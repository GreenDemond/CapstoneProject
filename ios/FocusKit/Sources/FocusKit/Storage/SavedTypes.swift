import Foundation

// What the app saves. None of these types has a place for audio, a name, an age, a school, or a
// diagnosis (AGENTS.md rules 3 and 4). Each one is its own file.

/// The steps being worked on, and what they are for.
public struct SavedWork: Storable {
  public static let fileName = "work.json"

  public var work: Work
  public var kindId: String?
  /// When the student last used the steps. Used for the welcome line only.
  public var savedOn: Date?
  /// The optional "How will I know it's done?" line, by step number.
  public var doneLines: [String: String]

  public init(
    work: Work, kindId: String? = nil, savedOn: Date? = nil, doneLines: [String: String] = [:]
  ) {
    self.work = work
    self.kindId = kindId
    self.savedOn = savedOn
    self.doneLines = doneLines
  }

  private enum CodingKeys: String, CodingKey {
    case work, kindId, savedOn, doneLines
  }

  public init(from decoder: Decoder) throws {
    let values = try decoder.container(keyedBy: CodingKeys.self)
    work = try values.decode(Work.self, forKey: .work)
    kindId = try values.decodeIfPresent(String.self, forKey: .kindId)
    savedOn = try values.decodeIfPresent(Date.self, forKey: .savedOn)
    doneLines = try values.decodeIfPresent([String: String].self, forKey: .doneLines) ?? [:]
  }

  /// Drops steps that are blank or have a bad or repeated number, cuts long steps, keeps at most
  /// the saved-step limit, and repairs the next step number.
  public func limited(by limits: Content.Limits) -> SavedWork {
    var seen = Set<Int>()
    var steps: [Step] = []
    for step in work.steps.prefix(limits.savedSteps) {
      let text = Text.trimmed(Text.cut(step.text, to: limits.savedStepLength))
      guard step.id >= 0, !text.isEmpty, seen.insert(step.id).inserted else { continue }
      steps.append(Step(id: step.id, text: text, done: step.done))
    }
    let highest = steps.map(\.id).max() ?? -1
    let nextId = work.nextId > highest ? work.nextId : highest + 1
    var copy = self
    copy.work = Work(steps: steps, nextId: nextId)
    let ids = Set(steps.map { String($0.id) })
    copy.doneLines = doneLines.filter { ids.contains($0.key) }
      .mapValues { Text.cut($0, to: limits.stepLength) }
    return copy
  }
}

public struct Note: Codable, Equatable, Sendable, Identifiable {
  public var id: String
  public var text: String
  public var date: Date

  public init(id: String = UUID().uuidString, text: String, date: Date) {
    self.id = id
    self.text = text
    self.date = date
  }
}

/// The student's goals and private notes ("What got in the way?"). Notes are newest first.
public struct Profile: Storable {
  public static let fileName = "profile.json"
  public static let goalLength = 500
  public static let noteLength = 1000
  public static let noteCount = 200

  public var goalToday: String
  public var goalWeek: String
  public var goalMonth: String
  public var goalYear: String
  public var notes: [Note]

  public init(
    goalToday: String = "", goalWeek: String = "", goalMonth: String = "", goalYear: String = "",
    notes: [Note] = []
  ) {
    self.goalToday = goalToday
    self.goalWeek = goalWeek
    self.goalMonth = goalMonth
    self.goalYear = goalYear
    self.notes = notes
  }

  public func limited(by limits: Content.Limits) -> Profile {
    func goal(_ text: String) -> String { Text.cut(text, to: Profile.goalLength) }
    return Profile(
      goalToday: goal(goalToday), goalWeek: goal(goalWeek), goalMonth: goal(goalMonth),
      goalYear: goal(goalYear),
      notes: notes.prefix(Profile.noteCount).compactMap { note in
        let text = Text.trimmed(Text.cut(note.text, to: Profile.noteLength))
        return text.isEmpty ? nil : Note(id: note.id, text: text, date: note.date)
      })
  }
}

