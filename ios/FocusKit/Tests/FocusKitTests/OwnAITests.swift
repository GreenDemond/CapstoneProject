import Foundation
import Testing

@testable import FocusKit

/// Obviously fake. The real key is never written anywhere.
private let fakeKey = "test-key-123"
private let goodAddress = "https://api.example.com/v1/chat/completions"

@MainActor
@Suite struct OwnAITests {
  let content: Content
  let store: MemoryStore
  let keys = FakeKeyStore()
  let transport = FakeHTTPTransport()
  let phone = FakeLanguageModel()

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
    phone.enqueue(.init(["A hint from the phone."]))
  }

  private func app(store other: (any Store)? = nil, backup: any BackupFlag = NoBackupFlag())
    -> AppModel
  {
    AppModel(
      content: content, store: other ?? store, clock: FakeClock(),
      services: Services(languageModel: phone, keys: keys, transport: transport, backup: backup))
  }

  /// A model set up to be switched on.
  private func ready(_ a: AppModel) {
    a.ownAI.noteDisclosureShown()
    a.ownAI.setAddress(goodAddress)
    a.ownAI.setModelName("some-model")
    #expect(a.ownAI.saveKey(fakeKey))
  }

  private func model(_ text: String = "OK") -> OpenAICompatibleModel {
    OpenAICompatibleModel(
      config: OwnAIConfig(address: goodAddress, modelName: "some-model"), keys: keys,
      transport: transport)
  }

  private func finalText(_ model: OpenAICompatibleModel, _ text: String = "hi") async throws
    -> String
  {
    var last = ""
    for try await piece in model.stream(
      instructions: "RULES", messages: [ChatMessage(role: .user, text: text)])
    {
      last = piece
    }
    return last
  }

  private func failure(_ model: OpenAICompatibleModel) async -> ModelFailure? {
    do {
      _ = try await finalText(model)
      return nil
    } catch let failure as ModelFailure {
      return failure
    } catch {
      return nil
    }
  }

  // MARK: The request

  @Test func theRequestHasTheRightShape() async throws {
    _ = keys.save(fakeKey)
    transport.enqueueReply("Try the first line.")
    let reply = try await finalText(model(), "help me")
    #expect(reply == "Try the first line.")
    let request = try #require(transport.requests.first)
    #expect(request.httpMethod == "POST")
    #expect(request.url?.absoluteString == goodAddress)
    #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer \(fakeKey)")
    #expect(request.value(forHTTPHeaderField: "Content-Type") == "application/json")
    #expect(request.timeoutInterval > 0 && request.timeoutInterval <= 60)
    let body = try #require(request.httpBody)
    let json = try #require(try JSONSerialization.jsonObject(with: body) as? [String: Any])
    #expect(json["model"] as? String == "some-model")
    #expect(json["stream"] as? Bool == false)
    let messages = try #require(json["messages"] as? [[String: String]])
    #expect(messages.first == ["role": "system", "content": "RULES"])
    #expect(messages.last == ["role": "user", "content": "help me"])
  }

  @Test func theRulesAndHistoryGoInTheRequestThroughTheChatEngine() async throws {
    _ = keys.save(fakeKey)
    transport.enqueueReply("A question: what have you tried?")
    let engine = ChatEngine(model: model(), content: content)
    var events: [ChatEvent] = []
    for await event in engine.reply(
      to: [ChatMessage(role: .user, text: "stuck")],
      context: ChatContext(kindLabel: "Essay"))
    {
      events.append(event)
    }
    #expect(events == [.finished("A question: what have you tried?")])
    let body = try #require(transport.requests.first?.httpBody)
    let text = String(decoding: body, as: UTF8.self)
    #expect(text.contains(content.chat.rulesReminder.prefix(20)))
  }

  // MARK: The safety checks still apply

  @Test func aReplyWithTheSafetyWordBecomesTheTrustedAdultLineAndIsNotSaved() async {
    _ = keys.save(fakeKey)
    transport.enqueueReply(content.safety.word)
    let a = app()
    ready(a)
    #expect(a.ownAI.setOn(true))
    a.talk.draft = "I feel awful"
    a.talk.send()
    for _ in 0..<5000 where a.talk.isReplying { await Task.yield() }
    #expect(a.talk.turns.last?.kind == .trustedAdult)
    #expect(a.talk.turns.last?.text == content.safety.line)
    #expect(a.talk.chats.isEmpty)
    #expect(!a.talk.turns.contains { $0.text == "I feel awful" })
  }

  @Test func aFinishedAnswerFromTheServiceIsCaughtByTheAnswerGuard() async throws {
    _ = keys.save(fakeKey)
    let essay = (1...12).map { "Paragraph \($0): " + String(repeating: "word ", count: 60) }
      .joined(separator: "\n\n")
    transport.enqueueReply(essay)
    let engine = ChatEngine(model: model(), content: content)
    var events: [ChatEvent] = []
    for await event in engine.reply(
      to: [ChatMessage(role: .user, text: "write it")], context: ChatContext(kindLabel: "Essay"))
    {
      events.append(event)
    }
    #expect(events == [.answerRefused])
  }

  // MARK: Failures

  @Test func aWrongKeyIsMappedToKeyNotAccepted() async {
    _ = keys.save(fakeKey)
    for status in [401, 403] {
      transport.enqueue(.reply(status: status, body: Data("{}".utf8)))
      #expect(await failure(model()) == .keyNotAccepted)
    }
  }

  @Test func busyIsMappedFrom429() async {
    _ = keys.save(fakeKey)
    transport.enqueue(.reply(status: 429, body: Data()))
    #expect(await failure(model()) == .busy)
  }

  @Test func aServerErrorAndATimeoutBothMeanUnavailable() async {
    _ = keys.save(fakeKey)
    transport.enqueue(.reply(status: 500, body: Data()))
    #expect(await failure(model()) == .unavailable)
    transport.enqueue(.fails(.timedOut))
    #expect(await failure(model()) == .unavailable)
  }

  @Test func malformedJsonAndEmptyRepliesAreCalmFailures() async {
    _ = keys.save(fakeKey)
    transport.enqueue(.reply(status: 200, body: Data("not json".utf8)))
    #expect(await failure(model()) == .other)
    transport.enqueueReply("   ")
    #expect(await failure(model()) == .other)
    transport.enqueue(.reply(status: 200, body: Data(#"{"choices":[]}"#.utf8)))
    #expect(await failure(model()) == .other)
  }

  @Test func noKeyMeansNothingIsSent() async {
    #expect(model().availability == .other)
    #expect(await failure(model()) == .unavailable)
    #expect(transport.requests.isEmpty)
  }

  @Test func theChatShowsCalmLinesAndKeepsTheMessageForNextTime() async {
    transport.enqueue(.reply(status: 401, body: Data()))
    let a = app()
    ready(a)
    #expect(a.ownAI.setOn(true))
    a.talk.draft = "help"
    a.talk.send()
    for _ in 0..<5000 where a.talk.isReplying { await Task.yield() }
    #expect(a.talk.serviceNote == Words.ownAIKeyNotAccepted)
    #expect(a.talk.draft == "help")
    #expect(a.talk.turns.isEmpty)
    transport.enqueue(.reply(status: 429, body: Data()))
    a.talk.send()
    for _ in 0..<5000 where a.talk.isReplying { await Task.yield() }
    #expect(a.talk.serviceNote == Words.ownAIBusy)
    transport.enqueue(.fails(.timedOut))
    a.talk.send()
    for _ in 0..<5000 where a.talk.isReplying { await Task.yield() }
    #expect(a.talk.unavailableLine == Words.aiUnavailable(.other))
    #expect(a.talk.draft == "help")
  }

  @Test func theStepCoachFallsBackToStarterStepsWhenTheServiceFails() async {
    transport.enqueue(.reply(status: 500, body: Data()))
    let a = app()
    ready(a)
    #expect(a.ownAI.setOn(true))
    let coach = StepCoach(model: model(), content: content)
    let result = await coach.suggest(assignment: "Read chapter 2", kindLabel: "Reading", count: 3)
    if case .fallback = result {} else { Issue.record("expected a fallback, got \(result)") }
  }

  // MARK: Addresses

  @Test func onlyHttpsAddressesAreAccepted() {
    #expect(OwnAIConfig.parse(goodAddress) != nil)
    #expect(OwnAIConfig.parse("  HTTPS://api.example.com/v1/chat/completions ") != nil)
    for bad in [
      "http://api.example.com/v1/chat/completions", "ftp://x.com", "api.example.com", "", "   ",
      "https://", "not a url", "https://user:pw@api.example.com/x",
      "https://api.example.com/x?key=abc", "https://api.example.com/x#frag",
      "https:///path", "javascript:alert(1)",
    ] {
      #expect(OwnAIConfig.parse(bad) == nil, "\(bad)")
    }
  }

  @Test func anHttpAddressGivesACalmLineAndCannotBeSwitchedOn() {
    let a = app()
    a.ownAI.noteDisclosureShown()
    a.ownAI.setAddress("http://api.example.com/v1/chat/completions")
    a.ownAI.setModelName("m")
    _ = a.ownAI.saveKey(fakeKey)
    #expect(a.ownAI.addressProblem == Words.ownAIAddressBad)
    #expect(!a.ownAI.canSwitchOn)
    #expect(!a.ownAI.setOn(true))
    #expect(!a.settings.ownAIOn)
  }

  // MARK: Switching on

  @Test func switchingOnNeedsTheDisclosureToHaveBeenShown() {
    let a = app()
    a.ownAI.setAddress(goodAddress)
    a.ownAI.setModelName("m")
    _ = a.ownAI.saveKey(fakeKey)
    #expect(!a.ownAI.setOn(true))
    a.ownAI.noteDisclosureShown()
    #expect(a.ownAI.setOn(true))
    #expect(a.ownAI.isInUse)
  }

  @Test func theDisclosureNamesWhatIsSentAndWhereTo() {
    let a = app()
    a.ownAI.setAddress(goodAddress)
    let line = a.ownAI.disclosure
    #expect(line.contains(goodAddress))
    #expect(line.contains("chat messages"))
    #expect(line.contains("step and assignment text"))
    #expect(line.contains("rules"))
    #expect(line.contains("privacy rules"))
  }

  @Test func switchingOnNeedsAModelNameAndAKey() {
    let a = app()
    a.ownAI.noteDisclosureShown()
    a.ownAI.setAddress(goodAddress)
    #expect(!a.ownAI.setOn(true))
    a.ownAI.setModelName("m")
    #expect(!a.ownAI.setOn(true))
    _ = a.ownAI.saveKey(fakeKey)
    #expect(a.ownAI.setOn(true))
  }

  @Test func offByDefaultAndTheDefaultIsTheModelOnThePhone() async {
    let a = app()
    #expect(!a.settings.ownAIOn)
    a.talk.draft = "hello"
    a.talk.send()
    for _ in 0..<5000 where a.talk.isReplying { await Task.yield() }
    #expect(phone.calls.count == 1)
    #expect(transport.requests.isEmpty)
    #expect(a.talk.privacyLine == Words.talkPrivacy)
  }

  @Test func switchingOffReturnsToTheModelOnThePhone() async {
    transport.enqueueReply("From my service.")
    let a = app()
    ready(a)
    #expect(a.ownAI.setOn(true))
    #expect(a.talk.privacyLine == Words.talkPrivacyOwn)
    a.talk.draft = "one"
    a.talk.send()
    for _ in 0..<5000 where a.talk.isReplying { await Task.yield() }
    #expect(transport.requests.count == 1)
    #expect(phone.calls.isEmpty)
    #expect(a.ownAI.setOn(false))
    #expect(a.talk.privacyLine == Words.talkPrivacy)
    a.talk.draft = "two"
    a.talk.send()
    for _ in 0..<5000 where a.talk.isReplying { await Task.yield() }
    #expect(transport.requests.count == 1)
    #expect(phone.calls.count == 1)
  }

  // MARK: The visible switch between the two AIs

  @Test func theVisibleSwitchChoosesBetweenTheTwoWhileTheServiceIsOn() async {
    transport.enqueueReply("From my service.")
    let a = app()
    #expect(!a.ownAI.isReady)
    ready(a)
    #expect(!a.ownAI.isReady)
    #expect(a.ownAI.setOn(true))
    #expect(a.ownAI.isReady)
    #expect(a.ownAI.isInUse)
    a.ownAI.use(own: false)
    #expect(a.ownAI.isReady && !a.ownAI.isInUse)
    #expect(a.talk.privacyLine == Words.talkPrivacy)
    a.talk.draft = "x"
    a.talk.send()
    for _ in 0..<5000 where a.talk.isReplying { await Task.yield() }
    #expect(phone.calls.count == 1)
    a.ownAI.use(own: true)
    a.talk.draft = "y"
    a.talk.send()
    for _ in 0..<5000 where a.talk.isReplying { await Task.yield() }
    #expect(transport.requests.count == 1)
    #expect(a.ownAI.isInUse)
  }

  @Test func theChoiceIsRememberedAfterReopening() {
    let a = app()
    ready(a)
    _ = a.ownAI.setOn(true)
    a.ownAI.use(own: false)
    let again = app()
    #expect(again.ownAI.isReady)
    #expect(!again.ownAI.isInUse)
  }

  @Test func theSwitchDoesNothingWhenTheServiceIsOff() {
    let a = app()
    ready(a)
    a.ownAI.use(own: true)
    #expect(!a.ownAI.isInUse)
  }

  // MARK: Check connection

  @Test func checkConnectionSendsOneTinyFixedRequestAndReportsCalmly() async throws {
    let a = app()
    ready(a)
    transport.enqueueReply("OK")
    await a.ownAI.checkConnection()
    #expect(a.ownAI.checkLine == Words.ownAICheckWorks)
    #expect(transport.requests.count == 1)
    let body = String(decoding: try #require(transport.requests[0].httpBody), as: UTF8.self)
    #expect(body.contains(OpenAICompatibleModel.checkMessage))

    transport.enqueue(.reply(status: 401, body: Data()))
    await a.ownAI.checkConnection()
    #expect(a.ownAI.checkLine == Words.ownAIKeyNotAccepted)
    transport.enqueue(.reply(status: 429, body: Data()))
    await a.ownAI.checkConnection()
    #expect(a.ownAI.checkLine == Words.ownAIBusy)
    transport.enqueue(.fails(.timedOut))
    await a.ownAI.checkConnection()
    #expect(a.ownAI.checkLine == Words.ownAICheckProblem)
  }

  @Test func checkConnectionIsNotPossibleUntilEverythingIsFilledIn() async {
    let a = app()
    a.ownAI.setAddress(goodAddress)
    await a.ownAI.checkConnection()
    #expect(transport.requests.isEmpty)
    #expect(a.ownAI.checkLine == nil)
  }

  // MARK: The key never leaks

  @Test func theKeyIsInNoSavedFileAndNoMessage() async {
    transport.enqueue(.reply(status: 401, body: Data()))
    let a = app()
    ready(a)
    _ = a.ownAI.setOn(true)
    a.talk.draft = "hi"
    a.talk.send()
    for _ in 0..<5000 where a.talk.isReplying { await Task.yield() }
    a.me.setGuide("be kind")
    for name in store.fileNames {
      let data = store.rawRead(name) ?? Data()
      #expect(!String(decoding: data, as: UTF8.self).contains(fakeKey), "\(name)")
    }
    for line in [
      a.ownAI.keyLine, a.ownAI.disclosure, a.ownAI.keyNote ?? "", a.talk.serviceNote ?? "",
      a.ownAI.checkLine ?? "", Words.privacyLines.joined(),
    ] {
      #expect(!line.contains(fakeKey))
    }
    #expect(a.ownAI.keyLine == Words.ownAIKeySaved)
  }

  @Test func theKeyIsNeverInASavedFileOnDisk() throws {
    let folder = FileManager.default.temporaryDirectory.appendingPathComponent(
      "ownai-\(UUID().uuidString)")
    defer { try? FileManager.default.removeItem(at: folder) }
    let real = FileStore(folder: folder, limits: content.limits)
    let a = app(store: real)
    ready(a)
    _ = a.ownAI.setOn(true)
    a.finishWelcome()
    let names = try FileManager.default.contentsOfDirectory(atPath: folder.path)
    #expect(names.contains("settings.json"))
    for name in names {
      let text = try String(contentsOf: folder.appendingPathComponent(name), encoding: .utf8)
      #expect(!text.contains(fakeKey), "\(name)")
    }
  }

  @Test func theAddressAndModelNameAreSavedButNotTheKey() throws {
    let a = app()
    ready(a)
    let saved = try #require(store.load(Settings.self).value)
    #expect(saved.ownAIEndpoint == goodAddress)
    #expect(saved.ownAIModelId == "some-model")
    let encoded = String(decoding: try JSONEncoder().encode(saved), as: UTF8.self)
    #expect(!encoded.contains(fakeKey))
  }

  @Test func aKeyThatCannotBeSavedSaysSoCalmlyAndSavesNothing() {
    keys.setFailing(true)
    let a = app()
    #expect(!a.ownAI.saveKey(fakeKey))
    #expect(a.ownAI.keyNote == Words.ownAIKeyCouldNotSave)
    #expect(!a.ownAI.hasKey)
    #expect(!a.ownAI.saveKey("   "))
  }

  @Test func removingTheKeySwitchesTheServiceOff() {
    let a = app()
    ready(a)
    _ = a.ownAI.setOn(true)
    a.ownAI.removeKey()
    #expect(!a.ownAI.hasKey)
    #expect(!keys.hasKey)
    #expect(!a.settings.ownAIOn)
    #expect(!a.ownAI.isInUse)
  }

  @Test func deleteEverythingRemovesTheKeyAndReturnsToThePhone() {
    let a = app()
    ready(a)
    _ = a.ownAI.setOn(true)
    #expect(keys.hasKey)
    #expect(a.eraseEverything())
    #expect(!keys.hasKey)
    #expect(!a.ownAI.hasKey)
    #expect(!a.ownAI.isInUse)
    #expect(a.settings == Settings())
    #expect(store.fileNames.isEmpty)
  }

  @Test func deleteEverythingChangesNothingIfTheKeyCannotBeRemoved() {
    let a = app()
    ready(a)
    a.finishWelcome()
    keys.setFailing(true)
    #expect(!a.eraseEverything())
    #expect(a.welcomed)
    #expect(keys.hasKey)
  }

  // MARK: The network file rule

  @Test func onlyTwoSourceFilesOpenAConnection() throws {
    let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
      .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
    var hits: [String] = []
    for folder in ["FocusKit/Sources", "App"] {
      let walker = FileManager.default.enumerator(
        at: root.appendingPathComponent(folder), includingPropertiesForKeys: nil)
      while let file = walker?.nextObject() as? URL {
        guard file.pathExtension == "swift" else { continue }
        let text = try String(contentsOf: file, encoding: .utf8)
        if text.contains("URLSession") || text.contains("URLRequest(") {
          hits.append(file.lastPathComponent)
        }
      }
    }
    #expect(hits.sorted() == ["OpenAICompatibleModel.swift", "WikipediaLookUp.swift"])
  }

  @Test func theKeyIsReadFromTheKeychainOnlyInsideTheStoreAndTheModel() throws {
    let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
      .deletingLastPathComponent().deletingLastPathComponent()
    let walker = FileManager.default.enumerator(
      at: root.appendingPathComponent("Sources"), includingPropertiesForKeys: nil)
    var hits: [String] = []
    while let file = walker?.nextObject() as? URL {
      guard file.pathExtension == "swift" else { continue }
      let text = try String(contentsOf: file, encoding: .utf8)
      if text.contains("keys.read()") || text.contains(".read()") { hits.append(file.lastPathComponent) }
      if text.contains("import Security") { hits.append("SECURITY:" + file.lastPathComponent) }
    }
    #expect(hits.sorted() == ["OpenAICompatibleModel.swift", "SECURITY:KeychainKeyStore.swift"])
  }
}

@MainActor
@Suite struct BackupTests {
  let content: Content
  let store: MemoryStore

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
  }

  private func app(_ backup: any BackupFlag, store other: (any Store)? = nil) -> AppModel {
    AppModel(
      content: content, store: other ?? store, clock: FakeClock(),
      services: Services(backup: backup))
  }

  @Test func theDefaultIsIncludedInBackup() {
    #expect(Settings().includeInBackup)
    let flag = FakeBackupFlag()
    let a = app(flag)
    #expect(a.settings.includeInBackup)
    #expect(a.me.includeInBackup)
    #expect(flag.excluded == false)
  }

  @Test func theSettingRoundTrips() {
    let flag = FakeBackupFlag()
    let a = app(flag)
    a.me.setIncludeInBackup(false)
    #expect(flag.excluded == true)
    #expect(!app(FakeBackupFlag()).settings.includeInBackup)
    a.me.setIncludeInBackup(true)
    #expect(flag.excluded == false)
    #expect(app(FakeBackupFlag()).settings.includeInBackup)
  }

  @Test func oldSavedSettingsWithoutTheFieldLoadAsOn() throws {
    let old = #"{"version":1,"value":{"readAloud":true,"talk":false,"speechRate":0.5,"headphonesOnly":true,"guides":{},"lengths":{},"howILikeToWork":{}}}"#
    try store.rawWrite(Settings.fileName, Data(old.utf8))
    let flag = FakeBackupFlag()
    let a = app(flag, store: store)
    #expect(a.settings.includeInBackup)
    #expect(a.settings.readAloud)
    #expect(!a.settings.ownAIOn)
    #expect(flag.excluded == false)
  }

  @Test func theFolderFollowsTheSettingAtLaunchAndWhenItChanges() {
    var saved = Settings()
    saved.includeInBackup = false
    try? store.save(saved)
    let flag = FakeBackupFlag()
    let a = app(flag)
    #expect(flag.excluded == true)
    let calls = flag.callCount
    a.me.setReadAloud(true)  // an unrelated change does not touch the folder again
    #expect(flag.callCount == calls)
    a.me.setIncludeInBackup(true)
    #expect(flag.excluded == false)
  }

  @Test func deleteEverythingGoesBackToIncluded() {
    let flag = FakeBackupFlag()
    let a = app(flag)
    a.me.setIncludeInBackup(false)
    #expect(a.eraseEverything())
    #expect(flag.excluded == false)
  }

  @Test func theRealFolderResourceValueIsSetAndCleared() throws {
    let folder = FileManager.default.temporaryDirectory.appendingPathComponent(
      "backup-\(UUID().uuidString)")
    defer { try? FileManager.default.removeItem(at: folder) }
    let flag = FolderBackupFlag(folder: folder)
    #expect(flag.setExcluded(true))
    #expect(try folder.resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup == true)
    #expect(flag.setExcluded(false))
    #expect(try folder.resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup == false)
  }

  @Test func theWelcomeAndAboutWordsMentionTheBackup() {
    #expect(Words.welcomePrivacy.contains("iPhone backup"))
    let about = Words.privacyLines.joined(separator: " ")
    #expect(about.contains("Include in my iPhone backup"))
    #expect(about.contains("iCloud"))
  }
}
