import Foundation
import Testing

@testable import FocusKit

@Suite struct StorageTests {
  let limits: Content.Limits
  let date = Date(timeIntervalSince1970: 1_800_000_000)

  init() throws {
    limits = try loadContent().limits
  }

  private func folder() -> URL {
    FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
  }

  private func names(in folder: URL) -> [String] {
    ((try? FileManager.default.contentsOfDirectory(atPath: folder.path)) ?? []).sorted()
  }

  private var samples: SampleValues {
    SampleValues(date: date)
  }

  // MARK: round trips

  @Test func everyTypeRoundTripsThroughAFileStore() throws {
    let store = FileStore(folder: folder(), limits: limits)
    try roundTrip(samples.work, store)
    try roundTrip(samples.profile, store)
    try roundTrip(samples.settings, store)
    try roundTrip(samples.chats, store)
    try roundTrip(samples.parked, store)
    try roundTrip(samples.recall, store)
  }

  @Test func everyTypeRoundTripsThroughAMemoryStore() throws {
    let store = MemoryStore(limits: limits)
    try roundTrip(samples.work, store)
    try roundTrip(samples.profile, store)
    try roundTrip(samples.settings, store)
    try roundTrip(samples.chats, store)
    try roundTrip(samples.parked, store)
    try roundTrip(samples.recall, store)
  }

  private func roundTrip<Value: Storable>(_ value: Value, _ store: some Store) throws {
    #expect(store.load(Value.self) == .missing)
    try store.save(value)
    #expect(store.load(Value.self) == .found(value), "\(Value.fileName)")
  }

  @Test func eachTypeHasItsOwnFile() throws {
    let store = MemoryStore(limits: limits)
    try store.save(samples.work)
    try store.save(samples.chats)
    #expect(store.fileNames == ["chats.json", "work.json"])
  }

