import Foundation

/// What I did (PROG1): one plain line per assignment and the counts read from those lines. The
/// lines say only what happened. Nothing here says better, worse, late or missed, and nothing is a
/// score, a percentage or a streak.
public enum WhatIDid {
  /// How far back the screen looks, by the day the steps reached the editor.
  public static let days = 30
  /// A first step done on the planning day or the next one counts as soon after planning.
  public static let soonDays = 1

  /// One assignment as it stands now.
  public struct Line: Equatable, Sendable {
    public let planned: Int
    public let finished: Int
    /// Whether the first step was done the same or the next local day after planning. The student
    /// never reads a number of days (the never-shame words test).
    public let firstStepSoon: Bool
    public let suggested: Bool
    public let date: Date
  }

  /// The id of an assignment's line: one line per assignment, rewritten as steps are done.
  public static func id(for assignmentId: String) -> String { "progress-\(assignmentId)" }

  /// Whole calendar days from `planned` to `first`, never negative (a clock that went backwards
  /// counts as zero, never as an early start).
  public static func days(from planned: Date, to first: Date, calendar: Calendar = .current) -> Int
  {
    let start = calendar.startOfDay(for: planned)
    let end = calendar.startOfDay(for: first)
    return max(calendar.dateComponents([.day], from: start, to: end).day ?? 0, 0)
  }

  private static func steps(_ count: Int) -> String { count == 1 ? "1 step" : "\(count) steps" }

  /// The text of the line. Fixed shape so it can be read back. It never says how many days, and it
  /// says nothing about a first step that was not soon: a missing sentence is not a judgement.
  public static func text(
    planned: Int, finished: Int, firstStepSoon: Bool, suggested: Bool
  ) -> String {
    var parts = ["Planned \(steps(planned))", "Finished \(finished)"]
    if firstStepSoon { parts.append("First step done soon after planning") }
    parts.append(suggested ? "Steps from a suggestion" : "Steps written by you")
    return parts.joined(separator: ". ") + "."
  }

  /// Reads a line back. Nil for any other text, so a damaged line is ignored.
  public static func parse(_ entry: LearnerRecord.Entry) -> Line? {
    guard entry.kind == .progress,
      let match = entry.text.wholeMatch(
        of:
          /Planned (\d+) steps?\. Finished (\d+)\. (First step done soon after planning\. )?(Steps from a suggestion|Steps written by you)\./
      ),
      let planned = Int(match.1), let finished = Int(match.2)
    else { return nil }
    return Line(
      planned: planned, finished: finished, firstStepSoon: match.3 != nil,
      suggested: match.4 == "Steps from a suggestion", date: entry.date)
  }

  /// The counts for the last 30 days, by the day each assignment's steps reached the editor.
  public struct Summary: Equatable, Sendable {
    public let assignments: Int
    public let stepsFinished: Int
    /// Assignments whose first step was done the same day or the next day after planning.
    public let firstStepSoon: Int
    public let fromSuggestion: Int
    public let writtenByStudent: Int

    public var isEmpty: Bool { assignments == 0 }
  }

  public static func summary(in record: LearnerRecord, now: Date) -> Summary {
    let oldest = now.addingTimeInterval(-Double(days) * 86_400)
    let lines = record.entries(of: .progress).compactMap(parse).filter { $0.date >= oldest }
    return Summary(
      assignments: lines.count, stepsFinished: lines.map(\.finished).reduce(0, +),
      firstStepSoon: lines.filter(\.firstStepSoon).count,
      fromSuggestion: lines.filter(\.suggested).count,
      writtenByStudent: lines.filter { !$0.suggested }.count)
  }

  /// Whether any line exists at all, so the screen can tell "nothing yet" from "nothing lately".
  public static func hasAny(in record: LearnerRecord) -> Bool {
    record.entries(of: .progress).contains { parse($0) != nil }
  }
}
