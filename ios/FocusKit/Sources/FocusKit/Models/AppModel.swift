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
  public let me: MeModel
  public let ownAI: OwnAIModel

  public private(set) var welcomed: Bool
  /// The student is on the work screen.
  public private(set) var inStep: Bool
  public private(set) var saved: SavedWork?
  /// What the app keeps across assignments: one line per saved note, and one per finished course.
  public private(set) var learner: LearnerRecord
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
  private let phoneModel: any LanguageModel
  private let switcher: SwitchableLanguageModel
  private let backup: any BackupFlag
  private var backupApplied: Bool?
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
    self.phoneModel = services.languageModel
    let switcher = SwitchableLanguageModel(services.languageModel)
    self.switcher = switcher
    self.backup = services.backup
    self.ownAI = OwnAIModel(keys: services.keys, transport: services.transport)
    self.dictation = DictationModel(
      input: services.speechInput, store: store, clock: clock, limit: content.limits.pasteLength)
    self.speaker = SpeakerModel(output: services.speechOutput, headphones: services.headphones)
    self.talk = ChatModel(
      content: content, store: store, clock: clock, model: switcher,
      speaker: self.speaker)
    self.me = MeModel(content: content, store: store, clock: clock)
    self.learner = store.load(LearnerRecord.self).value ?? LearnerRecord()
    self.planner = PlannerModel(content: content, store: store, clock: clock, draft: draft)
    self.planner.coach = StepCoach(model: switcher, content: content)
    self.planner.nudgeMove = CoachMove(model: switcher, content: content)
    self.planner.ownServiceLabel = { [weak self] in self?.ownAI.chosen?.label }
    self.planner.onStart = { [weak self] saved in self?.began(saved) }
    self.me.settings = { [weak self] in self?.settings ?? Settings() }
    self.me.change = { [weak self] change in self?.updateSettings(change) }
    self.me.erase = { [weak self] in self?.eraseEverything() ?? false }
    self.me.onNotesSaved = { [weak self] in self?.syncNoteLines() }
    self.ownAI.settings = { [weak self] in self?.settings ?? Settings() }
    self.ownAI.change = { [weak self] change in self?.updateSettings(change) }
    self.ownAI.onChoiceChanged = { [weak self] in self?.chooseModel() }
    self.talk.ownServiceLabel = { [weak self] in self?.ownAI.chosen?.label }
    self.talk.currentAIId = { [weak self] in self?.ownAI.chosenId }
    self.talk.ownServiceUsesHttp = { [weak self] in
      self?.ownAI.chosen?.config.needsUnencryptedWarning == true
    }
    self.talk.settings = { [weak self] in self?.settings ?? Settings() }
    self.talk.onUseSteps = { [weak self] steps, kind in
      guard let self, self.planner.importSteps(steps, kindId: kind) else { return }
      self.planning = true
      // The editor lives on Today. If the chat was opened from the work screen, leave the step
      // (it stays saved) so the editor is not hidden behind it.
      self.leaveStep()
      self.showToday = true
    }
    self.speaker.settings = { [weak self] in self?.settings ?? Settings() }
    self.dictation.willListen = { [weak self] in self?.speaker.interrupted() }
    startOwnServices()
    chooseModel()
    applyBackup()
  }

  /// Build 5 kept one service in four settings and one key. Save the list first, then move the
  /// key, so a failure at either step is simply tried again next launch with nothing lost.
  private func startOwnServices() {
    if settings.movedFromSingleService {
      var copy = settings
      copy.movedFromSingleService = false
      updateSettings { $0 = copy }
    }
    // If the list could not be saved, the key stays in its old place until a launch where it can.
    if saveNote == nil { ownAI.migrateLegacyKey() }
    ownAI.refreshKeys()
    ownAI.settleChoice()
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

  /// Leaving the planner for Today is only possible when there are saved steps to show. What was
  /// typed stays in the draft, so "New assignment" picks up where the student left off.
  public var canLeavePlanning: Bool { hasSteps }

  public func cancelPlanning() {
    guard hasSteps else { return }
    planning = false
  }

  /// "Make steps" from the Plan tab: opens the planner on Today.
  public func goToPlanning() {
    planning = true
    showToday = true
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
      var counted = saved
      counted.stuck += 1
      self.saved = counted
      save(counted)
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
    let previous = saved
    var updated = saved
    updated.work = after
    updated.savedOn = now
    if choice == .drifted { updated.drifted += 1 }
    let ask = choice == .done && asksRecall(kindId: saved.kindId)
    let wrote = save(updated)
    // If the last step cannot be saved, the step stays open so the student can tap Done again.
    if !wrote, choice == .done, after.allDone {
      self.saved = previous
      return .ignored
    }
    self.saved = updated
    if wrote, choice == .done, after.allDone {
      writeCourseLine(updated)
    }

    switch choice {
    case .later:
      inStep = false
    case .done where after.allDone && !ask:
      inStep = false
    default:
      break
    }
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
    made.coach = CoachMove(model: switcher, content: content)
    ladders[step.id] = made
    return made
  }

  /// Asks the AI for one question about this step. The step text and kind come from the saved
  /// step, not from the boxes the student can edit.
  public func askQuestion(_ ladder: LadderModel, for step: Step) async {
    let label = content.kinds.first { $0.id == saved?.kindId }?.label ?? "Something else"
    let record = LearnerSelector.entries(
      context: SelectorContext(moveKey: "stuckQuestion", course: saved?.course),
      record: learner, content: content)
    await ladder.askQuestion(stepText: step.text, kindLabel: label, record: record)
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

  /// Removes one parked thought. The student confirms first (in the view).
  public func deleteParked(_ id: String) {
    parked.items.removeAll { $0.id == id }
    save(parked)
  }

  /// Removes one recall answer. The student confirms first (in the view).
  public func deleteRecall(_ id: String) {
    recall.items.removeAll { $0.id == id }
    save(recall)
  }

  // MARK: Settings

  public var readAloudOn: Bool { settings.readAloud }
  public var talkOn: Bool { settings.talk }

  /// Changes the settings and saves them. The one place settings are written.
  public func updateSettings(_ change: (inout Settings) -> Void) {
    var copy = settings
    change(&copy)
    settings = copy.limited(by: content.limits)
    save(settings)
    applyBackup()
  }

  /// Uses the student's own AI service when one is chosen and ready; otherwise the phone's own.
  /// Every reply from either goes through the same safety and answer checks.
  private func chooseModel() {
    if let own = ownAI.makeModel() {
      switcher.use(own)
    } else {
      switcher.use(phoneModel)
    }
    talk.refreshAvailability()
  }

  /// Makes the data folder follow "Include in my iPhone backup". Only when it changed.
  private func applyBackup() {
    let excluded = !settings.includeInBackup
    guard backupApplied != excluded else { return }
    backupApplied = backup.setExcluded(excluded) ? excluded : nil
  }

  // MARK: Delete everything

  /// "Delete everything on this iPhone". Removes every saved file (backups too), then forgets
  /// everything held in memory. Nothing is saved afterwards until the student does something, so
  /// the folder stays empty. Returns false, changing nothing, if the files could not be removed.
  @discardableResult
  public func eraseEverything() -> Bool {
    // The key goes first. If it cannot be removed, nothing is reported as deleted.
    guard ownAI.eraseKeys() else {
      saveNote = Words.couldNotErase
      return false
    }
    do {
      try store.deleteAll()
    } catch {
      saveNote = Words.couldNotErase
      return false
    }
    welcomed = false
    inStep = false
    saved = nil
    parked = ParkedThoughts()
    recall = RecallAnswers()
    learner = LearnerRecord()
    settings = Settings()
    planning = false
    ladders = [:]
    lastTap = nil
    saveNote = nil
    welcomeLine = Pickup.line(savedOn: nil, now: clock.now, in: content)
    planner.reset()
    talk.reset()
    me.reset()
    ownAI.reset()
    chooseModel()
    applyBackup()
    dictation.reset()
    speaker.stop()
    return true
  }

  // MARK: Saving

  @discardableResult
  private func save<Value: Storable>(_ value: Value) -> Bool {
    do {
      try store.save(value)
      saveNote = nil
      return true
    } catch {
      saveNote = Words.couldNotSave
      return false
    }
  }

  // MARK: What the learner record keeps

  /// One course line for a finished assignment with a class label. Written once: the id is the
  /// assignment's, so a repeat writes over the same line. A failed record write is silent: the
  /// steps have already saved, and the record is not shown anywhere.
  private func writeCourseLine(_ finished: SavedWork) {
    guard let label = finished.course, !finished.work.steps.isEmpty else { return }
    let kind = content.kinds.first { $0.id == finished.kindId }?.label ?? "Something else"
    let kept = finished.work.steps.prefix(LearnerRecord.courseStepLimit)
      .map { Text.trimmed($0.text) }
      .joined(separator: " / ")
    let id = "course-\(finished.assignmentId)"
    learner.remove(id: id)
    learner.add(
      LearnerRecord.Entry(
        id: id, kind: .course, date: clock.now, text: "\(kind): \(kept)", source: .app,
        courseLabel: label, stuckCount: finished.stuck, driftedCount: finished.drifted))
    saveLearner()
  }

  /// Brings the note lines up to date with the Me notes: a line for each note, with the note's own
  /// id, and no line for a note that is gone (deleted, or dropped past the notes cap). This runs
  /// after each successful notes save, so a note whose earlier save failed still gets its line, and
  /// notes saved before the record existed get lines the first time a note is saved after that.
  private func syncNoteLines() {
    let notes = me.profile.notes
    let ids = Set(notes.map(\.id))
    learner.entries.removeAll { $0.kind == .obstacle && !ids.contains($0.id) }
    let have = Set(learner.entries.map(\.id))
    for note in notes where !have.contains(note.id) {
      learner.add(
        LearnerRecord.Entry(
          id: note.id, kind: .obstacle, date: note.date, text: note.text, source: .student))
    }
    saveLearner()
  }

  private func saveLearner() {
    learner = learner.limited(by: content.limits)
    try? store.save(learner)
  }

  private func saveFlags() {
    save(Flags(welcomed: welcomed, inStep: inStep))
  }
}
