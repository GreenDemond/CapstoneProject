import Foundation

/// The weekly look-back (C5): when it is offered and how the student's answers are written down.
public enum Reflection {
  /// Days between look-backs.
  public static let days = 7

  /// Due when seven days have passed since the card was last handled. With no date yet, not due:
  /// the first visit to Plan starts the clock.
  public static func isDue(lastHandled: Date?, now: Date) -> Bool {
    guard let last = lastHandled else { return false }
    return now.timeIntervalSince(last) >= Double(days) * 86_400
  }

  /// The words a record line starts with. The rest is the student's own words.
  public static let helpedLabel = "What helped"
  public static let nextLabel = "To try next"

  public static func line(_ label: String, _ answer: String) -> String {
    "\(label): \(Text.trimmed(answer))"
  }
}
