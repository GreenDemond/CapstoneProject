import Foundation
import Observation

/// The stuck ladder for one step, without AI: hints in order, then help wording a question for a
/// person. Nothing here changes the steps and nothing here uses the network.
@MainActor
@Observable
public final class LadderModel {
  public static let hintsBeforeAsking = 2
  /// The most AI questions on one step. A ceiling from state, not from anything the student types.
  public static let maxAIAsks = 2

  public private(set) var hintsShown: [String] = []
  public var onStep = ""
  public var tried = ""
  public var dontGet = ""
  public private(set) var copied = false

  /// The AI question move. Nil where there is no step (the Talk tab) so no button shows.
  public var coach: CoachMove?
  /// How many times the AI question was asked on this step, including NOTHING and fallbacks.
  public private(set) var aiAsks = 0
  public private(set) var isAsking = false
  /// The question on screen: the AI's, or the move's own fallback line.
  public private(set) var coachQuestion: String?
  /// The trusted-adult line, shown instead of a question.
  public private(set) var coachNote: String?
  private var fallbackShown = false

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

  /// The Ask me a question button shows when the AI is on, a hint is up, and the ceiling is not hit.
  public var canAskQuestion: Bool {
    coach?.isAvailable == true && !hintsShown.isEmpty && aiAsks < Self.maxAIAsks && !isAsking
      && !fallbackShown
  }

  /// Asks the AI for one question about the step. `stepText` and `kindLabel` come from the saved
  /// step, not from the boxes the student can edit. Never writes anything down.
  public func askQuestion(stepText: String, kindLabel: String) async {
    guard let coach, canAskQuestion else { return }
    isAsking = true
    defer { isAsking = false }
    aiAsks += 1
    let key = "stuckQuestion"
    let names = content.coach.facts
    var facts = [
      CoachText.fact(names.kind, kindLabel, content: content),
      CoachText.fact(names.step, stepText, content: content),
    ]
    if !Text.trimmed(tried).isEmpty {
      facts.append(CoachText.fact(names.tried, tried, content: content))
    }
    // The question may only use words from the step, what the student tried, the kind of work, and
    // the move's short list, so it cannot bring in facts about the subject.
    let source = [stepText, tried, kindLabel].joined(separator: " ")
    switch await coach.run(moveKey: key, facts: facts, shape: .question, source: source) {
    case .line(let line):
      coachNote = nil
      coachQuestion = line
    case .nothing:
      break
    case .trustedAdult:
      coachQuestion = nil
      coachNote = content.safety.line
    case .fallback:
      coachNote = nil
      coachQuestion = coach.fallbackLine(for: key)
      fallbackShown = true
    }
  }

  public func markCopied() {
    copied = question != nil
  }

  public func edited() {
    copied = false
  }
}
