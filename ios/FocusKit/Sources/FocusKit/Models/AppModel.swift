import Foundation
import Observation

/// What happened after one of the five buttons. The view shows `message` and acts on the case.
public enum CheckInResult: Equatable, Sendable {
  /// A repeated tap, or a tap for a step that is no longer the current one. Nothing happened.
  case ignored
  case done(message: String, askRecall: Bool)
  case allDone(message: String, askRecall: Bool)
  case stillWorking(message: String)
  case stuck
  case drifted(message: String)
  /// Drifted with a blank box: the step is unchanged.
  case needsSmallerPiece(message: String)
  case later
  case laterNotPossible(message: String)
}

/// The whole app's state: the steps, the first-run flag, parked thoughts, the planner.
@MainActor
@Observable
public final class AppModel {
  /// Two taps closer together than this count as one.
  public static let tapGap: TimeInterval = 0.5

  public let content: Content
  public let planner: PlannerModel
  public let dictation: DictationModel
  public let speaker: SpeakerModel
  public let talk: ChatModel

  public private(set) var welcomed: Bool
  /// The student is on the work screen.
  public private(set) var inStep: Bool
  public private(set) var saved: SavedWork?
  public private(set) var parked: ParkedThoughts
  public private(set) var recall: RecallAnswers
  /// The welcome line, worked out once per opening of the app.
  public private(set) var welcomeLine: String
  /// The student asked for a new assignment (or the app reopened with one half planned).
  public private(set) var planning: Bool
  public private(set) var saveNote: String?
  public private(set) var settings: Settings
  /// The student chose "Use these as my steps": the screen should show Today (the editor).
  public var showToday = false

  private let store: any Store
  private let clock: any AppClock
  private var lastTap: Date?
  private var ladders: [Int: LadderModel] = [:]

  public init(
    content: Content, store: any Store, clock: any AppClock = SystemClock(),
    services: Services = .none
  ) {
    self.content = content
    self.store = store
    self.clock = clock
    let flags = store.load(Flags.self).value ?? Flags()
    let saved = store.load(SavedWork.self).value
    let draft = store.load(Draft.self).value ?? .empty
    self.welcomed = flags.welcomed
    self.saved = saved
    self.parked = store.load(ParkedThoughts.self).value ?? ParkedThoughts()
    self.recall = store.load(RecallAnswers.self).value ?? RecallAnswers()
    self.welcomeLine = Pickup.line(savedOn: saved?.savedOn, now: clock.now, in: content)
    self.planning = draft.hasContent
    self.inStep = flags.inStep && (saved?.work.currentIndex != nil)
    self.settings = store.load(Settings.self).value ?? Settings()
    self.dictation = DictationModel(
      input: services.speechInput, store: store, clock: clock, limit: content.limits.pasteLength)
    self.speaker = SpeakerModel(output: services.speechOutput, headphones: services.headphones)
    self.talk = ChatModel(
      content: content, store: store, clock: clock, model: services.languageModel,
      speaker: self.speaker)
    self.planner = PlannerModel(content: content, store: store, clock: clock, draft: draft)
    self.planner.coach = StepCoach(model: services.languageModel, content: content)
    self.planner.onStart = { [weak self] saved in self?.began(saved) }
    self.talk.settings = { [weak self] in self?.settings ?? Settings() }
    self.talk.onUseSteps = { [weak self] steps, kind in
      guard let self, self.planner.importSteps(steps, kindId: kind) else { return }
      self.planning = true
      self.showToday = true
    }
    self.speaker.settings = { [weak self] in self?.settings ?? Settings() }
    self.dictation.willListen = { [weak self] in self?.speaker.interrupted() }
  }

  // MARK: Reading

  public var work: Work? { saved?.work }

  public var hasSteps: Bool { !(saved?.work.steps.isEmpty ?? true) }

  public var currentStep: Step? {
    guard let work = saved?.work, let index = work.currentIndex else { return nil }
    return work.steps[index]
  }

  /// "Step 2 of 5": the position of the current step among all steps.
  public var stepPosition: (number: Int, total: Int)? {
    guard let work = saved?.work, let index = work.currentIndex else { return nil }
    return (index + 1, work.steps.count)
  }

  public var currentDoneLine: String? {
    guard let step = currentStep, let line = saved?.doneLines[String(step.id)],
      !Text.trimmed(line).isEmpty
    else { return nil }
    return line
  }

  public var allDone: Bool { saved?.work.allDone ?? false }