/// Settings. Reply length and guide are per kind of work; "all" is the fallback.
///
/// Voice is two independent switches (DECISIONS D7): `readAloud` (the app speaks) and `talk` (the
/// student speaks into the microphone; speech becomes text on the phone and nothing is recorded).
/// Both are off until the student turns them on.
public struct Settings: Storable {
  public static let fileName = "settings.json"

  public var readAloud: Bool
  public var talk: Bool
  public var headphonesOnly: Bool
  public var voiceId: String?
  public var speechRate: Double
  public var guides: [String: String]
  public var lengths: [String: String]
  /// Answers to the "How I like to work" questions, by question id.
  public var howILikeToWork: [String: String]
  /// "Include in my iPhone backup". On unless the student turns it off, and on for settings saved
  /// before this existed (DECISIONS: Backup, 2026-11-21).
  public var includeInBackup: Bool
  /// The student's own AI services: up to five. The keys are NOT here; each is only in the
  /// Keychain (`KeyStore`), under an account made from the service's id. The label, address and
  /// model are not secret.
  public var ownAIServices: [OwnAIService]
  /// The id of the service chosen on Talk, or nil for the AI on this iPhone.
  public var chosenServiceId: String?
  /// True only for settings read from build 5's single service: the list was made from the old
  /// fields and the app should save it and move the old key. Never written.
  public var movedFromSingleService = false

  public init(
    readAloud: Bool = false, talk: Bool = false, headphonesOnly: Bool = true,
    voiceId: String? = nil,
    speechRate: Double = 0.5, guides: [String: String] = [:], lengths: [String: String] = [:],
    howILikeToWork: [String: String] = [:], includeInBackup: Bool = true,
    ownAIServices: [OwnAIService] = [], chosenServiceId: String? = nil
  ) {
    self.readAloud = readAloud
    self.talk = talk
    self.headphonesOnly = headphonesOnly
    self.voiceId = voiceId
    self.speechRate = speechRate
    self.guides = guides
    self.lengths = lengths
    self.howILikeToWork = howILikeToWork
    self.includeInBackup = includeInBackup
    self.ownAIServices = ownAIServices
    self.chosenServiceId = chosenServiceId
  }

  private enum CodingKeys: String, CodingKey {
    case readAloud, talk, voiceMode, headphonesOnly, voiceId, speechRate, guides, lengths
    case howILikeToWork, includeInBackup, ownAIServices, chosenServiceId
    // Build 5's single service. Read, never written.
    case ownAIOn, ownAIEndpoint, ownAIModelId, ownAIChosen
  }

