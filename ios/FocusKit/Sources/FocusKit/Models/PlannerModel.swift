import Foundation
import Observation

/// The assignment screen, the "say my steps" screen and the editor. Holds no screen code.
@MainActor
@Observable
public final class PlannerModel {
  public static let stepCounts = [3, 5, 8]

  public private(set) var draft: Draft
  /// A calm line shown when something could not be saved.
  public private(set) var saveNote: String?
  /// True after Make was pressed with no words.
  public private(set) var showEmptyNote = false
  /// Called when Start succeeds, with the saved steps.
  public var onStart: (SavedWork) -> Void = { _ in }
  /// The step coach, when the phone has an AI. Without it everything uses the starter steps.
  public var coach: StepCoach?
  /// A calm line about what the AI did (for example, that starter steps were used instead).
  public private(set) var aiNote: String?
  /// The AI is working on a suggestion.
  public private(set) var thinking = false
  /// The split-nudge question move. Nil means no AI, so no Ask me a question link.
  public var nudgeMove: CoachMove?
  /// The label of the student's own AI service when it is the one in use. Set by the app model.
  public var ownServiceLabel: () -> String? = { nil }
  /// Steps already asked about in this app run. Memory only; one call per step id.
  private var nudgeAsked: Set<Int> = []
  private var nudgeQuestions: [Int: (text: String, question: String)] = [:]
  /// Bumped when the draft is replaced, so a late answer for an older draft is dropped.
  private var nudgeEpoch = 0

  /// One idea for the next step, waiting for the student to use it or not.
  public private(set) var idea: Idea?

  /// One suggested step, from the AI or from the starter steps.
  public struct Idea: Equatable, Sendable {
    public let text: String
    public let fromAI: Bool
  }

  private let content: Content
  private let store: any Store
  private let clock: any AppClock

  public init(content: Content, store: any Store, clock: any AppClock, draft: Draft = .empty) {
    self.content = content
    self.store = store
    self.clock = clock
    self.draft = draft.limited(by: content.limits)
  }

  public var kinds: [Content.Kind] { content.kinds }

  /// Back to an empty planner without saving anything (after Delete everything).
  public func reset() {
    draft = .empty
    forgetNudges()
    saveNote = nil
    aiNote = nil
    idea = nil
    thinking = false
    showEmptyNote = false
  }

  // MARK: Assignment

  /// Takes what the student typed or pasted. Cut to the paste limit; the end is cut, not the start.
  public func setText(_ raw: String) {
    let limit = content.limits.pasteLength
    draft.truncated = raw.utf16.count > limit
    draft.text = Text.cut(raw, to: limit)
    showEmptyNote = false
    persist()
  }

  /// The optional class label. Blank is none; the length limit is in `LearnerRecord`.
  /// The label is kept as typed (cut to the limit) so spaces survive while typing. It is trimmed
  /// when it is saved with the assignment.
  public func setCourse(_ raw: String) {
    draft.course = LearnerRecord.Entry.cutLabel(raw)
    persist()
  }

  public func setKind(_ id: String) {
    guard content.kinds.contains(where: { $0.id == id }) else { return }
    draft.kindId = id
    persist()
  }

  public func setStepCount(_ count: Int) {
    guard Self.stepCounts.contains(count) else { return }
    draft.stepCount = count
    persist()
  }

  public var hasAssignmentText: Bool {
    !PastedText.clean(draft.text).isEmpty
  }

  /// "Suggest some to start": starter steps open in the editor, never on the work screen.
  @discardableResult
  public func makeSuggested() -> Bool {
    guard hasAssignmentText else {
      showEmptyNote = true
      return false
    }
    let all = StarterSteps.steps(
      for: draft.kindId, pastedText: PastedText.clean(draft.text), in: content)
    let chosen = all.prefix(draft.stepCount)
    draft.steps = []
    draft.nextId = 0
    draft.nudgeDismissed = []
    forgetNudges()
    draft.fromAI = false
    for text in chosen { append(text) }
    draft.stage = .editor
    persist()
    return true
  }

