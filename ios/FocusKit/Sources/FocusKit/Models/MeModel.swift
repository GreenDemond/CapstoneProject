import Foundation
import Observation

public enum Goal: Sendable, CaseIterable {
  case today, week, month, year
}

/// The Me tab: goals, private notes, how I like to work, how the AI talks, voice, privacy, and
/// Delete everything. Settings are changed through the app's one `updateSettings`.
@MainActor
@Observable
public final class MeModel {
  public private(set) var profile: Profile
  public private(set) var saveNote: String?
  /// The student tapped Delete everything once.
  public private(set) var confirmingDelete = false
  public private(set) var eraseNote: String?

  /// Set by the app.
  public var settings: () -> Settings = { Settings() }
  public var change: ((inout Settings) -> Void) -> Void = { _ in }
  public var erase: () -> Bool = { false }

  private let content: Content
  private let store: any Store
  private let clock: any AppClock

  public init(content: Content, store: any Store, clock: any AppClock) {
    self.content = content
    self.store = store
    self.clock = clock
    self.profile = store.load(Profile.self).value ?? Profile()
  }

  // MARK: Goals and notes

  public func goal(_ goal: Goal) -> String {
    switch goal {
    case .today: profile.goalToday
    case .week: profile.goalWeek
    case .month: profile.goalMonth
    case .year: profile.goalYear
    }
  }

  public func setGoal(_ goal: Goal, _ words: String) {
    let text = Text.cut(words, to: Profile.goalLength)
    switch goal {
    case .today: profile.goalToday = text
    case .week: profile.goalWeek = text
    case .month: profile.goalMonth = text
    case .year: profile.goalYear = text
    }
    saveProfile()
  }

  @discardableResult
  public func addNote(_ words: String) -> Bool {
    let text = Text.trimmed(Text.cut(words, to: Profile.noteLength))
    guard !text.isEmpty else { return false }
    profile.notes.insert(Note(text: text, date: clock.now), at: 0)
    saveProfile()
    return true
  }

  public func deleteNote(_ id: String) {
    profile.notes.removeAll { $0.id == id }
    saveProfile()
  }

  // MARK: How I like to work

  public var questions: [Content.Question] { content.howILikeToWork.questions }

  public func answer(_ questionId: String) -> String? {
    settings().howILikeToWork[questionId]
  }

  /// Only an option the question offers is kept.
  public func setAnswer(_ questionId: String, _ value: String) {
    guard let question = questions.first(where: { $0.id == questionId }),
      question.options.contains(where: { $0.value == value })
    else { return }
    change { $0.howILikeToWork[questionId] = value }
  }

  public var firstGuess: FirstGuess? {
    FirstGuess.make(answers: settings().howILikeToWork, in: content)
  }

  /// The countdown length the timer menu marks as the student's starting pick.
  public var startingCountdownMinutes: Int? { firstGuess?.countdownMinutes }

  // MARK: How the AI talks

  public var guide: String { settings().guides["all"] ?? "" }

  public func setGuide(_ words: String) {
    let text = Text.cut(words, to: content.limits.guide)
    change {
      if Text.trimmed(text).isEmpty {
        $0.guides["all"] = nil
      } else {
        $0.guides["all"] = text
      }
    }
  }

  public var lengthId: String { settings().lengths["all"] ?? content.chat.defaultLength }

  public var lengths: [(id: String, label: String)] {
    [
      ("short", content.chat.lengths.short.label), ("medium", content.chat.lengths.medium.label),
      ("long", content.chat.lengths.long.label),
    ]
  }

  public func setLength(_ id: String) {
    guard lengths.contains(where: { $0.id == id }) else { return }
    change { $0.lengths["all"] = id }
  }

  // MARK: Voice

  public func setReadAloud(_ on: Bool) { change { $0.readAloud = on } }
  public func setTalk(_ on: Bool) { change { $0.talk = on } }
  public func setHeadphonesOnly(_ on: Bool) { change { $0.headphonesOnly = on } }
  public func setVoice(_ id: String?) { change { $0.voiceId = id } }
  public func setSpeechRate(_ rate: Double) { change { $0.speechRate = rate } }

  // MARK: Backup

  public var includeInBackup: Bool { settings().includeInBackup }
  public func setIncludeInBackup(_ on: Bool) { change { $0.includeInBackup = on } }

  // MARK: Delete everything

  /// The first tap. Nothing is deleted yet.
  public func askDeleteEverything() {
    confirmingDelete = true
    eraseNote = nil
  }

  public func cancelDelete() {
    confirmingDelete = false
  }

  /// The second tap.
  @discardableResult
  public func confirmDeleteEverything() -> Bool {
    guard confirmingDelete else { return false }
    confirmingDelete = false
    if erase() {
      profile = Profile()
      eraseNote = nil
      return true
    }
    eraseNote = Words.couldNotErase
    return false
  }

  /// Forgets what is held in memory, after everything was deleted.
  public func reset() {
    profile = Profile()
    confirmingDelete = false
    saveNote = nil
  }

  private func saveProfile() {
    do {
      try store.save(profile)
      profile = profile.limited(by: content.limits)
      saveNote = nil
    } catch {
      saveNote = Words.couldNotSave
    }
  }
}
