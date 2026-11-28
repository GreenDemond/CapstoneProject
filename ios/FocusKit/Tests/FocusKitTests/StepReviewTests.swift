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

@MainActor
@Suite struct StepRequirementTests {
  let content: Content
  let store: MemoryStore
  let fake = FakeLanguageModel()
  static let lab = "Lab report. Include a graph of your data."

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
  }

  private func check(_ assignment: String, reply: FakeLanguageModel.Reply) async
    -> StepCoach.RequirementsOutcome
  {
    fake.enqueue(reply)
    return await StepCoach(model: fake, content: content).requirements(assignment: assignment)
  }

  private func planner(_ text: String, steps: [String] = [], model: FakeLanguageModel? = nil)
    -> PlannerModel
  {
    let app = AppModel(
      content: content, store: store, clock: FakeClock(),
      services: Services(languageModel: model ?? fake))
    app.planner.setText(text)
    return app.planner
  }

  // MARK: Matching

  @Test func aWholeWordRunIsFoundAndAPartOfAWordIsNot() {
    #expect(StepReview.containsWords("Write a paragraph", "paragraph"))
    #expect(!StepReview.containsWords("Write a paragraph", "rap"))
    #expect(StepReview.containsWords(Self.lab, "Include a graph of your data"))
    #expect(!StepReview.containsWords(Self.lab, "graph of data"))
  }

  @Test func aRequirementWithNoKeyWordsIsNeverReported() {
    #expect(StepReview.uncovered(["Use it if you can"], steps: [], in: content).isEmpty)
  }

  @Test func aStepNeedsAllTheKeyWordsOfARequirement() {
    let needs = ["Include a graph of your data"]
    #expect(StepReview.uncovered(needs, steps: ["Collect data"], in: content) == needs)
    #expect(StepReview.uncovered(needs, steps: ["Make the graph"], in: content) == needs)
    #expect(StepReview.uncovered(needs, steps: ["Make the graph of the data"], in: content).isEmpty)
    #expect(
      StepReview.uncovered(needs, steps: ["Collect data", "Draw a graph"], in: content) == needs)
  }

  @Test func aNumberCoversAStepWithTheSameNumber() {
    let needs = ["At least 500 words"]
    #expect(StepReview.uncovered(needs, steps: ["Write 500 words"], in: content).isEmpty)
    #expect(StepReview.uncovered(needs, steps: ["Write 300 words"], in: content) == needs)
  }

  // MARK: What the AI gave

  @Test func linesCopiedWordForWordAreKept() async {
    let outcome = await check(
      Self.lab, reply: .init(["Include a graph of your data\nInclude a video"]))
    #expect(outcome == .found(["Include a graph of your data"]))
  }

  @Test func nothingToListIsNothingFound() async {
    #expect(await check(Self.lab, reply: .init(["NOTHING"])) == .found([]))
  }

  @Test func linesThatFailTheCheckAreUnclearNotNothing() async {
    #expect(await check(Self.lab, reply: .init(["Include a video"])) == .unclear)
    #expect(await check("Write a paragraph", reply: .init(["rap"])) == .unclear)
  }

  @Test func theSafetyWordGivesTheTrustedAdultOutcome() async {
    #expect(await check(Self.lab, reply: .init(["TRUSTED_ADULT"])) == .trustedAdult)
  }

  @Test func aGuardrailStopGivesTheTrustedAdultOutcome() async {
    #expect(await check(Self.lab, reply: .failing(.guardrail)) == .trustedAdult)
  }

  @Test func aRefusalIsUnavailable() async {
    #expect(await check(Self.lab, reply: .failing(.refusal)) == .unavailable)
  }

  @Test func atMostSixLinesAreKept() async {
    let assignment =
      "Alpha item. Beta item. Gamma item. Delta item. Epsilon item. Zeta item. Eta item. Theta item."
    let lines = [
      "Alpha item", "Beta item", "Gamma item", "Delta item", "Epsilon item", "Zeta item",
      "Eta item", "Theta item",
    ]
    let outcome = await check(assignment, reply: .init([lines.joined(separator: "\n")]))
    #expect(outcome == .found(Array(lines.prefix(6))))
  }

  // MARK: In the planner

  @Test func withNoAINothingShowsAndTheCheckIsOff() {
    let planner = planner(Self.lab, model: FakeLanguageModel(availability: .notEnabled))
    #expect(!planner.canCheckRequirements)
    #expect(planner.requirementsResult == nil)
  }

  @Test func aChangedAssignmentHidesTheResult() async {
    fake.enqueue(.init(["Include a graph of your data"]))
    let planner = planner(Self.lab)
    await planner.checkRequirements()
    #expect(planner.requirementsResult == .lines(["Include a graph of your data"]))
    planner.setText("A different assignment")
    #expect(planner.requirementsResult == nil)
    #expect(planner.uncoveredRequirements == nil)
  }

  @Test func aDoubleTapMakesOneCall() async {
    fake.enqueue(.init(["Include a graph of your data"]))
    let planner = planner(Self.lab)
    async let first: Void = planner.checkRequirements()
    async let second: Void = planner.checkRequirements()
    _ = await (first, second)
    #expect(fake.calls.count == 1)
  }

  @Test func uncoveredRequirementsFollowTheStepsAsTheyChange() async {
    fake.enqueue(.init(["Include a graph of your data"]))
    let planner = planner(Self.lab)
    planner.beginSaying()
    planner.addSaid("Write the method")
    planner.thatsAll()
    await planner.checkRequirements()
    #expect(planner.uncoveredRequirements == ["Include a graph of your data"])
    planner.setStepText(planner.draft.steps[0].id, "Make the graph of your data")
    #expect(planner.uncoveredRequirements?.isEmpty == true)
  }

  @Test func theSafetyLineShowsEvenWhenTheStudentChangedTheAssignment() async {
    fake.enqueue(.init(["TRUSTED_ADULT"]))
    let planner = planner(Self.lab)
    await planner.checkRequirements()
    #expect(planner.aiNote == content.safety.line)
    #expect(planner.requirementsResult == nil)
  }

  @Test func aCheckResultIsHiddenOnceTheAIIsGone() async {
    fake.enqueue(.init(["Include a graph of your data"]))
    let planner = planner(Self.lab)
    await planner.checkRequirements()
    #expect(planner.requirementsResult != nil)
    planner.coach = nil
    #expect(planner.requirementsResult == nil)
    #expect(planner.uncoveredRequirements == nil)
  }

  @Test func pluralsMatch() {
    #expect(
      StepReview.uncovered(["Use two sources"], steps: ["Read one source"], in: content).isEmpty)
    #expect(
      StepReview.uncovered(["Use two sources"], steps: ["Read one book"], in: content).count == 1)
  }
}
