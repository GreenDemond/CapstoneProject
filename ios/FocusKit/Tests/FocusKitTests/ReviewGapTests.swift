import Foundation
import Testing

@testable import FocusKit

/// Gaps found in the review of the test suite (see the review in the chat). Each test here proves one
/// behaviour that had no test before. Obviously fake keys only.
private let gapKey = "test-key-GAP"
private let gapAddress = "https://api.example.com/v1/chat/completions"

@Suite struct ReviewGapTests {
  let content: Content

  init() throws {
    content = try loadContent()
  }

  // MARK: Replies from the student's own AI service

  private func service(transport: FakeHTTPTransport, keys: FakeKeyStore) -> OpenAICompatibleModel {
    _ = keys.save(gapKey, account: KeyAccount.forService(id: "gap"))
    return OpenAICompatibleModel(
      config: OwnAIConfig(address: gapAddress, modelName: "gap-model"),
      account: KeyAccount.forService(id: "gap"), keys: keys, transport: transport)
  }

  /// The failure the student would see, or nil when the reply arrived.
  private func failure(_ model: OpenAICompatibleModel) async -> ModelFailure? {
    do {
      for try await _ in model.stream(
        instructions: "Help.", messages: [ChatMessage(role: .user, text: "hi")])
      {}
      return nil
    } catch {
      return error as? ModelFailure
    }
  }

  /// A Chat Completions reply whose total size in bytes is exactly `total`.
  private func replyBody(totalBytes total: Int) -> Data {
    let prefix = #"{"choices":[{"message":{"content":""#
    let suffix = #""}}]}"#
    let padding = total - prefix.utf8.count - suffix.utf8.count
    return Data((prefix + String(repeating: "a", count: padding) + suffix).utf8)
  }

  @Test func aRedirectAnswerIsNotFollowedAndIsOnlyAFailure() async {
    let transport = FakeHTTPTransport()
    let keys = FakeKeyStore()
    transport.enqueue(.reply(status: 302, body: Data()))
    #expect(await failure(service(transport: transport, keys: keys)) == .unavailable)
    #expect(transport.requests.count == 1)
  }

  @Test func aReplyExactlyAtTheSizeLimitIsAccepted() async {
    let transport = FakeHTTPTransport()
    let keys = FakeKeyStore()
    transport.enqueue(.reply(status: 200, body: replyBody(totalBytes: ReplyLimit.bytes)))
    #expect(await failure(service(transport: transport, keys: keys)) == nil)
  }

  @Test func aReplyOneByteOverTheSizeLimitIsRefused() async {
    let transport = FakeHTTPTransport()
    let keys = FakeKeyStore()
    transport.enqueue(.reply(status: 200, body: replyBody(totalBytes: ReplyLimit.bytes + 1)))
    #expect(await failure(service(transport: transport, keys: keys)) == .other)
  }

  // MARK: Addresses the student types

  @Test func anAddressOfExactlyTheLengthLimitIsAcceptedAndOneMoreIsRefused() {
    let prefix = "https://a.example.com/"
    let fits = prefix + String(repeating: "a", count: OwnAIConfig.addressLimit - prefix.count)
    #expect(OwnAIConfig.parse(fits) != nil)
    #expect(OwnAIConfig.parse(fits + "a") == nil)
  }

  @Test func aProtocolRelativeOrSchemeOnlyOrOneWordAddressIsRefused() {
    for text in ["//api.example.com/v1", "https:", "https://", "example"] {
      #expect(OwnAIConfig.parse(text) == nil, "\(text)")
    }
    // localhost is the one bare word the app accepts, because it is how a phone reaches a server
    // on the same network.
    #expect(OwnAIConfig.parse("localhost") != nil)
  }

  @Test func anAddressWithAnEmptyQueryOrFragmentMarkerIsRefused() {
    #expect(OwnAIConfig.parse("https://api.example.com/v1?") == nil)
    #expect(OwnAIConfig.parse("https://api.example.com/v1#") == nil)
  }

  @Test func theModelListIsNeverGuessedForACustomPath() {
    #expect(ModelLister.listAddress(for: nil) == nil)
    #expect(
      ModelLister.listAddress(for: OwnAIConfig.parse("https://api.example.com/custom/path")) == nil)
    #expect(
      ModelLister.listAddress(for: OwnAIConfig.parse(gapAddress))?.absoluteString
        == "https://api.example.com/v1/models")
  }

  @Test func aModelListKeepsOnlyPlainNames() {
    let data = Data(
      #"{"data":[{"id":"openai/gpt-4o:free"},{"id":"~anthropic/claude-3.5"},{"id":"bad name"},{"id":"<b>x</b>"},{"id":"modèle"},{"id":""},{"id":"ok"}]}"#
        .utf8)
    #expect(ModelLister.readNames(data) == ["openai/gpt-4o:free", "~anthropic/claude-3.5", "ok"])
  }

  // MARK: The safety word

  @Test func theSafetyWordArrivingOneCharacterAtATimeIsStillCaught() async {
    let model = FakeLanguageModel()
    let word = content.safety.word
    model.enqueue(.init(word.map { String($0) }))
    var all: [ChatEvent] = []
    for await event in ChatEngine(model: model, content: content).reply(
      to: [ChatMessage(role: .user, text: "I'm stuck.")],
      context: ChatContext(kindLabel: "Essay"))
    {
      all.append(event)
    }
    #expect(all == [.trustedAdult])
  }

  // MARK: Wording

  @Test func theWordingFilesHaveNoShameWords() throws {
    let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
      .deletingLastPathComponent().deletingLastPathComponent()
    let banned = ["missed", "lazy", "behind", "streak", "overdue", "wasted", "you should"]
    var hits: [String] = []
    for name in ["Words.swift", "WordsAI.swift", "WordsVoice.swift"] {
      let file = root.appendingPathComponent("Sources/FocusKit/Models/\(name)")
      let text = try String(contentsOf: file, encoding: .utf8).lowercased()
      for word in banned where text.contains(word) {
        hits.append("\(name): \(word)")
      }
    }
    #expect(hits.isEmpty, "\(hits)")
  }

  @Test func theNetworkIsOpenedOnlyInTheAllowedFiles() throws {
    let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
      .deletingLastPathComponent().deletingLastPathComponent()
    let allowed: Set<String> = [
      "WikipediaLookUp.swift", "OpenAICompatibleModel.swift", "FakeHTTPTransport.swift",
    ]
    var found = Set<String>()
    let walker = FileManager.default.enumerator(
      at: root.appendingPathComponent("Sources/FocusKit"), includingPropertiesForKeys: nil)
    while let file = walker?.nextObject() as? URL {
      guard file.pathExtension == "swift" else { continue }
      let text = try String(contentsOf: file, encoding: .utf8)
      if text.contains("URLSession") || text.contains("URLRequest") {
        found.insert(file.lastPathComponent)
      }
    }
    #expect(found == allowed, "\(found.symmetricDifference(allowed))")
  }
}