  /// Reads the two switches. Settings saved before D7 have a single `voiceMode` word instead:
  /// quiet is both off, iTalk is Talk only, weTalk is both on. A missing or unknown word means
  /// both off (silent), never a crash and never a lost setting.
  public init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    let legacy = (try? c.decodeIfPresent(String.self, forKey: .voiceMode)) ?? nil
    let legacyRead = legacy == "weTalk"
    let legacyTalk = legacy == "iTalk" || legacy == "weTalk"
    self.readAloud = (try? c.decodeIfPresent(Bool.self, forKey: .readAloud)) ?? legacyRead
    self.talk = (try? c.decodeIfPresent(Bool.self, forKey: .talk)) ?? legacyTalk
    self.headphonesOnly = try c.decodeIfPresent(Bool.self, forKey: .headphonesOnly) ?? true
    self.voiceId = try c.decodeIfPresent(String.self, forKey: .voiceId)
    self.speechRate = try c.decodeIfPresent(Double.self, forKey: .speechRate) ?? 0.5
    self.guides = try c.decodeIfPresent([String: String].self, forKey: .guides) ?? [:]
    self.lengths = try c.decodeIfPresent([String: String].self, forKey: .lengths) ?? [:]
    self.howILikeToWork =
      try c.decodeIfPresent([String: String].self, forKey: .howILikeToWork) ?? [:]
    self.includeInBackup = (try? c.decodeIfPresent(Bool.self, forKey: .includeInBackup)) ?? true
    let listed = try? c.decodeIfPresent([LossyService].self, forKey: .ownAIServices)
    if let listed {
      self.ownAIServices = listed.compactMap(\.service)
      self.chosenServiceId = (try? c.decodeIfPresent(String.self, forKey: .chosenServiceId)) ?? nil
    } else {
      // Settings saved by build 5: one service in four fields. It becomes the first entry.
      let endpoint = (try? c.decodeIfPresent(String.self, forKey: .ownAIEndpoint)) ?? ""
      let model = (try? c.decodeIfPresent(String.self, forKey: .ownAIModelId)) ?? ""
      if !Text.trimmed(endpoint).isEmpty || !Text.trimmed(model).isEmpty {
        let service = OwnAIService(
          id: UUID().uuidString, label: OwnAIService.migratedLabel, endpoint: endpoint,
          modelId: model)
        let on = (try? c.decodeIfPresent(Bool.self, forKey: .ownAIOn)) ?? false
        let chosen = (try? c.decodeIfPresent(Bool.self, forKey: .ownAIChosen)) ?? false
        self.ownAIServices = [service]
        self.chosenServiceId = on && chosen ? service.id : nil
        self.movedFromSingleService = true
      } else {
        self.ownAIServices = []
        self.chosenServiceId = nil
      }
    }
    self = limitedServices()
  }

  /// One saved service that may be damaged: a bad entry is dropped, never a crash.
  private struct LossyService: Decodable {
    var service: OwnAIService?
    init(from decoder: Decoder) throws {
      service = try? OwnAIService(from: decoder)
    }
  }

  public func encode(to encoder: Encoder) throws {
    var c = encoder.container(keyedBy: CodingKeys.self)
    try c.encode(readAloud, forKey: .readAloud)
    try c.encode(talk, forKey: .talk)
    try c.encode(headphonesOnly, forKey: .headphonesOnly)
    try c.encodeIfPresent(voiceId, forKey: .voiceId)
    try c.encode(speechRate, forKey: .speechRate)
    try c.encode(guides, forKey: .guides)
    try c.encode(lengths, forKey: .lengths)
    try c.encode(howILikeToWork, forKey: .howILikeToWork)
    try c.encode(includeInBackup, forKey: .includeInBackup)
    try c.encode(ownAIServices, forKey: .ownAIServices)
    try c.encodeIfPresent(chosenServiceId, forKey: .chosenServiceId)
  }

  public func limited(by limits: Content.Limits) -> Settings {
    var copy = self
    copy.speechRate = speechRate.isFinite ? min(1, max(0, speechRate)) : 0.5
    copy.guides = guides.mapValues { Text.cut($0, to: limits.guide) }
    copy.howILikeToWork = howILikeToWork.mapValues { Text.cut($0, to: 100) }
    return copy.limitedServices()
  }

  /// Keeps the services well formed: a label (cut to length), no repeated id, at most five, and a
  /// chosen id that points at a service in the list.
  fileprivate func limitedServices() -> Settings {
    var copy = self
    var seen = Set<String>()
    var kept: [OwnAIService] = []
    for service in ownAIServices {
      var s = service
      s.label = Text.cut(Text.trimmed(s.label), to: OwnAIService.labelLimit)
      s.endpoint = Text.cut(s.endpoint, to: OwnAIConfig.addressLimit)
      s.modelId = Text.cut(s.modelId, to: OwnAIConfig.modelLimit)
      guard !Text.trimmed(s.id).isEmpty, !s.label.isEmpty, !seen.contains(s.id),
        kept.count < OwnAIService.maxServices
      else { continue }
      seen.insert(s.id)
      kept.append(s)
    }
    copy.ownAIServices = kept
    if let chosen = copy.chosenServiceId, !seen.contains(chosen) { copy.chosenServiceId = nil }
    return copy
  }
}

/// One AI service the student entered. The key is not here.
public struct OwnAIService: Codable, Equatable, Sendable, Identifiable {
  public static let maxServices = 5
  public static let labelLimit = 30
  /// The label for the service made from build 5's single setting.
  public static let migratedLabel = "My service"

