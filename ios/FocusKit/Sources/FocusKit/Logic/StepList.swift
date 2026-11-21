import Foundation

public enum StepList {
  /// The steps in an AI reply that is a list ("1. Read it", "- Read it"). Fewer than two list
  /// lines means it is not a list, so nothing is offered. Each step is cut to the step limit.
  public static func extract(from reply: String, limit: Int) -> [String] {
    var steps: [String] = []
    for line in reply.split(separator: "\n", omittingEmptySubsequences: true) {
      let text = Text.trimmed(String(line))
      guard let match = text.firstMatch(of: /^(?:\d{1,2}[.)]|[-•*])\s+(.+)$/) else { continue }
      let step = Text.trimmed(Text.cut(String(match.1), to: limit))
      if !step.isEmpty { steps.append(step) }
    }
    return steps.count >= 2 ? steps : []
  }
}