  /// "Suggest some to start": the AI's steps when it is on and they pass every check, otherwise the
  /// starter steps. Either way the steps open in the editor, never on the work screen.
  public func suggest() async {
    guard hasAssignmentText else {
      showEmptyNote = true
      return
    }
    guard !thinking else { return }
    aiNote = nil
    guard let coach, coach.isAvailable else {
      makeSuggested()
      return
    }
    thinking = true
    let kindLabel = content.kinds.first { $0.id == draft.kindId }?.label ?? "Something else"
    let outcome = await coach.suggest(
      assignment: PastedText.clean(draft.text), kindLabel: kindLabel, count: draft.stepCount)
    thinking = false
    switch outcome {
    case .steps(let steps):
      importSteps(steps, kindId: draft.kindId)
    case .trustedAdult:
      // The words are not kept, and no steps are made. The fixed line is shown.
      setText("")
      aiNote = content.safety.line
    case .fallback(let reason):
      makeSuggested()
      if reason != .unavailable { aiNote = Words.coachFallback }
    }
  }

  /// "Give me an idea": one possible next step, never the whole list. With no AI, or when the
  /// AI's idea is not usable, it is the next starter step the student does not have yet.
  public func giveIdea() async {
    guard !thinking else { return }
    aiNote = nil
    let kindLabel = content.kinds.first { $0.id == draft.kindId }?.label ?? "Something else"
    let have = draft.steps.map { Text.trimmed($0.text) }
    if let coach, coach.isAvailable {
      thinking = true
      let outcome = await coach.idea(
        assignment: PastedText.clean(draft.text), kindLabel: kindLabel, stepsSoFar: have)
      thinking = false
      switch outcome {
      case .idea(let text):
        idea = Idea(text: text, fromAI: true)
        return
      case .trustedAdult:
        aiNote = content.safety.line
        return
      case .fallback:
        break
      }
    }
    let starter = StarterSteps.steps(
      for: draft.kindId, pastedText: PastedText.clean(draft.text), in: content)
    let lowered = Set(have.map { $0.lowercased() })
    idea = starter.first { !lowered.contains($0.lowercased()) }.map {
      Idea(text: $0, fromAI: false)
    }
    if idea == nil { aiNote = Words.ideaNone }
  }

  /// The student took the idea: it becomes the next step they said.
  public func useIdea() {
    guard let idea else { return }
    self.idea = nil
    if addSaid(idea.text), idea.fromAI { draft.fromAI = true }
    persist()
  }

  public func dismissIdea() {
    idea = nil
  }

  /// Steps from the AI (or from a chat) open in the editor with the AI label, never on the work
  /// screen. The kind is kept if it is one of ours.
  @discardableResult
  public func importSteps(_ texts: [String], kindId: String?) -> Bool {
    let limit = content.limits.stepLength
    let chosen = texts.map { Text.trimmed(Text.cut($0, to: limit)) }.filter { !$0.isEmpty }
      .prefix(content.limits.savedSteps)
    guard !chosen.isEmpty else { return false }
    draft.steps = []
    draft.nextId = 0
    draft.nudgeDismissed = []
    forgetNudges()
    for text in chosen { append(text) }
    if let kindId, content.kinds.contains(where: { $0.id == kindId }) { draft.kindId = kindId }
    draft.fromAI = true
    draft.stage = .editor
    persist()
    return true
  }

  /// "I'll say my steps": one small step at a time.
  @discardableResult
  public func beginSaying() -> Bool {
    guard hasAssignmentText else {
      showEmptyNote = true
      return false
    }
    draft.steps = []
    draft.nextId = 0
    draft.nudgeDismissed = []
    forgetNudges()
    draft.fromAI = false
    idea = nil
    draft.stage = .saying
    showEmptyNote = false
    persist()
    return true
  }

  /// Adds one said step. Blank words add nothing.
  @discardableResult
  public func addSaid(_ words: String) -> Bool {
    let text = Text.trimmed(Text.cut(words, to: content.limits.stepLength))
    guard !text.isEmpty, draft.steps.count < content.limits.savedSteps else { return false }
    append(text)
    persist()
    return true
  }

  /// "That's all": goes to the editor, but only when there is at least one step.
  @discardableResult
  public func thatsAll() -> Bool {
    guard draft.steps.contains(where: { !Text.trimmed($0.text).isEmpty }) else { return false }
    draft.stage = .editor
    persist()
    return true
  }

  /// Back one level. The steps already made stay in the draft, so nothing is lost.
  public func backToAssignment() {
    draft.stage = .assignment
    persist()
  }

