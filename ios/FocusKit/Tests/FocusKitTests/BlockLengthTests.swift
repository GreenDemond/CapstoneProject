import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct BlockLengthTests {
  let content: Content
  let store: MemoryStore
  let clock = FakeClock()

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
  }

  private func answer(
    _ minutes: Int, _ answer: BlockLength.Answer, daysAgo: Double = 0
  ) -> LearnerRecord.Entry {
    LearnerRecord.Entry(
      kind: .setting, date: clock.now.addingTimeInterval(-daysAgo * 86_400),
      text: BlockLength.text(minutes: minutes, answer: answer), source: .app)
  }

  private func suggested(_ entries: [LearnerRecord.Entry]) -> Int? {
    BlockLength.suggested(in: LearnerRecord(entries: entries), now: clock.now)
  }

  // MARK: The lines

  @Test func theLinesReadPlainlyAndParseBack() throws {
    #expect(BlockLength.text(minutes: 12, answer: .shorter) == "12-minute block: too long")
    #expect(BlockLength.text(minutes: 25, answer: .longer) == "25-minute block: too short")
    #expect(BlockLength.text(minutes: 5, answer: .aboutRight) == "5-minute block: about right")
    let saved = try #require(BlockLength.parse(answer(25, .shorter)))
    #expect(saved.minutes == 25 && saved.answer == .shorter)
    let other = LearnerRecord.Entry(
      kind: .setting, date: clock.now, text: "Starts at 4pm", source: .app)
    #expect(BlockLength.parse(other) == nil)
  }

  // MARK: The suggestion

  @Test func oneOrTwoAnswersChangeNothingAndThreeDo() {
    #expect(suggested([answer(25, .shorter)]) == nil)
    #expect(suggested([answer(25, .shorter), answer(25, .shorter)]) == nil)
    var three: [LearnerRecord.Entry] = []
    for index in 0..<3 { three.append(answer(25, .shorter, daysAgo: Double(index))) }
    #expect(suggested(three) == 12)
  }

  @Test func threeTooShortAtTwelveSuggestTwentyFive() {
    var three: [LearnerRecord.Entry] = []
    for index in 0..<3 { three.append(answer(12, .longer, daysAgo: Double(index))) }
    #expect(suggested(three) == 25)
  }

  @Test func tooLongAtFiveAndTooShortAtTwentyFiveHaveNowhereToGo() {
    var short: [LearnerRecord.Entry] = []
    var long: [LearnerRecord.Entry] = []
    for index in 0..<4 {
      short.append(answer(5, .shorter, daysAgo: Double(index)))
      long.append(answer(25, .longer, daysAgo: Double(index)))
    }
    #expect(suggested(short) == nil)
    #expect(suggested(long) == nil)
  }

  @Test func aMixedSetChangesNothing() {
    let mixed = [
      answer(25, .shorter, daysAgo: 0), answer(25, .shorter, daysAgo: 1),
      answer(25, .shorter, daysAgo: 2), answer(25, .longer, daysAgo: 3),
    ]
    #expect(suggested(mixed) == nil)
  }

  @Test func aboutRightAnswersDoNotCancelButCountInTheWindow() {
    // Three too long and two about right in the newest five: still three of five, none the other way.
    let entries = [
      answer(25, .shorter, daysAgo: 0), answer(25, .aboutRight, daysAgo: 1),
      answer(25, .shorter, daysAgo: 2), answer(25, .aboutRight, daysAgo: 3),
      answer(25, .shorter, daysAgo: 4),
    ]
    #expect(suggested(entries) == 12)
  }

  @Test func onlyTheNewestFiveWithinThirtyDaysCount() {
    var old: [LearnerRecord.Entry] = []
    for index in 0..<3 { old.append(answer(25, .shorter, daysAgo: 40 + Double(index))) }
    #expect(suggested(old) == nil)

    var pushedOut: [LearnerRecord.Entry] = []
    for index in 0..<3 { pushedOut.append(answer(25, .shorter, daysAgo: 20 + Double(index))) }
    for index in 0..<5 { pushedOut.append(answer(25, .aboutRight, daysAgo: Double(index))) }
    #expect(suggested(pushedOut) == nil)
  }

  @Test func theNewestAnswerWinsWhenTwoLengthsPointSomewhere() {
    var entries: [LearnerRecord.Entry] = []
    for index in 0..<3 { entries.append(answer(25, .shorter, daysAgo: 5 + Double(index))) }
    for index in 0..<3 { entries.append(answer(12, .longer, daysAgo: Double(index))) }
    #expect(suggested(entries) == 25)
  }

  // MARK: Through the app

  private func app(_ record: LearnerRecord = LearnerRecord()) throws -> AppModel {
    try store.save(record)
    return AppModel(
      content: content, store: store, clock: clock,
      services: Services(languageModel: FakeLanguageModel()))
  }

  @Test func anAnswerWritesOneAppLineAndNothingTheStudentTyped() throws {
    let model = try app()
    model.answerBlockLength(minutes: 12, .shorter)
    let lines = model.learner.entries(of: .setting)
    #expect(lines.count == 1)
    #expect(lines[0].text == "12-minute block: too long")
    #expect(lines[0].source == .app)
    model.answerBlockLength(minutes: 7, .shorter)
    #expect(model.learner.entries(of: .setting).count == 1)
  }

  @Test func theTimerSuggestionFollowsTheAnswersAndBeatsTheQuestionnaire() throws {
    let model = try app()
    model.me.setAnswer("block", "short")
    #expect(model.me.startingCountdownMinutes == 12)
    for _ in 0..<3 { model.answerBlockLength(minutes: 12, .longer) }
    #expect(model.me.startingCountdownMinutes == 25)
    #expect(model.me.learnedLine == "Your answers so far point to 25 minutes.")
  }

  @Test func deletingAnAnswerRecomputesTheSuggestionAtOnce() throws {
    let model = try app()
    for _ in 0..<3 { model.answerBlockLength(minutes: 25, .shorter) }
    #expect(model.me.startingCountdownMinutes == 12)
    let id = try #require(model.learner.entries(of: .setting).first?.id)
    model.deleteLearnerLine(id)
    #expect(model.me.startingCountdownMinutes == nil)
    #expect(model.me.learnedLine == nil)
    #expect(model.learner.entries(of: .setting).count == 2)
  }

  // MARK: When the question is raised

  @Test func theQuestionIsRaisedOnlyJustAfterTheCountdownEnds() {
    let end = clock.now
    #expect(!BlockLength.shouldAsk(end: end, now: end.addingTimeInterval(-1)))
    #expect(BlockLength.shouldAsk(end: end, now: end.addingTimeInterval(1)))
    #expect(BlockLength.shouldAsk(end: end, now: end.addingTimeInterval(120)))
    #expect(!BlockLength.shouldAsk(end: end, now: end.addingTimeInterval(121)))
    #expect(!BlockLength.shouldAsk(end: end, now: end.addingTimeInterval(3 * 3600)))
  }

  // MARK: Words

  @Test func theNewWordsHaveNoShameOrPraiseOrScoreWords() {
    let words = [
      Words.blockQuestion(12), Words.blockShorter, Words.blockAboutRight, Words.blockLonger,
      Words.blockSkip, Words.blockLearnedLine(12), Words.timerLearned,
      BlockLength.text(minutes: 12, answer: .shorter),
      BlockLength.text(minutes: 12, answer: .longer),
      BlockLength.text(minutes: 12, answer: .aboutRight),
    ].joined(separator: " ").lowercased()
      .split(whereSeparator: { !$0.isLetter }).map(String.init)
    let banned = [
      "attention", "focus", "mood", "effort", "diagnosis", "adhd", "missed", "behind", "late",
      "overdue", "failed", "great", "awesome", "streak", "score", "best", "worst", "bad", "good",
      "proud", "sorry", "lazy", "should", "must",
    ]
    for word in banned { #expect(!words.contains(word), "\(word)") }
  }

  @Test func shorterIsNotOfferedAtTheShortestNorLongerAtTheLongest() {
    #expect(!BlockLength.offers(.shorter, at: 5) && BlockLength.offers(.longer, at: 5))
    #expect(BlockLength.offers(.shorter, at: 12) && BlockLength.offers(.longer, at: 12))
    #expect(BlockLength.offers(.shorter, at: 25) && !BlockLength.offers(.longer, at: 25))
    for length in BlockLength.lengths { #expect(BlockLength.offers(.aboutRight, at: length)) }
  }

  @Test func theTimerHasAFiveMinuteLength() {
    #expect(BlockLength.lengths == [5, 12, 25])
  }
}
