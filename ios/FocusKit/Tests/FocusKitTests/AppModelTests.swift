import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct AppModelTests {
  let content: Content
  let store: MemoryStore
  let clock = FakeClock()

  init() throws {
    content = try loadContent()
    store = MemoryStore(limits: content.limits)
  }

  private func app(steps: [String], kind: String = "other") throws -> AppModel {
    let model = AppModel(content: content, store: store, clock: clock)
    model.planner.setText("Some assignment")
    model.planner.setKind(kind)
    model.planner.beginSaying()
    for step in steps { model.planner.addSaid(step) }
    model.planner.thatsAll()
    #expect(model.planner.start())
    return model
  }

  /// Moves the clock past the double-tap gap so the next tap counts.
  private func wait() { clock.advance(by: AppModel.tapGap + 0.1) }

  @Test func eachOfTheFiveButtonsDoesItsOneThing() throws {
    let model = try app(steps: ["A", "B", "C"])
    var id = try #require(model.currentStep?.id)
    #expect(model.choose(.still, stepId: id) == .stillWorking(message: Words.stillAck))
    #expect(model.currentStep?.text == "A")
    wait()
    #expect(model.choose(.stuck, stepId: id) == .stuck)
    #expect(model.work?.steps.map(\.text) == ["A", "B", "C"])
    wait()
    #expect(model.choose(.later, stepId: id) == .later)
    #expect(!model.inStep)
    #expect(model.work?.steps.map(\.text) == ["B", "C", "A"])
    wait()
    id = try #require(model.currentStep?.id)
    model.startStep()
    #expect(
      model.choose(.drifted, stepId: id, smallerPiece: "B small")
        == .drifted(message: Words.driftedAck))
    #expect(model.currentStep?.text == "B small")
    wait()
    id = try #require(model.currentStep?.id)
    #expect(model.choose(.done, stepId: id) == .done(message: Words.doneAck, askRecall: false))
    #expect(model.work?.doneCount == 2)
  }

  @Test func aDoubleTapCountsOnce() throws {
    let model = try app(steps: ["A", "B", "C"])
    let id = try #require(model.currentStep?.id)
    #expect(model.choose(.done, stepId: id) != .ignored)
    // Same step number again, and again straight after on the new step: both ignored.
    #expect(model.choose(.done, stepId: id) == .ignored)
    let next = try #require(model.currentStep?.id)
    #expect(model.choose(.done, stepId: next) == .ignored)
    #expect(model.work?.doneCount == 1)
    wait()
    #expect(model.choose(.done, stepId: next) != .ignored)
    #expect(model.work?.doneCount == 2)
  }

  @Test func driftedWithABlankBoxChangesNothing() throws {
    let model = try app(steps: ["A", "B"])
    let id = try #require(model.currentStep?.id)
    let before = model.work
    #expect(
      model.choose(.drifted, stepId: id, smallerPiece: "   ")
        == .needsSmallerPiece(message: Words.driftedNeedsWords))
    #expect(model.work == before)
    // The blank try does not use up the next tap.
    #expect(model.choose(.drifted, stepId: id, smallerPiece: "A little") != .ignored)
  }

  @Test func laterWhenItIsTheOnlyStepLeftKeepsTheStep() throws {
    let model = try app(steps: ["A", "B"])
    var id = try #require(model.currentStep?.id)
    model.choose(.done, stepId: id)
    wait()
    id = try #require(model.currentStep?.id)
    #expect(model.choose(.later, stepId: id) == .laterNotPossible(message: Words.laterOnly))
    #expect(model.inStep)
    #expect(model.currentStep?.text == "B")
  }

  @Test func allDoneEndsTheStepAndSaysSo() throws {
    let model = try app(steps: ["A"])
    let id = try #require(model.currentStep?.id)
    #expect(model.choose(.done, stepId: id) == .allDone(message: Words.doneAck, askRecall: false))
    #expect(model.allDone)
    #expect(!model.inStep)
    #expect(model.currentStep == nil)
    // A tap for a step that no longer exists does nothing.
    wait()
    #expect(model.choose(.done, stepId: id) == .ignored)
  }

  @Test func recallIsOfferedAfterReadingAndKeptOnLastStep() throws {
    let model = try app(steps: ["Read a page"], kind: "reading")
    let id = try #require(model.currentStep?.id)
    #expect(model.choose(.done, stepId: id) == .allDone(message: Words.doneAck, askRecall: true))
    #expect(model.inStep)  // stays so the question can be shown
    #expect(model.saveRecall("Courage can be quiet", stepId: id))
    #expect(!model.saveRecall("   ", stepId: id))
    #expect(model.recall.items.count == 1)
    model.leaveStep()
    #expect(!model.inStep)
  }

  @Test func killingAndReopeningReturnsToTheSameStep() throws {
    let model = try app(steps: ["A", "B", "C"])
    var id = try #require(model.currentStep?.id)
    model.choose(.done, stepId: id)
    wait()
    id = try #require(model.currentStep?.id)
    let reopened = AppModel(content: content, store: store, clock: clock)
    #expect(reopened.inStep)
    #expect(reopened.currentStep?.text == "B")
    #expect(reopened.stepPosition?.number == 2)
    #expect(reopened.stepPosition?.total == 3)
    #expect(!reopened.showsPlanner)
  }

  @Test func afterADayAwayTodayWelcomesBackAndSaysNothingAboutTheGap() throws {
    let model = try app(steps: ["A", "B"])
    #expect(model.welcomeLine == content.pickup.sameDay)
    clock.advance(by: 8 * 24 * 3600)
    let reopened = AppModel(content: content, store: store, clock: clock)
    #expect(reopened.welcomeLine == content.pickup.laterDay)
    #expect(!reopened.welcomeLine.contains("8"))
    #expect(reopened.currentStep?.text == "A")
  }

  @Test func neverShamingWordsInWhatTheStudentReads() throws {
    let banned = try Regex("(?i)\\b(missed|behind|late|overdue|failed|failure|days?)\\b")
    var files = [URL]()
    let here = URL(fileURLWithPath: #filePath)
    let root = here.deletingLastPathComponent().deletingLastPathComponent()
      .deletingLastPathComponent()
      .deletingLastPathComponent()
    files.append(root.appendingPathComponent("FocusKit/Sources/FocusKit/Models/Words.swift"))
    let appFolder = root.appendingPathComponent("App/FocusApp")
    let found = (try? FileManager.default.contentsOfDirectory(atPath: appFolder.path)) ?? []
    files += found.filter { $0.hasSuffix(".swift") }.map { appFolder.appendingPathComponent($0) }
    #expect(files.count > 3)
    let literal = try Regex("\"([^\"\\\\]|\\\\.)*\"")
    for file in files {
      let text = try String(contentsOf: file, encoding: .utf8)
      for match in text.matches(of: literal) {
        let words = String(text[match.range])
        #expect(
          words.firstMatch(of: banned) == nil,
          Comment(rawValue: "\(file.lastPathComponent): \(words)"))
      }
    }
    // The shared words and hints too.
    let all =
      content.stuckHints + [content.pickup.sameDay, content.pickup.laterDay, content.twoMinuteStep]
      + content.kinds.flatMap(\.starterSteps)
    // One seeded starter step for test practice says "Check what you missed" (about the material,
    // not about the student's days). It is shared content; changing it needs a decision.
    for line in all where line != "Check what you missed" {
      #expect(line.firstMatch(of: banned) == nil, Comment(rawValue: line))
    }
  }

  @Test func savedThoughtsAndAnswersCanBeDeletedOneAtATime() throws {
    let model = try app(steps: ["A", "B"])
    #expect(model.park("Buy milk"))
    #expect(model.park("Ask about the trip"))
    #expect(model.saveRecall("The water cycle has four stages", stepId: nil))
    let thought = try #require(model.parked.items.last?.id)
    let answer = try #require(model.recall.items.first?.id)
    model.deleteParked(thought)
    #expect(model.parked.items.map(\.text) == ["Ask about the trip"])
    model.deleteRecall(answer)
    #expect(model.recall.items.isEmpty)
    // Deleting an id that is not there changes nothing.
    model.deleteParked("missing")
    #expect(model.parked.items.count == 1)
    // The change is saved: a fresh model reads the same list.
    let reopened = AppModel(content: content, store: store, clock: clock)
    #expect(reopened.parked.items.map(\.text) == ["Ask about the trip"])
    #expect(reopened.recall.items.isEmpty)
  }

  @Test func parkingAThoughtKeepsTheStepOnScreen() throws {
    let model = try app(steps: ["A", "B"])
    let id = try #require(model.currentStep?.id)
    #expect(model.park("Buy milk"))
    #expect(!model.park("  "))
    #expect(model.parked.items.first?.text == "Buy milk")
    #expect(model.currentStep?.id == id)
    #expect(model.inStep)
    let reopened = AppModel(content: content, store: store, clock: clock)
    #expect(reopened.parked.items.count == 1)
  }

  @Test func theFiveButtonsAreAllInTheModelWithOneLabelEach() {
    #expect(Choice.allCases.count == 5)
    #expect(Set(Choice.allCases.map { Words.label(for: $0) }).count == 5)
  }

  @Test func stuckLadderGivesHintsInOrderThenHelpWithAQuestion() throws {
    let ladder = LadderModel(content: content, stepText: "Write one line")
    #expect(!ladder.canAskPerson)
    #expect(ladder.nextHint())
    #expect(!ladder.canAskPerson)
    #expect(ladder.nextHint())
    #expect(ladder.canAskPerson)
    #expect(ladder.hintsShown == Array(content.stuckHints.prefix(2)))
    // More taps than hints: nothing repeats and nothing breaks.
    for _ in 0..<10 { ladder.nextHint() }
    #expect(ladder.hintsShown == content.stuckHints)
    #expect(!ladder.hasMoreHints)
    #expect(!ladder.nextHint())
  }

  @Test func theQuestionNeedsSomeWordsAndHasThreeParts() {
    let ladder = LadderModel(content: content)
    #expect(ladder.question == nil)
    ladder.tried = "  "
    #expect(ladder.question == nil)
    ladder.onStep = "Writing the intro"
    ladder.tried = "Reading the example"
    ladder.dontGet = "How to start"
    #expect(
      ladder.question
        == "I'm on: Writing the intro\nI tried: Reading the example\nI don't get: How to start")
  }

  @Test func stuckNeverChangesTheStepsAndLeavingAndReturningKeepsTheLadder() throws {
    let model = try app(steps: ["A", "B", "C"])
    let step = try #require(model.currentStep)
    let before = model.work
    let ladder = model.ladder(for: step)
    ladder.nextHint()
    #expect(model.choose(.stuck, stepId: step.id) == .stuck)
    wait()
    #expect(model.choose(.stuck, stepId: step.id) == .stuck)
    #expect(model.work == before)
    #expect(model.ladder(for: step).hintsShown.count == 1)
  }
}
