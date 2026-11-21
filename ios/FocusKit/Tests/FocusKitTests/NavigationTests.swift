import Foundation
import Testing

@testable import FocusKit

/// Ways out and ways back: no screen is a dead end, and leaving never loses saved work.
@MainActor
@Suite struct NavigationTests {
  let content: Content
  let store: MemoryStore
  let clock = FakeClock()

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
  }

  private func appWithSteps(_ steps: [String] = ["A", "B", "C"]) -> AppModel {
    let model = AppModel(content: content, store: store, clock: clock)
    model.planner.setText("Some assignment")
    model.planner.beginSaying()
    for step in steps { model.planner.addSaid(step) }
    model.planner.thatsAll()
    model.planner.start()
    return model
  }

  // MARK: The work screen

  @Test func leavingAStepKeepsItAndComingBackShowsTheSameStep() {
    let model = appWithSteps()
    #expect(model.inStep)
    clock.advance(by: 5)
    let before = model.work
    model.leaveStep()
    #expect(!model.inStep)
    #expect(model.work == before)
    #expect(model.currentStep?.text == "A")
    model.startStep()
    #expect(model.inStep)
    #expect(model.currentStep?.text == "A")
  }

  @Test func leavingThenClosingTheAppReopensOnTodayWithTheSameStep() {
    let model = appWithSteps()
    model.leaveStep()
    let reopened = AppModel(content: content, store: store, clock: clock)
    #expect(!reopened.inStep)
    #expect(!reopened.showsPlanner)
    #expect(reopened.currentStep?.text == "A")
  }

  @Test func leavingNeverCountsAgainstTheStudent() {
    let model = appWithSteps()
    let line = model.welcomeLine
    model.leaveStep()
    model.leaveStep()
    #expect(model.welcomeLine == line)
    #expect(model.work?.doneCount == 0)
    #expect(model.work?.steps.map(\.text) == ["A", "B", "C"])
  }

  @Test func usingChatStepsFromTheWorkScreenLeavesTheStepAndOpensTheEditor() {
    let model = appWithSteps()
    #expect(model.inStep)
    model.talk.onUseSteps(["Read it", "Write one line"], nil)
    #expect(!model.inStep)
    #expect(model.showToday)
    #expect(model.planner.draft.stage == .editor)
    // The saved steps are untouched.
    #expect(model.work?.steps.map(\.text) == ["A", "B", "C"])
  }

  // MARK: Planning

  @Test func cancellingANewAssignmentGoesToTodayAndKeepsWhatWasTyped() {
    let model = appWithSteps()
    model.leaveStep()
    model.startNewAssignment()
    #expect(model.showsPlanner)
    #expect(model.canLeavePlanning)
    model.planner.setText("Half a thought")
    model.cancelPlanning()
    #expect(!model.showsPlanner)
    #expect(model.planner.draft.text == "Half a thought")
    model.startNewAssignment()
    #expect(model.planner.draft.text == "Half a thought")
  }

  @Test func withNoStepsThereIsNothingToLeaveTo() {
    let model = AppModel(content: content, store: store, clock: clock)
    #expect(model.showsPlanner)
    #expect(!model.canLeavePlanning)
    model.cancelPlanning()
    #expect(model.showsPlanner)
  }

  @Test func backFromTheEditorKeepsTheStepsAndCanReturnToThem() {
    let model = AppModel(content: content, store: store, clock: clock)
    model.planner.setText("Essay")
    model.planner.makeSuggested()
    let steps = model.planner.draft.steps.map(\.text)
    #expect(model.planner.draft.stage == .editor)
    model.planner.backToAssignment()
    #expect(model.planner.draft.stage == .assignment)
    #expect(model.planner.draft.steps.map(\.text) == steps)
    #expect(model.planner.wouldReplaceSteps)
    #expect(model.planner.backToEditor())
    #expect(model.planner.draft.stage == .editor)
    #expect(model.planner.draft.steps.map(\.text) == steps)
  }

  @Test func backToTheEditorWithNoStepsDoesNothing() {
    let model = AppModel(content: content, store: store, clock: clock)
    model.planner.setText("Essay")
    #expect(!model.planner.wouldReplaceSteps)
    #expect(!model.planner.backToEditor())
    #expect(model.planner.draft.stage == .assignment)
  }

  @Test func stepsKeptBehindTheAssignmentSurviveClosingTheApp() {
    let model = AppModel(content: content, store: store, clock: clock)
    model.planner.setText("Essay")
    model.planner.makeSuggested()
    model.planner.setText("")
    model.planner.backToAssignment()
    let reopened = AppModel(content: content, store: store, clock: clock)
    #expect(reopened.planner.draft.steps.count == model.planner.draft.steps.count)
    #expect(reopened.showsPlanner)
  }

  @Test func theEmptyPlanTabCanOpenThePlannerOnToday() {
    let model = appWithSteps()
    model.leaveStep()
    model.goToPlanning()
    #expect(model.showsPlanner)
    #expect(model.showToday)
  }

  // MARK: Trying again

  @Test func lookUpOffersTryAgainOnlyWhenThereWasNoAnswerAndItWorksNextTime() async {
    let fake = FakeLookUp(.fail(.offline))
    let model = LookUpModel(lookUp: fake, words: "courage")
    #expect(!model.canTryAgain)
    model.search()
    await model.waitForSearch()
    #expect(model.state == .offline)
    #expect(model.canTryAgain)
    let page = LookUpResult(
      title: "Courage", line: "x", url: URL(string: "https://en.wikipedia.org/wiki/Courage")!)
    fake.set(.results([page]))
    model.search()
    await model.waitForSearch()
    #expect(model.state == .results([page]))
    #expect(!model.canTryAgain)
    for error in [LookUpError.timeout, .trouble] {
      fake.set(.fail(error))
      model.search()
      await model.waitForSearch()
      #expect(model.canTryAgain)
    }
  }

  @Test func talkCanBeRetriedWhenTheAIWasNotReady() {
    let fake = FakeLanguageModel(availability: .notReady)
    let speaker = SpeakerModel(output: FakeSpeechOutput(), headphones: FakeHeadphones(connected: true))
    let chat = ChatModel(
      content: content, store: store, clock: clock, model: fake, speaker: speaker)
    #expect(chat.unavailableLine != nil)
    chat.refreshAvailability()
    #expect(!chat.isAvailable)
    fake.set(.available)
    chat.refreshAvailability()
    #expect(chat.isAvailable)
    #expect(chat.unavailableLine == nil)
  }

  @Test func theMicrophoneOffersTryAgainWhenDeniedAndRecoversWhenAllowed() async {
    let input = FakeSpeechInput(availability: .permissionDenied)
    let dictation = DictationModel(input: input, store: store, clock: clock, limit: 200)
    #expect(!dictation.canTryAgain)
    await dictation.refresh()
    #expect(dictation.state == .denied)
    #expect(dictation.canTryAgain)
    #expect(dictation.isOffered)
    input.set(.ready)
    await dictation.refresh()
    #expect(dictation.state == .idle)
    #expect(!dictation.canTryAgain)
  }

  @Test func noWordInTheNewWordsIsAShameWord() {
    let words = [
      Words.backToToday, Words.backToMySteps, Words.back, Words.tryAgain, Words.replaceTitle,
      Words.replaceKeep, Words.replaceGo, Words.planEmpty, Words.planMakeSteps,
    ]
    for word in ["missed", "behind", "late", "overdue", "failed"] {
      for line in words { #expect(!line.lowercased().contains(word)) }
    }
  }
}
