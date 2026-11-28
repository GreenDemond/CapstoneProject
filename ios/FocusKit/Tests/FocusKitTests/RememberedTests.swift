import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct RememberedTests {
  let content: Content
  let store: MemoryStore
  let clock = FakeClock()

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
  }

  private func line(
    _ kind: LearnerRecord.Kind, _ text: String, id: String = UUID().uuidString,
    source: LearnerRecord.Source = .student, course: String? = nil, daysAgo: Double = 0
  ) -> LearnerRecord.Entry {
    LearnerRecord.Entry(
      id: id, kind: kind, date: clock.now.addingTimeInterval(-daysAgo * 86_400), text: text,
      source: source, courseLabel: course)
  }

  private func app(_ record: LearnerRecord = LearnerRecord()) throws -> AppModel {
    try store.save(record)
    return AppModel(
      content: content, store: store, clock: clock,
      services: Services(languageModel: FakeLanguageModel()))
  }

  private func saved() -> LearnerRecord? { store.load(LearnerRecord.self).value }

  // MARK: Deleting a line

  @Test func deletingAPatternAClassAndASettingRemovesOnlyThatLine() throws {
    let record = LearnerRecord(entries: [
      line(.pattern, "Starting is hard", id: "p1"),
      line(.setting, "25-minute block: too long", id: "s1", source: .app),
      line(.course, "Essay: read / plan", id: "c1", source: .app, course: "History"),
      line(.pattern, "Drifts at night", id: "p2"),
    ])
    let model = try app(record)
    for id in ["p1", "s1", "c1"] { model.deleteLearnerLine(id) }
    #expect(model.learner.entries.map(\.id) == ["p2"])
    #expect(saved()?.entries.map(\.id) == ["p2"])
    #expect(model.learnerNote == nil)
  }

  @Test func deletingAReflectionWorks() throws {
    let model = try app(LearnerRecord(entries: [line(.reflection, "A good week", id: "r1")]))
    model.deleteLearnerLine("r1")
    #expect(model.learner.entries.isEmpty)
  }

  @Test func deletingANoteLineDeletesTheNoteAndItDoesNotComeBack() throws {
    let model = try app()
    model.me.addNote("Phone keeps buzzing")
    let id = try #require(model.me.profile.notes.first?.id)
    #expect(model.learner.entries.contains { $0.id == id })
    model.deleteLearnerLine(id)
    #expect(model.me.profile.notes.isEmpty)
    #expect(!model.learner.entries.contains { $0.id == id })
    // Another note saved later does not bring the line back.
    model.me.addNote("A second note")
    #expect(!model.learner.entries.contains { $0.id == id })
  }

  @Test func aLineAnotherFeatureWroteSurvivesANoteSave() throws {
    let model = try app(
      LearnerRecord(entries: [line(.obstacle, "Too vague last time", id: "why-1")]))
    model.me.addNote("A note")
    #expect(model.learner.entries.contains { $0.id == "why-1" })
    let noteId = try #require(model.me.profile.notes.first?.id)
    model.me.deleteNote(noteId)
    #expect(model.learner.entries.contains { $0.id == "why-1" })
  }

  @Test func aLineAnotherFeatureWroteIsDeletedDirectly() throws {
    let model = try app(
      LearnerRecord(entries: [line(.obstacle, "Too vague last time", id: "why-1")]))
    model.deleteLearnerLine("why-1")
    #expect(model.learner.entries.isEmpty)
    #expect(model.learner.wasDeleted("why-1"))
  }

  @Test func aDeletedClassLineIsNotWrittenBackWhenTheSameAssignmentFinishesAgain() throws {
    let model = try app()
    model.planner.setText("Some assignment")
    model.planner.setKind("essay")
    model.planner.setCourse("History")
    _ = model.planner.beginSaying()
    _ = model.planner.addSaid("Read the prompt")
    _ = model.planner.thatsAll()
    #expect(model.planner.start())
    let id = try #require(model.currentStep?.id)
    _ = model.choose(.done, stepId: id)
    let course = try #require(model.learner.entries(of: .course).first)
    model.deleteLearnerLine(course.id)
    #expect(model.learner.entries(of: .course).isEmpty)
    // The same assignment finishing again must not rewrite the deleted line.
    model.writeCourseLine(try #require(model.saved))
    #expect(model.learner.entries(of: .course).isEmpty)
  }

  // MARK: Failed saves

  @Test func aFailedLineDeleteLeavesTheLineAndSaysSo() throws {
    let model = try app(LearnerRecord(entries: [line(.pattern, "Starting is hard", id: "p1")]))
    store.failWrites = true
    model.deleteLearnerLine("p1")
    #expect(model.learner.entries.map(\.id) == ["p1"])
    #expect(!model.learner.wasDeleted("p1"))
    #expect(model.learnerNote == Words.rememberedDeleteFailed)
  }

  @Test func aFailedNoteDeleteKeepsTheNote() throws {
    let model = try app()
    model.me.addNote("Phone keeps buzzing")
    let id = try #require(model.me.profile.notes.first?.id)
    store.failWrites = true
    model.deleteLearnerLine(id)
    #expect(model.me.profile.notes.contains { $0.id == id })
    #expect(model.learnerNote == Words.rememberedDeleteFailed)
  }

  // MARK: The deleted list

  @Test func theDeletedListIsCappedAndAnOldFileLoadsWithItEmpty() throws {
    var record = LearnerRecord()
    for index in 0..<250 { record.markDeleted("id-\(index)") }
    #expect(record.deleted.count == LearnerRecord.deletedLimit)
    #expect(record.deleted.last == "id-249" && !record.wasDeleted("id-0"))
    let old = #"{"version":1,"value":{"entries":[]}}"#
    store.plant(LearnerRecord.fileName, Data(old.utf8))
    #expect(store.load(LearnerRecord.self).value?.deleted.isEmpty == true)
  }

  @Test func theDeletedListIsOnlyWrittenWhenThereIsSomething() throws {
    try store.save(LearnerRecord())
    let empty = String(decoding: try #require(store.rawRead(LearnerRecord.fileName)), as: UTF8.self)
    #expect(!empty.contains("deleted"))
    var record = LearnerRecord()
    record.markDeleted("x")
    try store.save(record)
    let full = String(decoding: try #require(store.rawRead(LearnerRecord.fileName)), as: UTF8.self)
    #expect(full.contains("deleted"))
  }

  @Test func aDeletedLineNeverReachesTheNextMovesFacts() throws {
    let model = try app(
      LearnerRecord(entries: [
        LearnerRecord.Entry(
          id: "p1", kind: .pattern, date: clock.now, text: "Gets stuck on the first line",
          source: .student, tags: [.stuck])
      ]))
    model.deleteLearnerLine("p1")
    let facts = LearnerSelector.facts(
      context: SelectorContext(moveKey: "stuckQuestion"), record: model.learner, content: content)
    #expect(facts.isEmpty)
  }

  // MARK: Ratings

  @Test func ratingCountsUsePlainNamesAndHideMovesWithNoRatings() throws {
    let model = try app()
    model.rate(move: "stuckQuestion", .helped)
    model.rate(move: "stuckQuestion", .helped)
    model.rate(move: "stuckQuestion", .meh)
    model.rate(move: "chat", .notthis)
    let counts = model.ratingCounts
    #expect(counts.map(\.move) == ["stuckQuestion", "chat"])
    #expect(Words.ratingLine(counts[0]) == "Stuck question: Helped 2, Meh 1, Not this 0")
    #expect(Words.ratingLine(counts[1]) == "Talk replies: Helped 0, Meh 0, Not this 1")
  }

  @Test func clearingRatingsRemovesOnlyRatingsAndResetsTheFixedLineFirstChoice() throws {
    let model = try app(
      LearnerRecord(entries: [
        line(.pattern, "Starting is hard", id: "p1"), line(.setting, "25-minute block", id: "n1"),
      ]))
    for _ in 0..<5 { model.rate(move: "stuckQuestion", .notthis) }
    #expect(Feedback.showFixedFirst(move: "stuckQuestion", in: model.learner, now: clock.now))
    model.clearRatings()
    #expect(model.learner.entries(of: .feedback).isEmpty)
    #expect(model.learner.entries.map(\.id).sorted() == ["n1", "p1"])
    #expect(!Feedback.showFixedFirst(move: "stuckQuestion", in: model.learner, now: clock.now))
    #expect(model.ratingCounts.isEmpty)
  }

  // MARK: Words

  @Test func theNewWordsHaveNoShameOrPraiseOrScoreWords() {
    let words = [
      Words.meRowRemembered, Words.rememberedIntro, Words.rememberedEmpty,
      Words.rememberedGroupNotes, Words.rememberedGroupReflections, Words.rememberedGroupPatterns,
      Words.rememberedGroupSettings, Words.rememberedGroupClasses, Words.rememberedGroupRatings,
      Words.rememberedYouWrote, Words.rememberedAppNoted, Words.rememberedDelete,
      Words.rememberedConfirm, Words.rememberedDeleteFailed, Words.rememberedClearRatings,
      Words.rememberedClearNote, Words.rememberedClearConfirm,
    ].joined(separator: " ").lowercased()
      .split(whereSeparator: { !$0.isLetter }).map(String.init)
    let banned = [
      "attention", "focus", "mood", "effort", "diagnosis", "adhd", "teacher", "missed", "behind",
      "late", "overdue", "failed", "great", "awesome", "streak", "score", "best", "worst", "bad",
      "good", "proud", "sorry", "lazy", "should", "must",
    ]
    for word in banned { #expect(!words.contains(word), "\(word)") }
  }

  @Test func aDamagedDeletedListNeverSetsTheWholeFileAside() throws {
    var record = LearnerRecord(entries: [line(.pattern, "Starting is hard", id: "a")])
    record.markDeleted("x")
    try store.save(record)
    let good = String(decoding: try #require(store.rawRead(LearnerRecord.fileName)), as: UTF8.self)
    let bad = good.replacingOccurrences(of: #""deleted":["x"]"#, with: #""deleted":"oops""#)
    #expect(bad != good)
    store.plant(LearnerRecord.fileName, Data(bad.utf8))
    let loaded = store.load(LearnerRecord.self).value
    #expect(loaded?.entries.map(\.id) == ["a"])
    #expect(loaded?.deleted.isEmpty == true)
  }

  @Test func theKeysWithADeletedListAreTheOldKeysPlusDeletedAndTheValuesAreIdsOnly() throws {
    var record = LearnerRecord(entries: [line(.pattern, "Starting is hard", id: "a")])
    record.markDeleted("course-123")
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
      keys == [
        "version", "value", "entries", "id", "kind", "date", "text", "source", "tags", "deleted",
      ])
    let value = (tree as? [String: Any])?["value"] as? [String: Any]
    #expect(value?["deleted"] as? [String] == ["course-123"])
  }

  @Test func aNoteLineWhoseNoteIsGoneIsRemovedAtLaunchAndNothingIsAdded() throws {
    try store.save(
      LearnerRecord(entries: [
        line(.obstacle, "A note that was deleted", id: "orphan"),
        line(.obstacle, "Another feature's line", id: "why-1"),
        line(.pattern, "Starting is hard", id: "p1"),
      ]))
    let model = AppModel(
      content: content, store: store, clock: clock,
      services: Services(languageModel: FakeLanguageModel()))
    #expect(model.learner.entries.map(\.id).sorted() == ["p1", "why-1"])
    #expect(saved()?.entries.map(\.id).sorted() == ["p1", "why-1"])
  }

  @Test func onlyANoteLineAsksForTheNoteConfirmation() throws {
    let model = try app()
    model.me.addNote("A note")
    let noteId = try #require(model.me.profile.notes.first?.id)
    #expect(model.isNoteLine(noteId))
    model.rate(move: "chat", .helped)
    #expect(!model.isNoteLine("why-1") && !model.isNoteLine("missing"))
  }

  @Test func ratingsForAnyMoveAreCountedAndCanBeCleared() throws {
    let model = try app()
    model.rate(move: "somethingNew", .meh)
    #expect(model.ratingCounts.map(\.move) == ["somethingNew"])
    #expect(Words.ratingLine(model.ratingCounts[0]).hasPrefix("AI lines:"))
    model.clearRatings()
    #expect(model.ratingCounts.isEmpty)
  }
}
