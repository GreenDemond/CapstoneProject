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
}
