import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct PlannerTests {
  let content: Content
  let store: MemoryStore
  let clock = FakeClock()

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
  }

  private func planner(draft: Draft = .empty) -> PlannerModel {
    PlannerModel(content: content, store: store, clock: clock, draft: draft)
  }

  @Test func nothingEnteredGivesACalmNoteAndNoSteps() {
    let model = planner()
    #expect(!model.makeSuggested())
    #expect(model.showEmptyNote)
    #expect(model.draft.stage == .assignment)
    model.setText("   \n  ")
    #expect(!model.makeSuggested())
  }

  @Test func suggestedStepsOpenTheEditorNotTheWork() {
    let model = planner()
    model.setText("Five paragraphs on courage")
    model.setKind("essay")
    model.setStepCount(3)
    #expect(model.makeSuggested())
    #expect(model.draft.stage == .editor)
    #expect(model.draft.steps.count == 3)
  }

  @Test func startOnlyWorksFromTheEditor() {
    let model = planner()
    var started: SavedWork?
    model.onStart = { started = $0 }
    model.setText("Essay on courage")
    // Not shown the editor yet: Start must do nothing, even with steps present.
    #expect(!model.canStart)
    #expect(!model.start())
    #expect(started == nil)
    model.makeSuggested()
    #expect(model.start())
    #expect(started?.work.steps.count == 5)
    #expect(started?.kindId == "other")
  }

  @Test func startTwiceStartsOnce() {
    let model = planner()
    var count = 0
    model.onStart = { _ in count += 1 }
    model.setText("Read chapter 3")
    model.makeSuggested()
    #expect(model.start())
    #expect(!model.start())
    #expect(count == 1)
  }

  @Test func listPastedBecomesTheFirstSteps() {
    let model = planner()
    model.setText("1. Read pages 1-5\n2. Answer the questions")
    model.setStepCount(3)
    model.makeSuggested()
    #expect(model.draft.steps.first?.text == "Read pages 1-5")
    #expect(model.draft.steps.count == 3)
  }

  @Test func tenThousandCharactersAreCutAndSaid() {
    let model = planner()
    model.setText(String(repeating: "a", count: 10_000))
    #expect(model.draft.text.utf16.count == content.limits.pasteLength)
    #expect(model.draft.truncated)
    #expect(model.makeSuggested())
  }

  @Test func sayingStepsByTyping() {
    let model = planner()
    model.beginSaying()
    #expect(!model.addSaid("   "))
    #expect(!model.thatsAll())
    #expect(model.addSaid("Open the doc"))
    #expect(model.addSaid("Write one line"))
    #expect(model.addSaid("Read it once"))
    #expect(model.thatsAll())
    #expect(model.draft.stage == .editor)
    var started: SavedWork?
    model.onStart = { started = $0 }
    #expect(model.start())
    #expect(started?.work.steps.map(\.text) == ["Open the doc", "Write one line", "Read it once"])
  }

  @Test func nudgeAppearsForAndAndNoLeavesTheStepAlone() throws {
    let model = planner()
    model.beginSaying()
    model.addSaid("Read the chapter and answer the questions")
    model.addSaid("Check it")
    let first = try #require(model.draft.steps.first)
    let second = try #require(model.draft.steps.last)
    #expect(model.looksLikeTwo(first.id))
    #expect(!model.looksLikeTwo(second.id))
    model.dismissNudge(first.id)
    #expect(!model.looksLikeTwo(first.id))
    #expect(model.draft.steps.first?.text == "Read the chapter and answer the questions")
    #expect(model.draft.steps.count == 2)
  }

  @Test func splitAtAndAndJoinBack() throws {
    let model = planner()
    model.beginSaying()
    model.addSaid("Read the chapter and answer the questions")
    let id = try #require(model.draft.steps.first?.id)
    #expect(model.split(id))
    #expect(model.draft.steps.map(\.text) == ["Read the chapter", "answer the questions"])
    #expect(model.joinWithNext(id))
    #expect(model.draft.steps.map(\.text) == ["Read the chapter answer the questions"])
    #expect(!model.joinWithNext(id))
  }

  @Test func oneWordCannotBeSplit() throws {
    let model = planner()
    model.beginSaying()
    model.addSaid("Read")
    let id = try #require(model.draft.steps.first?.id)
    #expect(!model.split(id))
    #expect(model.draft.steps.count == 1)
  }

  @Test func reorderDeleteAndAdd() throws {
    let model = planner()
    model.beginSaying()
    for word in ["A one", "B two", "C three"] { model.addSaid(word) }
    model.thatsAll()
    model.move(from: IndexSet(integer: 2), to: 0)
    #expect(model.draft.steps.map(\.text) == ["C three", "A one", "B two"])
    model.move(from: IndexSet(integer: 0), to: 3)
    #expect(model.draft.steps.map(\.text) == ["A one", "B two", "C three"])
    model.delete(at: IndexSet(integer: 1))
    #expect(model.draft.steps.map(\.text) == ["A one", "C three"])
    let id = try #require(model.addStep("D four"))
    #expect(model.draft.steps.last?.id == id)
    model.setStepText(id, "D changed")
    #expect(model.draft.steps.last?.text == "D changed")
  }

  @Test func everyStepDeletedCannotStart() {
    let model = planner()
    model.setText("Something")
    model.makeSuggested()
    model.delete(at: IndexSet(model.draft.steps.indices))
    #expect(model.draft.steps.isEmpty)
    #expect(!model.canStart)
    #expect(!model.start())
  }

  @Test func aStepOfOnlySpacesIsDroppedOnStart() throws {
    let model = planner()
    model.beginSaying()
    model.addSaid("Real step")
    let id = try #require(model.addStep("   "))
    model.setStepText(id, "     ")
    model.thatsAll()
    var started: SavedWork?
    model.onStart = { started = $0 }
    #expect(model.start())
    #expect(started?.work.steps.map(\.text) == ["Real step"])
  }

  @Test func onlyBlankStepsCannotStart() {
    let model = planner()
    model.beginSaying()
    model.addSaid("x")
    model.setStepText(model.draft.steps[0].id, "  ")
    model.draft.stage == .saying ? () : ()
    #expect(!model.thatsAll())
    #expect(!model.start())
  }

  @Test func getReadyAndPutAwayCanBeAddedOnceAndRemoved() {
    let model = planner()
    model.beginSaying()
    model.addSaid("Middle")
    model.thatsAll()
    model.addGetReady()
    model.addGetReady()
    model.addPutAway()
    model.addPutAway()
    #expect(model.draft.steps.map(\.text) == [Words.getReadyStep, "Middle", Words.putAwayStep])
    model.delete(model.draft.steps[0].id)
    #expect(!model.hasGetReady)
  }

  @Test func doneLineTravelsToTheSavedWork() throws {
    let model = planner()
    model.beginSaying()
    model.addSaid("First")
    model.addSaid("Second")
    model.thatsAll()
    model.setDoneLine(model.draft.steps[1].id, "One page written")
    var started: SavedWork?
    model.onStart = { started = $0 }
    model.start()
    #expect(started?.doneLines == ["1": "One page written"])
  }

  @Test func stepsInTheEditorSurviveClosingTheApp() throws {
    let first = planner()
    first.setText("Essay on courage")
    first.makeSuggested()
    first.setStepText(first.draft.steps[0].id, "My own words")
    // The app is closed and opened again with the same saved files.
    let reopened = AppModel(content: content, store: store, clock: clock)
    #expect(reopened.showsPlanner)
    #expect(reopened.planner.draft.stage == .editor)
    #expect(reopened.planner.draft.steps.first?.text == "My own words")
    #expect(reopened.planner.draft.text == "Essay on courage")
  }

  @Test func aFailedSaveShowsACalmNoteAndKeepsTheSteps() {
    let model = planner()
    model.setText("Essay")
    model.makeSuggested()
    store.failWrites = true
    #expect(!model.start())
    #expect(model.saveNote == Words.couldNotSave)
    #expect(model.draft.stage == .editor)
    #expect(!model.draft.steps.isEmpty)
  }

  @Test func damagedDraftFileStartsFresh() {
    store.plant("draft.json", Data("not json".utf8))
    let app = AppModel(content: content, store: store, clock: clock)
    #expect(app.planner.draft == .empty)
    #expect(app.showsPlanner)
  }
}
