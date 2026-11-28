import Foundation

/// How a student rated one AI line. Three equal choices: no score, no total shown (M3).
public enum FeedbackRating: String, CaseIterable, Sendable {
  case helped, meh, notthis
}

/// One saved rating, read back from a `feedback` record line.
public struct FeedbackRecord: Equatable, Sendable {
  public let rating: FeedbackRating
  public let move: String
  public let date: Date
}

public enum Feedback {
  /// The text of a `feedback` line: the rating first, then the move. Never empty, and the rating
  /// can never be cut off. Nothing the student typed and nothing the AI said is in it.
  public static func text(_ rating: FeedbackRating, move: String) -> String {
    "\(rating.rawValue) \(move)"
  }

  /// Reads a line back. Nil when the line is not in this shape.
  public static func parse(_ entry: LearnerRecord.Entry) -> FeedbackRecord? {
    guard entry.kind == .feedback else { return nil }
    let parts = entry.text.split(separator: " ", maxSplits: 1).map(String.init)
    guard parts.count == 2, let rating = FeedbackRating(rawValue: parts[0]) else { return nil }
    return FeedbackRecord(rating: rating, move: parts[1], date: entry.date)
  }

  /// The newest ratings for one move, newest first.
  public static func ratings(for move: String, in record: LearnerRecord) -> [FeedbackRecord] {
    record.entries(of: .feedback).compactMap(parse)
      .filter { $0.move == move }
      .sorted { $0.date > $1.date }
  }

  /// The ratings that count: the newest five from the last 30 days.
  public static let window = 5
  public static let days = 30

  /// Whether the move should show its own fixed line first. True when at least three ratings are
  /// in the window and more than half are "meh" or "not this". Three "helped" in a row cannot
  /// leave a majority of the five, so the AI comes first again without a separate rule.
  public static func showFixedFirst(
    move: String, in record: LearnerRecord, now: Date
  ) -> Bool {
    let oldest = now.addingTimeInterval(-Double(days) * 86_400)
    let recent = ratings(for: move, in: record).filter { $0.date >= oldest }.prefix(window)
    guard recent.count >= 3 else { return false }
    let notHelped = recent.filter { $0.rating != .helped }.count
    return notHelped * 2 > recent.count
  }
}
