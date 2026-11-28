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
    self.me.learnedCountdownMinutes = { [weak self] in
      guard let self else { return nil }
      return BlockLength.suggested(in: self.learner, now: self.clock.now)
    }
    self.ownAI.settings = { [weak self] in self?.settings ?? Settings() }
    self.ownAI.change = { [weak self] change in self?.updateSettings(change) }
    self.ownAI.onChoiceChanged = { [weak self] in self?.chooseModel() }
    self.talk.ownServiceLabel = { [weak self] in self?.ownAI.chosen?.label }
    self.talk.onFeedback = { [weak self] in self?.rate(move: $0, $1) }
    self.planner.onFeedback = { [weak self] in self?.rate(move: $0, $1) }
    self.planner.recordLines = { [weak self] course in
      guard let self else { return [] }
      return LearnerSelector.entries(
        context: SelectorContext(moveKey: "stepCoach", course: course), record: self.learner,
        content: self.content)
    }
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
    dropOrphanNoteLines()
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
    writeProgressLine(new)
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
    // The first step done is remembered with the same save as the step, so it cannot be lost.
    if choice == .done, updated.firstDoneOn == nil { updated.firstDoneOn = now }
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
    // The line follows the plan: a step done, or a split that made the plan longer.
    if wrote, choice == .done || choice == .drifted { writeProgressLine(updated) }

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
    made.onFeedback = { [weak self] in self?.rate(move: "stuckQuestion", $0) }
    ladders[step.id] = made
    return made
  }

  /// Asks the AI for one question about this step. The step text and kind come from the saved
  /// step, not from the boxes the student can edit.
  public func askQuestion(_ ladder: LadderModel, for step: Step) async {
    ladder.fixedFirst = Feedback.showFixedFirst(
      move: "stuckQuestion", in: learner, now: clock.now)
    await ask(ladder, for: step, forceAI: false)
  }

  /// "See the AI's question", after the fixed line was shown first.
  public func seeAIQuestion(_ ladder: LadderModel, for step: Step) async {
    await ask(ladder, for: step, forceAI: true)
  }

  private func ask(_ ladder: LadderModel, for step: Step, forceAI: Bool) async {
    let label = content.kinds.first { $0.id == saved?.kindId }?.label ?? "Something else"
    let record = LearnerSelector.entries(
      context: SelectorContext(moveKey: "stuckQuestion", course: saved?.course),
      record: learner, content: content)
    await ladder.askQuestion(
      stepText: step.text, kindLabel: label, record: record, forceAI: forceAI)
  }

  /// Writes one rating. The line holds the rating and the move only: nothing the student typed and
  /// nothing the AI said.
  public func rate(move: String, _ rating: FeedbackRating) {
    learner.add(
      LearnerRecord.Entry(
        kind: .feedback, date: clock.now, text: Feedback.text(rating, move: move),
        source: .student))
    saveLearner()
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
  /// Not private so a test can run the exact path a second finish takes.
  func writeCourseLine(_ finished: SavedWork) {
    guard let label = finished.course, !finished.work.steps.isEmpty else { return }
    // A class line the student deleted is not written back.
    guard !learner.wasDeleted("course-\(finished.assignmentId)") else { return }
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

  /// The one line for this assignment in What I did, rewritten as steps are done. Plain counts of
  /// what happened. A line the student deleted is not written back, and a failed save simply
  /// leaves the line unwritten.
  func writeProgressLine(_ work: SavedWork) {
    let id = WhatIDid.id(for: work.assignmentId)
    guard !learner.wasDeleted(id), !work.work.steps.isEmpty else { return }
    let soon: Bool =
      work.firstDoneOn.flatMap { done in
        work.plannedOn.map { WhatIDid.days(from: $0, to: done) <= WhatIDid.soonDays }
      } ?? false
    let text = WhatIDid.text(
      planned: work.work.steps.count, finished: work.work.steps.filter(\.done).count,
      firstStepSoon: soon, suggested: work.suggested)
    let before = learner
    learner.remove(id: id)
    learner.add(
      LearnerRecord.Entry(
        id: id, kind: .progress, date: work.plannedOn ?? clock.now, text: text, source: .app))
    // A failed write is rolled back, so the screen matches what is on the device.
    if !saveLearner() { learner = before }
  }

  /// Brings the note lines up to date with the Me notes: a line for each note, with the note's own
  /// id, and no line for a note that is gone (deleted, or dropped past the notes cap). This runs
  /// after each successful notes save, so a note whose earlier save failed still gets its line, and
  /// notes saved before the record existed get lines the first time a note is saved after that.
  private func syncNoteLines() {
    let notes = me.profile.notes
    let ids = Set(notes.map(\.id))
    // Only lines mirrored from notes. A line another feature wrote (id starts with `why-`) stays.
    learner.entries.removeAll {
      $0.kind == .obstacle && !ids.contains($0.id) && !$0.id.hasPrefix(Self.otherLinePrefix)
    }
    let have = Set(learner.entries.map(\.id))
    for note in notes where !have.contains(note.id) {
      learner.add(
        LearnerRecord.Entry(
          id: note.id, kind: .obstacle, date: note.date, text: note.text, source: .student))
    }
    if !saveLearner() { learnerNote = Words.rememberedDeleteFailed }
  }

  /// At launch: a note line whose note is gone (for example a delete whose second write failed) is
  /// removed, so it is not shown or offered to the AI. Never adds a line.
  private func dropOrphanNoteLines() {
    let ids = Set(me.profile.notes.map(\.id))
    let orphans = learner.entries.filter {
      $0.kind == .obstacle && !ids.contains($0.id) && !$0.id.hasPrefix(Self.otherLinePrefix)
    }
    guard !orphans.isEmpty else { return }
    learner.entries.removeAll { entry in orphans.contains { $0.id == entry.id } }
    saveLearner()
  }

  @discardableResult
  private func saveLearner() -> Bool {
    learner = learner.limited(by: content.limits)
    do {
      try store.save(learner)
      return true
    } catch {
      return false
    }
  }

  /// A line another feature wrote into the obstacle kind has an id starting with this, so the
  /// note sync leaves it alone.
  static let otherLinePrefix = "why-"

  /// A calm line when a delete on the What the app remembers screen could not be saved.
  public private(set) var learnerNote: String?

  /// Deletes one line the student sees under What the app remembers about me. A note line deletes
  /// the note itself (the line mirrors it). Any other line is removed and its id remembered, so it
  /// is not written back. If the save fails the line stays and a calm line says so.
  public func deleteLearnerLine(_ id: String) {
    guard let entry = learner.entries.first(where: { $0.id == id }) else { return }
    learnerNote = nil
    if isNoteLine(id) {
      if !me.deleteNote(id) { learnerNote = Words.rememberedDeleteFailed }
      return
    }
    let before = learner
    learner.remove(id: id)
    learner.markDeleted(id)
    if !saveLearner() {
      learner = before
      learnerNote = Words.rememberedDeleteFailed
    }
  }

  /// A line under Things I told it is a note's mirror: deleting it deletes the note.
  public func isNoteLine(_ id: String) -> Bool {
    guard let entry = learner.entries.first(where: { $0.id == id }) else { return false }
    return entry.kind == .obstacle && !id.hasPrefix(Self.otherLinePrefix)
  }

  /// Called when the screen opens, so an old message is not shown again.
  public func clearLearnerNote() { learnerNote = nil }

  /// One answer to "Was 12 minutes about right?". A plain app summary: the student's tap, nothing
  /// they typed. It shows in What the app remembers about me, where it can be deleted.
  public func answerBlockLength(minutes: Int, _ answer: BlockLength.Answer) {
    guard BlockLength.lengths.contains(minutes) else { return }
    learner.add(
      LearnerRecord.Entry(
        kind: .setting, date: clock.now, text: BlockLength.text(minutes: minutes, answer: answer),
        source: .app))
    saveLearner()
  }

  // MARK: What I did (PROG1)

  /// Plain counts for the last 30 days, read from the lines under How it went.
  public var progressSummary: WhatIDid.Summary {
    WhatIDid.summary(in: learner, now: clock.now)
  }

  public var hasProgress: Bool { WhatIDid.hasAny(in: learner) }

  // MARK: Weekly look-back (C5)

  /// The look-back reply: the AI's two sentences, or the fixed line. `fixed` replies cannot be
  /// rated.
  public struct ReflectionReply: Equatable, Sendable {
    public let line: String
    public let fixed: Bool
  }

  public private(set) var reflectionReply: ReflectionReply?
  public private(set) var reflectionBusy = false
  public private(set) var reflectionRated = false

  public var reflectionDue: Bool {
    Reflection.isDue(lastHandled: settings.lastReflectionHandled, now: clock.now)
  }

  /// The first visit to Plan starts the seven days. Nothing is shown before they pass.
  public func startReflectionClock() {
    guard settings.lastReflectionHandled == nil else { return }
    updateSettings { $0.lastReflectionHandled = clock.now }
  }

  /// Not now, or Done: seven more days. Deleting the reflection lines never brings the card back.
  public func laterReflection() {
    updateSettings { $0.lastReflectionHandled = clock.now }
  }

  /// Done: the answers become the student's own lines (deletable under What the app remembers about
  /// me), then one reply. Only the two answers go to the AI. With nothing written, nothing is
  /// saved and no call is made.
  public func submitReflection(helped: String, next: String, toward: String = "") async {
    guard !reflectionBusy else { return }
    let helped = Text.trimmed(helped)
    let next = Text.trimmed(next)
    // The goal is read now, so an edit or a clear while the sheet was open takes effect. The
    // third answer only counts when a goal is shown.
    let goal = me.lookBackGoal
    let toward = goal == nil ? "" : Text.trimmed(toward)
    laterReflection()
    // Last week's reply never shows for this one, even if the sheet was swiped away.
    reflectionReply = nil
    reflectionRated = false
    guard !helped.isEmpty || !next.isEmpty || !toward.isEmpty else { return }
    reflectionBusy = true
    defer { reflectionBusy = false }
    let answers = [
      (Reflection.helpedLabel, helped), (Reflection.nextLabel, next),
      (Reflection.goalLabel, toward),
    ]
    for (label, answer) in answers where !answer.isEmpty {
      learner.add(
        LearnerRecord.Entry(
          kind: .reflection, date: clock.now, text: Reflection.line(label, answer),
          source: .student))
    }
    saveLearner()
    let fixed = ReflectionReply(line: Words.reflectionFixed, fixed: true)
    let move = CoachMove(model: switcher, content: content)
    guard move.isAvailable else {
      reflectionReply = fixed
      return
    }
    // The goal and the answer about it go into the request only when the student turned that on.
    let sendGoal = settings.sendGoalToAI ? goal : nil
    var facts: [String] = []
    var theirs = [helped, next]
    if !helped.isEmpty {
      facts.append(CoachText.fact("What helped this week", helped, content: content))
    }
    if !next.isEmpty {
      facts.append(CoachText.fact("One thing to try next week", next, content: content))
    }
    if let sendGoal {
      facts.append(CoachText.fact("The student's own goal", sendGoal, content: content))
      theirs.append(sendGoal)
      if !toward.isEmpty {
        facts.append(
          CoachText.fact("What connected to the goal this week", toward, content: content))
        theirs.append(toward)
      }
    }
    guard !facts.isEmpty else {
      reflectionReply = fixed
      return
    }
    let outcome = await move.run(
      moveKey: "weeklyReflection", facts: facts, shape: .twoSentences,
      source: theirs.joined(separator: " "))
    switch outcome {
    case .line(let line):
      // A reply that says a goal is reached, near or on track, in words the student did not write,
      // shows the fixed line instead.
      if Reflection.judgesProgress(line, studentText: theirs) {
        reflectionReply = fixed
      } else {
        reflectionReply = ReflectionReply(line: line, fixed: false)
      }
    case .trustedAdult:
      // The student's own words may say they are in distress: show the line, never a reply.
      reflectionReply = ReflectionReply(line: content.safety.line, fixed: true)
    case .nothing, .fallback:
      // NOTHING, a refusal, a failed check or no AI: the fixed line.
      reflectionReply = fixed
    }
  }

  public func rateReflection(_ rating: FeedbackRating) {
    guard let reply = reflectionReply, !reply.fixed, !reflectionRated else { return }
    reflectionRated = true
    rate(move: "weeklyReflection", rating)
  }

  /// Closing the screen drops the reply. It is never saved.
  public func closeReflection() {
    reflectionReply = nil
    reflectionRated = false
  }

  // MARK: Block follow-up (C4)

  /// The question under the block answer: the length it names, and the line once it is ready.
  public struct BlockFollowUp: Equatable, Sendable {
    public let minutes: Int
    public let target: Int
    public var line: String?
  }

  public private(set) var blockFollowUp: BlockFollowUp?
  private var followUpTask: Task<Void, Never>?
  private var followUpId = 0

  /// After Shorter or Longer: one question suggesting the next length. About right, and a length
  /// with nowhere to go, get nothing. The AI sees only code-built facts (the length tried, how it
  /// felt, the new length), never a student's words. Any failure shows the fixed line.
  public func startBlockFollowUp(minutes: Int, _ answer: BlockLength.Answer) {
    dismissBlockFollowUp()
    guard let target = BlockLength.target(from: minutes, answer) else { return }
    let fixed = Words.blockFollowUpFixed(target)
    let move = CoachMove(model: switcher, content: content)
    guard move.isAvailable else {
      blockFollowUp = BlockFollowUp(minutes: minutes, target: target, line: fixed)
      return
    }
    blockFollowUp = BlockFollowUp(minutes: minutes, target: target, line: nil)
    followUpId += 1
    let id = followUpId
    followUpTask = Task { [weak self] in
      guard let self else { return }
      let names = ["The block length the student tried", "How it felt", "The new length to try"]
      let felt = answer == .shorter ? "too long" : "too short"
      let texts = ["\(minutes) minutes", felt, "\(target) minutes"]
      let facts = zip(names, texts).map { CoachText.fact($0, $1, content: self.content) }
      let outcome = await move.run(
        moveKey: "settingFollowUp", facts: facts, shape: .question,
        source: texts.joined(separator: " "))
      guard !Task.isCancelled, self.followUpId == id else { return }
      var line = fixed
      // A safety word is spurious here (no student words are sent), so it shows the fixed line.
      if case .line(let reply) = outcome, BlockLength.namesOnly(target, in: reply) {
        line = reply
      }
      self.blockFollowUp?.line = line
    }
  }

  /// Done, or leaving the step: drops the question and cancels a call still running.
  public func dismissBlockFollowUp() {
    followUpTask?.cancel()
    followUpTask = nil
    followUpId += 1
    blockFollowUp = nil
  }

  /// Removes every rating. The fixed-line-first choice for the Stuck question starts over.
  public func clearRatings() {
    learnerNote = nil
    let before = learner
    learner.entries.removeAll { $0.kind == .feedback }
    if !saveLearner() {
      learner = before
      learnerNote = Words.rememberedDeleteFailed
    }
  }

  /// Per move, how many of each rating. Moves with no ratings are left out.
  public var ratingCounts: [RatingCount] {
    let all = learner.entries(of: .feedback).compactMap(Feedback.parse)
    let known = ["stuckQuestion", "splitNudge", "chat", "weeklyReflection"]
    let other = Set(all.map(\.move)).subtracting(known).sorted()
    return (known + other).compactMap { move in
      let mine = all.filter { $0.move == move }
      guard !mine.isEmpty else { return nil }
      return RatingCount(
        move: move, helped: mine.filter { $0.rating == .helped }.count,
        meh: mine.filter { $0.rating == .meh }.count,
        notThis: mine.filter { $0.rating == .notthis }.count)
    }
  }

  private func saveFlags() {
    save(Flags(welcomed: welcomed, inStep: inStep))
  }
}

/// How many times each rating was tapped for one kind of AI line.
public struct RatingCount: Equatable, Identifiable, Sendable {
  public let move: String
  public let helped: Int
  public let meh: Int
  public let notThis: Int
  public var id: String { move }
}
