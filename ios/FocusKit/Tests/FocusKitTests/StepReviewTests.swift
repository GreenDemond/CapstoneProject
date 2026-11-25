import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct StepReviewTests {
  let content: Content
  let store: MemoryStore

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
  }

  private func note(_ text: String) -> StepNote? {
    StepReview.note(for: text, in: content)
  }

  private func planner(steps: [String]) -> (PlannerModel, [Int]) {
    let app = AppModel(
      content: content, store: store, clock: FakeClock(),
      services: Services(languageModel: FakeLanguageModel()))
    let planner = app.planner
    planner.setText("Some assignment")
    planner.beginSaying()
    for step in steps { planner.addSaid(step) }
    planner.thatsAll()
    return (planner, planner.draft.steps.map(\.id))
  }

  // MARK: The check itself

  @Test func vagueStepsAreFlagged() {
    #expect(note("Study") == .vague)
    #expect(note("Do the essay.") == .vague)
    #expect(note("Study.") == .vague)
  }

  @Test func specificStepsAreNotFlagged() {
    #expect(note("Read chapter 3") == nil)
    #expect(note("Find two sources about uniforms") == nil)
  }

  @Test func aSingleWordNotOnTheListIsNotFlagged() {
    #expect(note("Read") == nil)
    #expect(note("Organize") == nil)
  }

  @Test func stepsOfTwentyWordsOrFewerAreNotTooLong() {
    let twenty = Array(repeating: "again", count: 20).joined(separator: " ")
    let twentyOne = Array(repeating: "again", count: 21).joined(separator: " ")
    #expect(note(twenty) == nil)
    #expect(note(twentyOne) == .tooLong)
  }

  @Test func blankTextGetsNoNote() {
    #expect(note("   ") == nil)
    #expect(note("") == nil)
  }

  @Test func everyStarterStepGetsNoNote() {
    for kind in content.kinds {
      for step in kind.starterSteps {
        #expect(note(step) == nil, "\(step)")
      }
    }
  }

  // MARK: In the planner

  @Test func aVagueStepShowsItsNoteUntilSkipped() {
    let (planner, ids) = planner(steps: ["Study"])
    #expect(planner.reviewNote(for: ids[0]) == .vague)
    planner.dismissReview(ids[0])
    #expect(planner.reviewNote(for: ids[0]) == nil)
  }

  @Test func skippingIsNotSaved() {
    let (planner, ids) = planner(steps: ["Study"])
    let before = store.fileNames.compactMap { store.rawRead($0) }
    planner.dismissReview(ids[0])
    let after = store.fileNames.compactMap { store.rawRead($0) }
    #expect(before == after)
  }

  @Test func theSplitNudgeTakesPrecedenceOverTheReviewNote() {
    let longStep = Array(repeating: "read", count: 19).joined(separator: " ") + " and write"
    let (planner, ids) = planner(steps: [longStep])
    #expect(planner.looksLikeTwo(ids[0]))
    #expect(planner.reviewNote(for: ids[0]) == nil)
    planner.dismissNudge(ids[0])
    #expect(planner.reviewNote(for: ids[0]) == nil)
  }

  @Test func aLongStepCanBeSplitWhenThereIsARoomAndASplitPoint() {
    let longStep = Array(repeating: "go", count: 21).joined(separator: " ")
    let (planner, ids) = planner(steps: [longStep])
    #expect(planner.reviewNote(for: ids[0]) == .tooLong)
    #expect(planner.canSplit(ids[0]))
  }

  @Test func aVagueStepCannotBeSplitWithoutAPoint() {
    let (planner, ids) = planner(steps: ["Study"])
    #expect(!planner.canSplit(ids[0]))
  }

  @Test func startStillWorksWithANotedStep() {
    let (planner, _) = planner(steps: ["Study", "Read chapter 3"])
    #expect(planner.start())
  }
}
