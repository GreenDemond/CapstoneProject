import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct ReflectionTests {
  let content: Content
  let store: MemoryStore
  let clock = FakeClock()
  let fake = FakeLanguageModel()

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
  }

  private let good =
    "You said talking it through helped. Would you like to try that again next week?"

  private func app(model: FakeLanguageModel? = nil) -> AppModel {
    AppModel(
      content: content, store: store, clock: clock,
      services: Services(languageModel: model ?? fake))
  }

  private func check(_ reply: String) -> Result<String?, CoachFallback> {
    let move = content.coach.moves["weeklyReflection"]!
    return CoachMove.check(
      reply, shape: .twoSentences, limit: content.limits.stepLength,
      word: content.safety.word, nothing: content.coach.nothingWord, starts: move.starts)
  }

  // MARK: The shape

  @Test func twoSentencesWithOneQuestionAtTheEndPass() {
    #expect((try? check(good).get()) == good)
  }

  @Test func oneSentenceThreeSentencesOrNoQuestionMarkFail() {
    for reply in [
      "You said talking it through helped.",
      "You said talking helped. It was good. Would you like to try that again?",
      "You said talking helped. Try that again next week.",
      "Would you like to try that again next week?",
      "You said talking helped? Would you like to try that again next week?",
    ] {
      #expect((try? check(reply).get()) == nil, "\(reply)")
    }
  }

  @Test func aWordEndingInMsIsNotAnAbbreviation() {
    #expect(
      (try? check("You said problems helped. Would you like to try that again next week?").get())
        != nil)
  }

  @Test func lastWeeksReplyNeverShowsForThisOne() async {
    fake.enqueue(.init([good]), .init([good]))
    let app = app()
    await app.submitReflection(helped: "talking it through", next: "")
    #expect(app.reflectionReply != nil)
    // The sheet was swiped away, so closeReflection never ran. A new Done starts clean.
    await app.submitReflection(helped: "   ", next: "")
    #expect(app.reflectionReply == nil && !app.reflectionRated)
  }

  @Test func theSecondSentenceNeedsAStartWord() {
    #expect(
      (try? check("You said talking helped. Try that again next week, would you?").get()) == nil)
  }

  @Test func anAbbreviationMakesItFallBackAndADecimalDoesNot() {
    #expect(
      (try? check("You said e.g. talking helped. Would you like to try that again?").get()) == nil)
    #expect(
      (try? check("You said 1.5 hours helped. Would you like to try that again?").get()) != nil)
  }

  // MARK: When the card is due

  @Test func theCardIsDueOnDaySevenAndNotDaySix() {
    let start = clock.now
    #expect(!Reflection.isDue(lastHandled: nil, now: start))
    #expect(!Reflection.isDue(lastHandled: start, now: start.addingTimeInterval(6.9 * 86_400)))
    #expect(Reflection.isDue(lastHandled: start, now: start.addingTimeInterval(7 * 86_400)))
  }

  @Test func theFirstVisitStartsTheClockAndShowsNothing() {
    let app = app()
    #expect(!app.reflectionDue)
    app.startReflectionClock()
    #expect(!app.reflectionDue && app.settings.lastReflectionHandled != nil)
    clock.advance(by: 7 * 86_400 + 1)
    #expect(app.reflectionDue)
  }

  @Test func notNowAndDoneEachWaitSevenMoreDays() async {
    let app = app()
    app.startReflectionClock()
    clock.advance(by: 8 * 86_400)
    #expect(app.reflectionDue)
    app.laterReflection()
    #expect(!app.reflectionDue)
    clock.advance(by: 8 * 86_400)
    fake.enqueue(.init([good]))
    await app.submitReflection(helped: "talking it through", next: "")
    #expect(!app.reflectionDue)
  }

  @Test func deletingTheLinesNeverBringsTheCardBack() async throws {
    let app = app()
    app.startReflectionClock()
    clock.advance(by: 8 * 86_400)
    fake.enqueue(.init([good]))
    await app.submitReflection(helped: "talking it through", next: "start earlier")
    for line in app.learner.entries(of: .reflection) { app.deleteLearnerLine(line.id) }
    #expect(app.learner.entries(of: .reflection).isEmpty)
    #expect(!app.reflectionDue)
  }

  @Test func anOldSettingsFileLoadsWithNoDate() throws {
    store.plant("settings.json", Data(#"{"version":1,"value":{"readAloud":false}}"#.utf8))
    #expect(store.load(Settings.self).value?.lastReflectionHandled == nil)
  }

  // MARK: Done

  @Test func theAnswersAreSavedAsTheStudentsOwnDeletableLines() async {
    fake.enqueue(.init([good]))
    let app = app()
    await app.submitReflection(helped: "talking it through", next: "start earlier")
    let lines = app.learner.entries(of: .reflection)
    #expect(
      lines.map(\.text).sorted() == [
        "To try next: start earlier", "What helped: talking it through",
      ])
    #expect(lines.allSatisfy { $0.source == .student })
    #expect(app.reflectionReply?.line == good && app.reflectionReply?.fixed == false)
  }

  @Test func onlyTheTwoAnswersAreSentAndTheRulesAreTheFixedOnes() async throws {
    fake.enqueue(.init([good]))
    let app = app()
    app.me.addNote("A private note about my week")
    await app.submitReflection(helped: "talking it through", next: "")
    let call = try #require(fake.calls.first)
    let move = try #require(content.coach.moves["weeklyReflection"])
    #expect(call.instructions == content.coach.common + "\n" + move.rules)
    let text = try #require(call.messages.first?.text)
    #expect(text.contains("talking it through"))
    #expect(!text.contains("private note"))
    #expect(!text.contains("One thing to try next week"))
  }

  @Test func withNoAnswerNothingIsSavedAndNoCallIsMade() async {
    let app = app()
    await app.submitReflection(helped: "   ", next: "")
    #expect(fake.calls.isEmpty)
    #expect(app.learner.entries(of: .reflection).isEmpty)
    #expect(app.reflectionReply == nil)
  }

  @Test func aDoubleTapMakesOneCall() async {
    fake.enqueue(.init([good]), .init([good]))
    let app = app()
    async let first: Void = app.submitReflection(helped: "talking it through", next: "")
    async let second: Void = app.submitReflection(helped: "talking it through", next: "")
    _ = await (first, second)
    #expect(fake.calls.count == 1)
  }

  // MARK: Fallbacks and the safety word

  @Test func everyFailureShowsTheFixedLine() async {
    let replies: [FakeLanguageModel.Reply] = [
      .init(["NOTHING"]), .init(["Great week! Keep it up."]),
      .init(["You said talking helped. Your attention drifts. Would you like to try more?"]),
      .init(["You said homework in Paris helped. Would you like to try that again?"]),
      .failing(.refusal), .failing(.guardrail), .failing(.other),
    ]
    for reply in replies {
      let model = FakeLanguageModel()
      model.enqueue(reply)
      let app = app(model: model)
      await app.submitReflection(helped: "talking it through", next: "start earlier")
      #expect(
        app.reflectionReply == AppModel.ReflectionReply(line: Words.reflectionFixed, fixed: true))
    }
  }

  @Test func withNoAITheFixedLineShowsAndNothingIsSent() async {
    let off = FakeLanguageModel(availability: .notEnabled)
    let app = app(model: off)
    await app.submitReflection(helped: "talking it through", next: "")
    #expect(app.reflectionReply?.line == Words.reflectionFixed)
    #expect(off.calls.isEmpty)
  }

  @Test func theSafetyWordShowsTheTrustedAdultLineAndCannotBeRated() async {
    fake.enqueue(.init(["TRUSTED_ADULT"]))
    let app = app()
    await app.submitReflection(helped: "I hurt myself", next: "")
    #expect(app.reflectionReply?.line == content.safety.line)
    app.rateReflection(.helped)
    #expect(app.learner.entries(of: .feedback).isEmpty)
  }

  // MARK: Rating

  @Test func onlyAnAIReplyCanBeRatedOnce() async {
    fake.enqueue(.init([good]))
    let app = app()
    await app.submitReflection(helped: "talking it through", next: "")
    app.rateReflection(.helped)
    app.rateReflection(.notthis)
    #expect(app.learner.entries(of: .feedback).map(\.text) == ["helped weeklyReflection"])
    #expect(app.ratingCounts.map(\.move) == ["weeklyReflection"])
    #expect(Words.ratingLine(app.ratingCounts[0]).hasPrefix("Weekly look-back:"))
  }

  @Test func theReplyIsNeverSaved() async {
    fake.enqueue(.init([good]))
    let app = app()
    await app.submitReflection(helped: "talking it through", next: "")
    for line in app.learner.entries { #expect(!line.text.contains("Would you like")) }
    app.closeReflection()
    #expect(app.reflectionReply == nil)
  }

  @Test func theNewWordsHaveNoShameOrPraiseOrScoreWords() {
    let words = [
      Words.reflectionCard, Words.reflectionOpen, Words.reflectionNotNow, Words.reflectionTitle,
      Words.reflectionHelpedQuestion, Words.reflectionNextQuestion, Words.reflectionDone,
      Words.reflectionClose, Words.reflectionThinking, Words.reflectionFixed,
    ].joined(separator: " ").lowercased()
      .split(whereSeparator: { !$0.isLetter }).map(String.init)
    let banned = [
      "attention", "focus", "mood", "effort", "diagnosis", "adhd", "missed", "behind", "late",
      "overdue", "failed", "great", "awesome", "streak", "score", "best", "worst", "bad", "good",
      "proud", "sorry", "lazy", "should", "must",
    ]
    for word in banned { #expect(!words.contains(word), "\(word)") }
  }
}
