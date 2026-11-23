import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct LearnerRecordTests {
  let limits: Content.Limits
  let store: MemoryStore
  let base = Date(timeIntervalSince1970: 1_800_000_000)

  init() throws {
    limits = try loadContent().limits
    store = MemoryStore(limits: limits)
  }

  private func entry(_ kind: LearnerRecord.Kind, _ text: String, minutes: Double = 0)
    -> LearnerRecord.Entry
  {
    LearnerRecord.Entry(
      kind: kind, date: base.addingTimeInterval(minutes * 60), text: text, source: .student)
  }

  // MARK: round trip

  @Test func everyKindRoundTrips() throws {
    var record = LearnerRecord()
    for kind in LearnerRecord.Kind.allCases {
      record.add(entry(kind, "one line for \(kind.rawValue)", minutes: 1))
    }
    try store.save(record.limited(by: limits))
    let loaded = store.load(LearnerRecord.self).value
    #expect(loaded?.entries.count == LearnerRecord.Kind.allCases.count)
    for kind in LearnerRecord.Kind.allCases {
      #expect(loaded?.entries(of: kind).count == 1)
    }
  }

  @Test func deleteOneEntry() {
    var record = LearnerRecord()
    let kept = entry(.obstacle, "Phone kept buzzing")
    record.add(kept)
    record.add(entry(.obstacle, "Too many tabs"))
    record.remove(id: kept.id)
    #expect(record.entries.map(\.text) == ["Too many tabs"])
  }

  // MARK: caps

  @Test func aFortyFirstSettingDropsTheOldest() {
    var record = LearnerRecord()
    for minute in 0...LearnerRecord.settingLimit {
      record.add(entry(.setting, "setting \(minute)", minutes: Double(minute)))
    }
    let kept = record.limited(by: limits).entries(of: .setting)
    #expect(kept.count == LearnerRecord.settingLimit)
    #expect(!kept.contains { $0.text == "setting 0" })
    #expect(kept.contains { $0.text == "setting \(LearnerRecord.settingLimit)" })
  }

  @Test func capsAreKeptPerKind() {
    var record = LearnerRecord()
    for minute in 0..<(LearnerRecord.obstacleLimit + 5) {
      record.add(entry(.obstacle, "obstacle \(minute)", minutes: Double(minute)))
    }
    record.add(entry(.setting, "kept setting", minutes: 0))
    let limited = record.limited(by: limits)
    #expect(limited.entries(of: .obstacle).count == LearnerRecord.obstacleLimit)
    #expect(limited.entries(of: .setting).count == 1)
  }

  @Test func aLongLineIsCutAndBlankLinesAreDropped() {
    let long = String(repeating: "a", count: 500)
    let kept = entry(.reflection, long)
    #expect(kept.text.utf16.count == LearnerRecord.entryLength)
    var record = LearnerRecord()
    record.add(entry(.reflection, "   "))
    #expect(record.limited(by: limits).entries.isEmpty)
  }

  // MARK: old and damaged data

  @Test func anOldFileWithNoEntriesLoadsEmpty() throws {
    try store.rawWrite(LearnerRecord.fileName, Data(#"{"version":1,"value":{}}"#.utf8))
    let loaded = store.load(LearnerRecord.self)
    #expect(loaded.value?.entries.isEmpty == true)
  }

  @Test func anEntryOfAKindThisBuildDoesNotKnowIsLeftOut() throws {
    let json = """
      {"version":1,"value":{"entries":[
        {"id":"a","kind":"mood","date":"2026-11-22T10:00:00Z","text":"x","source":"app","tags":[]},
        {"id":"b","kind":"obstacle","date":"2026-11-22T10:00:00Z","text":"Phone kept buzzing","source":"student","tags":[]}
      ]}}
      """
    try store.rawWrite(LearnerRecord.fileName, Data(json.utf8))
    let loaded = store.load(LearnerRecord.self).value
    #expect(loaded?.entries.map(\.text) == ["Phone kept buzzing"])
  }

  @Test func aLoadedLongLineIsCutAndUnknownTagsDropped() throws {
    let long = String(repeating: "b", count: 10_000)
    let json = """
      {"version":1,"value":{"entries":[
        {"id":"c","kind":"obstacle","date":"2026-11-22T10:00:00Z","text":"   \(long)  ","source":"student","tags":["stuck","made-up"]}
      ]}}
      """
    try store.rawWrite(LearnerRecord.fileName, Data(json.utf8))
    let entry = try #require(store.load(LearnerRecord.self).value?.entries.first)
    #expect(entry.text.utf16.count == LearnerRecord.entryLength)
    #expect(entry.tags == [.stuck])
  }

  @Test func aDamagedFileIsSetAsideNotCrashed() throws {
    try store.rawWrite(LearnerRecord.fileName, Data("not json".utf8))
    #expect(store.load(LearnerRecord.self) == .setAside(.damaged))
  }

  // MARK: deletion

  @Test func deleteEverythingRemovesTheFile() throws {
    try store.save(LearnerRecord(entries: [entry(.obstacle, "Phone kept buzzing")]))
    #expect(store.fileNames.contains(LearnerRecord.fileName))
    let app = AppModel(
      content: try loadContent(), store: store, clock: FakeClock(), services: .none)
    #expect(app.eraseEverything())
    #expect(store.load(LearnerRecord.self) == .missing)
  }

  // MARK: never stored

  /// Words that must never describe a stored line or the record's own labels.
  private static let forbidden = [
    "attention", "focus", "mood", "effort", "diagnosis", "adhd", "name", "school", "teacher",
    "missed", "behind", "late", "overdue", "failed", "great", "awesome",
  ]

  /// Every key the saved file can hold. A later field named for a diagnosis, a name or a school
  /// would appear here and fail the test.
  @Test func theSavedFileHasOnlyTheKeysTheNoteLists() throws {
    var record = LearnerRecord()
    record.add(entry(.obstacle, "Phone kept buzzing", minutes: 1))
    try store.save(record)
    let raw = try #require(store.rawRead(LearnerRecord.fileName))
    let tree = try JSONSerialization.jsonObject(with: raw)
    var keys = Set<String>()
    func collect(_ node: Any) {
      if let object = node as? [String: Any] {
        for (key, value) in object {
          keys.insert(key)
          collect(value)
        }
      } else if let list = node as? [Any] {
        list.forEach(collect)
      }
    }
    collect(tree)
    #expect(
      keys == ["version", "value", "entries", "id", "kind", "date", "text", "source", "tags"])
  }

  @Test func theRecordsOwnWordsNeverDescribeAPerson() throws {
    let here = URL(fileURLWithPath: #filePath)
    let root = here.deletingLastPathComponent().deletingLastPathComponent()
      .deletingLastPathComponent().deletingLastPathComponent()
    let source = try String(
      contentsOf: root.appendingPathComponent(
        "FocusKit/Sources/FocusKit/Storage/LearnerRecord.swift"), encoding: .utf8)
    // Comments are skipped: they say what the record must not hold, and so name those words.
    let code = source.split(separator: "\n").filter {
      !$0.trimmingCharacters(in: .whitespaces).hasPrefix("//")
    }.joined(separator: "\n")
    let words = Set(
      code.lowercased().split(whereSeparator: { !$0.isLetter }).map(String.init))
    for word in Self.forbidden {
      #expect(!words.contains(word), "LearnerRecord.swift contains \(word)")
    }
  }
}
