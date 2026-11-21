import Foundation

/// A language model that says what the test tells it to. It can stream in pieces, refuse, hit the
/// guardrail, run out of context, or be unavailable for each of the three reasons.
public final class FakeLanguageModel: LanguageModel, @unchecked Sendable {
  public struct Reply: Sendable {
    public var pieces: [String]
    public var failure: ModelFailure?
    /// After the pieces, wait until cancelled (the student taps Stop).
    public var neverEnds: Bool

    public init(_ pieces: [String], failure: ModelFailure? = nil, neverEnds: Bool = false) {
      self.pieces = pieces
      self.failure = failure
      self.neverEnds = neverEnds
    }

    public static func failing(_ failure: ModelFailure) -> Reply {
      Reply([], failure: failure)
    }
  }

  private let lock = NSLock()
  private var state: ModelAvailability
  private let size: Int
  private let counts: Bool
  private var queue: [Reply] = []
  private var seen: [(instructions: String, messages: [ChatMessage])] = []
  private var cancelled = 0
  private var tokenCalls = 0

  public init(
    availability: ModelAvailability = .available, contextSize: Int = 4096,
    countsTokens: Bool = true
  ) {
    state = availability
    size = contextSize
    counts = countsTokens
  }

  /// The next call gets this reply. When the queue is empty the last reply is repeated.
  public func enqueue(_ replies: Reply...) { lock.withLock { queue.append(contentsOf: replies) } }
  public func set(_ availability: ModelAvailability) { lock.withLock { state = availability } }

  public var calls: [(instructions: String, messages: [ChatMessage])] { lock.withLock { seen } }
  public var cancelCount: Int { lock.withLock { cancelled } }
  public var tokenCountCalls: Int { lock.withLock { tokenCalls } }

  public var availability: ModelAvailability { lock.withLock { state } }
  public var contextSize: Int { size }

  public func tokenCount(of text: String) async -> Int? {
    lock.withLock { tokenCalls += 1 }
    return counts ? text.utf16.count / 4 + 1 : nil
  }

  public func stream(instructions: String, messages: [ChatMessage]) -> AsyncThrowingStream<
    String, any Error
  > {
    let reply = lock.withLock { () -> Reply in
      seen.append((instructions, messages))
      if queue.count > 1 { return queue.removeFirst() }
      return queue.first ?? Reply([""])
    }
    return AsyncThrowingStream { continuation in
      let task = Task {
        var whole = ""
        for piece in reply.pieces {
          if Task.isCancelled { return }
          whole += piece
          continuation.yield(whole)
          await Task.yield()
        }
        if reply.neverEnds {
          while !Task.isCancelled { await Task.yield() }
          return
        }
        continuation.finish(throwing: reply.failure)
      }
      continuation.onTermination = { [weak self] reason in
        if case .cancelled = reason { self?.lock.withLock { self?.cancelled += 1 } }
        task.cancel()
      }
    }
  }
}
