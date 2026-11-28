import Foundation

/// What the app has learned about how a student works, kept on this iPhone only (`learner.json`).
/// Every line is the student's own words or a plain app summary. Nothing here holds a diagnosis,
/// a name, a school, or a teacher (AGENTS.md rules 3 and 4). Writers arrive in later slices; this
/// type only stores, limits and reads back what it is given.
public struct LearnerRecord: Storable {
  public static let fileName = "learner.json"

  // Caps. Newest entries are kept; the oldest are dropped on save.
  public static let settingLimit = 40
  public static let patternLimit = 30
  public static let obstacleLimit = 200
  public static let reflectionLimit = 26
  public static let courseLimit = 20
  public static let feedbackLimit = 500
  /// One line per assignment, for What I did. Newest kept.
  public static let progressLimit = 100
  /// Feedback lines kept for one move, newest first, so a busy move cannot push out another's.
  public static let feedbackPerMoveLimit = 100
  /// Ids of lines the student deleted, so a later writer does not put one back. Ids only.
  public static let deletedLimit = 200
  /// One line, in UTF-16 units, as the other stored text.
  public static let entryLength = 300
  /// The class label, in UTF-16 units (MEMORY-plan 2.2).
  public static let courseLabelLength = 40
  /// Course lines kept for one class label.
  public static let perClassCourseLimit = 10
  /// The most kept steps written into one course line.
  public static let courseStepLimit = 8

  public enum Kind: String, Codable, Equatable, Sendable, CaseIterable {
    case setting, pattern, obstacle, reflection, course, feedback, progress
  }

  public enum Source: String, Codable, Equatable, Sendable {
    case app, student, confirmed
  }

  public struct Entry: Codable, Equatable, Sendable, Identifiable {
    public var id: String
    public var kind: Kind
    public var date: Date
    public var text: String
    public var source: Source
    public var tags: [Tag]

    /// The class label for a course line (cut to 40, blank is none). Only course lines have one.
    public var courseLabel: String?
    /// For a course line: how many Stuck taps and effective Drifted taps the assignment had.
    public var stuckCount: Int?
    public var driftedCount: Int?

    public init(
      id: String = UUID().uuidString, kind: Kind, date: Date, text: String, source: Source,
      tags: [Tag] = [], courseLabel: String? = nil, stuckCount: Int? = nil,
      driftedCount: Int? = nil
    ) {
      self.id = id
      self.kind = kind
      self.date = date
      self.text = Entry.clean(text)
      self.source = source
      self.tags = tags
      self.courseLabel = Entry.cleanLabel(courseLabel)
      self.stuckCount = stuckCount
      self.driftedCount = driftedCount
    }

    private enum CodingKeys: String, CodingKey {
      case id, kind, date, text, source, tags, courseLabel, stuckCount, driftedCount
    }

    /// A line read from a file goes through the same cut and trim as one made in the app. Tags
    /// this build does not know are dropped; the line itself is kept.
    public init(from decoder: Decoder) throws {
      let values = try decoder.container(keyedBy: CodingKeys.self)
      id = try values.decode(String.self, forKey: .id)
      kind = try values.decode(Kind.self, forKey: .kind)
      date = try values.decode(Date.self, forKey: .date)
      text = Entry.clean(try values.decode(String.self, forKey: .text))
      source = try values.decode(Source.self, forKey: .source)
      let names = try values.decodeIfPresent([String].self, forKey: .tags) ?? []
      tags = names.compactMap { Tag(rawValue: $0) }
      courseLabel = Entry.cleanLabel(try values.decodeIfPresent(String.self, forKey: .courseLabel))
      stuckCount = try values.decodeIfPresent(Int.self, forKey: .stuckCount)
      driftedCount = try values.decodeIfPresent(Int.self, forKey: .driftedCount)
    }

    /// Cut to the class-label limit but not trimmed, so a space typed mid-word is kept.
    public static func cutLabel(_ label: String) -> String {
      Text.cut(label, to: LearnerRecord.courseLabelLength)
    }

    /// Trimmed and cut to the class-label limit; blank or missing is nil.
    public static func cleanLabel(_ label: String?) -> String? {
      guard let label else { return nil }
      let cut = Text.trimmed(Text.cut(Text.trimmed(label), to: LearnerRecord.courseLabelLength))
      return cut.isEmpty ? nil : cut
    }

