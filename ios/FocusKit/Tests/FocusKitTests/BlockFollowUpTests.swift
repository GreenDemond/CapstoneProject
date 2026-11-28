import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct BlockFollowUpTests {
  let content: Content
  let store: MemoryStore
  let fake = FakeLanguageModel()

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
  }

  private func app(model: FakeLanguageModel? = nil) -> AppModel {
    AppModel(
      content: content, store: store, clock: FakeClock(),
      services: Services(languageModel: model ?? fake))
  }

  /// Runs the follow-up and waits for it to finish.
  private func run(
    _ app: AppModel, minutes: Int, _ answer: BlockLength.Answer
  ) async -> AppModel.BlockFollowUp? {
    app.startBlockFollowUp(minutes: minutes, answer)
    for _ in 0..<200 where app.blockFollowUp != nil && app.blockFollowUp?.line == nil {
      try? await Task.sleep(nanoseconds: 5_000_000)
    }
    return app.blockFollowUp
  }

  // MARK: Which answers get a question

  @Test func aboutRightMakesNoCallAndShowsNothing() async {
    let app = app()
    #expect(await run(app, minutes: 12, .aboutRight) == nil)
    #expect(fake.calls.isEmpty)
  }

  @Test func theTargetIsTheNextLengthAndNilAtTheEnds() {
    #expect(BlockLength.target(from: 12, .shorter) == 5)
    #expect(BlockLength.target(from: 12, .longer) == 25)
    #expect(BlockLength.target(from: 25, .shorter) == 12)
    #expect(BlockLength.target(from: 5, .longer) == 12)
    #expect(BlockLength.target(from: 5, .shorter) == nil)
    #expect(BlockLength.target(from: 25, .longer) == nil)
    #expect(BlockLength.target(from: 7, .shorter) == nil)
  }

  @Test func shorterAndLongerEachMakeExactlyOneCallNamingTheNewLength() async throws {
    fake.enqueue(.init(["Would you like to try 5 minutes next time?"]))
    let app = app()
    let result = await run(app, minutes: 12, .shorter)
    #expect(result?.line == "Would you like to try 5 minutes next time?")
    #expect(fake.calls.count == 1)
    let call = try #require(fake.calls.first)
    let move = try #require(content.coach.moves["settingFollowUp"])
    #expect(call.instructions == content.coach.common + "\n" + move.rules)
    let text = try #require(call.messages.first?.text)
    #expect(text.contains("12 minutes") && text.contains("too long") && text.contains("5 minutes"))
  }

  @Test func theRequestCarriesNoStudentWordsOrRecordLines() async throws {
    fake.enqueue(.init(["Would you like to try 25 minutes next time?"]))
    let app = app()
    app.me.addNote("My secret worry about school")
    app.answerBlockLength(minutes: 12, .longer)
    _ = await run(app, minutes: 12, .longer)
    let text = try #require(fake.calls.first?.messages.first?.text)
    #expect(!text.contains("secret worry"))
    #expect(!text.contains("12-minute block"))
  }

  // MARK: What is rejected and what falls back

  @Test func aQuestionNamingAnotherLengthOrASizeWordFallsBackToTheFixedLine() async {
    for reply in [
      "Would you like to try 8 minutes next time?", "Would you like to try ten minutes next time?",
      "Would you like to try half the block next time?",
      "Would you like to try 12 and 5 minutes next time?",
    ] {
      let model = FakeLanguageModel()
      model.enqueue(.init([reply]))
      let app = app(model: model)
      let result = await run(app, minutes: 12, .shorter)
      #expect(result?.line == Words.blockFollowUpFixed(5), "\(reply)")
    }
  }

  @Test func everyFailureShowsTheFixedLine() async {
    let replies: [FakeLanguageModel.Reply] = [
      .init(["NOTHING"]), .init(["Try a shorter block."]), .failing(.refusal),
      .failing(.guardrail), .failing(.other), .init(["TRUSTED_ADULT"]),
    ]
    for reply in replies {
      let model = FakeLanguageModel()
      model.enqueue(reply)
      let app = app(model: model)
      let result = await run(app, minutes: 25, .shorter)
      #expect(result?.line == Words.blockFollowUpFixed(12))
    }
  }

  @Test func withNoAITheFixedLineShowsAtOnceAndNothingIsSent() async {
    let off = FakeLanguageModel(availability: .notEnabled)
    let app = app(model: off)
    app.startBlockFollowUp(minutes: 12, .longer)
    #expect(app.blockFollowUp?.line == Words.blockFollowUpFixed(25))
    #expect(off.calls.isEmpty)
  }

  @Test func aStatementOrADifferentTopicIsRejected() async {
    let model = FakeLanguageModel()
    model.enqueue(.init(["Your attention seems to drift after 5 minutes."]))
    let app = app(model: model)
    let result = await run(app, minutes: 12, .shorter)
    #expect(result?.line == Words.blockFollowUpFixed(5))
  }

  // MARK: Done, leaving and storing

  @Test func doneDropsTheQuestionAndALateReplyIsDiscarded() async {
    fake.enqueue(.init(["Would you like to try 5 minutes next time?"]))
    let app = app()
    app.startBlockFollowUp(minutes: 12, .shorter)
    #expect(app.blockFollowUp != nil)
    app.dismissBlockFollowUp()
    #expect(app.blockFollowUp == nil)
    try? await Task.sleep(nanoseconds: 100_000_000)
    #expect(app.blockFollowUp == nil)
  }

  @Test func theQuestionIsNeverSaved() async {
    fake.enqueue(.init(["Would you like to try 5 minutes next time?"]))
    let app = app()
    let before = store.fileNames.sorted()
    _ = await run(app, minutes: 12, .shorter)
    #expect(store.fileNames.sorted() == before)
    #expect(app.learner.entries.isEmpty)
  }

  @Test func aReplyThatNamesNoLengthFallsBackAndCannotPointTheWrongWay() async {
    #expect(!BlockLength.namesOnly(5, in: "Would you like a long block next time?"))
    let model = FakeLanguageModel()
    model.enqueue(.init(["Would you like a long block next time?"]))
    let app = app(model: model)
    let result = await run(app, minutes: 12, .shorter)
    #expect(result?.line == Words.blockFollowUpFixed(5))
  }

  @Test func theSizeWordsAreCheckedWithoutBreakingNormalSentences() {
    #expect(BlockLength.namesOnly(5, in: "Would you like to try 5 minutes next time?"))
    #expect(!BlockLength.namesOnly(5, in: "Would you like to try 50 minutes next time?"))
    #expect(!BlockLength.namesOnly(5, in: "Would you like to try an hour next time?"))
    #expect(BlockLength.namesOnly(12, in: "Want to try 12 minutes next time?"))
  }
}