  /// There are steps in the draft that making new ones would replace.
  public var wouldReplaceSteps: Bool {
    draft.steps.contains { !Text.trimmed($0.text).isEmpty }
  }

  /// Goes back to the steps already made. Does nothing when there are none.
  @discardableResult
  public func backToEditor() -> Bool {
    guard wouldReplaceSteps else { return false }
    draft.stage = .editor
    persist()
    return true
  }

  // MARK: Editor

  public func setStepText(_ id: Int, _ words: String) {
    guard let index = index(of: id) else { return }
    draft.steps[index].text = Text.cut(words, to: content.limits.stepLength)
    persist()
  }

  public func setDoneLine(_ id: Int, _ words: String) {
    guard let index = index(of: id) else { return }
    draft.steps[index].doneLine = Text.cut(words, to: content.limits.stepLength)
    persist()
  }

  @discardableResult
  public func addStep(_ words: String = "") -> Int? {
    guard draft.steps.count < content.limits.savedSteps else { return nil }
    let id = append(Text.cut(words, to: content.limits.stepLength))
    persist()
    return id
  }

  public func delete(at offsets: IndexSet) {
    let doomed = Set(offsets)
    draft.steps = draft.steps.enumerated().filter { !doomed.contains($0.offset) }.map(\.element)
    persist()
  }

  public func delete(_ id: Int) {
    draft.steps.removeAll { $0.id == id }
    persist()
  }

  public func move(from source: IndexSet, to destination: Int) {
    let moving = source.sorted().compactMap {
      draft.steps.indices.contains($0) ? draft.steps[$0] : nil
    }
    var rest = draft.steps.enumerated().filter { !source.contains($0.offset) }.map(\.element)
    let shift = source.filter { $0 < destination }.count
    let at = min(max(destination - shift, 0), rest.count)
    rest.insert(contentsOf: moving, at: at)
    draft.steps = rest
    persist()
  }

  /// Joins a step with the one after it.
  @discardableResult
  public func joinWithNext(_ id: Int) -> Bool {
    guard let index = index(of: id), index + 1 < draft.steps.count else { return false }
    let joined =
      Text.trimmed(draft.steps[index].text) + " " + Text.trimmed(draft.steps[index + 1].text)
    draft.steps[index].text = Text.cut(Text.trimmed(joined), to: content.limits.stepLength)
    draft.steps.remove(at: index + 1)
    persist()
    return true
  }

  /// Splits a step in two: at " and " if it has one, otherwise near the middle at a space.
  @discardableResult
  public func split(_ id: Int) -> Bool {
    guard let index = index(of: id), draft.steps.count < content.limits.savedSteps else {
      return false
    }
    let text = Text.trimmed(draft.steps[index].text)
    guard let parts = Self.splitParts(text) else { return false }
    nudgeQuestions[id] = nil
    draft.steps[index].text = parts.0
    let newId = draft.nextId
    draft.nextId += 1
    draft.steps.insert(DraftStep(id: newId, text: parts.1), at: index + 1)
    persist()
    return true
  }

  /// The gentle nudge: the step has " and " in it, or is long. Not shown again after No.
  public func looksLikeTwo(_ id: Int) -> Bool {
    guard let step = draft.steps.first(where: { $0.id == id }),
      !draft.nudgeDismissed.contains(id)
    else { return false }
    return Self.splitParts(Text.trimmed(step.text)) != nil
      && (Self.andRange(in: step.text) != nil || step.text.count > 90)
  }

  /// The AI's question for this step in place of the fixed nudge line, while the text is unchanged.
  public func nudgeQuestion(for id: Int) -> String? {
    guard let stored = nudgeQuestions[id], let index = index(of: id),
      Text.trimmed(draft.steps[index].text) == stored.text
    else { return nil }
    return stored.question
  }

  /// The Ask me a question link shows when the nudge shows, the AI is on, and this step was not
  /// asked about yet.
  public func canAskNudge(_ id: Int) -> Bool {
    nudgeMove?.isAvailable == true && looksLikeTwo(id) && !nudgeAsked.contains(id)
  }