    private static func clean(_ text: String) -> String {
      Text.trimmed(Text.cut(Text.trimmed(text), to: LearnerRecord.entryLength))
    }
  }

  /// The fixed tags the app may put on a line (MEMORY-plan 2.3). Parameterised tags such as
  /// `course:<id>` arrive with the writers in M0b. Never free text from an AI.
  public enum Tag: String, Codable, Equatable, Sendable, CaseIterable {
    case starting, stuck, drifting, finishing, time, place, sound
  }

  public var entries: [Entry]
  /// Ids of deleted lines, oldest first. Empty for most students and then not written to the file.
  public var deleted: [String]

  public init(entries: [Entry] = [], deleted: [String] = []) {
    self.entries = entries
    self.deleted = deleted
  }

  private enum CodingKeys: String, CodingKey {
    case entries, deleted
  }

  public func encode(to encoder: Encoder) throws {
    var values = encoder.container(keyedBy: CodingKeys.self)
    try values.encode(entries, forKey: .entries)
    if !deleted.isEmpty { try values.encode(deleted, forKey: .deleted) }
  }

  /// A file with no entries, or with an entry of a kind or source this build does not know,
  /// loads with those entries left out. It never crashes.
  public init(from decoder: Decoder) throws {
    let values = try decoder.container(keyedBy: CodingKeys.self)
    let lenient = try values.decodeIfPresent([Lenient].self, forKey: .entries) ?? []
    entries = lenient.compactMap(\.entry)
    // Lenient like the entries: a damaged list is empty and never sets the whole file aside.
    let ids = (try? values.decode([String].self, forKey: .deleted)) ?? []
    deleted = Array(ids.suffix(Self.deletedLimit))
  }

  /// Read one entry, or nil if it is not one this build understands.
  private struct Lenient: Decodable {
    let entry: Entry?

    init(from decoder: Decoder) throws {
      entry = try? Entry(from: decoder)
    }
  }

  /// Keeps the newest entries of each kind up to that kind's cap, and drops blank text. Course
  /// lines are also kept to `perClassCourseLimit` for each class label, newest first. A busy
  /// class can therefore use up the overall course cap and push out a quiet class's lines.
  public func limited(by _: Content.Limits) -> LearnerRecord {
    var kept: [Entry] = []
    for kind in Kind.allCases {
      var ofKind = entries.filter { $0.kind == kind && !$0.text.isEmpty }
        .sorted { $0.date > $1.date }
      if kind == .feedback {
        var perMove: [String: Int] = [:]
        ofKind = ofKind.filter { entry in
          let move = Feedback.parse(entry)?.move ?? ""
          let seen = perMove[move, default: 0] + 1
          perMove[move] = seen
          return seen <= Self.feedbackPerMoveLimit
        }
      }
      if kind == .course {
        var perClass: [String: Int] = [:]
        ofKind = ofKind.filter { entry in
          let key = (entry.courseLabel ?? "").lowercased()
          let seen = perClass[key, default: 0] + 1
          perClass[key] = seen
          return seen <= Self.perClassCourseLimit
        }
      }
      kept += ofKind.prefix(Self.cap(for: kind))
    }
    return LearnerRecord(
      entries: kept.sorted { $0.date < $1.date },
      deleted: Array(deleted.suffix(Self.deletedLimit)))
  }

  public static func cap(for kind: Kind) -> Int {
    switch kind {
    case .setting: settingLimit
    case .pattern: patternLimit
    case .obstacle: obstacleLimit
    case .reflection: reflectionLimit
    case .course: courseLimit
    case .feedback: feedbackLimit
    case .progress: progressLimit
    }
  }

  public func entries(of kind: Kind) -> [Entry] {
    entries.filter { $0.kind == kind }
  }

  /// Adds one entry. Caps are applied when the record is saved, not here.
  public mutating func add(_ entry: Entry) {
    entries.append(entry)
  }

  public mutating func remove(id: String) {
    entries.removeAll { $0.id == id }
  }

  /// Remembers that the student deleted this line, so it is not written back.
  public mutating func markDeleted(_ id: String) {
    deleted.removeAll { $0 == id }
    deleted.append(id)
    deleted = Array(deleted.suffix(Self.deletedLimit))
  }

  public func wasDeleted(_ id: String) -> Bool {
    deleted.contains(id)
  }
}
