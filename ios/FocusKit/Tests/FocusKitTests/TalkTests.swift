import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct TalkTests {
  let content: Content
  let store: MemoryStore
  let clock = FakeClock()
  let model = FakeLanguageModel()
  let output = FakeSpeechOutput()
  let headphones = FakeHeadphones(connected: true)
  let speaker: SpeakerModel
  let chat: ChatModel
  var settings = Settings()

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
    speaker = SpeakerModel(output: output, headphones: headphones)
    chat = ChatModel(
      content: content, store: store, clock: clock, model: model, speaker: speaker)
  }

  private func waitForReply() async {
    for _ in 0..<3000 where chat.isReplying { await Task.yield() }
  }

  private func say(_ text: String) async {
    chat.draft = text
    chat.send()
    await waitForReply()
  }

  private func savedChats() -> [Chat] { store.load(SavedChats.self).value?.chats ?? [] }

  private func everythingSaved() -> String {
    store.fileNames.compactMap { store.rawRead($0) }.map { String(decoding: $0, as: UTF8.self) }
      .joined()
  }

  // MARK: A conversation

  @Test func aConversationIsShownAndSaved() async {
    model.enqueue(.init(["What have you tried? Tell me one thing."]))
    await say("I can't start my essay")
    #expect(chat.turns.map(\.role) == [.user, .assistant])
    #expect(chat.turns[1].text == "What have you tried? Tell me one thing.")
    #expect(!chat.isReplying)
    #expect(chat.draft == "")
    #expect(savedChats().count == 1)
    #expect(
      savedChats()[0].messages.map(\.text) == [
        "I can't start my essay", "What have you tried? Tell me one thing.",
      ])
  }

  @Test func theNextMessageCarriesTheEarlierOnes() async {
    model.enqueue(.init(["First hint."]), .init(["Second hint."]))
    await say("One")
    await say("Two")
    #expect(model.calls[1].messages.map(\.text) == ["One", "First hint.", "Two"])
    #expect(savedChats().count == 1)
    #expect(savedChats()[0].messages.count == 4)
  }

  @Test func theOpeningLineIsFixedTextNotFromTheAI() {
    #expect(chat.openingLine == content.chat.openingQuestion)
    #expect(chat.turns.isEmpty)
  }

  @Test func anEmptyOrBlankMessageDoesNothing() async {
    chat.draft = "   \n"
    #expect(!chat.canSend)
    chat.send()
    #expect(chat.turns.isEmpty)
    #expect(model.calls.isEmpty)
  }

  @Test func aMessageAtTheLimitIsKeptAndOverTheLimitIsCutWithANote() async {
    model.enqueue(.init(["Ok."]))
    await say(String(repeating: "a", count: content.limits.message))
    #expect(chat.turns[0].text.utf16.count == content.limits.message)
    #expect(chat.cutNote == nil)
    await say(String(repeating: "b", count: content.limits.message + 50))
    #expect(chat.turns[2].text.utf16.count == content.limits.message)
    #expect(chat.cutNote == Words.messageCut)
  }

  @Test func aDoubleTapOnSendSendsOnce() async {
    model.enqueue(.init(["Ok. Fine."], neverEnds: true))
    chat.draft = "Hello"
    chat.send()
    chat.draft = "Hello"
    chat.send()
    #expect(model.calls.count <= 1)
    #expect(chat.turns.filter { $0.role == .user }.count == 1)
    chat.stop()
  }

  // MARK: Stop and leaving

  @Test func nothingIsShownOrSpokenWhileTheReplyIsStillArriving() async {
    speaker.settings = { Settings(readAloud: true, talk: true, headphonesOnly: true) }
    model.enqueue(.init(["One sentence. Two sent"], neverEnds: true))
    chat.draft = "Help"
    chat.send()
    for _ in 0..<200 { await Task.yield() }
    #expect(chat.turns.last?.text == "")
    #expect(chat.turns.last?.inProgress == true)
    #expect(output.spoken.isEmpty)
    chat.stop()
    #expect(!chat.isReplying)
    #expect(chat.turns.map(\.role) == [.user])
    #expect(output.spoken.isEmpty)
    #expect(model.cancelCount == 1)
  }

  @Test func aFinishedLookingReplyIsNeitherShownNorSpoken() async {
    speaker.settings = { Settings(readAloud: true, talk: true, headphonesOnly: true) }
    model.enqueue(
      .init(["Nice start. ", "Keep going. ", "Here is the finished essay: ", "Dogs are loyal."]))
    await say("write it")
    #expect(chat.turns.last?.kind == .notice)
    #expect(!chat.turns.contains { $0.text.contains("Nice start") })
    #expect(output.spoken.isEmpty)
  }

  @Test func stoppingBeforeAnyTextDropsTheEmptyReply() async {
    model.enqueue(.init(["Still thinking"], neverEnds: true))
    chat.draft = "Help"
    chat.send()
    for _ in 0..<50 { await Task.yield() }
    chat.stop()
    #expect(chat.turns.map(\.role) == [.user])
  }

  @Test func leavingMidReplyStopsItAndTheVoice() async {
    model.enqueue(.init(["One sentence. Two"], neverEnds: true))
    chat.draft = "Help"
    chat.send()
    for _ in 0..<100 { await Task.yield() }
    chat.leave()
    #expect(!chat.isReplying)
  }

  // MARK: The trusted-adult case

  @Test func aTriggeredMessageIsRemovedAndNeverStored() async {
    model.enqueue(.init(["Let's start small. "]), .init(["TRUSTED_ADULT"]))
    await say("Help with the first part")
    await say("my secret distress words here")
    #expect(chat.turns.last?.kind == .trustedAdult)
    #expect(chat.turns.last?.text == content.safety.line)
    #expect(!chat.turns.contains { $0.text.contains("secret distress") })
    #expect(!everythingSaved().contains("secret distress"))
    #expect(
      savedChats()[0].messages.map(\.text) == ["Help with the first part", "Let's start small."])
  }

  @Test func aTriggeredFirstMessageSavesNoChatAtAll() async {
    model.enqueue(.init(["TRUSTED_ADULT"]))
    await say("private words")
    #expect(savedChats().isEmpty)
    #expect(!store.fileNames.contains("chats.json"))
    #expect(!everythingSaved().contains("private words"))
  }

  @Test func theGuardrailOnTheStudentsMessageAlsoNeverReachesTheStore() async {
    model.enqueue(.failing(.guardrail))
    await say("guarded words")
    #expect(chat.turns.last?.kind == .trustedAdult)
    #expect(!everythingSaved().contains("guarded words"))
  }

  @Test func theTriggeredMessageIsNotSentAgainWithTheNextOne() async {
    model.enqueue(.init(["TRUSTED_ADULT"]), .init(["A hint."]))
    await say("triggering words")
    await say("a normal message")
    #expect(model.calls[1].messages.map(\.text) == ["a normal message"])
  }

  @Test func theLineIsSpokenOnlyInWeTalkWithHeadphones() async {
    speaker.settings = { Settings(readAloud: true, talk: true, headphonesOnly: false) }
    headphones.set(connected: false)
    model.enqueue(.init(["TRUSTED_ADULT"]))
    await say("words")
    #expect(output.spoken.isEmpty)
    headphones.set(connected: true)
    model.enqueue(.init(["TRUSTED_ADULT"]))
    await say("more words")
    #expect(output.spoken == [content.safety.line])
  }

  // MARK: Other outcomes

  @Test func aFinishedAnswerIsReplacedByTheHintsOnlyLineAndNotKept() async {
    model.enqueue(.init(["Here is your essay. Courage is brave."]))
    await say("write it for me")
    #expect(chat.turns.last?.text == Words.aiHintsOnly)
    #expect(chat.turns.last?.kind == .notice)
    #expect(!everythingSaved().contains("Courage is brave"))
  }

  @Test func aReplyCutOffShowsOnlyTheCalmLine() async {
    model.enqueue(.init(["Start here. Then"], failure: .refusal))
    await say("help")
    #expect(chat.turns.map(\.text).suffix(2) == ["help", Words.aiCouldNotAnswer])
    #expect(!chat.turns.contains { $0.text.contains("Start here") })
    #expect(!chat.isReplying)
  }

  @Test func aRefusalGivesTheCalmLine() async {
    model.enqueue(.failing(.refusal))
    await say("help")
    #expect(chat.turns.last?.text == Words.aiCouldNotAnswer)
  }

  @Test func aTooLongChatSaysSo() async {
    model.enqueue(.failing(.contextFull))
    await say("help")
    #expect(chat.turns.last?.text == Words.aiTooLong)
  }

  @Test func withNoAIMessagesAreNotSentAndTheWordsStay() async {
    let off = FakeLanguageModel(availability: .notEnabled)
    let quiet = ChatModel(
      content: content, store: store, clock: clock, model: off, speaker: speaker)
    quiet.draft = "my words"
    quiet.send()
    #expect(quiet.turns.isEmpty)
    #expect(quiet.draft == "my words")
    #expect(quiet.unavailableLine == Words.aiUnavailable(.notEnabled))
    #expect(off.calls.isEmpty)
  }

  @Test func theAIBecomingUnavailableMidSendKeepsTheWords() async {
    model.set(.notReady)
    chat.draft = "my words"
    chat.send()
    #expect(chat.turns.isEmpty)
    #expect(chat.draft == "my words")
    #expect(chat.unavailableLine == Words.aiUnavailable(.notReady))
  }

  // MARK: Use these as my steps

  @Test func aListReplyOffersStepsAndTheyLandInTheEditorNotTheWorkScreen() async throws {
    let app = AppModel(
      content: content, store: store, clock: clock,
      services: Services(languageModel: model))
    model.enqueue(
      .init(["Try this plan.\n1. Read the question\n2. Underline the verb\n3. Write one line\n"]))
    app.talk.draft = "Help me plan"
    app.talk.send()
    for _ in 0..<3000 where app.talk.isReplying { await Task.yield() }
    #expect(app.talk.offeredSteps == ["Read the question", "Underline the verb", "Write one line"])
    app.talk.useAsSteps()
    #expect(app.planner.draft.stage == .editor)
    #expect(app.planner.draft.fromAI)
    #expect(
      app.planner.draft.steps.map(\.text) == [
        "Read the question", "Underline the verb", "Write one line",
      ])
    #expect(app.showsPlanner)
    #expect(app.showToday)
    #expect(!app.inStep)
    #expect(app.work == nil)
  }

  @Test func aListOfAnswerContentIsNotOfferedAsSteps() async {
    // Each line is an answer, not something the student does, so nothing is offered.
    model.enqueue(
      .init(["Here you go.\n1. The answer is 42\n2. Paris is the capital\n3. x equals 7\n"]))
    await say("give me the answers as a list")
    #expect(chat.offeredSteps.isEmpty)
  }

  @Test func aReplyWithoutAListOffersNothing() async {
    model.enqueue(.init(["Just one idea. Try it."]))
    await say("help")
    #expect(chat.offeredSteps.isEmpty)
    #expect(StepList.extract(from: "1. Only one", limit: 200).isEmpty)
  }

  // MARK: From Stuck, settings, voice

  @Test func talkItThroughFromStuckKnowsTheStepAndTheKind() async {
    model.enqueue(.init(["What have you tried?"]))
    chat.begin(stepText: "Underline the verb", kindId: "essay")
    await say("I'm stuck")
    let instructions = model.calls[0].instructions
    #expect(instructions.contains("Underline the verb"))
    #expect(instructions.contains("Kind of work: Essay"))
    #expect(savedChats()[0].kindId == "essay")
  }

  @Test func theStudentsGuideAndLengthAreUsed() async {
    chat.settings = {
      Settings(guides: ["all": "Be very brief."], lengths: ["all": "long"])
    }
    model.enqueue(.init(["Ok."]))
    await say("hi")
    let text = model.calls[0].instructions
    #expect(text.contains("Be very brief."))
    #expect(text.contains(content.chat.lengths.long.text))
  }

  @Test func inWeTalkTheCheckedReplyIsSpokenOnceAfterItFinishes() async {
    speaker.settings = { Settings(readAloud: true, talk: true, headphonesOnly: true) }
    model.enqueue(.init(["First idea. Sec", "ond idea. Third"]))
    await say("hi")
    #expect(output.spoken == ["First idea. Second idea. Third"])
  }

  @Test func inQuietNothingIsSpoken() async {
    model.enqueue(.init(["First idea. Second idea."]))
    await say("hi")
    #expect(output.spoken.isEmpty)
  }

  // MARK: Saved chats

  @Test func elevenChatsKeepTenAndDeletingNeedsASecondTap() async {
    model.enqueue(.init(["Ok."]))
    for number in 0..<11 {
      chat.newChat()
      await say("Chat \(number)")
    }
    #expect(chat.chats.count == 10)
    #expect(savedChats().count == 10)
    let doomed = chat.chats[3].id
    chat.askDelete(doomed)
    #expect(chat.chats.count == 10)
    chat.confirmDelete()
    #expect(chat.chats.count == 9)
    #expect(!savedChats().contains { $0.id == doomed })
  }

  @Test func askingThenCancellingDeletesNothing() async {
    model.enqueue(.init(["Ok."]))
    await say("one")
    chat.askDelete(chat.chats[0].id)
    chat.cancelDeletes()
    chat.confirmDelete()
    #expect(chat.chats.count == 1)
  }

  @Test func deleteAllNeedsASecondTap() async {
    model.enqueue(.init(["Ok."]))
    await say("one")
    chat.newChat()
    await say("two")
    chat.askDeleteAll()
    #expect(chat.chats.count == 2)
    chat.confirmDelete()
    #expect(chat.chats.isEmpty)
    #expect(savedChats().isEmpty)
  }

  @Test func openingASavedChatShowsItsMessages() async {
    model.enqueue(.init(["Ok hint."]))
    await say("first")
    let saved = chat.chats[0]
    chat.newChat()
    #expect(chat.turns.isEmpty)
    chat.open(saved)
    #expect(chat.turns.map(\.text) == ["first", "Ok hint."])
  }

  @Test func aStoreThatCannotWriteGivesACalmNoteAndKeepsTheScreen() async {
    store.failWrites = true
    model.enqueue(.init(["A hint."]))
    await say("help")
    #expect(chat.saveNote == Words.couldNotSave)
    #expect(chat.turns.last?.text == "A hint.")
  }

  @Test func aLongChatKeepsOnlyWhatFitsWhenSaved() async {
    model.enqueue(.init([String(repeating: "Try this. ", count: 60)]))
    for number in 0..<40 {
      await say("message number \(number) " + String(repeating: "z", count: 300))
    }
    let kept = savedChats().first?.messages ?? []
    #expect(kept.map { $0.text.utf16.count }.reduce(0, +) <= content.limits.chatCharacters + 400)
    #expect(kept.last != nil)
  }
}