  /// Asks the AI for one question about whether to split this step. Nothing changes the step. A
  /// refusal, NOTHING or a question that fails the checks leaves the fixed line.
  public func askNudge(_ id: Int) async {
    guard let nudgeMove, canAskNudge(id), let at = index(of: id) else { return }
    nudgeAsked.insert(id)
    let asked = Text.trimmed(draft.steps[at].text)
    let epoch = nudgeEpoch
    let fact = CoachText.fact(content.coach.facts.step, asked, content: content)
    let outcome = await nudgeMove.run(
      moveKey: "splitNudge", facts: [fact], shape: .question, source: asked)
    // The safety line is shown even if the student has moved on from this step.
    if outcome == .trustedAdult { aiNote = content.safety.line }
    guard epoch == nudgeEpoch, let now = index(of: id),
      Text.trimmed(draft.steps[now].text) == asked, looksLikeTwo(id)
    else { return }
    if case .line(let line) = outcome { nudgeQuestions[id] = (asked, line) }
  }

  private func forgetNudges() {
    nudgeAsked = []
    nudgeQuestions = [:]
    nudgeEpoch += 1
  }

  /// The answer No: the step stays as it is and the nudge does not come back.
  public func dismissNudge(_ id: Int) {
    nudgeQuestions[id] = nil
    guard !draft.nudgeDismissed.contains(id) else { return }
    draft.nudgeDismissed.append(id)
    persist()
  }

  public var hasGetReady: Bool { draft.steps.first?.text == Words.getReadyStep }
  public var hasPutAway: Bool { draft.steps.last?.text == Words.putAwayStep }

  public func addGetReady() {
    guard !hasGetReady, draft.steps.count < content.limits.savedSteps else { return }
    let id = draft.nextId
    draft.nextId += 1
    draft.steps.insert(DraftStep(id: id, text: Words.getReadyStep), at: 0)
    persist()
  }

  public func addPutAway() {
    guard !hasPutAway else { return }
    addStep(Words.putAwayStep)
  }

  // MARK: Start

  public var canStart: Bool {
    draft.stage == .editor && draft.steps.contains { !Text.trimmed($0.text).isEmpty }
  }

  /// Turns the editor's steps into the work. Only works from the editor, so starter steps can never
  /// reach the work screen without being shown. A second call does nothing.
  @discardableResult
  public func start() -> Bool {
    guard canStart else { return false }
    var texts: [String] = []
    var lines: [String: String] = [:]
    for step in draft.steps {
      let text = Text.trimmed(step.text)
      guard !text.isEmpty else { continue }
      let line = Text.trimmed(step.doneLine)
      if !line.isEmpty { lines[String(texts.count)] = line }
      texts.append(text)
    }
    let saved = SavedWork(
      work: Work(texts: texts), kindId: draft.kindId, savedOn: clock.now, doneLines: lines,
      course: draft.course)
    do {
      try store.save(saved)
    } catch {
      saveNote = Words.couldNotSave
      return false
    }
    draft = .empty
    forgetNudges()
    persist()
    onStart(saved)
    return true
  }

  // MARK: Helpers

  @discardableResult
  private func append(_ text: String) -> Int {
    let id = draft.nextId
    draft.nextId += 1
    draft.steps.append(DraftStep(id: id, text: text))
    return id
  }

  private func index(of id: Int) -> Int? {
    draft.steps.firstIndex { $0.id == id }
  }

  private func persist() {
    do {
      try store.save(draft)
      saveNote = nil
    } catch {
      saveNote = Words.couldNotSave
    }
  }

  private static func andRange(in text: String) -> Range<String.Index>? {
    text.range(of: " and ", options: .caseInsensitive)
  }

  /// Two non-empty halves, or nil when the step cannot be split.
  static func splitParts(_ text: String) -> (String, String)? {
    if let range = andRange(in: text) {
      let first = Text.trimmed(String(text[..<range.lowerBound]))
      let second = Text.trimmed(String(text[range.upperBound...]))
      if !first.isEmpty, !second.isEmpty { return (first, second) }
    }
    let spaces = text.indices.filter { text[$0] == " " }
    guard !spaces.isEmpty else { return nil }
    let middle = text.index(text.startIndex, offsetBy: text.count / 2)
    let best = spaces.min {
      text.distance(from: middle, to: $0).magnitude < text.distance(from: middle, to: $1).magnitude
    }!
    let first = Text.trimmed(String(text[..<best]))
    let second = Text.trimmed(String(text[best...]))
    return first.isEmpty || second.isEmpty ? nil : (first, second)
  }
}