  /// A UUID that never changes. The key's account is made from it, never from the label.
  public var id: String
  public var label: String
  public var endpoint: String
  public var modelId: String

  public init(id: String = UUID().uuidString, label: String, endpoint: String, modelId: String) {
    self.id = id
    self.label = label
    self.endpoint = endpoint
    self.modelId = modelId
  }

  public var keyAccount: String { KeyAccount.forService(id: id) }
  public var config: OwnAIConfig { OwnAIConfig(address: endpoint, modelName: modelId) }
}

public struct Chat: Codable, Equatable, Sendable, Identifiable {
  public var id: String
  public var kindId: String?
  public var updatedOn: Date
  public var messages: [ChatMessage]

  public init(
    id: String = UUID().uuidString, kindId: String? = nil, updatedOn: Date,
    messages: [ChatMessage]
  ) {
    self.id = id
    self.kindId = kindId
    self.updatedOn = updatedOn
    self.messages = messages
  }
}

/// Up to the chat limit (10) of saved chats, newest first. Older messages that no longer fit the
/// per-chat limit are dropped, newest kept.
public struct SavedChats: Storable {
  public static let fileName = "chats.json"

  public var chats: [Chat]

  public init(chats: [Chat] = []) {
    self.chats = chats
  }

  public func limited(by limits: Content.Limits) -> SavedChats {
    SavedChats(
      chats: chats.prefix(limits.chats).map { chat in
        var copy = chat
        copy.messages = History.trim(chat.messages, limit: limits.chatCharacters)
        copy.messages = copy.messages.map {
          ChatMessage(role: $0.role, text: Text.cut($0.text, to: limits.chatCharacters))
        }
        return copy
      })
  }
}

public struct ParkedThought: Codable, Equatable, Sendable, Identifiable {
  public var id: String
  public var text: String
  public var date: Date

  public init(id: String = UUID().uuidString, text: String, date: Date) {
    self.id = id
    self.text = text
    self.date = date
  }
}

/// Thoughts the student set aside during a step. Newest first.
public struct ParkedThoughts: Storable {
  public static let fileName = "parked.json"
  public static let textLength = 500
  public static let count = 200

  public var items: [ParkedThought]

  public init(items: [ParkedThought] = []) {
    self.items = items
  }

  public func limited(by limits: Content.Limits) -> ParkedThoughts {
    ParkedThoughts(
      items: items.prefix(ParkedThoughts.count).compactMap { item in
        let text = Text.trimmed(Text.cut(item.text, to: ParkedThoughts.textLength))
        return text.isEmpty ? nil : ParkedThought(id: item.id, text: text, date: item.date)
      })
  }
}

public struct RecallAnswer: Codable, Equatable, Sendable, Identifiable {
  public var id: String
  public var stepId: Int?
  public var answer: String
  public var date: Date

  public init(id: String = UUID().uuidString, stepId: Int? = nil, answer: String, date: Date) {
    self.id = id
    self.stepId = stepId
    self.answer = answer
    self.date = date
  }
}

/// The student's answers to the recall question after a reading or study step. Newest first.
public struct RecallAnswers: Storable {
  public static let fileName = "recall.json"
  public static let textLength = 1000
  public static let count = 200

  public var items: [RecallAnswer]

  public init(items: [RecallAnswer] = []) {
    self.items = items
  }

  public func limited(by limits: Content.Limits) -> RecallAnswers {
    RecallAnswers(
      items: items.prefix(RecallAnswers.count).compactMap { item in
        let text = Text.trimmed(Text.cut(item.answer, to: RecallAnswers.textLength))
        return text.isEmpty
          ? nil : RecallAnswer(id: item.id, stepId: item.stepId, answer: text, date: item.date)
      })
  }
}

/// Small facts about the app itself. No personal detail.
public struct Flags: Storable {
  public static let fileName = "flags.json"

  /// The student has seen the first-run screen.
  public var welcomed: Bool
  /// The student was on the work screen when the app closed.
  public var inStep: Bool

  public init(welcomed: Bool = false, inStep: Bool = false) {
    self.welcomed = welcomed
    self.inStep = inStep
  }
}
