import Foundation
import Testing

@testable import FocusKit

@Suite struct ContentTests {
  @Test func contentLoads() throws {
    let content = try Content.bundled()
    #expect(content.version == 1)
  }

  @Test func sixKindsEachWithStarterSteps() throws {
    let content = try Content.bundled()
    #expect(content.kinds.count == 6)
    for kind in content.kinds {
      #expect(!kind.label.isEmpty)
      #expect(!kind.starterSteps.isEmpty)
    }
  }

  @Test func fiveHints() throws {
    #expect(try Content.bundled().stuckHints.count == 5)
  }

  @Test func safetyWordAndLineAreNotEmpty() throws {
    let safety = try Content.bundled().safety
    #expect(!safety.word.isEmpty)
    #expect(!safety.line.isEmpty)
  }

  @Test func missingFileThrows() {
    let url = URL(fileURLWithPath: "/nonexistent/content.json")
    #expect(throws: ContentError.missingFile) { try Content.load(from: url) }
  }

  @Test func coachCommonRulesCarryTheNothingAndSafetyWords() throws {
    let content = try Content.bundled()
    #expect(!content.coach.common.isEmpty)
    #expect(content.coach.common.contains(content.coach.nothingWord))
    #expect(content.coach.common.contains(content.safety.word))
    #expect(content.coach.common.contains("\n"))
    for (key, move) in content.coach.moves {
      #expect(!move.rules.isEmpty, "\(key) rules")
      #expect(!move.ask.isEmpty, "\(key) ask")
      #expect(move.maxWords >= 0, "\(key) maxWords")
      #expect(!move.fallback.isEmpty, "\(key) fallback")
    }
  }

  @Test func missingKeyThrows() throws {
    let url = try temporaryFile(#"{"version": 1}"#)
    #expect(throws: ContentError.unreadable) { try Content.load(from: url) }
  }

  @Test func unknownExtraKeyIsIgnored() throws {
    let original = try Content.bundled()
    let source = try Data(contentsOf: bundledURL())
    var object = try #require(
      try JSONSerialization.jsonObject(with: source) as? [String: Any])
    object["somethingNew"] = "ignored"
    let data = try JSONSerialization.data(withJSONObject: object)
    let url = try temporaryFile(data)
    #expect(try Content.load(from: url) == original)
  }

  private func bundledURL() throws -> URL {
    try #require(
      Bundle.module.url(
        forResource: "content", withExtension: "json", subdirectory: "Shared"))
  }

  private func temporaryFile(_ text: String) throws -> URL {
    try temporaryFile(Data(text.utf8))
  }

  private func temporaryFile(_ data: Data) throws -> URL {
    let url = FileManager.default.temporaryDirectory
      .appendingPathComponent(UUID().uuidString + ".json")
    try data.write(to: url)
    return url
  }
}
