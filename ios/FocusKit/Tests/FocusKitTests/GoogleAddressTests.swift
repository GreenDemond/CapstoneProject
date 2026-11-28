import Foundation
import Testing

@testable import FocusKit

/// The addresses, headers and request shape below come from Google's own OpenAI-compatibility
/// page (https://aistudio.google.com/docs/openai, read 2026-11-27). The key is made up.
private let googleBase = "https://generativelanguage.googleapis.com/v1beta/openai/"
private let googleChat = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
private let googleModels = "https://generativelanguage.googleapis.com/v1beta/openai/models"
private let googleKey = "test-key-GGG"
private let googleModel = "gemini-4-hydrogen"

@MainActor
@Suite struct GoogleAddressTests {
  let keys = FakeKeyStore()
  let transport = FakeHTTPTransport()

  private func chat(_ text: String) -> String? { OwnAIConfig.parse(text)?.absoluteString }

  // MARK: Addresses

  @Test func googlesBaseAddressBecomesTheDocumentedChatAddress() {
    #expect(chat(googleBase) == googleChat)
    #expect(chat("https://generativelanguage.googleapis.com/v1beta/openai") == googleChat)
    #expect(chat("generativelanguage.googleapis.com/v1beta/openai/") == googleChat)
    #expect(chat(googleChat) == googleChat)
  }

