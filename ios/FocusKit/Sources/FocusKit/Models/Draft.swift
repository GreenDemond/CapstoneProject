import Foundation

public enum DraftStage: String, Codable, Equatable, Sendable {
  /// Typing or pasting the assignment.
  case assignment
  /// Typing one step at a time ("I'll say my steps").
  case saying
  /// The editor. Both ways of making steps end here.
  case editor
}

public struct DraftStep: Codable, Equatable, Sendable, Identifiable {
  public var id: Int
  public var text: String
  public var doneLine: String

  public init(id: Int, text: String, doneLine: String = "") {
    self.id = id
    self.text = text
    self.doneLine = doneLine
  }
}

/// An assignment being planned. Saved after every change so closing the app loses nothing.
public struct Draft: Storable {
  public static let fileName = "draft.json"

  public var stage: DraftStage
  public var text: String
  public var kindId: String
  public var stepCount: Int
  public var steps: [DraftStep]
  public var nextId: Int
  /// Steps whose "looks like two steps" nudge was answered No.
  public var nudgeDismissed: [Int]
  public var truncated: Bool
  /// The steps came from the AI on the phone. They always carry a label saying so.
  public var fromAI: Bool

  public init(
    stage: DraftStage = .assignment, text: String = "", kindId: String = "other",
    stepCount: Int = 5, steps: [DraftStep] = [], nextId: Int = 0, nudgeDismissed: [Int] = [],
    truncated: Bool = false, fromAI: Bool = false
  ) {
    self.stage = stage
    self.text = text
    self.kindId = kindId
    self.stepCount = stepCount
    self.steps = steps
    self.nextId = nextId
    self.nudgeDismissed = nudgeDismissed
    self.truncated = truncated
    self.fromAI = fromAI
  }

  private enum CodingKeys: String, CodingKey {
    case stage, text, kindId, stepCount, steps, nextId, nudgeDismissed, truncated, fromAI
  }

  public init(from decoder: Decoder) throws {
    let values = try decoder.container(keyedBy: CodingKeys.self)
    stage = try values.decode(DraftStage.self, forKey: .stage)
    text = try values.decode(String.self, forKey: .text)
    kindId = try values.decode(String.self, forKey: .kindId)
    stepCount = try values.decode(Int.self, forKey: .stepCount)
    steps = try values.decode([DraftStep].self, forKey: .steps)
    nextId = try values.decode(Int.self, forKey: .nextId)
    nudgeDismissed = try values.decode([Int].self, forKey: .nudgeDismissed)
    truncated = try values.decode(Bool.self, forKey: .truncated)
    fromAI = try values.decodeIfPresent(Bool.self, forKey: .fromAI) ?? false
  }

  public static let empty = Draft()

  /// True when there is something worth bringing back after the app was closed.
  public var hasContent: Bool {
    stage != .assignment || !Text.trimmed(text).isEmpty
      || steps.contains { !Text.trimmed($0.text).isEmpty }
  }

  public func limited(by limits: Content.Limits) -> Draft {
    var seen = Set<Int>()
    var kept: [DraftStep] = []
    for step in steps.prefix(limits.savedSteps) where step.id >= 0 && seen.insert(step.id).inserted
    {
      kept.append(
        DraftStep(
          id: step.id, text: Text.cut(step.text, to: limits.savedStepLength),
          doneLine: Text.cut(step.doneLine, to: limits.stepLength)))
    }
    var copy = self
    copy.text = Text.cut(text, to: limits.pasteLength)
    copy.steps = kept
    copy.nextId = max(nextId, (kept.map(\.id).max() ?? -1) + 1)
    copy.stepCount = [3, 5, 8].contains(stepCount) ? stepCount : 5
    return copy
  }
}
