import Foundation

/// The second file (after `WikipediaLookUp.swift`) that opens a network connection. It sends to the
/// one address the student typed, and only while "Use my own AI service" is on or the student taps
/// Check connection. The key is read from the `KeyStore` for each request, is put only in the
/// Authorization header, and appears in no error, log or screen text.

/// Sends one request and returns the answer. Tests use `FakeHTTPTransport`.
public protocol HTTPTransport: Sendable {
  func send(_ request: URLRequest) async throws -> (data: Data, status: Int)
}

/// The most a reply may be, in bytes. A longer reply is refused, and nothing from it is kept. The
/// live transport reads at most one byte past this, so a huge reply is never held in memory.
public enum ReplyLimit {
  public static let bytes = 1_000_000
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
    let (bytes, response) = try await session.bytes(for: request, delegate: NoRedirects())
    guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
    // Stop one byte past the limit. Leaving the loop ends the request, so the rest is never read.
    var data = Data()
    for try await byte in bytes {
      data.append(byte)
      if data.count > ReplyLimit.bytes { break }
    }
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
  public var thinking: ThinkingLevel

  public init(address: String, modelName: String, thinking: ThinkingLevel = ThinkingLevel.standard)
  {
    self.address = address
    self.modelName = modelName
    self.thinking = thinking
  }

  /// The address as a URL, or nil. https and http are accepted (the parent's decision, 2026-11-21;
  /// see `isEncrypted`). No password in the address and no query or fragment (a key put in the
  /// address would end up in the settings file).
  public var url: URL? { Self.parse(address) }

  /// Google's Gemini API host, the only one whose model names and default get special handling.
  static let googleHost = "generativelanguage.googleapis.com"

  /// A model name to fill in for an address that has a known default, only while the model box is
  /// empty or still holds the app's own starting name. A name the student typed is never replaced.
  public static func suggestedModel(address: String, current: String) -> String? {
    let name = current.trimmingCharacters(in: .whitespacesAndNewlines)
    guard name.isEmpty || name == Words.ownAIDefaultModel,
      parse(address)?.host?.lowercased() == googleHost
    else { return nil }
    return Words.ownAIGoogleModel
  }

  public static let addressLimit = 500
  public static let modelLimit = 100

  public static func parse(_ text: String) -> URL? {
    let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty, trimmed.utf16.count <= addressLimit else { return nil }
    let withScheme = addingSchemeIfMissing(trimmed)
    guard let parts = URLComponents(string: withScheme),
      let scheme = parts.scheme?.lowercased(), scheme == "https" || scheme == "http",
      let host = parts.host, !host.isEmpty,
      parts.user == nil, parts.password == nil,
      parts.query == nil, parts.fragment == nil
    else { return nil }
    var normal = parts
    normal.scheme = scheme
    normal.path = chatPath(host: host, path: parts.path)
    return normal.url
  }

  /// A host with no scheme, such as `openrouter.ai/api/v1` or `localhost:11434`, is taken as https.
  /// Anything else with a colon before the host (`javascript:...`) is left alone so it is refused.
  static func addingSchemeIfMissing(_ text: String) -> String {
    if text.contains("://") { return text }
    let hostPart =
      text.split(separator: "/", maxSplits: 1, omittingEmptySubsequences: false)
      .first.map(String.init) ?? text
    guard !hostPart.contains(":") || isHostWithPort(hostPart) else { return text }
    let host = hostPart.split(separator: ":").first.map(String.init) ?? hostPart
    guard host == "localhost" || host.contains(".") else { return text }
    return "https://" + text
  }

  private static func isHostWithPort(_ hostPart: String) -> Bool {
    guard let colon = hostPart.lastIndex(of: ":") else { return false }
    let host = hostPart[..<colon]
    let port = hostPart[hostPart.index(after: colon)...]
    let hostOK =
      !host.isEmpty && host.allSatisfy { $0.isLetter || $0.isNumber || $0 == "." || $0 == "-" }
    return hostOK && !port.isEmpty && port.allSatisfy(\.isNumber)
  }

