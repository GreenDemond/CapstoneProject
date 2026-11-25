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
  public var onStep = "" { didSet { if onStep != oldValue { boxesChanged() } } }
  public var tried = "" { didSet { if tried != oldValue { boxesChanged() } } }
  public var dontGet = "" { didSet { if dontGet != oldValue { boxesChanged() } } }
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
  /// Set by the app before each ask: the student's recent ratings say show the fixed line first.
  public var fixedFirst = false
  /// The fixed line is up and the AI has not been asked yet. The student can tap to see the AI's.
  public private(set) var heldBack = false
  /// The record lines sent with the AI question, in the student's own words, for "What the AI was told".
  public private(set) var sentRecord: [LearnerRecord.Entry] = []
  /// The line on screen is the AI's, not the fixed one: only then can it be rated.
  private var questionIsAI = false
  public private(set) var questionRated = false
  public var onFeedback: ((FeedbackRating) -> Void)?

  // MARK: Tidy my question (C6)

  /// The most tidies on one step. A ceiling from state, as for the Stuck question.
  public static let maxTidies = 2
  /// The AI's tidy version, shown in a card until the student taps Use this or edits a box.
  public private(set) var tidied: String?
  public private(set) var usingTidied = false
  public private(set) var isTidying = false
  /// A calm line when the tidy could not be used: the student's own words are unchanged.
  public private(set) var tidyNote: String?
  private var tidies = 0

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
    if usingTidied, let tidied { return tidied }
    let parts = [
      (Words.askOn, onStep), (Words.askTried, tried), (Words.askDontGet, dontGet),
    ]
    guard parts.contains(where: { !Text.trimmed($0.1).isEmpty }) else { return nil }
    return parts.map { "\($0.0) \(Text.trimmed($0.1))" }.joined(separator: "\n")
  }

  /// The Ask me a question button shows when the AI is on, a hint is up, and the ceiling is not hit.
  public var canAskQuestion: Bool {
    coach?.isAvailable == true && !hintsShown.isEmpty && aiAsks < Self.maxAIAsks && !isAsking
      && !fallbackShown && !heldBack
  }

  /// After the fixed line was shown first, the AI's question on a tap.
  public var canSeeAIQuestion: Bool {
    heldBack && coach?.isAvailable == true && !isAsking && aiAsks < Self.maxAIAsks
  }

  public var canRate: Bool { questionIsAI && !questionRated && coachNote == nil }

  /// One rating per AI question. A second tap does nothing.
  public func rate(_ rating: FeedbackRating) {
    guard canRate else { return }
    questionRated = true
    onFeedback?(rating)
  }

  /// Asks the AI for one question about the step. `stepText` and `kindLabel` come from the saved
  /// step, not from the boxes the student can edit. Never writes anything down.
  public func askQuestion(
    stepText: String, kindLabel: String, record: [LearnerRecord.Entry] = [], forceAI: Bool = false
  ) async {
    guard let coach, forceAI ? canSeeAIQuestion : canAskQuestion else { return }
    let key = "stuckQuestion"
    // Ratings say this move has not helped lately: show the fixed line, make no AI call, and
    // let the student tap to see the AI's question. Nothing says why.
    if fixedFirst && !forceAI {
      coachNote = nil
      coachQuestion = coach.fallbackLine(for: key)
      questionIsAI = false
      questionRated = false
      heldBack = true
      sentRecord = []
      return
    }
    heldBack = false
    isAsking = true
    defer { isAsking = false }
    aiAsks += 1
    questionIsAI = false
    questionRated = false
    sentRecord = record
    let names = content.coach.facts
    var facts = [
      CoachText.fact(names.kind, kindLabel, content: content),
      CoachText.fact(names.step, stepText, content: content),
    ]
    if !Text.trimmed(tried).isEmpty {
      facts.append(CoachText.fact(names.tried, tried, content: content))
    }
    // What the record may show this move, in the student's own words (M1).
    facts += record.map { CoachText.fact($0.kind.rawValue, $0.text, content: content) }
    // The question may only use words from the step, what the student tried, the kind of work, and
    // the move's short list, so it cannot bring in facts about the subject.
    // Only a pattern line's words widen this: those are the student's own words about how they work.
    // A course line holds steps from an earlier assignment, which may be the AI's, so its words
    // never count.
    let own = record.filter { $0.kind == .pattern }.map(\.text)
    let source = ([stepText, tried, kindLabel] + own).joined(separator: " ")
    switch await coach.run(moveKey: key, facts: facts, shape: .question, source: source) {
    case .line(let line):
      coachNote = nil
      coachQuestion = line
      questionIsAI = true
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

  /// The Tidy it button shows when an AI is on, the "I don't get" box has words, and the ceiling
  /// is not hit.
  public var canTidy: Bool {
    coach?.isAvailable == true && !Text.trimmed(dontGet).isEmpty && tidies < Self.maxTidies
      && !isTidying
  }

  /// Asks the AI to put the three lines into one question for a person. Nothing is shown as the
  /// question until the student taps Use this, and the three boxes never change.
  public func tidy() async {
    guard let coach, canTidy else { return }
    isTidying = true
    defer { isTidying = false }
    tidies += 1
    tidyNote = nil
    let names = content.coach.facts
    var facts: [String] = []
    for (label, text) in [(names.step, onStep), (names.tried, tried), (names.dontGet, dontGet)]
    where !Text.trimmed(text).isEmpty {
      facts.append(CoachText.fact(label, text, content: content))
    }
    let source = [onStep, tried, dontGet].joined(separator: " ")
    let asked = [onStep, tried, dontGet]
    let outcome = await coach.run(
      moveKey: "tidyQuestion", facts: facts, shape: .askLine, source: source)
    // The boxes changed while the AI worked: that reply is for words that are gone. Drop it.
    guard asked == [onStep, tried, dontGet] else { return }
    switch outcome {
    case .line(let line):
      // It must still use the student's own words about what they do not get.
      let mine = Set(CoachText.words(dontGet, minLetters: 4))
      if mine.isEmpty || !mine.isDisjoint(with: Set(CoachText.words(line, minLetters: 4))) {
        tidied = line
        usingTidied = false
        copied = false
      } else {
        tidyNote = Words.tidyUnchanged
      }
    case .trustedAdult:
      tidied = nil
      usingTidied = false
      coachNote = content.safety.line
    case .nothing, .fallback:
      tidyNote = Words.tidyUnchanged
    }
  }

  /// Use this: the copyable question becomes the tidy one. The boxes stay as they are.
  public func useTidied() {
    guard tidied != nil else { return }
    usingTidied = true
    copied = false
  }

  /// Editing any box goes back to the student's own words and drops the tidy one.
  private func boxesChanged() {
    tidied = nil
    usingTidied = false
    tidyNote = nil
  }

  public func markCopied() {
    copied = question != nil
  }

  public func edited() {
    copied = false
  }
}
