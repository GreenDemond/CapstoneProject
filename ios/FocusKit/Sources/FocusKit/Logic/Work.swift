import Foundation

/// One step of an assignment.
public struct Step: Codable, Equatable, Sendable {
  public var id: Int
  public var text: String
  public var done: Bool

  public init(id: Int, text: String, done: Bool = false) {
    self.id = id
    self.text = text
    self.done = done
  }
}

/// The five answers on the work screen.
public enum Choice: String, CaseIterable, Sendable {
  case done
  case still
  case stuck
  case drifted
  case later
}

/// The steps of one assignment and the next free step number.
public struct Work: Codable, Equatable, Sendable {
  public var steps: [Step]
  public var nextId: Int

  public init(steps: [Step], nextId: Int) {
    self.steps = steps
    self.nextId = nextId
  }

  /// Makes a work list from step texts. Blank texts are dropped.
  public init(texts: [String]) {
    let kept = texts.map { Text.trimmed($0) }.filter { !$0.isEmpty }
    self.init(
      steps: kept.enumerated().map { Step(id: $0.offset, text: $0.element) },
      nextId: kept.count)
  }

  /// Index of the step being worked on (the first one not done), or nil if none is left.
  public var currentIndex: Int? {
    steps.firstIndex { !$0.done }
  }

  public var doneCount: Int {
    steps.filter { $0.done }.count
  }

  public var remainingCount: Int {
    steps.count - doneCount
  }

  /// True only when there is at least one step and every step is done.
  public var allDone: Bool {
    !steps.isEmpty && currentIndex == nil
  }

  /// Applies one choice and returns the new work. Done, and the first part of a Drifted step,
  /// count the same. Still working and Stuck never change the steps. Later moves the step to the end.
  /// `splitText` is only used by Drifted: the student's smaller version of the step.
  public func applying(_ choice: Choice, splitText: String = "") -> Work {
    guard let current = currentIndex else { return self }
    var work = self

    switch choice {
    case .done:
      work.steps[current].done = true

    case .drifted:
      let text = Text.trimmed(splitText)
      // A blank box, or the same words, keeps the step whole.
      if text.isEmpty || text == Text.trimmed(steps[current].text) { return self }
      work.steps[current].done = true
      work.steps.insert(Step(id: nextId, text: text), at: current + 1)
      work.nextId = nextId + 1

    case .later:
      let othersAllDone = steps.enumerated().allSatisfy { $0.offset == current || $0.element.done }
      if othersAllDone { return self }
      let moved = work.steps.remove(at: current)
      work.steps.append(moved)

    case .still, .stuck:
      break
    }
    return work
  }
}