  @Test func groqAndOtherOpenAIRootsAreCompleted() {
    #expect(
      chat("https://api.groq.com/openai/v1") == "https://api.groq.com/openai/v1/chat/completions")
    #expect(
      chat("https://api.groq.com/openai") == "https://api.groq.com/openai/v1/chat/completions")
    #expect(
      chat("https://api.groq.com/openai/") == "https://api.groq.com/openai/v1/chat/completions")
    // Any path ending in a version marker is completed. This is not a claim about this provider.
    #expect(
      chat("https://open.bigmodel.cn/api/paas/v4/")
        == "https://open.bigmodel.cn/api/paas/v4/chat/completions")
  }

  @Test func aPathEndingInAVersionMarkerIsCompletedAndNothingElseIs() {
    for last in ["v2", "v10", "v1beta", "v1alpha", "v2beta3"] {
      #expect(
        chat("https://example.com/\(last)") == "https://example.com/\(last)/chat/completions",
        "\(last)")
    }
    for last in ["v", "V1", "v1.5", "v1x", "version2", "custom/path", "v1/responses", "v1/chat"] {
      #expect(chat("https://example.com/\(last)") == "https://example.com/\(last)", "\(last)")
    }
  }

  @Test func theVersionPatternIsExact() {
    for good in ["v1", "v2", "v10", "v1beta", "v1alpha", "v2beta3", "v1alpha12"] {
      #expect(OwnAIConfig.isVersionSegment(good), "\(good)")
    }
    for bad in [
      "", "v", "V1", "v1.5", "v1x", "version2", "1", "v1beta.2", "v-1", "vbeta", "v1 beta",
    ] {
      #expect(!OwnAIConfig.isVersionSegment(bad), "\(bad)")
    }
  }

  @Test func theNewRuleDoesNotTouchOpenRouterOrTheOldBaseAddresses() {
    #expect(chat("https://openrouter.ai/v2") == "https://openrouter.ai/v2/chat/completions")
    #expect(chat("https://openrouter.ai/api/v1") == "https://openrouter.ai/api/v1/chat/completions")
    #expect(chat("https://openrouter.ai") == "https://openrouter.ai/api/v1/chat/completions")
    #expect(chat("https://api.openai.com") == "https://api.openai.com/v1/chat/completions")
    #expect(chat("http://localhost:11434") == "http://localhost:11434/v1/chat/completions")
  }

  @Test func aKeyInTheAddressIsStillRefused() {
    #expect(OwnAIConfig.parse(googleBase + "?key=abc") == nil)
    #expect(
      OwnAIConfig.parse("https://generativelanguage.googleapis.com/v1beta/openai?key=abc") == nil)
  }

  @Test func theModelListAddressIsTheDocumentedOne() {
    #expect(
      ModelLister.listAddress(for: OwnAIConfig.parse(googleBase))?.absoluteString == googleModels)
  }

  // MARK: The request, as in Google's example

  private func google() -> (OwnAIService, OpenAICompatibleModel) {
    let service = OwnAIService(label: "Google", endpoint: googleBase, modelId: googleModel)
    _ = keys.save(googleKey, account: service.keyAccount)
    let model = OpenAICompatibleModel(
      config: service.config, account: service.keyAccount, keys: keys, transport: transport)
    return (service, model)
  }

  private func reply(_ model: OpenAICompatibleModel) async throws -> String {
    var text = ""
    for try await piece in model.stream(
      instructions: "You are a helpful assistant.",
      messages: [ChatMessage(role: .user, text: "Explain to me how AI works")])
    {
      text = piece
    }
    return text
  }

  private func body(_ request: URLRequest) throws -> [String: Any] {
    let data = try #require(request.httpBody)
    return try #require(try JSONSerialization.jsonObject(with: data) as? [String: Any])
  }

  @Test func theRequestMatchesGooglesOwnExample() async throws {
    let (_, model) = google()
    transport.enqueueReply("It finds patterns in data.")
    #expect(try await reply(model) == "It finds patterns in data.")
    let request = try #require(transport.requests.first)
    #expect(request.httpMethod == "POST")
    #expect(request.url?.absoluteString == googleChat)
    #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer \(googleKey)")
    #expect(request.value(forHTTPHeaderField: "Content-Type") == "application/json")
    let sent = try body(request)
    #expect(sent["model"] as? String == googleModel)
    #expect(sent["reasoning_effort"] as? String == "low")
    let messages = try #require(sent["messages"] as? [[String: String]])
    #expect(
      messages == [
        ["role": "system", "content": "You are a helpful assistant."],
        ["role": "user", "content": "Explain to me how AI works"],
      ])
    // The key is only in the Authorization header.
    #expect(request.url?.absoluteString.contains(googleKey) == false)
    #expect(!String(decoding: request.httpBody ?? Data(), as: UTF8.self).contains(googleKey))
    #expect(request.allHTTPHeaderFields?.filter { $0.value.contains(googleKey) }.count == 1)
  }

  @Test func aRefusedThinkingSettingIsRetriedOnceWithoutIt() async throws {
    let (_, model) = google()
    transport.enqueue(
      .reply(
        status: 400,
        body: Data(#"{"error":{"message":"Unknown name \"reasoning_effort\""}}"#.utf8)))
    transport.enqueueReply("Fine.")
    #expect(try await reply(model) == "Fine.")
    let requests = transport.requests
    #expect(requests.count == 2)
    #expect(try body(requests[0])["reasoning_effort"] as? String == "low")
    #expect(try body(requests[1])["reasoning_effort"] == nil)
    for request in requests {
      #expect(request.url?.absoluteString == googleChat)
      #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer \(googleKey)")
    }
  }

  // MARK: Model names

  private func list(_ ids: [String]) -> Data {
    let items = ids.map { "{\"id\":\"\($0)\"}" }.joined(separator: ",")
    return Data("{\"object\":\"list\",\"data\":[\(items)]}".utf8)
  }

  private let sample = [
    "models/gemini-4-hydrogen", "models/embedding-001", "models/", "tunedModels/x",
    "gemini-4-neon", "models/gemini-4-hydrogen",
  ]

  private func found(_ address: String) async throws -> [String] {
    transport.enqueue(.reply(status: 200, body: list(sample)))
    let outcome = await ModelLister.lookUp(
      config: OwnAIConfig(address: address, modelName: ""), typedKey: googleKey, account: nil,
      keys: keys, transport: transport)
    guard case .found(let names) = outcome else {
      Issue.record("no names for \(address)")
      return []
    }
    return names
  }

  @Test func onGoogleTheModelsPrefixIsDroppedOnceAndOnlyThere() async throws {
    let names = try await found(googleBase)
    #expect(names == ["gemini-4-hydrogen", "embedding-001", "tunedModels/x", "gemini-4-neon"])
    let request = try #require(transport.requests.first)
    #expect(request.httpMethod == "GET")
    #expect(request.url?.absoluteString == googleModels)
    #expect(request.value(forHTTPHeaderField: "Authorization") == "Bearer \(googleKey)")
    #expect(request.url?.absoluteString.contains(googleKey) == false)
  }

  @Test func otherHostsKeepEveryName() async throws {
    let expected = [
      "models/gemini-4-hydrogen", "models/embedding-001", "models/", "tunedModels/x",
      "gemini-4-neon",
    ]
    #expect(try await found("https://api.example.com/v1") == expected)
    #expect(try await found("https://evil.googleapis.com.example.org/v1") == expected)
    #expect(
      try await found("https://generativelanguage.googleapis.com.example.org/v1beta/openai")
        == expected)
  }

  @Test func aPrefixedAndAPlainNameCollapseToOne() {
    let names = ModelLister.readNames(list(["models/x", "x", "y"]), stripPrefix: "models/")
    #expect(names == ["x", "y"])
    #expect(ModelLister.readNames(list(["models/x", "x"])) == ["models/x", "x"])
  }

  @Test func anUnprefixedGoogleListIsUnchanged() async throws {
    transport.enqueue(.reply(status: 200, body: list(["gemini-4-hydrogen", "gemini-4-neon"])))
    let outcome = await ModelLister.lookUp(
      config: OwnAIConfig(address: googleBase, modelName: ""), typedKey: googleKey, account: nil,
      keys: keys, transport: transport)
    #expect(outcome == .found(["gemini-4-hydrogen", "gemini-4-neon"]))
  }
}

@Suite struct GoogleDefaultModelTests {
  private func suggest(_ address: String, _ current: String) -> String? {
    OwnAIConfig.suggestedModel(address: address, current: current)
  }

  @Test func googlesAddressFillsAnEmptyOrStartingModelBox() {
    let base = "https://generativelanguage.googleapis.com/v1beta/openai/"
    #expect(suggest(base, "") == "models/gemini-flash-lite-latest")
    #expect(suggest(base, "   ") == "models/gemini-flash-lite-latest")
    #expect(suggest(base, "openrouter/free") == "models/gemini-flash-lite-latest")
    #expect(suggest("GENERATIVELANGUAGE.googleapis.com/v1beta/openai", "") != nil)
    #expect(suggest(base + "chat/completions", "") != nil)
  }

  @Test func aNameTheStudentChoseIsNeverReplaced() {
    let base = "https://generativelanguage.googleapis.com/v1beta/openai/"
    #expect(suggest(base, "gemini-4-hydrogen") == nil)
    #expect(suggest(base, "models/other") == nil)
    #expect(suggest(base, "models/gemini-flash-lite-latest") == nil)
  }

  @Test func otherAddressesNeverChangeTheBox() {
    #expect(suggest("https://openrouter.ai/api/v1", "") == nil)
    #expect(suggest("https://api.example.com/v1", "openrouter/free") == nil)
    #expect(
      suggest("https://generativelanguage.googleapis.com.example.org/v1beta/openai", "") == nil)
    #expect(suggest("https://evil.googleapis.com/v1", "") == nil)
    #expect(suggest("not an address", "") == nil)
    #expect(suggest("", "") == nil)
  }
}
