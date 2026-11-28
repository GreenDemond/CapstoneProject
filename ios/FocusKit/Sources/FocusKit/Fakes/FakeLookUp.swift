import Foundation

/// A look-up that answers from a script. For tests.
public final class FakeLookUp: LookUp, @unchecked Sendable {
  public enum Answer: Sendable {
    case results([LookUpResult])
    case fail(LookUpError)
    /// Waits this long, then gives no results.
    case slow(seconds: Double)
  }

  private let lock = NSLock()
  private var answer: Answer
  private var asked: [String] = []

  public init(_ answer: Answer) {
    self.answer = answer
  }

  public func set(_ answer: Answer) {
    lock.withLock { self.answer = answer }
  }

  public var searches: [String] {
    lock.withLock { asked }
  }

  public func search(_ words: String) async throws -> [LookUpResult] {
    let current = lock.withLock {
      asked.append(words)
      return answer
    }
    switch current {
    case .results(let results): return results
    case .fail(let error): throw error
    case .slow(let seconds):
      try await Task.sleep(for: .seconds(seconds))
      return []
    }
  }
}
