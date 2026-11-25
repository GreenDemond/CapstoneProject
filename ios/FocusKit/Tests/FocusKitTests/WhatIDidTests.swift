import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct WhatIDidTests {
  let content: Content
  let store: MemoryStore
  let clock = FakeClock()

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
  }

  private func line(
    _ planned: Int, _ finished: Int, first: Bool = false, suggested: Bool = false,
    daysAgo: Double = 0, id: String = UUID().uuidString
  ) -> LearnerRecord.Entry {
    LearnerRecord.Entry(
      id: id, kind: .progress, date: clock.now.addingTimeInterval(-daysAgo * 86_400),
      text: WhatIDid.text(
        planned: planned, finished: finished, firstStepSoon: first, suggested: suggested),
      source: .app)
  }

  private func summary(_ entries: [LearnerRecord.Entry]) -> WhatIDid.Summary {
    WhatIDid.summary(in: LearnerRecord(entries: entries), now: clock.now)
  }

  // MARK: The line

  @Test func theLineReadsPlainlyNeverCountsDaysAndParsesBack() throws {
    #expect(
      WhatIDid.text(planned: 5, finished: 2, firstStepSoon: true, suggested: false)
        == "Planned 5 steps. Finished 2. First step done soon after planning. Steps written by you."
    )
    #expect(
      WhatIDid.text(planned: 1, finished: 0, firstStepSoon: false, suggested: true)
        == "Planned 1 step. Finished 0. Steps from a suggestion.")
    // A first step that was not soon adds no sentence: a missing sentence is not a judgement.
    #expect(
      WhatIDid.text(planned: 3, finished: 3, firstStepSoon: false, suggested: false)
        == "Planned 3 steps. Finished 3. Steps written by you.")
    let parsed = try #require(WhatIDid.parse(line(5, 2, first: true, suggested: true)))
    #expect(parsed.planned == 5 && parsed.finished == 2 && parsed.firstStepSoon == true)
    #expect(parsed.suggested)
    #expect(
      !WhatIDid.text(planned: 2, finished: 1, firstStepSoon: true, suggested: false)
        .lowercased().contains("day"))
  }

  @Test func aDamagedLineIsIgnoredNotACrash() {
    let bad = LearnerRecord.Entry(
      kind: .progress, date: clock.now, text: "Planned many steps. Finished some.", source: .app)
    #expect(WhatIDid.parse(bad) == nil)
    #expect(summary([bad]).isEmpty)
  }

  // MARK: The counts

  @Test func theWindowIsThirtyDaysByPlanDate() {
    #expect(summary([line(3, 1, daysAgo: 29)]).assignments == 1)
    #expect(summary([line(3, 1, daysAgo: 31)]).assignments == 0)
  }

  @Test func theCountsAddUpAndSuggestionsAndOwnPlansAreSeparateEqualLines() {
    let result = summary([
      line(5, 5, first: true, suggested: true), line(4, 2, first: true),
      line(3, 0, suggested: true), line(6, 6, first: false),
    ])
    #expect(result.assignments == 4)
    #expect(result.stepsFinished == 13)
    #expect(result.firstStepSoon == 2)
    #expect(result.fromSuggestion == 2 && result.writtenByStudent == 2)
  }

  @Test func aFirstStepDoneSoonCountsALaterOneAndAnUnknownOneDoNot() {
    #expect(summary([line(3, 1, first: true)]).firstStepSoon == 1)
    #expect(summary([line(3, 1, first: false)]).firstStepSoon == 0)
    #expect(summary([line(3, 0)]).firstStepSoon == 0)
    #expect(summary([line(3, 0)]).assignments == 1)
  }

  @Test func daysAreLocalCalendarDaysAndABackwardsClockCountsAsZero() {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = TimeZone(identifier: "America/Chicago") ?? .current
    let late = calendar.date(
      from: DateComponents(year: 2026, month: 3, day: 3, hour: 23, minute: 50))!
    let early = calendar.date(
      from: DateComponents(year: 2026, month: 3, day: 4, hour: 0, minute: 10))!
    #expect(WhatIDid.days(from: late, to: early, calendar: calendar) == 1)
    #expect(WhatIDid.days(from: early, to: late, calendar: calendar) == 0)
    #expect(WhatIDid.days(from: late, to: late, calendar: calendar) == 0)
  }

  // MARK: Writing the line

  private func app() -> AppModel {
    AppModel(
      content: content, store: store, clock: clock,
      services: Services(languageModel: FakeLanguageModel()))
  }

  private func plan(_ model: AppModel, own steps: [String] = ["Read it", "Plan it"]) {
    model.planner.setText("Some assignment")
    _ = model.planner.beginSaying()
    for step in steps { _ = model.planner.addSaid(step) }
    _ = model.planner.thatsAll()
    #expect(model.planner.start())
  }

  private func lines(_ model: AppModel) -> [LearnerRecord.Entry] {
    model.learner.entries(of: .progress)
  }

  @Test func startingWritesOneLineForAnAssignmentWrittenByTheStudent() {
    let model = app()
    plan(model)
    #expect(lines(model).count == 1)
    #expect(lines(model)[0].text == "Planned 2 steps. Finished 0. Steps written by you.")
    #expect(lines(model)[0].source == .app)
  }

  @Test func finishingStepsRewritesTheSameLineAndNeverAddsAnother() throws {
    let model = app()
    plan(model)
    let first = try #require(model.currentStep?.id)
    clock.advance(by: AppModel.tapGap + 0.1)
    _ = model.choose(.done, stepId: first)
    #expect(lines(model).count == 1)
    #expect(
      lines(model)[0].text
        == "Planned 2 steps. Finished 1. First step done soon after planning. Steps written by you."
    )
    let second = try #require(model.currentStep?.id)
    clock.advance(by: AppModel.tapGap + 0.1)
    _ = model.choose(.done, stepId: second)
    #expect(lines(model).count == 1)
    #expect(lines(model)[0].text.contains("Finished 2."))
  }

  @Test func theFirstStepDayIsMeasuredFromPlanning() throws {
    let model = app()
    plan(model)
    clock.advance(by: 2 * 86_400 + 60)
    let id = try #require(model.currentStep?.id)
    _ = model.choose(.done, stepId: id)
    #expect(!lines(model)[0].text.contains("First step"))
    #expect(model.progressSummary.firstStepSoon == 0)
  }

  @Test func theAssignmentInProgressIsCounted() {
    let model = app()
    plan(model)
    #expect(model.progressSummary.assignments == 1)
    #expect(model.progressSummary.writtenByStudent == 1)
    #expect(model.hasProgress)
  }

  @Test func aDeletedLineIsNotWrittenBackAndTheCountsFollowAtOnce() throws {
    let model = app()
    plan(model)
    let id = try #require(lines(model).first?.id)
    model.deleteLearnerLine(id)
    #expect(lines(model).isEmpty && model.progressSummary.assignments == 0)
    let step = try #require(model.currentStep?.id)
    clock.advance(by: AppModel.tapGap + 0.1)
    _ = model.choose(.done, stepId: step)
    #expect(lines(model).isEmpty)
  }

  @Test func aFailedSaveLeavesNoLineOnScreenOrOnTheDeviceAndTheNextDoneWritesIt() throws {
    let model = app()
    store.failWritesTo = LearnerRecord.fileName
    plan(model)
    #expect(model.saved != nil)
    #expect(!model.hasProgress)
    #expect(store.load(LearnerRecord.self).value?.entries(of: .progress).isEmpty ?? true)
    store.failWritesTo = nil
    let id = try #require(model.currentStep?.id)
    clock.advance(by: AppModel.tapGap + 0.1)
    _ = model.choose(.done, stepId: id)
    #expect(lines(model).count == 1)
    #expect(store.load(LearnerRecord.self).value?.entries(of: .progress).count == 1)
    let again = AppModel(
      content: content, store: store, clock: clock,
      services: Services(languageModel: FakeLanguageModel()))
    #expect(again.hasProgress)
  }

  @Test func theFirstStepDayIsSavedWithTheStepItself() throws {
    let model = app()
    plan(model)
    let id = try #require(model.currentStep?.id)
    clock.advance(by: AppModel.tapGap + 0.1)
    _ = model.choose(.done, stepId: id)
    #expect(store.load(SavedWork.self).value?.firstDoneOn != nil)
  }

  @Test func aSplitMakesTheLineFollowThePlanOnTheNextDone() throws {
    let model = app()
    plan(model, own: ["Read the long chapter", "Plan it"])
    let id = try #require(model.currentStep?.id)
    clock.advance(by: AppModel.tapGap + 0.1)
    _ = model.choose(.drifted, stepId: id, smallerPiece: "Read page one")
    let planned = model.saved?.work.steps.count ?? 0
    #expect(lines(model)[0].text.hasPrefix("Planned \(planned) step"))
  }

  // MARK: Suggested or written by the student

  @Test func onlyIllSayMyStepsIsWrittenByTheStudent() {
    let own = app()
    own.planner.setText("A")
    _ = own.planner.beginSaying()
    _ = own.planner.addSaid("Read it")
    #expect(!own.planner.draft.suggested)

    let starter = app()
    starter.planner.setText("A")
    _ = starter.planner.makeSuggested()
    #expect(starter.planner.draft.suggested)

    let talk = app()
    talk.planner.setText("A")
    #expect(talk.planner.importSteps(["Read it"], kindId: nil))
    #expect(talk.planner.draft.suggested)
  }

  @Test func takingAnIdeaMakesThePlanSuggestedAndSayingMyStepsStartsOver() async {
    let model = app()
    model.planner.setText("Essay")
    model.planner.setKind("essay")
    _ = model.planner.beginSaying()
    await model.planner.giveIdea()
    model.planner.useIdea()
    #expect(model.planner.draft.suggested)
    _ = model.planner.beginSaying()
    #expect(!model.planner.draft.suggested)
  }

  @Test func aSuggestedPlanIsWrittenAsFromASuggestion() {
    let model = app()
    model.planner.setText("A")
    _ = model.planner.makeSuggested()
    #expect(model.planner.start())
    #expect(lines(model)[0].text.hasSuffix("Steps from a suggestion."))
  }

  @Test func thePlanDateIsSetOnceWhenTheStepsReachTheEditor() {
    let model = app()
    model.planner.setText("A")
    #expect(model.planner.draft.plannedOn == nil)
    _ = model.planner.makeSuggested()
    let first = model.planner.draft.plannedOn
    #expect(first != nil)
    clock.advance(by: 3 * 86_400)
    model.planner.setStepText(model.planner.draft.steps[0].id, "Changed")
    #expect(model.planner.draft.plannedOn == first)
  }

  @Test func goingBackToChangeTheAssignmentStartsTheDayAgain() {
    let model = app()
    model.planner.setText("A")
    _ = model.planner.makeSuggested()
    let first = model.planner.draft.plannedOn
    model.planner.backToAssignment()
    #expect(model.planner.draft.plannedOn == nil)
    clock.advance(by: 3 * 86_400)
    _ = model.planner.makeSuggested()
    #expect(model.planner.draft.plannedOn != first)
  }

  @Test func aDraftLeftForAMonthStillCountsFromTheDayItWasStarted() {
    let model = app()
    model.planner.setText("A")
    _ = model.planner.makeSuggested()
    clock.advance(by: 40 * 86_400)
    #expect(model.planner.start())
    #expect(model.saved?.plannedOn == clock.now)
    #expect(model.progressSummary.assignments == 1)
  }

  // MARK: Storage

  @Test func oldDraftAndWorkFilesLoadWithTheNewFieldsEmpty() throws {
    let draft =
      #"{"version":1,"value":{"stage":"editor","text":"x","kindId":"essay","stepCount":5,"steps":[],"nextId":0,"nudgeDismissed":[],"truncated":false}}"#
    store.plant("draft.json", Data(draft.utf8))
    let loaded = store.load(Draft.self).value
    #expect(loaded?.plannedOn == nil && loaded?.suggested == false)
    // A saved-work file from an older build: the same file with the new keys taken out.
    try store.save(SavedWork(work: Work(texts: ["Read it"]), assignmentId: "a1"))
    let raw = try #require(store.rawRead(SavedWork.fileName))
    var tree = try #require(try JSONSerialization.jsonObject(with: raw) as? [String: Any])
    var value = try #require(tree["value"] as? [String: Any])
    for key in ["plannedOn", "suggested", "firstDoneOn"] { value.removeValue(forKey: key) }
    tree["value"] = value
    store.plant(SavedWork.fileName, try JSONSerialization.data(withJSONObject: tree))
    let back = store.load(SavedWork.self).value
    #expect(back != nil)
    #expect(back?.plannedOn == nil && back?.firstDoneOn == nil && back?.suggested == false)
  }

  @Test func aProgressLineAddsNoNewKeysToTheSavedFile() throws {
    try store.save(LearnerRecord(entries: [line(2, 1, first: true)]))
    let raw = try #require(store.rawRead(LearnerRecord.fileName))
    let tree = try JSONSerialization.jsonObject(with: raw)
    var keys = Set<String>()
    func collect(_ node: Any) {
      if let object = node as? [String: Any] {
        for (key, value) in object {
          keys.insert(key)
          collect(value)
        }
      } else if let list = node as? [Any] {
        list.forEach(collect)
      }
    }
    collect(tree)
    #expect(
      keys == ["version", "value", "entries", "id", "kind", "date", "text", "source", "tags"])
  }

  @Test func theProgressKindHasACapAndKeepsTheNewest() {
    #expect(LearnerRecord.cap(for: .progress) == 100)
    var entries: [LearnerRecord.Entry] = []
    for index in 0..<120 { entries.append(line(2, 1, daysAgo: Double(index) / 10)) }
    let limited = LearnerRecord(entries: entries).limited(by: content.limits)
    #expect(limited.entries(of: .progress).count == 100)
  }

  @Test func noMoveCanSeeTheProgressLines() {
    for (key, move) in content.coach.moves {
      #expect(!move.sees.contains { $0.kind == "progress" }, "\(key)")
    }
    #expect(!content.stepCoach.sees.contains { $0.kind == "progress" })
    let other = LearnerRecord.Entry(
      kind: .pattern, date: clock.now, text: "Starting is hard", source: .student,
      tags: [.starting])
    let record = LearnerRecord(entries: [line(2, 1, first: true), other])
    for key in ["stuckQuestion", "splitNudge", "stepCoach", "tidyQuestion", "weeklyReflection"] {
      let seen = LearnerSelector.entries(
        context: SelectorContext(moveKey: key, course: "History"), record: record,
        content: content)
      #expect(!seen.contains { $0.kind == .progress }, "\(key)")
    }
  }

  // MARK: Words

  @Test func theWordsHaveNoShamePraiseScoreOrImprovementWords() {
    let words = [
      Words.meRowDid, Words.didLast30, Words.didNothingLately, Words.didNothingYet,
      Words.didGoalsLink, Words.rememberedGroupProgress, Words.didAssignments(4),
      Words.didAssignments(1), Words.didSteps(14), Words.didFirstStep(3),
      Words.didFromSuggestion(2), Words.didWrittenByYou(2),
      WhatIDid.text(planned: 5, finished: 0, firstStepSoon: false, suggested: false),
      WhatIDid.text(planned: 5, finished: 5, firstStepSoon: true, suggested: true),
    ].joined(separator: " ").lowercased()
      .split(whereSeparator: { !$0.isLetter }).map(String.init)
    let banned = [
      "attention", "focus", "mood", "effort", "diagnosis", "adhd", "missed", "behind", "late",
      "overdue", "failed", "great", "awesome", "streak", "score", "best", "worst", "bad", "good",
      "proud", "sorry", "lazy", "should", "must", "improve", "improved", "progress", "better",
      "sooner", "later", "slow", "only", "abandoned", "help", "less",
    ]
    for word in banned { #expect(!words.contains(word), "\(word)") }
  }
}