  /// Turns the base address a provider shows (for example `https://openrouter.ai/api/v1`,
  /// `https://api.openai.com`, or `http://localhost:11434`) into the chat address. The app adds
  /// `/chat/completions`, and OpenRouter's `/api` prefix, when they are missing.
  ///
  /// A path that ends in a version marker (`/v2`, `/v1beta`) or in `openai` is also a base address
  /// (Google's `/v1beta/openai`, Groq's `/openai/v1`): it gets `/chat/completions`, and a lone
  /// `/openai` gets `/v1` first. Any other path is the student's own and is kept as typed.
  static func chatPath(host: String, path: String) -> String {
    var base = path
    while base.hasSuffix("/") { base.removeLast() }
    if base.hasSuffix("/chat/completions") { return base }
    let isBase = base.isEmpty || base == "/api" || base == "/v1" || base == "/api/v1"
    guard isBase else { return providerBasePath(base) }
    if host.lowercased() == "openrouter.ai", !base.hasPrefix("/api") {
      base = "/api" + base
    }
    if !base.hasSuffix("/v1") {
      base += "/v1"
    }
    return base + "/chat/completions"
  }

  /// The chat path for a base address with some other path, or the path as typed.
  private static func providerBasePath(_ base: String) -> String {
    let segments = base.split(separator: "/").map(String.init)
    guard let last = segments.last else { return base }
    if isVersionSegment(last) { return base + "/chat/completions" }
    guard last == "openai" else { return base }
    if segments.dropLast().last.map(isVersionSegment) == true {
      return base + "/chat/completions"
    }
    return base + "/v1/chat/completions"
  }

  /// A version marker such as `v1`, `v2`, `v10`, `v1beta` or `v2beta3`. Exact, lower case.
  static func isVersionSegment(_ text: String) -> Bool {
    text.wholeMatch(of: /v[0-9]+((alpha|beta)[0-9]*)?/) != nil
  }

  /// False for a good http address: the key and the messages would travel unencrypted.
  public var isEncrypted: Bool { url?.scheme == "https" }

  /// A Tailscale address: a `.ts.net` name or an address in 100.64.0.0/10. Its traffic is
  /// encrypted end to end by the tailnet, so http there does not need the unencrypted warning.
  public var isTailnet: Bool {
    guard let host = url?.host?.lowercased() else { return false }
    if host == "ts.net" || host.hasSuffix(".ts.net") { return true }
    let octets = host.split(separator: ".").compactMap { Int($0) }
    guard octets.count == 4 else { return false }
    return octets[0] == 100 && (64...127).contains(octets[1])
  }

  /// True when chat should say the messages are not encrypted: http, and not a Tailscale address.
  public var needsUnencryptedWarning: Bool { !isEncrypted && !isTailnet }

  /// The provider's page on getting a key, when the address is OpenRouter's.
  public var keyHelpURL: URL? {
    guard let host = url?.host?.lowercased(), host == "openrouter.ai" else { return nil }
    return URL(string: Words.ownAIKeyHelpURL)
  }

  public var hasModelName: Bool {
    !modelName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
  }
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
  private let account: String
  private let keys: any KeyStore
  private let transport: any HTTPTransport

  /// One service: its address and model, and the account of its own key. This model reads no other
  /// account, so it can never send another service's key.
  public init(
    config: OwnAIConfig, account: String, keys: any KeyStore, transport: any HTTPTransport
  ) {
    self.config = config
    self.account = account
    self.keys = keys
    self.transport = transport
  }

  public var availability: ModelAvailability {
    config.url != nil && config.hasModelName && keys.hasKey(account: account) ? .available : .other
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
    /// Omitted when nil, so a service that refuses the setting never sees it.
    var reasoningEffort: String?

    private enum CodingKeys: String, CodingKey {
      case model, messages, stream
      case reasoningEffort = "reasoning_effort"
    }
  }

  private struct Answer: Decodable {
    struct Choice: Decodable {
      struct Message: Decodable { var content: String? }
      var message: Message?
    }
    var choices: [Choice]?
  }

