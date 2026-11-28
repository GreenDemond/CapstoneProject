import Foundation

/// What a move is told about this moment, so the selector can pick lines for it.
public struct SelectorContext: Equatable, Sendable {
  public let moveKey: String
  /// The class label of the current assignment, if any.
  public let course: String?

  public init(moveKey: String, course: String? = nil) {
    self.moveKey = moveKey
    self.course = course
  }
}

/// Picks which learner-record lines a coaching move may see. Pure: the same record and context
/// give the same lines. A move sees only what `coach.moves.<key>.sees` in content.json allows, so
/// gate 2 can review the allow-list in one place. Rules only, no search (MEMORY-plan 3.1).
public enum LearnerSelector {
  /// At most this many lines, and this many UTF-16 characters in all. Oldest dropped first.
  public static let maxLines = 5
  public static let maxCharacters = 600

  /// The record lines for one move, each as a quoted fact line.
  public static func facts(
    context: SelectorContext, record: LearnerRecord, content: Content
  ) -> [String] {
    entries(context: context, record: record, content: content).map {
      CoachText.fact($0.kind.rawValue, $0.text, content: content)
    }
  }

  /// The record lines themselves, newest first, within the budget.
  public static func entries(
    context: SelectorContext, record: LearnerRecord, content: Content
  ) -> [LearnerRecord.Entry] {
    // The step coach is not a coaching move, so its allow-list sits beside its rules.
    let rules =
      context.moveKey == "stepCoach"
      ? content.stepCoach.sees : (content.coach.moves[context.moveKey]?.sees ?? [])
    guard !rules.isEmpty else { return [] }
    var picked: [LearnerRecord.Entry] = []
    for rule in rules {
      guard let kind = LearnerRecord.Kind(rawValue: rule.kind), rule.limit > 0 else { continue }
      let tags = Set(rule.tags.compactMap { LearnerRecord.Tag(rawValue: $0) })
      let matching = record.entries(of: kind)
        .filter { entry in
          if !rule.tags.isEmpty, tags.isDisjoint(with: entry.tags) { return false }
          if rule.thisCourse {
            guard let want = context.course?.lowercased(), !want.isEmpty,
              entry.courseLabel?.lowercased() == want
            else { return false }
          }
          return !entry.text.isEmpty
        }
        .sorted { $0.date > $1.date }
        .prefix(rule.limit)
      for entry in matching where !picked.contains(where: { $0.id == entry.id }) {
        picked.append(entry)
      }
    }
    // Oldest first out, until the budget fits.
    var kept = picked.sorted { $0.date > $1.date }
    func size(_ entries: [LearnerRecord.Entry]) -> Int {
      entries.map { CoachText.fact($0.kind.rawValue, $0.text, content: content) }
        .joined().utf16.count
    }
    while !kept.isEmpty && (kept.count > maxLines || size(kept) > maxCharacters) {
      kept.removeLast()
    }
    return kept
  }
}
