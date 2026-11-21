import Foundation

public enum Hints {
  /// The hint for a number of hints already shown, or nil after the last one.
  public static func hint(at index: Int, in content: Content) -> String? {
    guard index >= 0, index < content.stuckHints.count else { return nil }
    return content.stuckHints[index]
  }
}

public enum StarterSteps {
  /// Steps found in pasted text: lines that start with a number ("1." or "2)") or a bullet.
  public static func listItems(in text: String, stepLength: Int) -> [String] {
    var items: [String] = []
    for line in text.split(separator: "\n", omittingEmptySubsequences: true) {
      if let item = listItem(String(line)) {
        items.append(Text.cut(item, to: stepLength))
      }
    }
    return items
  }

  /// The full list, in order: items from the pasted text, then the starter steps for the kind
  /// that are not already there. An unknown kind uses "other". The screen shows some at first.
  public static func steps(for kindId: String, pastedText: String, in content: Content) -> [String]
  {
    let kind =
      content.kinds.first { $0.id == kindId }
      ?? content.kinds.first { $0.id == "other" }
    var result = listItems(in: pastedText, stepLength: content.limits.stepLength)
    for starter in kind?.starterSteps ?? [] where !result.contains(starter) {
      result.append(starter)
    }
    return result
  }

  /// Puts the two-minute step first, once. Returns a new list.
  public static func withTwoMinuteStart(_ steps: [String], in content: Content) -> [String] {
    [content.twoMinuteStep] + steps.filter { $0 != content.twoMinuteStep }
  }

  private static func listItem(_ line: String) -> String? {
    var rest = Substring(Text.trimmed(line))
    if let first = rest.first, first == "-" || first == "*" || first == "•" {
      rest = rest.dropFirst()
    } else {
      let digits = rest.prefix { $0.isASCII && $0.isNumber }
      guard !digits.isEmpty else { return nil }
      rest = rest.dropFirst(digits.count)
      guard let mark = rest.first, mark == "." || mark == ")" else { return nil }
      rest = rest.dropFirst()
    }
    guard let space = rest.first, space.isWhitespace else { return nil }
    let item = Text.trimmed(String(rest))
    return item.isEmpty ? nil : item
  }
}
