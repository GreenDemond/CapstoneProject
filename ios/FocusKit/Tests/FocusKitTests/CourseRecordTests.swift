import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct CourseRecordTests {
  let content: Content
  let store: MemoryStore
  let clock = FakeClock()

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
  }

  private func app(steps: [String], course: String? = nil, store: MemoryStore? = nil) -> AppModel {
    let model = AppModel(content: content, store: store ?? self.store, clock: clock)
    model.planner.setText("Some assignment")
    model.planner.setKind("essay")
    if let course { model.planner.setCourse(course) }
    _ = model.planner.beginSaying()
    for step in steps { _ = model.planner.addSaid(step) }
    _ = model.planner.thatsAll()
    #expect(model.planner.start())
    return model
  }

  private func wait() { clock.advance(by: AppModel.tapGap + 0.1) }

  private func finishAll(_ model: AppModel) {
    while let id = model.currentStep?.id {
      _ = model.choose(.done, stepId: id)
      wait()
    }
  }

  private func courseLines(_ model: AppModel) -> [LearnerRecord.Entry] {
    model.learner.entries(of: .course)
  }

  // MARK: class label

  @Test func theLabelIsCutToFortyAndBlankIsNone() {
    #expect(LearnerRecord.Entry.cleanLabel("   ") == nil)
    #expect(LearnerRecord.Entry.cleanLabel(nil) == nil)
    #expect(LearnerRecord.Entry.cleanLabel("History") == "History")
    let long = String(repeating: "h", count: 60)
    #expect(LearnerRecord.Entry.cleanLabel(long)?.utf16.count == 40)
  }

  @Test func theLabelIsKeptOnTheDraftAndTheSavedWork() {
    let model = AppModel(content: content, store: store, clock: clock)
    model.planner.setCourse("  History  ")
    #expect(model.planner.draft.course == "  History  ")
    model.planner.setText("Some assignment")
    _ = model.planner.beginSaying()
    _ = model.planner.addSaid("Read the source")
    _ = model.planner.thatsAll()
    #expect(model.planner.start())
    #expect(model.saved?.course == "History")
  }

  @Test func olderSavedWorkWithoutTheLabelLoadsWithNone() throws {
    let old = """
      {"version":1,"value":{"work":{"steps":[{"id":0,"text":"Read","done":false}],"nextId":1}}}
      """
    store.plant(SavedWork.fileName, Data(old.utf8))
    let loaded = store.load(SavedWork.self).value
    #expect(loaded?.course == nil)
    #expect(loaded?.stuck == 0)
    #expect(loaded?.drifted == 0)
    #expect(loaded?.assignmentId.hasPrefix("legacy-") == true)
  }

  @Test func aSpaceTypedInTheLabelIsKeptWhileTyping() {
    let model = AppModel(content: content, store: store, clock: clock)
    model.planner.setCourse("Social ")
    #expect(model.planner.draft.course == "Social ")
    model.planner.setCourse("Social Studies")
    #expect(model.planner.draft.course == "Social Studies")
    model.planner.setText("Some assignment")
    _ = model.planner.beginSaying()
    _ = model.planner.addSaid("Read the source")
    _ = model.planner.thatsAll()
    #expect(model.planner.start())
    #expect(model.saved?.course == "Social Studies")
  }

  @Test func aFailedSaveOfTheLastDoneKeepsTheStepOpenToRetry() {
    let model = app(steps: ["Read the source"], course: "History")
    let id = model.currentStep?.id ?? -1
    store.failWritesTo = SavedWork.fileName
    #expect(model.choose(.done, stepId: id) == .ignored)
    #expect(model.allDone == false)
    #expect(model.currentStep?.id == id)
    #expect(courseLines(model).isEmpty)
    store.failWritesTo = nil
    wait()
    #expect(model.choose(.done, stepId: id) != .ignored)
    #expect(model.allDone)
    #expect(courseLines(model).count == 1)
  }

  @Test func aNoteWhoseSaveFailedGetsItsLineWhenALaterNoteSaves() {
    let model = AppModel(content: content, store: store, clock: clock)
    store.failWritesTo = Profile.fileName
    _ = model.me.addNote("First note")
    #expect(model.learner.entries(of: .obstacle).isEmpty)
    store.failWritesTo = nil
    _ = model.me.addNote("Second note")
    let texts = Set(model.learner.entries(of: .obstacle).map(\.text))
    #expect(texts == ["First note", "Second note"])
  }

  // MARK: course line on finish

  @Test func finishingWithALabelWritesOneCourseLine() {
    let model = app(steps: ["Read the source", "Write the plan"], course: "History")
    finishAll(model)
    let lines = courseLines(model)
    #expect(lines.count == 1)
    #expect(lines.first?.courseLabel == "History")
    #expect(lines.first?.text.contains("Read the source / Write the plan") == true)
  }

  @Test func atMostEightStepsGoIntoTheLine() {
    let steps = (1...10).map { "Step \($0)" }
    let model = app(steps: steps, course: "History")
    finishAll(model)
    let text = courseLines(model).first?.text ?? ""
    #expect(text.contains("Step 8"))
    #expect(!text.contains("Step 9"))
  }

  @Test func stuckAndDriftedCountsMatchTheTaps() {
    let model = app(steps: ["Read the source", "Write the plan"], course: "History")
    let first = model.currentStep?.id ?? -1
    _ = model.choose(.stuck, stepId: first)
    wait()
    _ = model.choose(.stuck, stepId: first)
    wait()
    _ = model.choose(.still, stepId: first)
    wait()
    finishAll(model)
    let line = courseLines(model).first
    #expect(line?.stuckCount == 2)
    #expect(line?.driftedCount == 0)
  }

  @Test func aDriftedTapThatSplitsCountsOnce() {
    let model = app(steps: ["Read the source and take notes"], course: "History")
    let id = model.currentStep?.id ?? -1
    _ = model.choose(.drifted, stepId: id, smallerPiece: "Read the source")
    wait()
    finishAll(model)
    #expect(courseLines(model).first?.driftedCount == 1)
  }

  @Test func noLabelOrOnlySpacesWritesNoCourseLine() {
    let none = app(steps: ["Read the source"])
    finishAll(none)
    #expect(courseLines(none).isEmpty)

    let spaces = app(steps: ["Read the source"], course: "   ")
    finishAll(spaces)
    #expect(courseLines(spaces).isEmpty)
  }

  @Test func leavingWithLaterWritesNoCourseLine() {
    let model = app(steps: ["Read the source"], course: "History")
    _ = model.choose(.later, stepId: model.currentStep?.id ?? -1)
    #expect(courseLines(model).isEmpty)
  }

  @Test func aFailedRecordWriteStillFinishesTheAssignment() {
    let model = app(steps: ["Read the source"], course: "History")
    store.failWritesTo = LearnerRecord.fileName
    finishAll(model)
    #expect(model.allDone)
    #expect(store.load(SavedWork.self).value?.work.allDone == true)
    store.failWritesTo = nil
  }

  // MARK: per-class limit

  @Test func aClassKeepsItsNewestTenLines() {
    var record = LearnerRecord()
    for minute in 0..<11 {
      record.add(
        LearnerRecord.Entry(
          kind: .course, date: Date(timeIntervalSince1970: Double(minute) * 60),
          text: "line \(minute)", source: .app, courseLabel: "History"))
    }
    record.add(
      LearnerRecord.Entry(
        kind: .course, date: Date(timeIntervalSince1970: 0), text: "algebra", source: .app,
        courseLabel: "Algebra"))
    let kept = record.limited(by: content.limits).entries(of: .course)
    #expect(kept.filter { $0.courseLabel == "History" }.count == 10)
    #expect(!kept.contains { $0.text == "line 0" })
    #expect(kept.contains { $0.text == "algebra" })
  }

  // MARK: note lines

  @Test func aNoteGetsOneLineWithTheSameIdAndDeletingItRemovesIt() {
    let model = AppModel(content: content, store: store, clock: clock)
    #expect(model.me.addNote("Phone kept buzzing"))
    let note = model.me.profile.notes.first
    let lines = model.learner.entries(of: .obstacle)
    #expect(lines.count == 1)
    #expect(lines.first?.id == note?.id)
    #expect(lines.first?.text == "Phone kept buzzing")
    model.me.deleteNote(note?.id ?? "")
    #expect(model.learner.entries(of: .obstacle).isEmpty)
  }

  @Test func aLongNoteLineIsCutToTheEntryLength() {
    let model = AppModel(content: content, store: store, clock: clock)
    _ = model.me.addNote(String(repeating: "n", count: 900))
    let line = model.learner.entries(of: .obstacle).first
    #expect(line?.text.utf16.count == LearnerRecord.entryLength)
  }

  // MARK: delete everything

  @Test func deleteEverythingClearsTheRecordInMemoryAndInTheFile() throws {
    let model = AppModel(content: content, store: store, clock: clock)
    _ = model.me.addNote("Phone kept buzzing")
    #expect(!model.learner.entries.isEmpty)
    #expect(model.eraseEverything())
    #expect(model.learner.entries.isEmpty)
    #expect(store.load(LearnerRecord.self) == .missing)
  }

  // MARK: words that become stored text

  /// Words that must not appear in text the app can store as a line. Exact phrases in
  /// `allowedPhrases` are reviewed and kept on purpose (see M0b design note).
  private static let forbidden = [
    "attention", "focus", "mood", "effort", "diagnosis", "adhd", "name", "school", "teacher",
    "missed", "behind", "late", "overdue", "failed", "great", "awesome",
  ]

  private static let allowedPhrases = [
    "Write down what you would ask a teacher",
    "Ask a teacher or classmate what part is unclear.",
  ]

  @Test func storableTextNeverNamesAPersonOrAJudgement() throws {
    let root = URL(fileURLWithPath: #filePath)
      .deletingLastPathComponent().deletingLastPathComponent()
      .deletingLastPathComponent().deletingLastPathComponent()
    let json = try String(
      contentsOf: root.appendingPathComponent("Shared/content.json"), encoding: .utf8)
    let object = try #require(JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any])
    var strings: [String] = []
    for kind in object["kinds"] as? [[String: Any]] ?? [] {
      strings += kind["starterSteps"] as? [String] ?? []
    }
    strings += object["stuckHints"] as? [String] ?? []
    let moves = (object["coach"] as? [String: Any])?["moves"] as? [String: [String: Any]] ?? [:]
    strings += moves.values.compactMap { $0["fallback"] as? String }
    #expect(strings.count > 10)
    for text in strings {
      var checked = text
      for phrase in Self.allowedPhrases {
        checked = checked.replacingOccurrences(of: phrase, with: "")
      }
      let words = Set(checked.lowercased().split(whereSeparator: { !$0.isLetter }).map(String.init))
      for word in Self.forbidden {
        #expect(!words.contains(word), "“\(text)” contains \(word)")
      }
    }
  }
}
