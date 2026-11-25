import Foundation
import Testing

@testable import FocusKit

/// Obviously fake. Real keys are never written anywhere.
private let keyA = "test-key-AAA"
private let keyB = "test-key-BBB"
private let addressA = "https://api.example.com/v1/chat/completions"
private let addressB = "https://other.example.org/v1/chat/completions"

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

  /// Adds a ready service and returns its id.
  @discardableResult
  private func add(
    _ a: AppModel, label: String = "Alpha", address: String = addressA, model: String = "model-a",
    key: String = keyA
  ) -> String {
    a.ownAI.noteDisclosureShown()
    guard
      case .saved(let id) = a.ownAI.save(
        id: nil, label: label, endpoint: address, modelId: model, key: key, thinking: .standard)
    else {
      Issue.record("could not add \(label)")
      return ""
    }
    return id
  }

  private func model(_ service: OwnAIService) -> OpenAICompatibleModel {
    OpenAICompatibleModel(
      config: service.config, account: service.keyAccount, keys: keys, transport: transport)
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

  private func send(_ a: AppModel, _ text: String) async {
    a.talk.draft = text
    a.talk.send()
    for _ in 0..<5000 where a.talk.isReplying { await Task.yield() }
  }

  // MARK: Earlier messages stay with the AI they were written to (D8)

  /// The user messages in one request body sent to a service.
  private func userMessages(_ request: URLRequest) -> [String] {
    guard let body = request.httpBody,
      let json = try? JSONSerialization.jsonObject(with: body) as? [String: Any],
      let messages = json["messages"] as? [[String: Any]]
    else { return [] }
    return messages.filter { $0["role"] as? String == "user" }.compactMap {
      $0["content"] as? String
    }
  }

  @Test func switchingToAServiceStartsANewChatSoPhoneMessagesAreNotSent() async throws {
    let a = app()
    await send(a, "private words typed for the phone")
    #expect(phone.calls.count == 1)
    let id = add(a)
    a.ownAI.use(id)
    transport.enqueueReply("A hint from the service.")
    await send(a, "now to the service")
    let request = try #require(transport.requests.last)
    #expect(userMessages(request) == ["now to the service"])
    #expect(a.talk.serviceNote == Words.talkNewChatForAI)
    // The earlier phone chat is kept, unchanged, in My chats.
    #expect(
      a.talk.chats.contains { $0.messages.first?.text == "private words typed for the phone" })
    #expect(a.talk.chats.first?.aiId == id)
  }

  @Test func reopeningAPhoneChatThenSendingToAServiceStartsFresh() async throws {
    let a = app()
    await send(a, "phone chat words")
    let phoneChat = try #require(a.talk.chats.first)
    #expect(phoneChat.aiId == nil)
    let id = add(a)
    a.ownAI.use(id)
    a.talk.open(phoneChat)
    transport.enqueueReply("Service hint.")
    await send(a, "a new question")
    let request = try #require(transport.requests.last)
    #expect(userMessages(request) == ["a new question"])
  }

  @Test func aChatStaysWholeWhileTheSameAIIsUsed() async throws {
    let a = app()
    let id = add(a)
    a.ownAI.use(id)
    transport.enqueueReply("First hint.")
    await send(a, "one")
    transport.enqueueReply("Second hint.")
    await send(a, "two")
    let request = try #require(transport.requests.last)
    #expect(userMessages(request) == ["one", "two"])
    #expect(a.talk.serviceNote == nil)
  }

  @Test func stepsAndChatUseTheSameChosenAI() async throws {
    let a = app()
    let id = add(a)
    a.ownAI.use(id)
    // The one setting the assignment screen and Talk both show and change.
    #expect(a.ownAI.chosenId == id)
    #expect(a.ownAI.showsPicker)
    a.ownAI.use(nil)
    #expect(a.ownAI.chosenId == nil)
  }

  @Test func olderSavedChatsWithNoAIValueLoadAsPhoneChats() throws {
    let json = #"{"id":"c1","updatedOn":0,"messages":[{"role":"user","text":"hi"}]}"#
    let chat = try JSONDecoder().decode(Chat.self, from: Data(json.utf8))
    #expect(chat.aiId == nil)
  }

  // MARK: The list: add, edit, remove, the limit

  @Test func noServicesAtFirstAndNothingIsSent() async {
    let a = app()
    #expect(a.ownAI.services.isEmpty)
    #expect(!a.ownAI.showsPicker)
    #expect(a.ownAI.chosenId == nil)
    await send(a, "hello")
    #expect(phone.calls.count == 1)
    #expect(transport.requests.isEmpty)
    #expect(a.talk.privacyLine == Words.talkPrivacy)
  }

  @Test func addingEditingAndRemovingAServiceChangesTheList() {
    let a = app()
    let id = add(a)
    #expect(a.ownAI.services.map(\.label) == ["Alpha"])
    #expect(a.ownAI.services.first?.id == id)
    #expect(UUID(uuidString: id) != nil)
    guard
      case .saved = a.ownAI.save(
        id: id, label: "Alpha two", endpoint: addressA, modelId: "model-z", key: "",
        thinking: .standard)
    else {
      Issue.record("edit failed")
      return
    }
    #expect(a.ownAI.services.count == 1)
    #expect(a.ownAI.service(id: id)?.label == "Alpha two")
    #expect(a.ownAI.service(id: id)?.modelId == "model-z")
    #expect(a.ownAI.hasKey(id))  // an empty key box keeps the saved key
    a.ownAI.askRemove(id)
    #expect(a.ownAI.confirmRemove(id))
    #expect(a.ownAI.services.isEmpty)
  }

  @Test func removeAsksOnceBeforeRemoving() {
    let a = app()
    let id = add(a)
    #expect(!a.ownAI.confirmRemove(id))  // not asked yet
    #expect(a.ownAI.services.count == 1)
    a.ownAI.askRemove(id)
    a.ownAI.cancelRemove()
    #expect(!a.ownAI.confirmRemove(id))
    #expect(a.ownAI.services.count == 1)
    a.ownAI.askRemove(id)
    #expect(a.ownAI.confirmRemove(id))
  }

  @Test func theLimitIsFiveServices() {
    let a = app()
    for n in 1...5 { add(a, label: "S\(n)", model: "m\(n)", key: "k\(n)") }
    #expect(a.ownAI.services.count == 5)
    #expect(a.ownAI.isFull)
    #expect(!a.ownAI.canAdd)
    let sixth = a.ownAI.save(
      id: nil, label: "S6", endpoint: addressA, modelId: "m", key: "k6", thinking: .standard)
    #expect(sixth == .limitReached)
    #expect(a.ownAI.services.count == 5)
    #expect(keys.accounts.count == 5)  // the sixth key was not saved either
    // An existing service can still be edited at five.
    let first = a.ownAI.services[0].id
    #expect(
      a.ownAI.save(
        id: first, label: "S1b", endpoint: addressA, modelId: "m1", key: "", thinking: .standard)
        == .saved(id: first))
    // Removing one makes room.
    a.ownAI.askRemove(first)
    #expect(a.ownAI.confirmRemove(first))
    #expect(a.ownAI.canAdd)
  }

  @Test func aLabelIsRequiredTrimmedLimitedAndNotRepeated() {
    let a = app()
    a.ownAI.noteDisclosureShown()
    for blank in ["", "   ", "\n"] {
      #expect(
        a.ownAI.save(
          id: nil, label: blank, endpoint: addressA, modelId: "m", key: "k", thinking: .standard)
          == .labelNeeded)
    }
    #expect(a.ownAI.services.isEmpty)
    guard
      case .saved(let id) = a.ownAI.save(
        id: nil, label: "  " + String(repeating: "x", count: 80) + "  ", endpoint: addressA,
        modelId: "m", key: "k", thinking: .standard)
    else {
      Issue.record("long label not saved")
      return
    }
    #expect(a.ownAI.service(id: id)?.label.count == OwnAIService.labelLimit)
    #expect(
      a.ownAI.save(
        id: nil, label: "OpenAI", endpoint: addressA, modelId: "m", key: "k", thinking: .standard)
        != .labelTaken)
    #expect(
      a.ownAI.save(
        id: nil, label: " openai ", endpoint: addressB, modelId: "m", key: "k", thinking: .standard)
        == .labelTaken)
  }

  @Test func nothingCanBeAddedBeforeTheDisclosureIsShown() {
    let a = app()
    #expect(!a.ownAI.canAdd)
    #expect(
      a.ownAI.save(
        id: nil, label: "A", endpoint: addressA, modelId: "m", key: "k", thinking: .standard)
        == .disclosureFirst)
    #expect(a.ownAI.services.isEmpty)
    #expect(keys.accounts.isEmpty)
    a.ownAI.noteDisclosureShown()
    #expect(a.ownAI.canAdd)
  }

  @Test func theDisclosureNamesWhatIsSentAndWhereTo() {
    let line = app().ownAI.disclosure
    #expect(line.contains("chat messages"))
    #expect(line.contains("step and assignment text"))
    #expect(line.contains("rules"))
    #expect(line.contains("privacy rules"))
    #expect(line.contains("nothing is sent"))
  }

  // MARK: Addresses

  @Test func httpsAndHttpAreAcceptedAndNothingElse() {
    #expect(OwnAIConfig.parse(addressA) != nil)
    #expect(OwnAIConfig.parse("  HTTPS://api.example.com/v1/chat/completions ") != nil)
    let plain = OwnAIConfig(address: "http://192.168.1.5:8080/v1/chat/completions", modelName: "m")
    #expect(plain.url?.scheme == "http")
    #expect(!plain.isEncrypted)
    #expect(OwnAIConfig(address: addressA, modelName: "m").isEncrypted)
    for bad in [
      "ftp://x.com", "", "   ", "https://", "http://", "not a url", "javascript:alert(1)",
      "https://user:pw@api.example.com/x", "http://user@host/x",
      "https://api.example.com/x?key=abc", "http://host/x#frag", "https:///path",
      "javascript:alert(1)", "file:///etc/passwd", "ws://host/x",
    ] {
      #expect(OwnAIConfig.parse(bad) == nil, "\(bad)")
    }
  }

  @Test func aProviderBaseAddressIsCompletedForOpenRouterAndOthers() {
    func chat(_ text: String) -> String? { OwnAIConfig.parse(text)?.absoluteString }
    // OpenRouter: the base address it shows, a bare host, and the full chat address all work.
    #expect(chat("https://openrouter.ai/api/v1") == "https://openrouter.ai/api/v1/chat/completions")
    #expect(chat("openrouter.ai") == "https://openrouter.ai/api/v1/chat/completions")
    #expect(chat("https://openrouter.ai/") == "https://openrouter.ai/api/v1/chat/completions")
    #expect(chat("https://openrouter.ai/api") == "https://openrouter.ai/api/v1/chat/completions")
    #expect(
      chat("https://openrouter.ai/api/v1/chat/completions")
        == "https://openrouter.ai/api/v1/chat/completions")
    // Other services.
    #expect(chat("https://api.openai.com") == "https://api.openai.com/v1/chat/completions")
    #expect(chat("https://api.openai.com/v1") == "https://api.openai.com/v1/chat/completions")
    #expect(chat("api.example.com/v1") == "https://api.example.com/v1/chat/completions")
    #expect(chat("http://localhost:11434") == "http://localhost:11434/v1/chat/completions")
    #expect(chat("100.101.102.103:8080") == "https://100.101.102.103:8080/v1/chat/completions")
    // The model list follows the completed address.
    let listed = ModelLister.listAddress(for: OwnAIConfig.parse("openrouter.ai/api/v1"))
    #expect(listed?.absoluteString == "https://openrouter.ai/api/v1/models")
  }

  @Test func aTailscaleAddressIsNotWarnedAboutInChat() {
    func config(_ text: String) -> OwnAIConfig { OwnAIConfig(address: text, modelName: "m") }
    #expect(config("http://mac.tailnet-abc.ts.net:8080/v1").isTailnet)
    #expect(config("http://ts.net/v1").isTailnet)
    #expect(config("http://100.101.102.103:11434/v1").isTailnet)
    #expect(config("http://100.64.0.1/v1").isTailnet)
    #expect(config("http://100.127.255.255/v1").isTailnet)
    // Outside the Tailscale range, or not a Tailscale name, the warning still applies.
    #expect(!config("http://100.63.0.1/v1").isTailnet)
    #expect(!config("http://100.128.0.1/v1").isTailnet)
    #expect(!config("http://192.168.1.5:8080/v1").isTailnet)
    #expect(!config("http://example.com.ts.net.evil.com/v1").isTailnet)
    #expect(config("http://192.168.1.5:8080/v1").needsUnencryptedWarning)
    #expect(config("http://100.63.0.1/v1").needsUnencryptedWarning)
    #expect(!config("http://100.101.102.103/v1").needsUnencryptedWarning)
    #expect(!config("https://api.example.com/v1").needsUnencryptedWarning)
    // The save-time tick still applies to every http address, Tailscale included.
    #expect(!config("http://100.101.102.103/v1").isEncrypted)
  }

  @Test func aBadAddressIsNotSaved() {
    let a = app()
    a.ownAI.noteDisclosureShown()
    #expect(
      a.ownAI.save(
        id: nil, label: "A", endpoint: "ftp://x.com", modelId: "m", key: keyA, thinking: .standard)
        == .addressBad)
    #expect(a.ownAI.services.isEmpty)
    #expect(keys.accounts.isEmpty)
    a.ownAI.setHttpUnderstood(true)
    let http = a.ownAI.save(
      id: nil, label: "Local", endpoint: "http://localhost:1234/v1/chat/completions",
      modelId: "m", key: keyA, thinking: .standard)
    guard case .saved = http else {
      Issue.record("http not accepted")
      return
    }
  }

  // MARK: The http tick, and the Talk line for an http service

  @Test func anHttpAddressIsRefusedUntilTheStudentTicks() {
    let a = app()
    a.ownAI.noteDisclosureShown()
    let home = "http://192.168.1.5:8080/v1/chat/completions"
    #expect(
      a.ownAI.save(
        id: nil, label: "Home", endpoint: home, modelId: "m", key: keyA, thinking: .standard)
        == .httpNotUnderstood)
    #expect(a.ownAI.services.isEmpty)
    #expect(keys.accounts.isEmpty)
    #expect(a.ownAI.line(for: .httpNotUnderstood) == Words.ownAIHttpNeedsTick)
    a.ownAI.setHttpUnderstood(true)
    guard
      case .saved(let id) = a.ownAI.save(
        id: nil, label: "Home", endpoint: home, modelId: "m", key: keyA, thinking: .standard)
    else {
      Issue.record("http not saved with the tick")
      return
    }
    #expect(a.ownAI.service(id: id)?.endpoint == home)
    #expect(a.ownAI.hasKey(id))
  }

  @Test func httpsSavesWithoutTheTick() {
    let a = app()
    add(a)
    #expect(!a.ownAI.httpUnderstood)
    #expect(a.ownAI.services.count == 1)
    #expect(!a.ownAI.needsHttpTick(addressA))
  }

  @Test func changingBackToHttpsClearsTheTickRequirement() {
    let a = app()
    a.ownAI.noteDisclosureShown()
    let home = "http://192.168.1.5:8080/v1/chat/completions"
    a.ownAI.addressTyped(home)
    a.ownAI.setHttpUnderstood(true)
    #expect(a.ownAI.httpUnderstood)
    a.ownAI.addressTyped(addressA)
    #expect(!a.ownAI.httpUnderstood)
    a.ownAI.addressTyped(home)
    #expect(
      a.ownAI.save(
        id: nil, label: "Home", endpoint: home, modelId: "m", key: keyA, thinking: .standard)
        == .httpNotUnderstood)
  }

  @Test func theTalkLineSaysNotEncryptedOnlyForAnHttpService() {
    let a = app()
    let secure = add(a, label: "Secure")
    a.ownAI.use(secure)
    #expect(a.talk.privacyLine == Words.talkPrivacyOwn(label: "Secure"))
    #expect(!a.talk.privacyLine.contains("not encrypted"))
    a.ownAI.setHttpUnderstood(true)
    let home = "http://192.168.1.5:8080/v1/chat/completions"
    guard
      case .saved(let plain) = a.ownAI.save(
        id: nil, label: "Home", endpoint: home, modelId: "m", key: keyB, thinking: .standard)
    else {
      Issue.record("http not saved")
      return
    }
    a.ownAI.use(plain)
    #expect(a.talk.privacyLine == Words.talkPrivacyOwnHttp(label: "Home"))
    #expect(a.talk.privacyLine.contains("not encrypted on the way"))
    a.ownAI.use(secure)
    #expect(a.talk.privacyLine == Words.talkPrivacyOwn(label: "Secure"))
    #expect(!Words.talkPrivacy.contains("not encrypted"))
  }

  // MARK: Keys: one per service, by id

  @Test func eachServiceHasItsOwnKeyUnderItsIdAndNeverItsLabel() {
    let a = app()
    let one = add(a, label: "OpenAI", key: keyA)
    let two = add(a, label: "Local", address: addressB, key: keyB)
    #expect(Set(keys.accounts) == ["service-" + one, "service-" + two])
    for account in keys.accounts {
      #expect(!account.contains("OpenAI") && !account.contains("Local"))
    }
    #expect(keys.read(account: "service-" + one) == keyA)
    #expect(keys.read(account: "service-" + two) == keyB)
    a.ownAI.removeKey(one)
    #expect(!a.ownAI.hasKey(one) && a.ownAI.hasKey(two))
    #expect(keys.accounts == ["service-" + two])
  }

  @Test func removingAServiceRemovesItsKeyAndOnlyIts() {
    let a = app()
    let one = add(a, label: "One", key: keyA)
    let two = add(a, label: "Two", address: addressB, key: keyB)
    a.ownAI.askRemove(one)
    #expect(a.ownAI.confirmRemove(one))
    #expect(keys.accounts == ["service-" + two])
    #expect(a.ownAI.services.map(\.id) == [two])
  }

  @Test func ifTheKeyCannotBeRemovedTheServiceStaysAndSaysSo() {
    let a = app()
    let id = add(a)
    keys.setFailing(true)
    a.ownAI.askRemove(id)
    #expect(!a.ownAI.confirmRemove(id))
    #expect(a.ownAI.services.count == 1)
    #expect(a.ownAI.note == Words.ownAIKeyCouldNotSave)
  }

  @Test func aKeyThatCannotBeSavedAddsNothing() {
    keys.setFailing(true)
    let a = app()
    a.ownAI.noteDisclosureShown()
    let result = a.ownAI.save(
      id: nil, label: "A", endpoint: addressA, modelId: "m", key: keyA, thinking: .standard)
    #expect(result == .keyCouldNotSave)
    #expect(a.ownAI.services.isEmpty)
    #expect(a.ownAI.note == Words.ownAIKeyCouldNotSave)
  }

  @Test func changingTheAddressToAnotherHostRemovesTheKeyButSameHostKeepsIt() {
    let a = app()
    let id = add(a)
    // Same host, new path: the key stays.
    _ = a.ownAI.save(
      id: id, label: "Alpha", endpoint: "https://api.example.com/other/chat/completions",
      modelId: "model-a", key: "", thinking: .standard)
    #expect(a.ownAI.hasKey(id))
    // Another host: the key given for the old address is removed, so it cannot reach the new one.
    _ = a.ownAI.save(
      id: id, label: "Alpha", endpoint: addressB, modelId: "model-a", key: "", thinking: .standard)
    #expect(!a.ownAI.hasKey(id))
    #expect(keys.accounts.isEmpty)
    #expect(a.ownAI.note == Words.ownAIKeyClearedForNewAddress)
    // Moving from https to http on the same host also counts as another address.
    _ = a.ownAI.save(
      id: id, label: "Alpha", endpoint: addressB, modelId: "model-a", key: keyB, thinking: .standard
    )
    a.ownAI.setHttpUnderstood(true)
    _ = a.ownAI.save(
      id: id, label: "Alpha", endpoint: "http://other.example.org/v1/chat/completions",
      modelId: "model-a", key: "", thinking: .standard)
    #expect(!a.ownAI.hasKey(id))
  }

  // MARK: A key is removed when the address moves to another origin

  /// A service made from build 5's settings, with build 5's key moved onto it.
  private func migrated(endpoint: String) throws -> (AppModel, String) {
    try oldSettings(on: false, chosen: false, endpoint: endpoint, model: "m")
    _ = keys.save("old-key", account: KeyAccount.legacy)
    let a = app()
    let id = try #require(a.ownAI.services.first?.id)
    #expect(a.ownAI.hasKey(id))
    a.ownAI.noteDisclosureShown()
    return (a, id)
  }

  @Test func aKeyIsDeletedWhenTheOldAddressWasBlank() throws {
    let (a, id) = try migrated(endpoint: "")
    #expect(
      a.ownAI.save(
        id: id, label: "My service", endpoint: addressA, modelId: "m", key: "", thinking: .standard)
        == .saved(id: id))
    #expect(!a.ownAI.hasKey(id))
    #expect(keys.accounts.isEmpty)
    #expect(a.ownAI.note == Words.ownAIKeyClearedForNewAddress)
  }

  @Test func aKeyIsDeletedWhenTheOldAddressDidNotParse() throws {
    let (a, id) = try migrated(endpoint: "ftp://broken.example/x")
    #expect(
      a.ownAI.save(
        id: id, label: "My service", endpoint: addressA, modelId: "m", key: "", thinking: .standard)
        == .saved(id: id))
    #expect(!a.ownAI.hasKey(id))
    #expect(keys.accounts.isEmpty)
    #expect(a.ownAI.note == Words.ownAIKeyClearedForNewAddress)
  }

  @Test func aKeyIsKeptWhenTheAddressStaysOnTheSameOrigin() {
    let a = app()
    let id = add(a, label: "Same", key: keyA)
    #expect(
      a.ownAI.save(
        id: id, label: "Same", endpoint: "https://api.example.com/v2/chat/completions",
        modelId: "model-a", key: "", thinking: .standard) == .saved(id: id))
    #expect(a.ownAI.hasKey(id))
    #expect(keys.read(account: "service-" + id) == keyA)
  }

  // MARK: The picker on Talk

  @Test func thePickerListsOnlyReadyServices() {
    let a = app()
    #expect(!a.ownAI.showsPicker)
    a.ownAI.noteDisclosureShown()
    _ = a.ownAI.save(
      id: nil, label: "NoKey", endpoint: addressA, modelId: "m", key: "", thinking: .standard)
    _ = a.ownAI.save(
      id: nil, label: "NoModel", endpoint: addressA, modelId: "  ", key: keyA, thinking: .standard)
    #expect(a.ownAI.readyServices.isEmpty && !a.ownAI.showsPicker)
    let ready = add(a, label: "Ready", address: addressB, key: keyB)
    #expect(a.ownAI.readyServices.map(\.id) == [ready])
    #expect(a.ownAI.showsPicker)
    #expect(a.ownAI.usesSegments)
    add(a, label: "Second", model: "m2", key: "k2")
    #expect(a.ownAI.usesSegments)
    add(a, label: "Third", model: "m3", key: "k3")
    #expect(a.ownAI.readyServices.count == 3 && !a.ownAI.usesSegments)
    #expect(a.ownAI.status(a.ownAI.services[0]) == Words.ownAIStatusNeedsKey)
    #expect(a.ownAI.status(a.ownAI.services[1]) == Words.ownAIStatusNeedsModel)
  }

  @Test func theChoiceIsByIdAndRememberedAfterReopening() {
    let a = app()
    let one = add(a, label: "One", key: keyA)
    let two = add(a, label: "Two", address: addressB, key: keyB)
    a.ownAI.use(two)
    #expect(a.ownAI.chosenId == two)
    #expect(a.talk.privacyLine == Words.talkPrivacyOwn(label: "Two"))
    let again = app()
    #expect(again.ownAI.chosenId == two)
    again.ownAI.use(one)
    let reopened1 = app()
    #expect(reopened1.ownAI.chosenId == one)
    again.ownAI.use(nil)
    let reopened2 = app()
    #expect(reopened2.ownAI.chosenId == nil)
    let reopened3 = app()
    #expect(reopened3.talk.privacyLine == Words.talkPrivacy)
  }

  @Test func aServiceThatIsNotReadyCannotBeChosen() {
    let a = app()
    a.ownAI.noteDisclosureShown()
    _ = a.ownAI.save(
      id: nil, label: "NoKey", endpoint: addressA, modelId: "m", key: "", thinking: .standard)
    let id = a.ownAI.services[0].id
    a.ownAI.use(id)
    #expect(a.ownAI.chosenId == nil)
    #expect(a.settings.chosenServiceId == nil)
    a.ownAI.use("not-an-id")
    #expect(a.settings.chosenServiceId == nil)
  }

  // MARK: Falling back

  @Test func removingTheChosenServiceFallsBackToThePhoneWithOneCalmLine() async {
    let a = app()
    let id = add(a)
    a.ownAI.use(id)
    #expect(a.ownAI.fellBackLine == nil)
    a.ownAI.askRemove(id)
    #expect(a.ownAI.confirmRemove(id))
    #expect(a.ownAI.chosenId == nil && a.settings.chosenServiceId == nil)
    #expect(a.ownAI.fellBackLine == Words.ownAIFellBack)
    #expect(a.talk.privacyLine == Words.talkPrivacy)
    await send(a, "hi")
    #expect(phone.calls.count == 1)
    #expect(transport.requests.isEmpty)
    a.ownAI.use(nil)
    #expect(a.ownAI.fellBackLine == nil)
  }

  @Test func losingTheKeyOfTheChosenServiceFallsBackToo() async {
    let a = app()
    let id = add(a)
    a.ownAI.use(id)
    a.ownAI.removeKey(id)
    #expect(a.ownAI.chosenId == nil)
    #expect(a.ownAI.fellBackLine == Words.ownAIFellBack)
    await send(a, "hi")
    #expect(phone.calls.count == 1)
    #expect(transport.requests.isEmpty)
  }

  @Test func aChosenServiceWhoseKeyIsMissingAtLaunchFallsBack() {
    let a = app()
    let id = add(a)
    a.ownAI.use(id)
    _ = keys.delete(account: "service-" + id)  // for example after a restore to a new phone
    let again = app()
    #expect(again.ownAI.chosenId == nil)
    #expect(again.settings.chosenServiceId == nil)
    #expect(again.ownAI.fellBackLine == Words.ownAIFellBack)
    #expect(again.talk.privacyLine == Words.talkPrivacy)
  }

  // MARK: The chat and the step coach use the chosen service, and only its key

  @Test func theChatUsesTheChosenServicesAddressModelAndKeyAndNeverAnothers() async throws {
    transport.enqueueReply("From the service.")
    let a = app()
    let one = add(a, label: "One", address: addressA, model: "model-one", key: keyA)
    let two = add(a, label: "Two", address: addressB, model: "model-two", key: keyB)
    a.ownAI.use(one)
    await send(a, "first")
    a.ownAI.use(two)
    await send(a, "second")
    #expect(phone.calls.isEmpty)
    let requests = transport.requests
    #expect(requests.count == 2)
    #expect(requests[0].url?.absoluteString == addressA)
    #expect(requests[0].value(forHTTPHeaderField: "Authorization") == "Bearer \(keyA)")
    #expect(requests[1].url?.absoluteString == addressB)
    #expect(requests[1].value(forHTTPHeaderField: "Authorization") == "Bearer \(keyB)")
    for (request, model, other) in [
      (requests[0], "model-one", keyB), (requests[1], "model-two", keyA),
    ] {
      let body = try #require(request.httpBody)
      let json = try #require(try JSONSerialization.jsonObject(with: body) as? [String: Any])
      #expect(json["model"] as? String == model)
      #expect(!String(decoding: body, as: UTF8.self).contains(other))
      #expect(request.allHTTPHeaderFields?.values.contains { $0.contains(other) } == false)
      #expect(!(request.url?.absoluteString.contains(other) ?? false))
    }
  }

  @Test func theStepCoachFollowsTheSameChoice() async throws {
    transport.enqueueReply("1. Read the question\n2. Underline the verb\n3. Write one line")
    let a = app()
    let one = add(a, label: "One", address: addressA, model: "model-one", key: keyA)
    let two = add(a, label: "Two", address: addressB, model: "model-two", key: keyB)
    a.ownAI.use(two)
    let coach = try #require(a.planner.coach)
    _ = await coach.suggest(assignment: "Read chapter 2", kindLabel: "Reading", count: 3)
    #expect(transport.requests.count == 1)
    #expect(transport.requests[0].url?.absoluteString == addressB)
    #expect(transport.requests[0].value(forHTTPHeaderField: "Authorization") == "Bearer \(keyB)")
    a.ownAI.use(one)
    _ = await coach.suggest(assignment: "Read chapter 2", kindLabel: "Reading", count: 3)
    #expect(transport.requests.last?.url?.absoluteString == addressA)
    #expect(
      transport.requests.last?.value(forHTTPHeaderField: "Authorization") == "Bearer \(keyA)")
    a.ownAI.use(nil)
    _ = await coach.suggest(assignment: "Read chapter 2", kindLabel: "Reading", count: 3)
    #expect(transport.requests.count == 2)  // the phone answered; nothing was sent
  }

  @Test func aModelBuiltForOneServiceReadsNoOtherAccount() async {
    let a = app()
    let one = add(a, label: "One", key: keyA)
    let two = add(a, label: "Two", address: addressB, key: keyB)
    _ = a.ownAI.removeKey(one)
    transport.enqueueReply("hi")
    // Service one has no key now; its model must not borrow two's.
    let lonely = model(
      a.ownAI.service(id: one) ?? OwnAIService(label: "x", endpoint: "", modelId: ""))
    #expect(await failure(lonely) == .unavailable)
    #expect(transport.requests.isEmpty)
    #expect(a.ownAI.hasKey(two))
  }

  // MARK: The request

  @Test func theRequestHasTheRightShape() async throws {
    let a = app()
    let id = add(a)
    let service = try #require(a.ownAI.service(id: id))
    transport.enqueueReply("Try the first line.")
    let reply = try await finalText(model(service), "help me")
    #expect(reply == "Try the first line.")
    let request = try #require(transport.requests.first)
    #expect(request.httpMethod == "POST")
    #expect(request.url?.absoluteString == addressA)
    #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer \(keyA)")
    #expect(request.value(forHTTPHeaderField: "Content-Type") == "application/json")
    #expect(request.timeoutInterval > 0 && request.timeoutInterval <= 60)
    let body = try #require(request.httpBody)
    let json = try #require(try JSONSerialization.jsonObject(with: body) as? [String: Any])
    #expect(json["model"] as? String == "model-a")
    #expect(json["stream"] as? Bool == false)
    let messages = try #require(json["messages"] as? [[String: String]])
    #expect(messages.first == ["role": "system", "content": "RULES"])
    #expect(messages.last == ["role": "user", "content": "help me"])
  }

  @Test func anHttpServiceIsCalledOnHttpWithItsKey() async throws {
    let a = app()
    a.ownAI.noteDisclosureShown()
    a.ownAI.setHttpUnderstood(true)
    let address = "http://192.168.1.5:8080/v1/chat/completions"
    guard
      case .saved(let id) = a.ownAI.save(
        id: nil, label: "Home", endpoint: address, modelId: "m", key: keyA, thinking: .standard)
    else {
      Issue.record("not saved")
      return
    }
    a.ownAI.use(id)
    transport.enqueueReply("ok")
    await send(a, "hi")
    #expect(transport.requests.first?.url?.absoluteString == address)
    #expect(
      transport.requests.first?.value(forHTTPHeaderField: "Authorization") == "Bearer \(keyA)")
  }

  @Test func theRulesAndHistoryGoInTheRequestThroughTheChatEngine() async throws {
    let a = app()
    let service = try #require(a.ownAI.service(id: add(a)))
    transport.enqueueReply("A question: what have you tried?")
    let engine = ChatEngine(model: model(service), content: content)
    var events: [ChatEvent] = []
    for await event in engine.reply(
      to: [ChatMessage(role: .user, text: "stuck")],
      context: ChatContext(kindLabel: "Essay"))
    {
      events.append(event)
    }
    #expect(events == [.finished("A question: what have you tried?")])
    let body = try #require(transport.requests.first?.httpBody)
    #expect(String(decoding: body, as: UTF8.self).contains(content.chat.rulesReminder.prefix(20)))
  }

  // MARK: The safety checks still apply

  @Test func aReplyWithTheSafetyWordBecomesTheTrustedAdultLineAndIsNotSaved() async {
    transport.enqueueReply(content.safety.word)
    let a = app()
    a.ownAI.use(add(a))
    await send(a, "I feel awful")
    #expect(a.talk.turns.last?.kind == .trustedAdult)
    #expect(a.talk.turns.last?.text == content.safety.line)
    #expect(a.talk.chats.isEmpty)
    #expect(!a.talk.turns.contains { $0.text == "I feel awful" })
  }

  @Test func aFinishedAnswerFromTheServiceIsCaughtByTheAnswerGuard() async throws {
    let a = app()
    let service = try #require(a.ownAI.service(id: add(a)))
    let essay = (1...12).map { "Paragraph \($0): " + String(repeating: "word ", count: 60) }
      .joined(separator: "\n\n")
    transport.enqueueReply(essay)
    let engine = ChatEngine(model: model(service), content: content)
    var events: [ChatEvent] = []
    for await event in engine.reply(
      to: [ChatMessage(role: .user, text: "write it")], context: ChatContext(kindLabel: "Essay"))
    {
      events.append(event)
    }
    #expect(events == [.answerRefused])
  }

  // MARK: Failures

  @Test func anOversizedReplyIsRefusedAndNothingIsKept() async throws {
    let a = app()
    let service = try #require(a.ownAI.service(id: add(a)))
    let big = String(repeating: "a", count: ReplyLimit.bytes)
    transport.enqueueReply(big)
    #expect(await failure(model(service)) == .other)
    transport.enqueueReply(big)
    #expect(await model(service).check() == .problem)
    transport.enqueueReply(big)
    a.ownAI.use(service.id)
    await send(a, "hi")
    #expect(!a.talk.turns.contains { $0.text.count > 1000 })
    let padded = Data(#"{"data":[{"id":"ok"}],"pad":"\#(big)"}"#.utf8)
    #expect(ModelLister.readNames(padded).isEmpty)
    transport.enqueue(.reply(status: 200, body: padded))
    await a.ownAI.lookUpModels(endpoint: addressA, key: "k", serviceId: nil)
    #expect(a.ownAI.lookupLine == Words.ownAIModelsProblem)
    #expect(a.ownAI.modelNames.isEmpty)
  }

  @Test func failuresMapToTheAppsOwnWords() async throws {
    let a = app()
    let service = try #require(a.ownAI.service(id: add(a)))
    for status in [401, 403] {
      transport.enqueue(.reply(status: status, body: Data("{}".utf8)))
      #expect(await failure(model(service)) == .keyNotAccepted)
    }
    transport.enqueue(.reply(status: 429, body: Data()))
    #expect(await failure(model(service)) == .busy)
    transport.enqueue(.reply(status: 500, body: Data()))
    #expect(await failure(model(service)) == .unavailable)
    transport.enqueue(.fails(.timedOut))
    #expect(await failure(model(service)) == .unavailable)
    transport.enqueue(.reply(status: 200, body: Data("not json".utf8)))
    #expect(await failure(model(service)) == .other)
    transport.enqueueReply("   ")
    #expect(await failure(model(service)) == .other)
    transport.enqueue(.reply(status: 200, body: Data(#"{"choices":[]}"#.utf8)))
    #expect(await failure(model(service)) == .other)
  }

  @Test func theChatShowsCalmLinesAndKeepsTheMessageForNextTime() async {
    transport.enqueue(.reply(status: 401, body: Data()))
    let a = app()
    a.ownAI.use(add(a))
    await send(a, "help")
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

  @Test func theStepCoachFallsBackToStarterStepsWhenTheServiceFails() async throws {
    transport.enqueue(.reply(status: 500, body: Data()))
    let a = app()
    a.ownAI.use(add(a))
    let coach = try #require(a.planner.coach)
    let result = await coach.suggest(assignment: "Read chapter 2", kindLabel: "Reading", count: 3)
    if case .fallback = result {} else { Issue.record("expected a fallback, got \(result)") }
  }

  // MARK: Check connection, per service

  @Test func checkConnectionUsesEachServicesOwnAddressAndKey() async throws {
    let a = app()
    let one = add(a, label: "One", address: addressA, key: keyA)
    let two = add(a, label: "Two", address: addressB, key: keyB)
    transport.enqueueReply("OK")
    await a.ownAI.checkConnection(two)
    #expect(a.ownAI.checkLine(two) == Words.ownAICheckWorks)
    #expect(a.ownAI.checkLine(one) == nil)
    #expect(transport.requests.count == 1)
    #expect(transport.requests[0].url?.absoluteString == addressB)
    #expect(transport.requests[0].value(forHTTPHeaderField: "Authorization") == "Bearer \(keyB)")
    let body = String(decoding: try #require(transport.requests[0].httpBody), as: UTF8.self)
    #expect(body.contains(OpenAICompatibleModel.checkMessage))

    transport.enqueue(.reply(status: 401, body: Data()))
    await a.ownAI.checkConnection(one)
    #expect(a.ownAI.checkLine(one) == Words.ownAIKeyNotAccepted)
    #expect(a.ownAI.checkLine(two) == Words.ownAICheckWorks)
    transport.enqueue(.reply(status: 429, body: Data()))
    await a.ownAI.checkConnection(one)
    #expect(a.ownAI.checkLine(one) == Words.ownAIBusy)
    transport.enqueue(.fails(.timedOut))
    await a.ownAI.checkConnection(one)
    #expect(a.ownAI.checkLine(one) == Words.ownAICheckProblem)
  }

  @Test func checkConnectionIsNotPossibleUntilTheServiceIsReady() async {
    let a = app()
    a.ownAI.noteDisclosureShown()
    _ = a.ownAI.save(
      id: nil, label: "NoKey", endpoint: addressA, modelId: "m", key: "", thinking: .standard)
    let id = a.ownAI.services[0].id
    #expect(!a.ownAI.canCheck(id))
    await a.ownAI.checkConnection(id)
    #expect(transport.requests.isEmpty)
    #expect(a.ownAI.checkLine(id) == nil)
  }

  // MARK: Look up models (optional)

  @Test func theModelListAddressFollowsTheChatAddressAndIsNeverGuessed() {
    func list(_ text: String) -> String? {
      ModelLister.listAddress(for: OwnAIConfig.parse(text))?.absoluteString
    }
    #expect(list(addressA) == "https://api.example.com/v1/models")
    #expect(
      list("https://openrouter.ai/api/v1/chat/completions") == "https://openrouter.ai/api/v1/models"
    )
    #expect(
      list("http://192.168.1.5:8080/v1/chat/completions") == "http://192.168.1.5:8080/v1/models")
    #expect(list("https://api.example.com/v1/responses") == nil)
    #expect(list("https://api.example.com/") == "https://api.example.com/v1/models")
    #expect(list("not a url") == nil)
  }

  @Test func lookingUpModelsAsksTheSameHostWithThatServicesKey() async throws {
    let a = app()
    let one = add(a, label: "One", address: addressA, key: keyA)
    _ = add(a, label: "Two", address: addressB, key: keyB)
    transport.enqueue(
      .reply(
        status: 200,
        body: Data(
          #"{"object":"list","data":[{"id":"gpt-small"},{"id":"gpt-small"},{"id":"bad name!"},{"id":"vendor/model:1~x"},{"id":""},{"x":1}]}"#
            .utf8)))
    await a.ownAI.lookUpModels(endpoint: addressA, key: "", serviceId: one)
    #expect(a.ownAI.modelNames == ["gpt-small", "vendor/model:1~x"])
    #expect(a.ownAI.lookupLine == Words.ownAIModelsFound(2))
    let request = try #require(transport.requests.first)
    #expect(request.httpMethod == "GET")
    #expect(request.url?.absoluteString == "https://api.example.com/v1/models")
    #expect(request.url?.host == URL(string: addressA)?.host)
    #expect(request.httpBody == nil)
    #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer \(keyA)")
    #expect(request.allHTTPHeaderFields?.values.contains { $0.contains(keyB) } == false)
  }

  @Test func aSavedKeyIsNeverSentToANewHostTypedInTheEditor() async throws {
    let a = app()
    let one = add(a, label: "One", address: addressA, key: keyA)
    transport.enqueue(.reply(status: 200, body: Data(#"{"data":[{"id":"m"}]}"#.utf8)))
    // The student is editing One and has typed another host, with no new key.
    await a.ownAI.lookUpModels(endpoint: addressB, key: "", serviceId: one)
    let request = try #require(transport.requests.first)
    #expect(request.url?.host == "other.example.org")
    #expect(request.value(forHTTPHeaderField: "Authorization") == nil)
    // Same host, other path: the saved key may be used.
    await a.ownAI.lookUpModels(
      endpoint: "https://api.example.com/v2/chat/completions", key: "", serviceId: one)
    #expect(transport.requests.last?.value(forHTTPHeaderField: "Authorization") == "Bearer \(keyA)")
    // http on the same host counts as another address.
    await a.ownAI.lookUpModels(
      endpoint: "http://api.example.com/v1/chat/completions", key: "", serviceId: one)
    #expect(transport.requests.last?.value(forHTTPHeaderField: "Authorization") == nil)
  }

  @Test func ifTheListCannotBeSavedTheOldKeyIsNotMoved() throws {
    try oldSettings(on: true, chosen: true, endpoint: addressA, model: "m")
    _ = keys.save("old-key", account: KeyAccount.legacy)
    let failing = FailingSaveStore(inner: store)
    let first = app(store: failing)
    #expect(first.ownAI.services.count == 1)  // shown from the old fields
    #expect(keys.accounts == [KeyAccount.legacy])  // the key did not move to an unsaved id
    let second = app()  // now saving works
    let service = try #require(second.ownAI.services.first)
    #expect(second.ownAI.hasKey(service.id))
    #expect(!keys.hasKey(account: KeyAccount.legacy))
    #expect(second.ownAI.chosenId == service.id)
  }

  @Test func aKeyJustTypedIsUsedForTheListAndNothingIsSaved() async throws {
    let a = app()
    a.ownAI.noteDisclosureShown()
    transport.enqueue(
      .reply(status: 200, body: Data(#"{"data":[{"id":"m1"}]}"#.utf8)))
    await a.ownAI.lookUpModels(endpoint: addressA, key: " typed-key ", serviceId: nil)
    #expect(
      transport.requests.first?.value(forHTTPHeaderField: "Authorization") == "Bearer typed-key")
    #expect(keys.accounts.isEmpty)
    #expect(a.ownAI.services.isEmpty)
    #expect(a.ownAI.modelNames == ["m1"])
    // No key at all is allowed: some lists are public.
    transport.enqueue(.reply(status: 200, body: Data(#"{"data":[{"id":"m2"}]}"#.utf8)))
    await a.ownAI.lookUpModels(endpoint: addressA, key: "", serviceId: nil)
    #expect(transport.requests.last?.value(forHTTPHeaderField: "Authorization") == nil)
  }

  @Test func aListThatCannotBeLoadedSaysSoCalmlyAndTypingStillWorks() async {
    let a = app()
    transport.enqueue(.reply(status: 401, body: Data()))
    await a.ownAI.lookUpModels(endpoint: addressA, key: "k", serviceId: nil)
    #expect(a.ownAI.lookupLine == Words.ownAIKeyNotAccepted)
    transport.enqueue(.reply(status: 429, body: Data()))
    await a.ownAI.lookUpModels(endpoint: addressA, key: "k", serviceId: nil)
    #expect(a.ownAI.lookupLine == Words.ownAIBusy)
    transport.enqueue(.fails(.timedOut))
    await a.ownAI.lookUpModels(endpoint: addressA, key: "k", serviceId: nil)
    #expect(a.ownAI.lookupLine == Words.ownAIModelsProblem)
    transport.enqueue(.reply(status: 200, body: Data("not json".utf8)))
    await a.ownAI.lookUpModels(endpoint: addressA, key: "k", serviceId: nil)
    #expect(a.ownAI.lookupLine == Words.ownAIModelsProblem)
    let before = transport.requests.count
    await a.ownAI.lookUpModels(
      endpoint: "https://api.example.com/v1/other", key: "k", serviceId: nil)
    #expect(a.ownAI.lookupLine == Words.ownAIModelsNoAddress)
    await a.ownAI.lookUpModels(endpoint: "nonsense", key: "k", serviceId: nil)
    #expect(a.ownAI.lookupLine == Words.ownAIModelsNoAddress)
    #expect(transport.requests.count == before)  // nothing was sent for an unknown address
    #expect(a.ownAI.modelNames.isEmpty)
    // A name typed by hand still saves.
    a.ownAI.noteDisclosureShown()
    guard
      case .saved = a.ownAI.save(
        id: nil, label: "Typed", endpoint: addressA, modelId: "my-own-name", key: "k",
        thinking: .standard)
    else {
      Issue.record("typed name not saved")
      return
    }
    #expect(a.ownAI.services.first?.modelId == "my-own-name")
  }

  @Test func theListIsCappedAndOnlyKeepsPlainNames() {
    let many = (1...1500).map { #"{"id":"model-\#($0)"}"# }.joined(separator: ",")
    let names = ModelLister.readNames(Data(#"{"data":[\#(many)]}"#.utf8))
    #expect(names.count == ModelLister.most)
    let long = String(repeating: "a", count: 101)
    #expect(
      ModelLister.readNames(Data(#"{"data":[{"id":"\#(long)"},{"id":"ok"}]}"#.utf8)) == ["ok"])
  }

  // MARK: Build 5 settings become the first service

  private func oldSettings(on: Bool, chosen: Bool, endpoint: String, model: String) throws {
    let json =
      #"{"version":1,"value":{"readAloud":false,"talk":false,"speechRate":0.5,"headphonesOnly":true,"guides":{},"lengths":{},"howILikeToWork":{},"includeInBackup":true,"ownAIOn":\#(on),"ownAIEndpoint":"\#(endpoint)","ownAIModelId":"\#(model)","ownAIChosen":\#(chosen)}}"#
    try store.rawWrite(Settings.fileName, Data(json.utf8))
  }

  @Test func buildFiveSettingsAndKeyBecomeTheFirstServiceWithNothingLost() async throws {
    try oldSettings(on: true, chosen: true, endpoint: addressA, model: "old-model")
    #expect(keys.save("old-key", account: KeyAccount.legacy))
    transport.enqueueReply("From the migrated service.")
    let a = app()
    let service = try #require(a.ownAI.services.first)
    #expect(a.ownAI.services.count == 1)
    #expect(service.label == "My service")
    #expect(service.endpoint == addressA && service.modelId == "old-model")
    #expect(a.ownAI.chosenId == service.id)
    #expect(a.ownAI.hasKey(service.id))
    #expect(keys.accounts == ["service-" + service.id])  // moved, not copied
    #expect(!keys.hasKey(account: KeyAccount.legacy))
    // The list is saved in the new shape, without the old fields, and without the key.
    let saved = String(decoding: store.rawRead(Settings.fileName) ?? Data(), as: UTF8.self)
    #expect(saved.contains("ownAIServices") && saved.contains(service.id))
    #expect(!saved.contains("ownAIEndpoint") && !saved.contains("ownAIChosen"))
    #expect(!saved.contains("old-key"))
    // It still works, with the old key, and the next launch sees the same service.
    await send(a, "hi")
    #expect(
      transport.requests.first?.value(forHTTPHeaderField: "Authorization") == "Bearer old-key")
    let again = app()
    #expect(again.ownAI.services == [service])
    #expect(again.ownAI.chosenId == service.id)
  }

  @Test func buildFiveWithTheServiceOffBecomesAnUnchosenService() throws {
    try oldSettings(on: false, chosen: false, endpoint: addressA, model: "m")
    _ = keys.save("old-key", account: KeyAccount.legacy)
    let a = app()
    #expect(a.ownAI.services.count == 1)
    #expect(a.ownAI.chosenId == nil)
    #expect(a.ownAI.readyServices.count == 1)
    #expect(a.talk.privacyLine == Words.talkPrivacy)
  }

  @Test func buildFiveWithNothingSetLoadsAsAnEmptyList() throws {
    try oldSettings(on: false, chosen: false, endpoint: "", model: "")
    let a = app()
    #expect(a.ownAI.services.isEmpty)
    #expect(a.settings.chosenServiceId == nil)
    // Settings with no own-service fields at all (older still) load the same way.
    let older = #"{"version":1,"value":{"readAloud":true}}"#
    try store.rawWrite(Settings.fileName, Data(older.utf8))
    let reopened4 = app()
    #expect(reopened4.ownAI.services.isEmpty)
  }

  @Test func buildFiveWithAKeyButNoAddressKeepsTheKeyInABlankService() throws {
    try oldSettings(on: false, chosen: false, endpoint: "", model: "")
    _ = keys.save("old-key", account: KeyAccount.legacy)
    let a = app()
    let service = try #require(a.ownAI.services.first)
    #expect(service.label == "My service" && service.endpoint.isEmpty)
    #expect(a.ownAI.hasKey(service.id))
    #expect(!keys.hasKey(account: KeyAccount.legacy))
  }

  @Test func ifTheKeyCannotBeMovedTheOldKeyStaysAndIsMovedNextLaunch() throws {
    try oldSettings(on: true, chosen: true, endpoint: addressA, model: "m")
    _ = keys.save("old-key", account: KeyAccount.legacy)
    keys.setFailing(true)
    let first = app()
    #expect(first.ownAI.services.count == 1)
    #expect(keys.hasKey(account: KeyAccount.legacy))  // nothing lost
    #expect(first.ownAI.chosenId == nil)
    keys.setFailing(false)
    let second = app()
    #expect(second.ownAI.services.count == 1)  // not a second copy
    let service = try #require(second.ownAI.services.first)
    #expect(second.ownAI.hasKey(service.id))
    #expect(!keys.hasKey(account: KeyAccount.legacy))
  }

  @Test func aDamagedServiceEntryIsDroppedWithoutACrash() throws {
    let json =
      #"{"version":1,"value":{"ownAIServices":[{"id":"a","label":"Good","endpoint":"https://x.com/v1/chat/completions","modelId":"m"},{"id":5},"junk",{"id":"b","label":"  ","endpoint":"","modelId":""},{"id":"a","label":"Again","endpoint":"","modelId":""}],"chosenServiceId":"missing"}}"#
    try store.rawWrite(Settings.fileName, Data(json.utf8))
    let a = app()
    #expect(a.ownAI.services.map(\.label) == ["Good"])
    #expect(a.settings.chosenServiceId == nil)
    let many = (1...8).map {
      #"{"id":"i\#($0)","label":"L\#($0)","endpoint":"","modelId":""}"#
    }.joined(separator: ",")
    try store.rawWrite(
      Settings.fileName, Data(#"{"version":1,"value":{"ownAIServices":[\#(many)]}}"#.utf8))
    let reopened5 = app()
    #expect(reopened5.ownAI.services.count == OwnAIService.maxServices)
  }

  // MARK: Keys never leak

  @Test func keysAreInNoSavedFileNoMessageAndNoErrorLine() async {
    transport.enqueue(.reply(status: 401, body: Data("secret \(keyA)".utf8)))
    let a = app()
    let one = add(a, label: "One", key: keyA)
    add(a, label: "Two", address: addressB, key: keyB)
    a.ownAI.use(one)
    await send(a, "hi")
    await a.ownAI.checkConnection(one)
    a.me.setGuide("be kind")
    a.finishWelcome()
    for name in store.fileNames {
      let text = String(decoding: store.rawRead(name) ?? Data(), as: UTF8.self)
      #expect(!text.contains(keyA) && !text.contains(keyB), "\(name)")
    }
    var lines = [
      a.ownAI.disclosure, a.ownAI.note ?? "", a.talk.serviceNote ?? "",
      a.talk.unavailableLine ?? "", a.ownAI.fellBackLine ?? "", a.talk.privacyLine,
      a.ownAI.lookupLine ?? "", Words.privacyLines.joined(),
    ]
    for service in a.ownAI.services {
      lines += [a.ownAI.status(service), a.ownAI.checkLine(service.id) ?? ""]
    }
    for line in lines { #expect(!line.contains(keyA) && !line.contains(keyB)) }
  }

  @Test func keysAreNeverInASavedFileOnDisk() throws {
    let folder = FileManager.default.temporaryDirectory.appendingPathComponent(
      "ownai-\(UUID().uuidString)")
    defer { try? FileManager.default.removeItem(at: folder) }
    let real = FileStore(folder: folder, limits: content.limits)
    let a = app(store: real)
    add(a)
    add(a, label: "Two", address: addressB, key: keyB)
    a.finishWelcome()
    let names = try FileManager.default.contentsOfDirectory(atPath: folder.path)
    #expect(names.contains("settings.json"))
    for name in names {
      let text = try String(contentsOf: folder.appendingPathComponent(name), encoding: .utf8)
      #expect(!text.contains(keyA) && !text.contains(keyB), "\(name)")
    }
  }

  @Test func theSettingsKeepTheLabelAddressAndModelButNotTheKey() throws {
    let a = app()
    let id = add(a)
    let saved = try #require(store.load(Settings.self).value)
    #expect(
      saved.ownAIServices == [
        OwnAIService(id: id, label: "Alpha", endpoint: addressA, modelId: "model-a")
      ])
    let encoded = String(decoding: try JSONEncoder().encode(saved), as: UTF8.self)
    #expect(!encoded.contains(keyA))
  }

  // MARK: Delete everything

  @Test func deleteEverythingRemovesEveryKeyAndReturnsToThePhone() async {
    let a = app()
    let one = add(a, label: "One", key: keyA)
    add(a, label: "Two", address: addressB, key: keyB)
    _ = keys.save("left-behind", account: KeyAccount.legacy)  // even an old key goes
    a.ownAI.use(one)
    #expect(keys.accounts.count == 3)
    #expect(a.eraseEverything())
    #expect(keys.accounts.isEmpty)
    #expect(a.ownAI.services.isEmpty && a.ownAI.chosenId == nil)
    #expect(a.settings == Settings())
    #expect(store.fileNames.isEmpty)
    await send(a, "hi")
    #expect(phone.calls.count == 1)
    #expect(transport.requests.isEmpty)
  }

  @Test func deleteEverythingChangesNothingIfAKeyCannotBeRemoved() {
    let a = app()
    add(a)
    a.finishWelcome()
    keys.setFailing(true)
    #expect(!a.eraseEverything())
    #expect(a.welcomed)
    #expect(!keys.accounts.isEmpty)
    #expect(a.ownAI.services.count == 1)
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

  @Test func keysAreReadOnlyInsideTheStoreAndTheNetworkFileAndOnlyTheKeychainFileImportsSecurity()
    throws
  {
    let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
      .deletingLastPathComponent().deletingLastPathComponent()
    let walker = FileManager.default.enumerator(
      at: root.appendingPathComponent("Sources"), includingPropertiesForKeys: nil)
    var hits: [String] = []
    while let file = walker?.nextObject() as? URL {
      guard file.pathExtension == "swift" else { continue }
      let text = try String(contentsOf: file, encoding: .utf8)
      if text.contains(".read(account") { hits.append(file.lastPathComponent) }
      if text.contains("import Security") { hits.append("SECURITY:" + file.lastPathComponent) }
    }
    // FakeKeyStore and the protocol declare `read(account:)` without a leading dot.
    #expect(
      Set(hits) == [
        "OpenAICompatibleModel.swift", "OwnAIModel.swift", "SECURITY:KeychainKeyStore.swift",
      ])
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
    let old =
      #"{"version":1,"value":{"readAloud":true,"talk":false,"speechRate":0.5,"headphonesOnly":true,"guides":{},"lengths":{},"howILikeToWork":{}}}"#
    try store.rawWrite(Settings.fileName, Data(old.utf8))
    let flag = FakeBackupFlag()
    let a = app(flag, store: store)
    #expect(a.settings.includeInBackup)
    #expect(a.settings.readAloud)
    #expect(a.settings.ownAIServices.isEmpty)
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
    // Read through a new URL each time: a URL object can keep the value it read first.
    func reread() throws -> URLResourceValues {
      try URL(fileURLWithPath: folder.path).resourceValues(forKeys: [.isExcludedFromBackupKey])
    }
    #expect(flag.setExcluded(true))
    #expect(try reread().isExcludedFromBackup == true)
    #expect(flag.setExcluded(false))
    // The system applies a cleared flag a moment later: read-back is briefly stale (measured on
    // this Mac: about 1 in 30 reads right after clearing, none after a second). So poll, briefly.
    // The check itself is unchanged: in the end the folder must not be excluded.
    var cleared = try reread().isExcludedFromBackup
    for _ in 0..<40 where cleared == true {
      Thread.sleep(forTimeInterval: 0.05)
      cleared = try reread().isExcludedFromBackup
    }
    #expect(cleared != true, "after clearing the flag read \(String(describing: cleared))")
  }

  @Test func theWelcomeAndAboutWordsMentionTheBackup() {
    #expect(Words.welcomePrivacy.contains("your own backup"))
    let about = Words.privacyLines.joined(separator: " ")
    #expect(about.contains("Include in my backup"))
    #expect(about.contains("iCloud"))
  }
}

/// A store that reads from another but cannot write, to test a failed first save.
private final class FailingSaveStore: Store, @unchecked Sendable {
  private let inner: any Store
  init(inner: any Store) { self.inner = inner }
  var limits: Content.Limits { inner.limits }
  func rawRead(_ name: String) -> Data? { inner.rawRead(name) }
  func rawWrite(_ name: String, _ data: Data) throws { throw CocoaError(.fileWriteUnknown) }
  func rawMoveAside(_ name: String, reason: SetAsideReason) -> Bool { false }
  func rawRemoveAll() throws { try inner.rawRemoveAll() }
}
