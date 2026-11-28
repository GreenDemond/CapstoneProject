import Foundation
import Observation

/// The Look it up screen. Words go to the look-up only when the student taps Search.
@MainActor
@Observable
public final class LookUpModel {
  public enum State: Equatable, Sendable {
    case idle
    case loading
    case results([LookUpResult])
    case none
    case offline
    case slow
    case trouble
    /// Search was tapped with no words.
    case emptyWords
  }

  /// Look it up is switched on in this version. D8 (what may leave the phone) is a draft until the
  /// parent confirms the first row; set this to false to switch the feature off.
  public static let isOn = true
  /// How long to wait for an answer before saying so.
  public static let timeLimit: Double = 10

  public var words: String

  /// The last search did not get an answer, so "Try again" makes sense.
  public var canTryAgain: Bool {
    switch state {
    case .offline, .slow, .trouble: true
    default: false
    }
  }
  public private(set) var state: State = .idle

  private let lookUp: any LookUp
  private let timeLimit: Double
  private var task: Task<Void, Never>?
  private var generation = 0

  public init(
    lookUp: any LookUp, words: String = "", timeLimit: Double = LookUpModel.timeLimit
  ) {
    self.lookUp = lookUp
    self.words = words
    self.timeLimit = timeLimit
  }

  /// Starts a search. A newer search, or `cancel()`, makes an older answer be ignored.
  public func search() {
    let cleaned = LookUpText.cleanWords(words)
    guard !cleaned.isEmpty else {
      state = .emptyWords
      return
    }
    cancel()
    generation += 1
    let mine = generation
    state = .loading
    let lookUp = lookUp
    let limit = timeLimit
    task = Task { [weak self] in
      let outcome = await Self.run(lookUp, cleaned, limit)
      guard let self, self.generation == mine, !Task.isCancelled else { return }
      self.state = outcome
    }
  }

  /// The student left the screen: drop any answer that has not arrived.
  public func cancel() {
    task?.cancel()
    task = nil
    generation += 1
    if state == .loading { state = .idle }
  }

  /// Waits for the current search (for tests).
  public func waitForSearch() async {
    await task?.value
  }

  nonisolated private static func run(_ lookUp: any LookUp, _ words: String, _ limit: Double) async
    -> State
  {
    do {
      let results = try await withThrowingTaskGroup(of: [LookUpResult]?.self) { group in
        group.addTask { try await lookUp.search(words) }
        group.addTask {
          try await Task.sleep(for: .seconds(limit))
          return nil
        }
        defer { group.cancelAll() }
        return try await group.next() ?? nil
      }
      guard let results else { return .slow }
      return results.isEmpty ? .none : .results(results)
    } catch let error as LookUpError {
      switch error {
      case .offline: return .offline
      case .timeout: return .slow
      case .trouble: return .trouble
      }
    } catch {
      return .trouble
    }
  }
}
