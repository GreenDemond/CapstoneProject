import Foundation
import Testing

@testable import FocusKit

@Suite struct ThinkingLevelTests {
  let account = "service-thinking"
  let address = "https://example.invalid/v1/chat/completions"

  private func model(_ level: ThinkingLevel?, transport: FakeHTTPTransport) -> OpenAICompatibleModel
  {
    let keys = FakeKeyStore(keys: [account: "secret-key"])
    let config = OwnAIConfig(
      address: address, modelName: "model-x", thinking: level ?? ThinkingLevel.standard)
    return OpenAICompatibleModel(config: config, account: account, keys: keys, transport: transport)
  }

  private func body(_ request: URLRequest) throws -> [String: Any] {
    let data = try #require(request.httpBody)
    return try #require(try JSONSerialization.jsonObject(with: data) as? [String: Any])
  }

  @Test func theStandardLevelIsLow() {
    #expect(ThinkingLevel.standard == .low)
    #expect(OwnAIService(label: "A", endpoint: address, modelId: "m").thinking == .low)
  }

  @Test func aServiceSavedBeforeThinkingLoadsAsLow() throws {
    let old = """
      {"id":"abc","label":"Old","endpoint":"\(address)","modelId":"m"}
      """
    let service = try JSONDecoder().decode(OwnAIService.self, from: Data(old.utf8))
    #expect(service.thinking == .low)
    #expect(service.config.thinking == .low)
  }

  @Test func theChosenLevelIsSentAsReasoningEffort() async throws {
    for level in ThinkingLevel.allCases {
      let transport = FakeHTTPTransport()
      transport.enqueueReply("A short reply.")
      _ = await model(level, transport: transport).check()
      let sent = try body(try #require(transport.requests.first))
      #expect(sent["reasoning_effort"] as? String == level.rawValue)
    }
  }

  @Test func aServiceThatRefusesTheSettingIsAskedAgainWithoutIt() async throws {
    let transport = FakeHTTPTransport()
    transport.enqueue(
      .reply(
        status: 400,
        body: Data(#"{"error":"Unsupported parameter: 'reasoning_effort'"}"#.utf8)))
    transport.enqueueReply("Answer without the setting.")
    let result = await model(.low, transport: transport).check()
    #expect(result == .works)
    #expect(transport.requests.count == 2)
    let second = try body(transport.requests[1])
    #expect(second["reasoning_effort"] == nil)
  }

  @Test func aBadRequestThatIsNotAboutTheSettingIsNotRetried() async {
    let transport = FakeHTTPTransport()
    transport.enqueue(.reply(status: 400, body: Data(#"{"error":"bad model name"}"#.utf8)))
    _ = await model(.low, transport: transport).check()
    #expect(transport.requests.count == 1)
  }

  @MainActor @Test func theLevelIsStoredWithTheServiceWhenSaved() throws {
    let content = try loadContent()
    let app = AppModel(
      content: content, store: MemoryStore(limits: content.limits), clock: FakeClock(),
      services: Services(keys: FakeKeyStore(), transport: FakeHTTPTransport()))
    app.ownAI.noteDisclosureShown()
    let result = app.ownAI.save(
      id: nil, label: "Mine", endpoint: address, modelId: "m", key: "k", thinking: .high)
    guard case .saved(let id) = result else {
      Issue.record("not saved: \(result)")
      return
    }
    #expect(app.ownAI.service(id: id)?.thinking == .high)
  }
}