  @Test func theFileSaysItsVersion() throws {
    let store = MemoryStore(limits: limits)
    try store.save(samples.work)
    let text = String(decoding: try #require(store.rawRead("work.json")), as: UTF8.self)
    #expect(text.contains("\"version\":1"))
  }

  // MARK: damaged and newer data

  @Test func missingFileIsMissing() {
    #expect(FileStore(folder: folder(), limits: limits).load(Profile.self) == .missing)
  }

  @Test func notJSONIsMovedAsideOnceAndTheAppStartsFresh() throws {
    let directory = folder()
    let store = FileStore(folder: directory, limits: limits)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    let junk = Data("not json at all".utf8)
    try junk.write(to: directory.appendingPathComponent("work.json"))

    #expect(store.load(SavedWork.self) == .setAside(.damaged))
    #expect(names(in: directory) == ["work.damaged.json"])
    #expect(store.load(SavedWork.self) == .missing)  // not moved again
    #expect(names(in: directory) == ["work.damaged.json"])

    try store.save(samples.work)  // later saves work
    #expect(store.load(SavedWork.self) == .found(samples.work))
    #expect(try Data(contentsOf: directory.appendingPathComponent("work.damaged.json")) == junk)
  }

  @Test func validJSONOfTheWrongShapeIsDamaged() {
    let store = MemoryStore(limits: limits)
    store.plant("work.json", Data(#"{"version":1,"value":{"steps":"no"}}"#.utf8))
    #expect(store.load(SavedWork.self) == .setAside(.damaged))
    store.plant("profile.json", Data(#"[1,2,3]"#.utf8))
    #expect(store.load(Profile.self) == .setAside(.damaged))
    store.plant("settings.json", Data(#"{"version":0,"value":{}}"#.utf8))
    #expect(store.load(Settings.self) == .setAside(.damaged))
  }

  @Test func aSecondDamagedFileDoesNotOverwriteTheFirstBackup() {
    let store = MemoryStore(limits: limits)
    store.plant("work.json", Data("one".utf8))
    _ = store.load(SavedWork.self)
    store.plant("work.json", Data("two".utf8))
    _ = store.load(SavedWork.self)
    #expect(store.rawRead("work.damaged.json") == Data("one".utf8))
    #expect(store.rawRead("work.damaged.2.json") == Data("two".utf8))
  }

  @Test func dataFromANewerVersionIsBackedUpAndNeverOverwritten() throws {
    let store = MemoryStore(limits: limits)
    let newer = Data(#"{"version":2,"value":{"future":true}}"#.utf8)
    store.plant("work.json", newer)

    #expect(store.load(SavedWork.self) == .setAside(.newerVersion))
    #expect(store.rawRead("work.json") == nil)
    #expect(store.rawRead("work.newer-version.json") == newer)

    try store.save(samples.work)
    #expect(store.rawRead("work.newer-version.json") == newer)
    #expect(store.load(SavedWork.self) == .found(samples.work))
  }

  @Test func damagedChatsNeverStopStepsFromLoadingOrSaving() throws {
    let store = MemoryStore(limits: limits)
    store.plant("chats.json", Data("garbage".utf8))
    try store.save(samples.work)
    #expect(store.load(SavedChats.self) == .setAside(.damaged))
    #expect(store.load(SavedWork.self) == .found(samples.work))
  }

  // MARK: failed writes

  @Test func aFailedWriteThrowsAndKeepsWhatWasSaved() throws {
    let store = MemoryStore(limits: limits)
    try store.save(samples.work)
    store.failWrites = true
    #expect(throws: StoreError.writeFailed) { try store.save(SavedWork(work: Work(texts: ["x"]))) }
    #expect(throws: StoreError.writeFailed) { try store.deleteAll() }
    store.failWrites = false
    #expect(store.load(SavedWork.self) == .found(samples.work))
  }

  @Test func aFileStoreThatCannotWriteThrowsInsteadOfCrashing() throws {
    let blocker = folder()
    try Data("a file, not a folder".utf8).write(to: blocker)
    let store = FileStore(folder: blocker, limits: limits)
    #expect(throws: StoreError.writeFailed) { try store.save(samples.work) }
    #expect(store.load(SavedWork.self) == .missing)
  }

  @Test func twoSavesInQuickSuccessionLeaveOneWholeFile() throws {
    let store = FileStore(folder: folder(), limits: limits)
    let first = SavedWork(work: Work(texts: ["first"]))
    let second = SavedWork(work: Work(texts: ["second", "two"]))
    DispatchQueue.concurrentPerform(iterations: 40) { index in
      try? store.save(index.isMultiple(of: 2) ? first : second)
    }
    let loaded = try #require(store.load(SavedWork.self).value)
    #expect(loaded == first || loaded == second)
  }

  // MARK: limits

  @Test func aStepLongerThanTheLimitIsCut() throws {
    let store = MemoryStore(limits: limits)
    let long = String(repeating: "a", count: limits.savedStepLength + 50)
    try store.save(SavedWork(work: Work(texts: [long, "short"])))
    let loaded = try #require(store.load(SavedWork.self).value)
    #expect(loaded.work.steps[0].text.count == limits.savedStepLength)
    #expect(loaded.work.steps[1].text == "short")
  }

  @Test func moreStepsThanTheLimitAreCutAndBadStepsDropped() throws {
    let store = MemoryStore(limits: limits)
    var steps = (0..<(limits.savedSteps + 10)).map { Step(id: $0, text: "s\($0)") }
    steps[3].text = "   "
    steps[5].id = 4  // repeated number
    steps[6].id = -2
    try store.save(SavedWork(work: Work(steps: steps, nextId: 0)))
    let loaded = try #require(store.load(SavedWork.self).value)
    #expect(loaded.work.steps.count <= limits.savedSteps - 3)
    #expect(Set(loaded.work.steps.map(\.id)).count == loaded.work.steps.count)
    let highest = try #require(loaded.work.steps.map(\.id).max())
    #expect(loaded.work.nextId > highest)
  }

  @Test func elevenChatsKeepTenNewest() throws {
    let store = MemoryStore(limits: limits)
    let chats = (0..<11).map {
      Chat(id: "c\($0)", updatedOn: date, messages: [ChatMessage(role: .user, text: "m\($0)")])
    }
    try store.save(SavedChats(chats: chats))
    let loaded = try #require(store.load(SavedChats.self).value)
    #expect(loaded.chats.count == limits.chats)
    #expect(loaded.chats.first?.id == "c0")
    #expect(loaded.chats.last?.id == "c9")
  }

  @Test func aVeryLongChatKeepsTheNewestMessages() throws {
    let store = MemoryStore(limits: limits)
    let text = String(repeating: "w", count: 1000)
    let messages = (0..<60).map {
      ChatMessage(role: $0.isMultiple(of: 2) ? .user : .assistant, text: text + "\($0)")
    }
    try store.save(SavedChats(chats: [Chat(updatedOn: date, messages: messages)]))
    let loaded = try #require(store.load(SavedChats.self).value)
    let kept = loaded.chats[0].messages
    #expect(kept.count < messages.count)
    #expect(kept.last == messages.last)
    #expect(kept.first?.role == .user)
  }

  @Test func settingsAndTextAreKeptInRange() throws {
    let store = MemoryStore(limits: limits)
    var settings = Settings()
    settings.speechRate = 9
    settings.guides["all"] = String(repeating: "g", count: limits.guide + 100)
    try store.save(settings)
    let loaded = try #require(store.load(Settings.self).value)
    #expect(loaded.speechRate == 1)
    #expect(loaded.guides["all"]?.count == limits.guide)
    #expect(!Settings().readAloud)
    #expect(!Settings().talk)
  }

  private func loadSettings(json: String) throws -> Settings {
    let store = MemoryStore(limits: limits)
    try store.rawWrite(Settings.fileName, Data(json.utf8))
    return try #require(store.load(Settings.self).value)
  }

  private func oldSettings(_ voice: String?) -> String {
    let mode = voice.map { "\"voiceMode\":\"\($0)\"," } ?? ""
    return """
      {"version":1,"value":{\(mode)"headphonesOnly":false,"voiceId":"v9","speechRate":0.3,\
      "guides":{"all":"Be brief."},"lengths":{},"howILikeToWork":{"sound":"quiet"}}}
      """
  }

  @Test func oldQuietSettingsLoadAsBothOff() throws {
    let loaded = try loadSettings(json: oldSettings("quiet"))
    #expect(!loaded.readAloud && !loaded.talk)
  }

  @Test func oldITalkSettingsLoadAsTalkOnly() throws {
    let loaded = try loadSettings(json: oldSettings("iTalk"))
    #expect(!loaded.readAloud && loaded.talk)
  }

  @Test func oldWeTalkSettingsLoadAsBothOn() throws {
    let loaded = try loadSettings(json: oldSettings("weTalk"))
    #expect(loaded.readAloud && loaded.talk)
  }

  @Test func oldSettingsKeepEverythingElse() throws {
    let loaded = try loadSettings(json: oldSettings("weTalk"))
    #expect(!loaded.headphonesOnly)
    #expect(loaded.voiceId == "v9")
    #expect(loaded.speechRate == 0.3)
    #expect(loaded.guides["all"] == "Be brief.")
    #expect(loaded.howILikeToWork["sound"] == "quiet")
  }

  @Test func unknownOrMissingOldVoiceLoadsAsBothOffWithoutLosingData() throws {
    for voice in ["shouting", "", "WETALK"] as [String?] + [nil] {
      let loaded = try loadSettings(json: oldSettings(voice))
      #expect(!loaded.readAloud && !loaded.talk)
      #expect(loaded.voiceId == "v9")
    }
    let wrongType = try loadSettings(
      json: #"{"version":1,"value":{"voiceMode":7,"headphonesOnly":true,"speechRate":0.5}}"#)
    #expect(!wrongType.readAloud && !wrongType.talk)
  }

  @Test func newSwitchesWinAndAreSavedWithoutTheOldWord() throws {
    let both = try loadSettings(
      json: #"{"version":1,"value":{"voiceMode":"quiet","readAloud":true,"talk":false}}"#)
    #expect(both.readAloud && !both.talk)
    let store = MemoryStore(limits: limits)
    try store.save(Settings(readAloud: true, talk: true))
    let raw = try #require(store.rawRead(Settings.fileName))
    #expect(!String(decoding: raw, as: UTF8.self).contains("voiceMode"))
    #expect(try #require(store.load(Settings.self).value) == Settings(readAloud: true, talk: true))
  }

  @Test func blankNotesParkedThoughtsAndRecallAnswersAreDropped() throws {
    let store = MemoryStore(limits: limits)
    try store.save(Profile(notes: [Note(text: "  ", date: date), Note(text: "ok", date: date)]))
    try store.save(ParkedThoughts(items: [ParkedThought(text: "", date: date)]))
    try store.save(RecallAnswers(items: [RecallAnswer(answer: "\n", date: date)]))
    #expect(store.load(Profile.self).value?.notes.map(\.text) == ["ok"])
    #expect(store.load(ParkedThoughts.self).value?.items.isEmpty == true)
    #expect(store.load(RecallAnswers.self).value?.items.isEmpty == true)
  }

  // MARK: deleting everything

  @Test func deleteAllLeavesNoFileAndAllowsNewSaves() throws {
    let directory = folder()
    let store = FileStore(folder: directory, limits: limits)
    try store.save(samples.work)
    try store.save(samples.chats)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    try Data("x".utf8).write(to: directory.appendingPathComponent("work.damaged.json"))
    try store.deleteAll()
    #expect(names(in: directory).isEmpty)
    try store.deleteAll()  // nothing left is fine
    try store.save(samples.work)
    #expect(store.load(SavedWork.self) == .found(samples.work))
  }

  // MARK: what is never stored

  @Test func noSavedTypeHasAPlaceForAudioANameAnAgeASchoolOrADiagnosis() {
    let forbidden = [
      "audio", "recording", "name", "age", "birth", "school", "diagnosis", "condition",
      "adhd", "email", "phone", "address", "location", "contact", "teacher", "parent",
    ]
    var found: [String] = []
    for value in samples.all {
      collectLabels(of: value, into: &found)
    }
    #expect(!found.isEmpty)
    for label in found {
      // Compare whole words ("messages" is fine, "age" is not): split camelCase into words.
      let words = splitWords(label)
      for word in forbidden {
        #expect(!words.contains(word), "\(label) looks like \(word)")
      }
    }
  }

  private func splitWords(_ label: String) -> [String] {
    var words: [String] = []
    var current = ""
    for character in label {
      if character.isUppercase, !current.isEmpty {
        words.append(current.lowercased())
        current = ""
      }
      current.append(character)
    }
    words.append(current.lowercased())
    return words
  }

  private func collectLabels(of value: Any, into labels: inout [String]) {
    for child in Mirror(reflecting: value).children {
      if let label = child.label { labels.append(label) }
      let inner = Mirror(reflecting: child.value)
      if inner.displayStyle == .struct || inner.displayStyle == .collection {
        collectLabels(of: child.value, into: &labels)
      }
    }
  }
}

struct SampleValues {
  let date: Date

  var work: SavedWork {
    SavedWork(
      work: Work(
        steps: [Step(id: 0, text: "Read", done: true), Step(id: 4, text: "Write")], nextId: 5),
      kindId: "essay", savedOn: date)
  }

  var profile: Profile {
    Profile(
      goalToday: "Finish reading", goalWeek: "Essay draft", goalMonth: "", goalYear: "Pass maths",
      notes: [Note(id: "n1", text: "Phone kept buzzing", date: date)])
  }

  var settings: Settings {
    Settings(
      readAloud: true, talk: true, headphonesOnly: false, voiceId: "v1", speechRate: 0.4,
      guides: ["all": "Be brief."], lengths: ["essay": "long"], howILikeToWork: ["sound": "quiet"])
  }

  var chats: SavedChats {
    SavedChats(chats: [
      Chat(
        id: "c1", kindId: "essay", updatedOn: date,
        messages: [
          ChatMessage(role: .user, text: "Where do I start?"),
          ChatMessage(role: .assistant, text: "What does the question ask?"),
        ])
    ])
  }

  var parked: ParkedThoughts {
    ParkedThoughts(items: [ParkedThought(id: "p1", text: "Buy a charger", date: date)])
  }

  var recall: RecallAnswers {
    RecallAnswers(items: [
      RecallAnswer(id: "r1", stepId: 0, answer: "It was about rivers", date: date)
    ])
  }

  var all: [Any] { [work, profile, settings, chats, parked, recall] }
}
