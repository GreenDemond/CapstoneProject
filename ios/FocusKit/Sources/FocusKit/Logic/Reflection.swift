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

  /// The label of the third answer's line. The line holds the student's words only, never the goal.
  public static let goalLabel = "Toward my goal"

  /// The goal the look-back uses: this week's, else this month's, else this year's, trimmed. Today's
  /// goal is not used. Nil when none is written (spaces only counts as none).
  public static func goal(in profile: Profile) -> String? {
    for text in [profile.goalWeek, profile.goalMonth, profile.goalYear] {
      let trimmed = Text.trimmed(text)
      if !trimmed.isEmpty { return trimmed }
    }
    return nil
  }

  /// Word stems a reply may not use to say a goal is reached, near, or on track, unless the student
  /// wrote that word themselves (a goal such as "get better at math" can still be restated).
  static let progressStems = [
    "reach", "achiev", "closer", "on track", "behind", "ahead", "succe", "fail", "improv",
    "better", "progress", "getting there", "because of", "paid off", "on target",
  ]

  /// True when the reply uses a progress word the student did not write.
  public static func judgesProgress(_ reply: String, studentText: [String]) -> Bool {
    let said = reply.lowercased()
    // Joined with a line break, so a phrase cannot be made from the end of one answer and the
    // start of the next.
    let theirs = studentText.joined(separator: "\n").lowercased()
    return progressStems.contains { said.contains($0) && !theirs.contains($0) }
  }
}
