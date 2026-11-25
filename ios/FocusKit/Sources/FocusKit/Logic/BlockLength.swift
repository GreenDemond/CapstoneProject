import Foundation

/// The work-block lengths on the timer, and what the student's own answers say about them (R5).
/// Every number here is worked out from the lines in the record each time, so deleting an answer
/// takes effect at once and nothing is counted separately.
public enum BlockLength {
  /// The timer menu's lengths, shortest first. Five lets "Shorter" at 12 minutes change something.
  public static let lengths = [5, 12, 25]

  public enum Answer: String, CaseIterable, Sendable {
    case shorter, aboutRight, longer
  }

  /// A saved answer: the length tried and how it felt.
  public struct Saved: Equatable, Sendable {
    public let minutes: Int
    public let answer: Answer
    public let date: Date
  }

  /// The most recent answers for one length that count, and how far back they count.
  public static let window = 5
  public static let days = 30
  /// At least this many of the window must point the same way, and none the other way.
  public static let needed = 3
  /// A question is only raised within this many seconds of the countdown ending.
  public static let freshSeconds: TimeInterval = 120

  /// Which answers are offered at a length. Shorter is not offered at the shortest and Longer not at
  /// the longest: those answers could never change anything.
  public static func offers(_ answer: Answer, at minutes: Int) -> Bool {
    switch answer {
    case .shorter: minutes != lengths.first
    case .aboutRight: true
    case .longer: minutes != lengths.last
    }
  }

  /// The text of the record line for one answer, for example "12-minute block: too long".
  public static func text(minutes: Int, answer: Answer) -> String {
    let feel: String
    switch answer {
    case .shorter: feel = "too long"
    case .aboutRight: feel = "about right"
    case .longer: feel = "too short"
    }
    return "\(minutes)-minute block: \(feel)"
  }

  /// Reads a record line back. Nil when it is not an answer line.
  public static func parse(_ entry: LearnerRecord.Entry) -> Saved? {
    guard entry.kind == .setting,
      let match = entry.text.wholeMatch(
        of: /(\d+)-minute block: (too long|about right|too short)/),
      let minutes = Int(match.1)
    else { return nil }
    let answer: Answer =
      match.2 == "too long" ? .shorter : (match.2 == "too short" ? .longer : .aboutRight)
    return Saved(minutes: minutes, answer: answer, date: entry.date)
  }

  /// The length the student's answers point to, or nil. For one length: at least three of its
  /// newest five answers from the last 30 days point the same way, and none the other way. Too long
  /// points to the next shorter length, too short to the next longer one. If two lengths each
  /// point somewhere, the one with the newest answer wins.
  public static func suggested(in record: LearnerRecord, now: Date) -> Int? {
    let oldest = now.addingTimeInterval(-Double(days) * 86_400)
    let all = record.entries(of: .setting).compactMap(parse).filter { $0.date >= oldest }
    var best: (target: Int, newest: Date)?
    for (index, length) in lengths.enumerated() {
      let recent = all.filter { $0.minutes == length }.sorted { $0.date > $1.date }.prefix(window)
      let tooLong = recent.filter { $0.answer == .shorter }.count
      let tooShort = recent.filter { $0.answer == .longer }.count
      var target: Int?
      if tooLong >= needed && tooShort == 0, index > 0 { target = lengths[index - 1] }
      if tooShort >= needed && tooLong == 0, index < lengths.count - 1 {
        target = lengths[index + 1]
      }
      if let target, let newest = recent.first?.date, newest > (best?.newest ?? .distantPast) {
        best = (target, newest)
      }
    }
    return best?.target
  }

  /// Whether to raise the question: the countdown has ended, and not long ago.
  public static func shouldAsk(end: Date, now: Date) -> Bool {
    now >= end && now.timeIntervalSince(end) <= freshSeconds
  }
}
