import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct GoalInLookBackTests {
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

  private func setGoals(
    _ app: AppModel, week: String = "", month: String = "", year: String = ""
  ) {
    app.me.setGoal(.week, week)
    app.me.setGoal(.month, month)
    app.me.setGoal(.year, year)
  }

  // MARK: Which goal

  @Test func theWeekGoalComesFirstThenMonthThenYearAndTodayIsNeverUsed() {
    let app = app()
    app.me.setGoal(.today, "Finish page one")
    #expect(app.me.lookBackGoal == nil)
    setGoals(app, year: "Pass the year")
    #expect(app.me.lookBackGoal == "Pass the year")
    setGoals(app, month: "Finish the essay", year: "Pass the year")
    #expect(app.me.lookBackGoal == "Finish the essay")
    setGoals(app, week: "Read chapter 3", month: "Finish the essay", year: "Pass the year")
    #expect(app.me.lookBackGoal == "Read chapter 3")
  }

  @Test func spacesOnlyCountsAsNoGoalAndTheSwitchHidesIt() {
    let app = app()
    setGoals(app, week: "   ")
    #expect(app.me.lookBackGoal == nil)
    setGoals(app, week: "Read chapter 3")
    #expect(app.me.lookBackGoal == "Read chapter 3")
    app.me.setShowGoalInLookBack(false)
    #expect(app.me.lookBackGoal == nil)
    app.me.setShowGoalInLookBack(true)
    #expect(app.me.lookBackGoal == "Read chapter 3")
  }

  @Test func oldSettingsLoadWithShowOnAndSendOff() {
    store.plant("settings.json", Data(#"{"version":1,"value":{"readAloud":false}}"#.utf8))
    let loaded = store.load(Settings.self).value
    #expect(loaded?.showGoalInLookBack == true && loaded?.sendGoalToAI == false)
    #expect(Settings().showGoalInLookBack && !Settings().sendGoalToAI)
  }

  @Test func theSwitchesSurviveASaveAndLoad() throws {
    let app = app()
    app.me.setSendGoalToAI(true)
    app.me.setShowGoalInLookBack(false)
    let again = AppModel(
      content: content, store: store, clock: clock,
      services: Services(languageModel: FakeLanguageModel()))
    #expect(again.me.sendGoalToAI && !again.me.showGoalInLookBack)
  }

  // MARK: What is sent

  @Test func withSendOffTheRequestIsTheTwoAnswersOnlyEvenWithAGoal() async throws {
    fake.enqueue(.init([good]))
    let app = app()
    setGoals(app, week: "Read chapter 3")
    await app.submitReflection(
      helped: "talking it through", next: "", toward: "I read two pages")
    let text = try #require(fake.calls.first?.messages.first?.text)
    #expect(text.contains("talking it through"))
    #expect(!text.contains("Read chapter 3") && !text.contains("two pages"))
    #expect(text.hasSuffix(content.coach.moves["weeklyReflection"]!.ask))
  }

  @Test func withSendOnTheGoalAndTheThirdAnswerAreSentQuoted() async throws {
    fake.enqueue(.init([good]))
    let app = app()
    setGoals(app, week: "Read \"chapter\" 3")
    app.me.setSendGoalToAI(true)
    await app.submitReflection(
      helped: "talking it through", next: "", toward: "I read two pages")
    let text = try #require(fake.calls.first?.messages.first?.text)
    #expect(text.contains("Read 'chapter' 3"))
    #expect(text.contains("I read two pages"))
    let call = try #require(fake.calls.first)
    let move = try #require(content.coach.moves["weeklyReflection"])
    #expect(call.instructions == content.coach.common + "\n" + move.rules)
    #expect(move.rules.contains("Do not say whether a goal has been reached"))
  }

  @Test func withSendOnButNoGoalNothingExtraIsSent() async throws {
    fake.enqueue(.init([good]))
    let app = app()
    app.me.setSendGoalToAI(true)
    await app.submitReflection(helped: "talking it through", next: "", toward: "I read pages")
    let text = try #require(fake.calls.first?.messages.first?.text)
    #expect(!text.contains("goal") && !text.contains("I read pages"))
  }

  @Test func withTheShowSwitchOffNeitherTheGoalNorTheThirdAnswerGoesAnywhere() async throws {
    fake.enqueue(.init([good]))
    let app = app()
    setGoals(app, week: "Read chapter 3")
    app.me.setSendGoalToAI(true)
    app.me.setShowGoalInLookBack(false)
    await app.submitReflection(helped: "talking it through", next: "", toward: "I read pages")
    let text = try #require(fake.calls.first?.messages.first?.text)
    #expect(!text.contains("Read chapter 3") && !text.contains("I read pages"))
    #expect(app.learner.entries(of: .reflection).count == 1)
  }

  @Test func aGoalEditedOrClearedWhileTheSheetIsOpenTakesEffectAtDone() async throws {
    fake.enqueue(.init([good]))
    let app = app()
    setGoals(app, week: "Read chapter 3")
    app.me.setSendGoalToAI(true)
    setGoals(app, week: "")
    await app.submitReflection(helped: "talking it through", next: "", toward: "I read pages")
    let text = try #require(fake.calls.first?.messages.first?.text)
    #expect(!text.contains("Read chapter 3") && !text.contains("I read pages"))
  }

  // MARK: What is saved

  @Test func theThirdAnswerIsSavedAsTheStudentsOwnLineAndTheGoalIsNeverInAnyLine() async {
    fake.enqueue(.init([good]))
    let app = app()
    setGoals(app, week: "Read chapter 3")
    await app.submitReflection(helped: "", next: "", toward: "I read two pages")
    let lines = app.learner.entries(of: .reflection)
    #expect(lines.map(\.text) == ["Toward my goal: I read two pages"])
    #expect(lines.allSatisfy { $0.source == .student && !$0.text.contains("chapter 3") })
    app.deleteLearnerLine(lines[0].id)
    #expect(app.learner.entries(of: .reflection).isEmpty)
    #expect(app.me.lookBackGoal == "Read chapter 3")
  }

  @Test func aThirdAnswerWithNoGoalShownIsNotSaved() async {
    let app = app()
    await app.submitReflection(helped: "", next: "", toward: "I read two pages")
    #expect(app.learner.entries(of: .reflection).isEmpty)
    #expect(fake.calls.isEmpty)
  }

  // MARK: Replies that judge progress

  /// The word-source rule already rejects most progress words, because the student did not write
  /// them. This is a case only the progress-word rule can catch: every word is the student's own,
  /// but together they say the student is "on track", which the app must never say.
  @Test func aReplyMadeOfTheStudentsOwnWordsThatSaysOnTrackIsStillRejected() async {
    let model = FakeLanguageModel()
    model.enqueue(.init(["You said keep. Would you like to stay on track next week?"]))
    let app = app(model: model)
    setGoals(app, week: "keep stay pages")
    app.me.setSendGoalToAI(true)
    await app.submitReflection(helped: "keep stay on", next: "track pages", toward: "")
    // Sanity: the same reply without the phrase would have been accepted by every other check.
    #expect(Reflection.judgesProgress("stay on track", studentText: ["keep stay on", "track"]))
    #expect(!Reflection.judgesProgress("stay on", studentText: ["keep stay on"]))
    #expect(app.reflectionReply?.fixed == true)
  }

  @Test func aReplyThatSaysTheGoalIsReachedNearOrOnTrackFallsBackToTheFixedLine() async {
    let replies = [
      "You said you reached your goal. Would you like to try that again next week?",
      "You said talking helped. Would you like to get closer to the goal next week?",
      "You said talking helped. Would you like to stay on track next week?",
      "You said talking helped. Would you like to try that and improve next week?",
    ]
    for reply in replies {
      let model = FakeLanguageModel()
      model.enqueue(.init([reply]))
      let app = app(model: model)
      setGoals(app, week: "Read chapter 3")
      app.me.setSendGoalToAI(true)
      await app.submitReflection(helped: "talking helped", next: "", toward: "I read pages")
      #expect(
        app.reflectionReply == AppModel.ReflectionReply(line: Words.reflectionFixed, fixed: true),
        "\(reply)")
    }
  }

  @Test func aGoalThatContainsAProgressWordCanStillBeRestated() async {
    fake.enqueue(
      .init(["You said get better at math. Would you like to try that again next week?"]))
    let app = app()
    setGoals(app, week: "get better at math")
    app.me.setSendGoalToAI(true)
    await app.submitReflection(helped: "", next: "", toward: "get better at math")
    #expect(app.reflectionReply?.fixed == false)
  }

  @Test func theJudgingCheckIsAboutWordsTheStudentDidNotWrite() {
    #expect(Reflection.judgesProgress("You are on track.", studentText: ["math"]))
    #expect(!Reflection.judgesProgress("You are on track.", studentText: ["I am on track"]))
    #expect(!Reflection.judgesProgress("You said math helped.", studentText: ["math"]))
  }

  @Test func theSafetyWordStillShowsTheTrustedAdultLine() async {
    fake.enqueue(.init(["TRUSTED_ADULT"]))
    let app = app()
    setGoals(app, week: "Read chapter 3")
    app.me.setSendGoalToAI(true)
    await app.submitReflection(helped: "talking helped", next: "", toward: "")
    #expect(app.reflectionReply?.line == content.safety.line)
  }

  // MARK: Words

  @Test func theNewWordsHaveNoShamePraiseScoreOrImprovementWords() {
    let words = [
      Words.reflectionGoalLine("Read chapter 3"), Words.reflectionTowardQuestion,
      Words.reflectionShowGoal, Words.goalSendSwitch, Words.goalSendNote, Words.goalShowNote,
    ].joined(separator: " ").lowercased()
      .split(whereSeparator: { !$0.isLetter }).map(String.init)
    let banned = [
      "attention", "focus", "mood", "effort", "diagnosis", "adhd", "missed", "behind", "late",
      "overdue", "failed", "great", "awesome", "streak", "score", "best", "worst", "bad", "good",
      "proud", "sorry", "lazy", "should", "must", "improve", "progress", "better", "sooner",
      "reached", "closer", "track",
    ]
    for word in banned { #expect(!words.contains(word), "\(word)") }
  }
}
