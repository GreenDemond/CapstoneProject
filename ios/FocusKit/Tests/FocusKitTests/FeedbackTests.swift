import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct FeedbackTests {
  let content: Content
  let store: MemoryStore
  let fake = FakeLanguageModel()
  let clock = FakeClock()

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
  }

  private func rating(
    _ rating: FeedbackRating, move: String = "stuckQuestion", daysAgo: Double = 0
  ) -> LearnerRecord.Entry {
    LearnerRecord.Entry(
      kind: .feedback, date: clock.now.addingTimeInterval(-daysAgo * 86_400),
      text: Feedback.text(rating, move: move), source: .student)
  }

  private func app(
    record: LearnerRecord = LearnerRecord(), model: FakeLanguageModel? = nil
  ) throws -> (AppModel, LadderModel, Step) {
    try store.save(record)
    let app = AppModel(
      content: content, store: store, clock: clock,
      services: Services(languageModel: model ?? fake))
    app.planner.setText("Some assignment")
    app.planner.setKind("essay")
    app.planner.beginSaying()
    app.planner.addSaid("Read the prompt")
    app.planner.thatsAll()
    _ = app.planner.start()
    let step = try #require(app.currentStep)
    let ladder = app.ladder(for: step)
    ladder.nextHint()
    return (app, ladder, step)
  }

  // MARK: What a rating stores

  @Test func aRatingIsOneLineWithTheRatingFirst() throws {
    let (app, _, _) = try app()
    app.rate(move: "chat", .notthis)
    let lines = app.learner.entries(of: .feedback)
    #expect(lines.count == 1)
    #expect(lines[0].text == "notthis chat")
    let read = try #require(Feedback.parse(lines[0]))
    #expect(read.rating == .notthis && read.move == "chat")
  }

  @Test func aRatingSurvivesTheSaveCutAndNeverHoldsStudentOrAIWords() throws {
    let (app, _, _) = try app()
    app.rate(move: "stuckQuestion", .meh)
    let saved = store.load(LearnerRecord.self).value
    #expect(saved?.entries(of: .feedback).first?.text == "meh stuckQuestion")
  }

  @Test func aRatingNeverChangesTheInstructionsOnTheNextCall() async throws {
    fake.enqueue(.init(["What is the first line of the prompt?"]), .init(["Which part first?"]))
    let (app, ladder, step) = try app()
    await app.askQuestion(ladder, for: step)
    ladder.rate(.notthis)
    let ladder2 = LadderModel(content: content, stepText: "Another")
    ladder2.coach = CoachMove(model: fake, content: content)
    ladder2.nextHint()
    await ladder2.askQuestion(stepText: "Another", kindLabel: "Essay")
    #expect(fake.calls.count == 2)
    #expect(fake.calls[0].instructions == fake.calls[1].instructions)
  }

  // MARK: Rating a Stuck question

  @Test func anAIQuestionCanBeRatedOnce() async throws {
    fake.enqueue(.init(["What is the first line of the prompt?"]))
    let (app, ladder, step) = try app()
    await app.askQuestion(ladder, for: step)
    #expect(ladder.canRate)
    ladder.rate(.helped)
    ladder.rate(.notthis)
    #expect(app.learner.entries(of: .feedback).count == 1)
    #expect(!ladder.canRate && ladder.questionRated)
  }

  @Test func theFixedFallbackLineCannotBeRated() async throws {
    fake.enqueue(.failing(.refusal))
    let (app, ladder, step) = try app()
    await app.askQuestion(ladder, for: step)
    #expect(ladder.coachQuestion != nil)
    #expect(!ladder.canRate)
  }

  @Test func theTrustedAdultLineCannotBeRated() async throws {
    fake.enqueue(.init(["TRUSTED_ADULT"]))
    let (app, ladder, step) = try app()
    await app.askQuestion(ladder, for: step)
    #expect(ladder.coachNote == content.safety.line)
    #expect(!ladder.canRate)
  }

  // MARK: The bias

  @Test func fiveMehOrNotThisShowTheFixedLineFirst() {
    let record = LearnerRecord(entries: [
      rating(.meh, daysAgo: 1), rating(.notthis, daysAgo: 2), rating(.meh, daysAgo: 3),
      rating(.notthis, daysAgo: 4), rating(.meh, daysAgo: 5),
    ])
    #expect(Feedback.showFixedFirst(move: "stuckQuestion", in: record, now: clock.now))
  }

  @Test func twoOfThreeNotHelpedIsAMajority() {
    let record = LearnerRecord(entries: [
      rating(.meh, daysAgo: 1), rating(.helped, daysAgo: 2), rating(.notthis, daysAgo: 3),
    ])
    #expect(Feedback.showFixedFirst(move: "stuckQuestion", in: record, now: clock.now))
  }

  @Test func fewerThanThreeRatingsChangeNothing() {
    let record = LearnerRecord(entries: [
      rating(.notthis, daysAgo: 1), rating(.notthis, daysAgo: 2),
    ])
    #expect(!Feedback.showFixedFirst(move: "stuckQuestion", in: record, now: clock.now))
  }

  @Test func oldRatingsAreIgnored() {
    let record = LearnerRecord(entries: [
      rating(.notthis, daysAgo: 40), rating(.notthis, daysAgo: 41), rating(.notthis, daysAgo: 42),
    ])
    #expect(!Feedback.showFixedFirst(move: "stuckQuestion", in: record, now: clock.now))
  }

  @Test func threeNewestHelpedBringTheAIBack() {
    let record = LearnerRecord(entries: [
      rating(.helped, daysAgo: 0.1), rating(.helped, daysAgo: 0.2), rating(.helped, daysAgo: 0.3),
      rating(.notthis, daysAgo: 1), rating(.notthis, daysAgo: 2),
    ])
    #expect(!Feedback.showFixedFirst(move: "stuckQuestion", in: record, now: clock.now))
  }

  @Test func otherMovesRatingsNeverMoveTheStuckBias() {
    let record = LearnerRecord(
      entries: (0..<8).map { rating(.notthis, move: "chat", daysAgo: Double($0)) })
    #expect(!Feedback.showFixedFirst(move: "stuckQuestion", in: record, now: clock.now))
  }

  @Test func theFixedLineComesFirstWithNoAICallUntilTheStudentTaps() async throws {
    let bad = LearnerRecord(entries: (1...5).map { rating(.notthis, daysAgo: Double($0)) })
    fake.enqueue(.init(["What is the first line of the prompt?"]))
    let (app, ladder, step) = try app(record: bad)
    await app.askQuestion(ladder, for: step)
    #expect(fake.calls.isEmpty)
    #expect(ladder.heldBack)
    #expect(ladder.coachQuestion == content.coach.moves["stuckQuestion"]?.fallback)
    #expect(!ladder.canAskQuestion && ladder.canSeeAIQuestion && !ladder.canRate)
    await app.seeAIQuestion(ladder, for: step)
    #expect(fake.calls.count == 1)
    #expect(ladder.coachQuestion == "What is the first line of the prompt?")
    #expect(ladder.canRate && !ladder.heldBack)
  }

  // MARK: The cap and the record

  @Test func aBusyMoveCannotPushOutAnotherMovesRatings() {
    var entries = (0..<150).map { rating(.helped, move: "chat", daysAgo: Double($0) / 10) }
    entries.append(rating(.notthis, move: "stuckQuestion", daysAgo: 30))
    let limited = LearnerRecord(entries: entries).limited(by: content.limits)
    #expect(
      limited.entries(of: .feedback).filter { Feedback.parse($0)?.move == "chat" }.count == 100)
    #expect(limited.entries(of: .feedback).contains { Feedback.parse($0)?.move == "stuckQuestion" })
  }

  @Test func aLineInAnotherShapeIsNotARating() {
    let odd = LearnerRecord.Entry(kind: .feedback, date: clock.now, text: "great job", source: .app)
    #expect(Feedback.parse(odd) == nil)
  }

  // MARK: What the AI was told

  @Test func theLinesSentAreKeptForTheDisclosureAndEmptyWhenNoneWere() async throws {
    fake.enqueue(.init(["What is the first line of the prompt?"]))
    let record = LearnerRecord(entries: [
      LearnerRecord.Entry(
        kind: .pattern, date: clock.now, text: "Gets stuck on the first line", source: .student,
        tags: [.stuck])
    ])
    let (app, ladder, step) = try app(record: record)
    await app.askQuestion(ladder, for: step)
    #expect(ladder.sentRecord.map(\.text) == ["Gets stuck on the first line"])

    let fake2 = FakeLanguageModel()
    fake2.enqueue(.init(["What is the first line of the prompt?"]))
    let store2 = MemoryStore(limits: content.limits)
    let app2 = AppModel(
      content: content, store: store2, clock: clock, services: Services(languageModel: fake2))
    app2.planner.setText("Some assignment")
    app2.planner.beginSaying()
    app2.planner.addSaid("Read the prompt")
    app2.planner.thatsAll()
    _ = app2.planner.start()
    let step2 = try #require(app2.currentStep)
    let ladder2 = app2.ladder(for: step2)
    ladder2.nextHint()
    await app2.askQuestion(ladder2, for: step2)
    #expect(ladder2.sentRecord.isEmpty)
  }

  // MARK: Chat and the split nudge

  @Test func onlyAFinishedAIReplyCanBeRated() throws {
    let (app, _, _) = try app()
    let reply = ChatTurn(role: .assistant, text: "A hint.")
    let mine = ChatTurn(role: .user, text: "Help")
    let safety = ChatTurn(role: .assistant, text: "Talk to an adult", kind: .trustedAdult)
    let notice = ChatTurn(role: .assistant, text: "Hints only", kind: .notice)
    let busy = ChatTurn(role: .assistant, text: "", inProgress: true)
    #expect(app.talk.canRate(reply))
    for turn in [mine, safety, notice, busy] { #expect(!app.talk.canRate(turn)) }
    app.talk.rate(reply, .helped)
    app.talk.rate(reply, .notthis)
    #expect(app.learner.entries(of: .feedback).map(\.text) == ["helped chat"])
    #expect(!app.talk.canRate(reply) && app.talk.isRated(reply))
  }

  @Test func theFixedSplitNudgeLineCannotBeRated() throws {
    let (app, _, _) = try app()
    app.planner.setText("Read the chapter and write the notes")
    app.planner.beginSaying()
    app.planner.addSaid("Read the chapter and write the notes")
    app.planner.thatsAll()
    let id = app.planner.draft.steps[0].id
    #expect(app.planner.looksLikeTwo(id))
    #expect(!app.planner.canRateNudge(id))
  }

  @Test func anAISplitNudgeQuestionCanBeRatedOnce() async throws {
    fake.enqueue(.init(["Is that one job or two?"]))
    let (app, _, _) = try app()
    app.planner.setText("Some assignment")
    app.planner.beginSaying()
    app.planner.addSaid("Read the chapter and write the notes")
    app.planner.thatsAll()
    let id = app.planner.draft.steps[0].id
    await app.planner.askNudge(id)
    #expect(app.planner.canRateNudge(id))
    app.planner.rateNudge(id, .meh)
    app.planner.rateNudge(id, .meh)
    #expect(app.learner.entries(of: .feedback).map(\.text) == ["meh splitNudge"])
  }

  @Test func aRatedQuestionThenAHeldBackFixedLineShowsNoRatingState() async throws {
    fake.enqueue(.init(["What is the first line of the prompt?"]))
    let (app, ladder, step) = try app()
    await app.askQuestion(ladder, for: step)
    ladder.rate(.notthis)
    #expect(ladder.questionRated)
    // The ratings now favour the fixed line; asking again holds the AI back.
    ladder.fixedFirst = true
    await ladder.askQuestion(stepText: step.text, kindLabel: "Essay")
    #expect(ladder.heldBack)
    #expect(!ladder.questionRated && !ladder.canRate)
  }

  @Test func repliesInAReopenedChatAreNotAskedAboutAgain() throws {
    let (app, _, _) = try app()
    let chat = Chat(
      id: "c1", updatedOn: clock.now,
      messages: [
        ChatMessage(role: .user, text: "Help"), ChatMessage(role: .assistant, text: "A hint."),
      ])
    app.talk.open(chat)
    let reply = try #require(app.talk.turns.last)
    #expect(!app.talk.canRate(reply) && !app.talk.isRated(reply))
  }
}