  /// The failures are the app's own words for what went wrong. No service text, no key.
  /// The thinking level is sent first. A service that answers 400 and names the setting is asked
  /// once more without it; the reply text itself is never shown or kept.
  private func complete(instructions: String, messages: [ChatMessage]) async throws -> String {
    guard let url = config.url, config.hasModelName, let key = keys.read(account: account),
      !key.isEmpty
    else {
      throw ModelFailure.unavailable
    }
    var lines = [Body.Line(role: "system", content: instructions)]
    for message in messages {
      lines.append(
        Body.Line(role: message.role == .user ? "user" : "assistant", content: message.text))
    }
    let name = config.modelName.trimmingCharacters(in: .whitespacesAndNewlines)
    let effort = config.thinking.rawValue
    var (data, status) = try await post(
      url: url, key: key, body: Body(model: name, messages: lines, reasoningEffort: effort))
    if status == 400, String(decoding: data, as: UTF8.self).contains("reasoning_effort") {
      (data, status) = try await post(
        url: url, key: key, body: Body(model: name, messages: lines, reasoningEffort: nil))
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
    guard data.count <= ReplyLimit.bytes,
      let answer = try? JSONDecoder().decode(Answer.self, from: data),
      let text = answer.choices?.first?.message?.content,
      !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    else { throw ModelFailure.other }
    return text
  }

  /// One request. The network failures are the app's own words; nothing from the service is kept.
  private func post(url: URL, key: String, body: Body) async throws -> (Data, Int) {
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
    do {
      return try await transport.send(request)
    } catch is CancellationError {
      throw CancellationError()
    } catch {
      // A time limit, no connection, a refused redirect: all the same to the student.
      throw ModelFailure.unavailable
    }
  }
}

/// What "Look up models" found. Never carries text from the service other than plain model names.
public enum ModelLookup: Equatable, Sendable {
  case found([String])
  /// The address is not a standard chat address, so the list's address is not known.
  case noListAddress
  case keyNotAccepted
  case busy
  case problem
}

/// Optional: asks the service for the names of its models, so the student can pick one instead of
/// typing it. Typing always works. Lessons from the web app (`js/ai-direct.js`, `js/logic/ai-services.js`):
/// the list's address is the chat address with `/models` in place of `/chat/completions` and the
/// app never guesses another; only plain names are kept; at most 1000; a failure never blocks typing.
public enum ModelLister {
  public static let suffix = "/chat/completions"
  public static let most = 1000

  /// The list's address, on the same scheme, host and port as the chat address, or nil.
  public static func listAddress(for chat: URL?) -> URL? {
    guard let chat, var parts = URLComponents(url: chat, resolvingAgainstBaseURL: false),
      parts.path.hasSuffix(suffix)
    else { return nil }
    parts.path = String(parts.path.dropLast(suffix.count)) + "/models"
    parts.query = nil
    parts.fragment = nil
    return parts.url
  }

  /// Plain names only: letters, digits and . _ : / ~ -, 1 to 100 characters.
  /// `stripPrefix` is taken off the front of each name once, before the checks (Google lists its
  /// models as `models/<name>`; chat takes `<name>`). Nothing else is changed.
  static func readNames(_ data: Data, stripPrefix: String? = nil) -> [String] {
    struct Reply: Decodable {
      struct Item: Decodable { var id: String? }
      var data: [Item]?
    }
    guard data.count <= ReplyLimit.bytes,
      let reply = try? JSONDecoder().decode(Reply.self, from: data)
    else { return [] }
    let allowed = Set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._:/~-")
    var seen = Set<String>()
    var names: [String] = []
    for item in reply.data ?? [] {
      guard var id = item.id?.trimmingCharacters(in: .whitespacesAndNewlines) else { continue }
      if let stripPrefix, id.hasPrefix(stripPrefix) { id = String(id.dropFirst(stripPrefix.count)) }
      guard (1...100).contains(id.count), id.allSatisfy(allowed.contains), seen.insert(id).inserted
      else { continue }
      names.append(id)
      if names.count == most { break }
    }
    return names
  }

  /// One GET. The key (the one just typed, or else the one saved for this service's account) goes
  /// only in the Authorization header, to the list address built from this service's own address.
  /// No key at all is fine: some lists are public.
  public static func lookUp(
    config: OwnAIConfig, typedKey: String?, account: String?, keys: any KeyStore,
    transport: any HTTPTransport
  ) async -> ModelLookup {
    guard let url = listAddress(for: config.url) else { return .noListAddress }
    var request = URLRequest(url: url, timeoutInterval: LiveHTTPTransport.timeLimit)
    request.httpMethod = "GET"
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    let typed = typedKey?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    let key = !typed.isEmpty ? typed : account.flatMap { keys.read(account: $0) } ?? ""
    if !key.isEmpty { request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization") }
    let data: Data
    let status: Int
    do {
      (data, status) = try await transport.send(request)
    } catch {
      return .problem
    }
    switch status {
    case 200...299:
      // Google lists models as `models/<name>`; chat takes `<name>`. Only that exact host.
      let google = config.url?.host?.lowercased() == OwnAIConfig.googleHost
      let names = readNames(data, stripPrefix: google ? "models/" : nil)
      return names.isEmpty ? .problem : .found(names)
    case 401, 403: return .keyNotAccepted
    case 429: return .busy
    default: return .problem
    }
  }
}
