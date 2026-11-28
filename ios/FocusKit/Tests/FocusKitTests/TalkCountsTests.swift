import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct TalkCountsTests {
  let content: Content
  let store: MemoryStore
  let model = FakeLanguageModel()

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
  }

  private func chat(_ other: FakeLanguageModel? = nil) -> ChatModel {
    ChatModel(
      content: content, store: store, clock: FakeClock(), model: other ?? model,
      speaker: SpeakerModel(output: FakeSpeechOutput(), headphones: FakeHeadphones(connected: true))
    )
  }

  private func say(_ text: String, to chat: ChatModel) async {
    chat.draft = text
    chat.send()
    for _ in 0..<3000 where chat.isReplying { await Task.yield() }
  }

  @Test func aShownReplyAddsOneToShownOnly() async {
    model.enqueue(.init(["What have you tried?"]))
    let talk = chat()
    await say("I can't start", to: talk)
    #expect(talk.counts == TalkCounts(shown: 1))
    #expect(store.load(TalkCounts.self).value == TalkCounts(shown: 1))
  }

  @Test func eachFixedLineAddsToItsOwnCount() async {
    model.enqueue(
      .init(["Here is your essay: " + String(repeating: "words ", count: 200)]),
      .failing(.refusal), .failing(.contextFull))
    let talk = chat()
    await say("write it", to: talk)
    #expect(talk.counts == TalkCounts(hintsOnly: 1))
    await say("please", to: talk)
    #expect(talk.counts == TalkCounts(hintsOnly: 1, couldNotAnswer: 1))
    await say("again", to: talk)
    #expect(talk.counts == TalkCounts(hintsOnly: 1, couldNotAnswer: 1, tooLong: 1))
  }

  @Test func aKeyNotAcceptedOrBusyServiceCountsAsNotAvailable() async {
    model.enqueue(.failing(.keyNotAccepted), .failing(.busy))
    let talk = chat()
    await say("one", to: talk)
    #expect(talk.counts == TalkCounts(unavailable: 1))
    await say("two", to: talk)
    #expect(talk.counts == TalkCounts(unavailable: 2))
  }

  @Test func theTrustedAdultLineIsNotCounted() async {
    model.enqueue(.init(["TRUSTED_ADULT"]))
    let talk = chat()
    await say("something serious", to: talk)
    #expect(talk.counts == TalkCounts())
    #expect(store.load(TalkCounts.self) == .missing)
  }

  @Test func anUnavailableAIAddsToUnavailable() async {
    model.enqueue(.failing(.unavailable))
    let talk = chat()
    await say("hello", to: talk)
    #expect(talk.counts == TalkCounts(unavailable: 1))
  }

  @Test func aStoppedReplyCountsNothing() async {
    model.enqueue(.init(["Partly"], neverEnds: true))
    let talk = chat()
    talk.draft = "hello"
    talk.send()
    for _ in 0..<50 { await Task.yield() }
    talk.stop()
    for _ in 0..<50 { await Task.yield() }
    #expect(talk.counts == TalkCounts())
  }

  @Test func countsComeBackAfterARelaunchAndADamagedFileLoadsAsZero() async {
    model.enqueue(.init(["What have you tried?"]))
    let first = chat()
    await say("hi", to: first)
    #expect(chat().counts.shown == 1)
    store.plant(TalkCounts.fileName, Data("not json".utf8))
    #expect(chat().counts == TalkCounts())
    // The damaged file was set aside; nothing is written until the next counted reply.
    #expect(store.rawRead(TalkCounts.fileName) == nil)
  }

  @Test func deleteEverythingThenOneReplyLeavesExactlyOne() async throws {
    model.enqueue(.init(["One."]), .init(["Two."]), .init(["Three."]))
    let app = AppModel(
      content: content, store: store, clock: FakeClock(), services: Services(languageModel: model))
    await say("a", to: app.talk)
    await say("b", to: app.talk)
    #expect(app.talk.counts.shown == 2)
    #expect(app.eraseEverything())
    #expect(app.talk.counts == TalkCounts())
    #expect(store.load(TalkCounts.self) == .missing)
    await say("c", to: app.talk)
    #expect(store.load(TalkCounts.self).value == TalkCounts(shown: 1))
  }

  @Test func theCapIsNeverPassed() {
    #expect(TalkCounts.raised(TalkCounts.cap) == TalkCounts.cap)
    #expect(TalkCounts.raised(-5) == 1)
  }

  @Test func theSavedFileHoldsOnlyTheFiveCounts() throws {
    try store.save(TalkCounts(shown: 3, hintsOnly: 1))
    let raw = try #require(store.rawRead(TalkCounts.fileName))
    let top = try #require(try JSONSerialization.jsonObject(with: raw) as? [String: Any])
    let value = try #require(top["value"] as? [String: Any])
    #expect(Set(top.keys) == ["version", "value"])
    #expect(Set(value.keys) == ["shown", "hintsOnly", "couldNotAnswer", "tooLong", "unavailable"])
  }

  @Test func theAboutWordsNameNoPersonAndNoScore() {
    let all = (Words.talkCountsLines(TalkCounts()) + [Words.talkCountsTitle, Words.talkCountsNote])
      .joined(separator: " ").lowercased()
    for word in ["refused", "failed", "score", "%", "you asked", "cheat"] {
      #expect(!all.contains(word), "contains \(word)")
    }
  }
}