  /// Which screen Today shows.
  public var showsPlanner: Bool { planning || !hasSteps }

  /// Reading and study steps get the optional recall question.
  public func asksRecall(kindId: String?) -> Bool {
    kindId == "reading" || kindId == "test-prep"
  }

  // MARK: First run

  public func finishWelcome() {
    welcomed = true
    saveFlags()
  }

  /// Call when the app comes to the front, so a later day gets the welcome-back line.
  public func refreshWelcome() {
    welcomeLine = Pickup.line(savedOn: saved?.savedOn, now: clock.now, in: content)
  }

  // MARK: Planning

  public func startNewAssignment() {
    planning = true
  }

  public func cancelPlanning() {
    guard hasSteps else { return }
    planning = false
  }

  private func began(_ new: SavedWork) {
    saved = new
    planning = false
    ladders = [:]
    refreshWelcome()
    inStep = true
    saveFlags()
  }

  // MARK: The work screen

  /// Opens the work screen on the current step.
  public func startStep() {
    guard currentStep != nil else { return }
    inStep = true
    saveFlags()
  }

  /// Leaves the work screen without changing any step.
  public func leaveStep() {
    inStep = false
    saveFlags()
  }

  /// One of the five buttons. `stepId` is the step the student was looking at, so a repeated tap
  /// after the screen moved on does nothing. `smallerPiece` is only used by Drifted.
  @discardableResult
  public func choose(_ choice: Choice, stepId: Int, smallerPiece: String = "") -> CheckInResult {
    guard let saved, let step = currentStep, step.id == stepId else { return .ignored }
    let now = clock.now
    if let lastTap, now.timeIntervalSince(lastTap) < Self.tapGap, now >= lastTap {
      return .ignored
    }

    let before = saved.work
    let after = before.applying(choice, splitText: smallerPiece)

    switch choice {
    case .stuck:
      lastTap = now
      return .stuck
    case .still:
      lastTap = now
      return .stillWorking(message: Words.stillAck)
    case .drifted where after == before:
      return .needsSmallerPiece(message: Words.driftedNeedsWords)
    case .later where after == before:
      lastTap = now
      return .laterNotPossible(message: Words.laterOnly)
    default:
      break
    }

    lastTap = now
    var updated = saved
    updated.work = after
    updated.savedOn = now
    self.saved = updated
    let ask = choice == .done && asksRecall(kindId: saved.kindId)

    switch choice {
    case .later:
      inStep = false
    case .done where after.allDone && !ask:
      inStep = false
    default:
      break
    }
    save(updated)
    saveFlags()

    switch choice {
    case .done:
      let message = Words.doneAck
      return after.allDone
        ? .allDone(message: message, askRecall: ask) : .done(message: message, askRecall: ask)
    case .drifted:
      return .drifted(message: Words.driftedAck)
    default:
      return .later
    }
  }

  /// The stuck ladder for a step. The same ladder comes back if the student leaves and returns.
  public func ladder(for step: Step) -> LadderModel {
    if let existing = ladders[step.id] { return existing }
    let made = LadderModel(content: content, stepText: step.text)
    ladders[step.id] = made
    return made
  }

  /// Hints with no step, for the Talk screen when there is no AI.
  public func freshHints() -> LadderModel {
    LadderModel(content: content)
  }

  // MARK: Parked thoughts and recall

  @discardableResult
  public func park(_ words: String) -> Bool {
    let text = Text.trimmed(words)
    guard !text.isEmpty else { return false }
    parked.items.insert(ParkedThought(text: text, date: clock.now), at: 0)
    save(parked)
    return true
  }

  @discardableResult
  public func saveRecall(_ words: String, stepId: Int?) -> Bool {
    let text = Text.trimmed(words)
    guard !text.isEmpty else { return false }
    recall.items.insert(RecallAnswer(stepId: stepId, answer: text, date: clock.now), at: 0)
    save(recall)
    return true
  }

  // MARK: Settings

  public var voiceMode: VoiceMode { settings.voiceMode }

  /// Changes the settings and saves them. The one place settings are written.
  public func updateSettings(_ change: (inout Settings) -> Void) {
    var copy = settings
    change(&copy)
    settings = copy.limited(by: content.limits)
    save(settings)
  }

  // MARK: Saving

  private func save<Value: Storable>(_ value: Value) {
    do {
      try store.save(value)
      saveNote = nil
    } catch {
      saveNote = Words.couldNotSave
    }
  }

  private func saveFlags() {
    save(Flags(welcomed: welcomed, inStep: inStep))
  }
}
