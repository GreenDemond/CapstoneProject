import Foundation
import Observation

/// The stuck ladder for one step, without AI: hints in order, then help wording a question for a
/// person. Nothing here changes the steps and nothing here uses the network.
@MainActor
@Observable
public final class LadderModel {
  public static let hintsBeforeAsking = 2

  public private(set) var hintsShown: [String] = []
  public var onStep = ""
  public var tried = ""
  public var dontGet = ""
  public private(set) var copied = false

  private let content: Content

  public init(content: Content, stepText: String = "") {
    self.content = content
    self.onStep = stepText
  }

  /// Shows the next hint. Returns false when there are none left; nothing is repeated.
  @discardableResult
  public func nextHint() -> Bool {
    guard let hint = Hints.hint(at: hintsShown.count, in: content) else { return false }
    hintsShown.append(hint)
    return true
  }

  public var hasMoreHints: Bool {
    Hints.hint(at: hintsShown.count, in: content) != nil
  }

  /// After two hints, or when there are no more, the app offers help wording a question.
  public var canAskPerson: Bool {
    hintsShown.count >= Self.hintsBeforeAsking || (!hintsShown.isEmpty && !hasMoreHints)
  }

  /// The question, or nil when all three boxes are empty.
  public var question: String? {
    let parts = [
      (Words.askOn, onStep), (Words.askTried, tried), (Words.askDontGet, dontGet),
    ]
    guard parts.contains(where: { !Text.trimmed($0.1).isEmpty }) else { return nil }
    return parts.map { "\($0.0) \(Text.trimmed($0.1))" }.joined(separator: "\n")
  }

  public func markCopied() {
    copied = question != nil
  }

  public func edited() {
    copied = false
  }
}
