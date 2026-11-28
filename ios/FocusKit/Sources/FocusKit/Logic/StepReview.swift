import Foundation

/// A question the app may ask about one step. Never a judgement of the student.
public enum StepNote: Equatable, Sendable {
  case tooLong
  case vague
}

public enum StepReview {
  /// The note for one step, or nil. An empty step gets none (the editor drops it at Start).
  /// A single word that is not on the vague list is not flagged, so typing a first word is calm.
  public static func note(for text: String, in content: Content) -> StepNote? {
    let trimmed = Text.trimmed(text)
    guard !trimmed.isEmpty else { return nil }
    let words = trimmed.split(whereSeparator: { $0.isWhitespace })
    if words.count > content.stepReview.maxWords { return .tooLong }
    let plain = trimmed.lowercased().trimmingCharacters(in: .punctuationCharacters)
    if content.stepReview.vaguePhrases.contains(plain) { return .vague }
    return nil
  }

  // MARK: Requirements (S3)

  /// Lower case; letters and digits only; single spaces.
  public static func normalized(_ text: String) -> String {
    text.lowercased().split(whereSeparator: { !$0.isLetter && !$0.isNumber }).joined(separator: " ")
  }

  /// The whole words of a text, in order.
  static func tokens(_ text: String) -> [String] {
    normalized(text).split(separator: " ").map(String.init)
  }

  /// True when the words of `phrase` appear as one run, in order, among the words of `text`.
  /// Whole words only: "rap" is not found in "paragraph".
  public static func containsWords(_ text: String, _ phrase: String) -> Bool {
    let whole = tokens(text)
    let wanted = tokens(phrase)
    guard !wanted.isEmpty, wanted.count <= whole.count else { return false }
    return (0...(whole.count - wanted.count)).contains { start in
      Array(whole[start..<(start + wanted.count)]) == wanted
    }
  }

  /// A word with a plain plural "s" taken off, so "sources" and "source" match. Short words stay.
  static func stem(_ word: String) -> String {
    word.count > 4 && word.hasSuffix("s") && !word.hasSuffix("ss") ? String(word.dropLast()) : word
  }

  /// The key words of a requirement: four or more letters, or any number, not on the stop list.
  public static func keyWords(_ requirement: String, in content: Content) -> [String] {
    tokens(requirement).filter { word in
      (word.count >= 4 || word.allSatisfy(\.isNumber))
        && !content.stepReview.stopWords.contains(word)
    }.map(stem)
  }

  /// The requirements that no single step covers. A step covers a requirement only when it
  /// contains all of the requirement's key words. A requirement with no key words is never reported.
  public static func uncovered(_ requirements: [String], steps: [String], in content: Content)
    -> [String]
  {
    let stepWords = steps.map { Set(tokens($0).map(stem)) }
    return requirements.filter { requirement in
      let keys = keyWords(requirement, in: content)
      guard !keys.isEmpty else { return false }
      return !stepWords.contains { words in keys.allSatisfy { words.contains($0) } }
    }
  }
}
