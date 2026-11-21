import Foundation

/// A transport that answers from a queue and records every request, for tests. No network.
public final class FakeHTTPTransport: HTTPTransport, @unchecked Sendable {
  public enum Answer: Sendable {
    case reply(status: Int, body: Data)
    case fails(URLError.Code)
  }

  private let lock = NSLock()
  private var queue: [Answer] = []
  private var seen: [URLRequest] = []
  private var last: Answer?

  public init() {}

  /// Each queued answer is used once, in order. When the queue is empty the last one is repeated.
  public func enqueue(_ answer: Answer) { lock.withLock { queue.append(answer) } }

  public func enqueueReply(_ text: String, status: Int = 200) {
    let body = #"{"choices":[{"message":{"role":"assistant","content":\#(Self.quoted(text))}}]}"#
    enqueue(.reply(status: status, body: Data(body.utf8)))
  }

  public var requests: [URLRequest] { lock.withLock { seen } }

  public func send(_ request: URLRequest) async throws -> (data: Data, status: Int) {
    let answer = lock.withLock { () -> Answer? in
      seen.append(request)
      if !queue.isEmpty { last = queue.removeFirst() }
      return last
    }
    switch answer {
    case .reply(let status, let body): return (body, status)
    case .fails(let code): throw URLError(code)
    case nil: throw URLError(.notConnectedToInternet)
    }
  }

  private static func quoted(_ text: String) -> String {
    guard let data = try? JSONEncoder().encode(text), let json = String(data: data, encoding: .utf8)
    else { return "\"\"" }
    return json
  }
}
