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

  // MARK: Assignment

  /// Takes what the student typed or pasted. Cut to the paste limit; the end is cut, not the start.
  public func setText(_ raw: String) {
    let limit = content.limits.pasteLength
    draft.truncated = raw.utf16.count > limit
    draft.text = Text.cut(raw, to: limit)
    showEmptyNote = false
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
    for text in chosen { append(text) }
    draft.stage = .editor
    persist()
    return true
  }

  /// "I'll say my steps": one small step at a time.
  public func beginSaying() {
    draft.steps = []
    draft.nextId = 0
    draft.nudgeDismissed = []
    draft.stage = .saying
    showEmptyNote = false
    persist()
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

  public func backToAssignment() {
    draft.stage = .assignment
    persist()
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

  /// The answer No: the step stays as it is and the nudge does not come back.
  public func dismissNudge(_ id: Int) {
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
      work: Work(texts: texts), kindId: draft.kindId, savedOn: clock.now, doneLines: lines)
    do {
      try store.save(saved)
    } catch {
      saveNote = Words.couldNotSave
      return false
    }
    draft = .empty
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
