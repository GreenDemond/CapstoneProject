import Foundation

/// The second file (after `WikipediaLookUp.swift`) that opens a network connection. It sends to the
/// one address the student typed, and only while "Use my own AI service" is on or the student taps
/// Check connection. The key is read from the `KeyStore` for each request, is put only in the
/// Authorization header, and appears in no error, log or screen text.

/// Sends one request and returns the answer. Tests use `FakeHTTPTransport`.
public protocol HTTPTransport: Sendable {
  func send(_ request: URLRequest) async throws -> (data: Data, status: Int)
}

/// The real transport: no cookies, no cache, no redirects (a redirect could carry the key to
/// another host), and a time limit.
public struct LiveHTTPTransport: HTTPTransport {
  public static let timeLimit: TimeInterval = 30

  private let session: URLSession

  public init() {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.timeoutIntervalForRequest = Self.timeLimit
    configuration.timeoutIntervalForResource = Self.timeLimit * 2
    configuration.waitsForConnectivity = false
    configuration.httpCookieStorage = nil
    configuration.urlCache = nil
    session = URLSession(configuration: configuration)
  }

  public func send(_ request: URLRequest) async throws -> (data: Data, status: Int) {
    let (data, response) = try await session.data(for: request, delegate: NoRedirects())
    guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
    return (data, http.statusCode)
  }

  private final class NoRedirects: NSObject, URLSessionTaskDelegate, Sendable {
    func urlSession(
      _ session: URLSession, task: URLSessionTask,
      willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest
    ) async -> URLRequest? {
      nil
    }
  }
}

/// What the student typed for the service: the address and the model's name.
public struct OwnAIConfig: Equatable, Sendable {
  public var address: String
  public var modelName: String

  public init(address: String, modelName: String) {
    self.address = address
    self.modelName = modelName
  }

  /// The address as a URL, or nil. Only https is accepted. No password in the address and no
  /// query or fragment (a key put in the address would end up in the settings file).
  public var url: URL? { Self.parse(address) }

  public static let addressLimit = 500
  public static let modelLimit = 100

  public static func parse(_ text: String) -> URL? {
    let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty, trimmed.utf16.count <= addressLimit,
      let parts = URLComponents(string: trimmed),
      parts.scheme?.lowercased() == "https",
      let host = parts.host, !host.isEmpty,
      parts.user == nil, parts.password == nil,
      parts.query == nil, parts.fragment == nil
    else { return nil }
    var secure = parts
    secure.scheme = "https"
    return secure.url
  }

  public var hasModelName: Bool { !modelName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
}

/// How a "Check connection" went. Never carries text from the service.
public enum ConnectionCheck: Equatable, Sendable {
  case works
  case keyNotAccepted
  case busy
  case problem
}

/// A language model reached over an OpenAI-compatible Chat Completions address. It sits behind the
/// same `LanguageModel` protocol as the phone's model, so `ChatEngine` and `StepCoach` apply the
/// safety word, the trusted-adult line and the answer guard to its replies in the same way.
public final class OpenAICompatibleModel: LanguageModel, Sendable {
  public static let checkInstructions = "Reply with the single word OK."
  public static let checkMessage = "Hello"

  private let config: OwnAIConfig
  private let keys: any KeyStore
  private let transport: any HTTPTransport

  public init(config: OwnAIConfig, keys: any KeyStore, transport: any HTTPTransport) {
    self.config = config
    self.keys = keys
    self.transport = transport
  }

  public var availability: ModelAvailability {
    config.url != nil && config.hasModelName && keys.hasKey ? .available : .other
  }

  /// A cautious size for services the app knows nothing about, as small as the phone's own model.
  public var contextSize: Int { 4096 }

  public func tokenCount(of text: String) async -> Int? { nil }

  public func stream(instructions: String, messages: [ChatMessage]) -> AsyncThrowingStream<
    String, any Error
  > {
    AsyncThrowingStream { continuation in
      let task = Task {
        do {
          continuation.yield(try await complete(instructions: instructions, messages: messages))
          continuation.finish()
        } catch {
          continuation.finish(throwing: error)
        }
      }
      continuation.onTermination = { _ in task.cancel() }
    }
  }

  /// Sends one tiny fixed message. Nothing of the student's goes in it, and the reply is never shown.
  public func check() async -> ConnectionCheck {
    do {
      _ = try await complete(
        instructions: Self.checkInstructions,
        messages: [ChatMessage(role: .user, text: Self.checkMessage)])
      return .works
    } catch ModelFailure.keyNotAccepted {
      return .keyNotAccepted
    } catch ModelFailure.busy {
      return .busy
    } catch {
      return .problem
    }
  }

  // MARK: Inside

  private struct Body: Encodable {
    struct Line: Encodable {
      var role: String
      var content: String
    }
    var model: String
    var messages: [Line]
    var stream = false
  }

  private struct Answer: Decodable {
    struct Choice: Decodable {
      struct Message: Decodable { var content: String? }
      var message: Message?
    }
    var choices: [Choice]?
  }

  /// The failures are the app's own words for what went wrong. No service text, no key.
  private func complete(instructions: String, messages: [ChatMessage]) async throws -> String {
    guard let url = config.url, config.hasModelName, let key = keys.read(), !key.isEmpty else {
      throw ModelFailure.unavailable
    }
    var lines = [Body.Line(role: "system", content: instructions)]
    for message in messages {
      lines.append(
        Body.Line(role: message.role == .user ? "user" : "assistant", content: message.text))
    }
    let body = Body(
      model: config.modelName.trimmingCharacters(in: .whitespacesAndNewlines), messages: lines)
    var request = URLRequest(url: url, timeoutInterval: LiveHTTPTransport.timeLimit)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
    do {
      request.httpBody = try JSONEncoder().encode(body)
    } catch {
      throw ModelFailure.other
    }

    let data: Data
    let status: Int
    do {
      (data, status) = try await transport.send(request)
    } catch is CancellationError {
      throw CancellationError()
    } catch {
      // A time limit, no connection, a refused redirect: all the same to the student.
      throw ModelFailure.unavailable
    }

    switch status {
    case 200...299:
      break
    case 401, 403:
      throw ModelFailure.keyNotAccepted
    case 429:
      throw ModelFailure.busy
    default:
      throw ModelFailure.unavailable
    }
    guard let answer = try? JSONDecoder().decode(Answer.self, from: data),
      let text = answer.choices?.first?.message?.content,
      !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    else { throw ModelFailure.other }
    return text
  }
}
