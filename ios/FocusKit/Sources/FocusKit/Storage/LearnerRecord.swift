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
  /// One line, in UTF-16 units, as the other stored text.
  public static let entryLength = 300

  public enum Kind: String, Codable, Equatable, Sendable, CaseIterable {
    case setting, pattern, obstacle, reflection, course, feedback
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

    public init(
      id: String = UUID().uuidString, kind: Kind, date: Date, text: String, source: Source,
      tags: [Tag] = []
    ) {
      self.id = id
      self.kind = kind
      self.date = date
      self.text = Entry.clean(text)
      self.source = source
      self.tags = tags
    }

    private enum CodingKeys: String, CodingKey {
      case id, kind, date, text, source, tags
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

  public init(entries: [Entry] = []) {
    self.entries = entries
  }

  private enum CodingKeys: String, CodingKey {
    case entries
  }

  /// A file with no entries, or with an entry of a kind or source this build does not know,
  /// loads with those entries left out. It never crashes.
  public init(from decoder: Decoder) throws {
    let values = try decoder.container(keyedBy: CodingKeys.self)
    let lenient = try values.decodeIfPresent([Lenient].self, forKey: .entries) ?? []
    entries = lenient.compactMap(\.entry)
  }

  /// Read one entry, or nil if it is not one this build understands.
  private struct Lenient: Decodable {
    let entry: Entry?

    init(from decoder: Decoder) throws {
      entry = try? Entry(from: decoder)
    }
  }

  /// Keeps only the newest entries of each kind, up to that kind's cap, and drops blank text.
  public func limited(by _: Content.Limits) -> LearnerRecord {
    var kept: [Entry] = []
    for kind in Kind.allCases {
      let ofKind = entries.filter { $0.kind == kind && !$0.text.isEmpty }
        .sorted { $0.date > $1.date }
      kept += ofKind.prefix(Self.cap(for: kind))
    }
    return LearnerRecord(entries: kept.sorted { $0.date < $1.date })
  }

  public static func cap(for kind: Kind) -> Int {
    switch kind {
    case .setting: settingLimit
    case .pattern: patternLimit
    case .obstacle: obstacleLimit
    case .reflection: reflectionLimit
    case .course: courseLimit
    case .feedback: feedbackLimit
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
}
