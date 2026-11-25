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
  /// Called after a note is added or deleted and the save worked, so the learner record can bring
  /// its note lines up to date with the notes.
  public var onNotesSaved: () -> Void = {}

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
    let note = Note(text: text, date: clock.now)
    profile.notes.insert(note, at: 0)
    if saveProfile() { onNotesSaved() }
    return true
  }

  /// Deletes a note. If the save fails the note is put back and the calm save note shows, so a
  /// note is never shown as gone when it is still on the device.
  @discardableResult
  public func deleteNote(_ id: String) -> Bool {
    let before = profile
    profile.notes.removeAll { $0.id == id }
    if saveProfile() {
      onNotesSaved()
      return true
    }
    profile = before
    return false
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
  public var startingCountdownMinutes: Int? {
    learnedCountdownMinutes() ?? firstGuess?.countdownMinutes
  }

  /// What the student's own answers about block length point to. Set by the app, which holds the
  /// record. It wins over the questionnaire's guess.
  public var learnedCountdownMinutes: () -> Int? = { nil }

  /// One plain line when the answers point somewhere, else nil.
  public var learnedLine: String? {
    learnedCountdownMinutes().map { Words.blockLearnedLine($0) }
  }

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

  /// Saves the profile. True when the save worked.
  @discardableResult
  private func saveProfile() -> Bool {
    profile = profile.limited(by: content.limits)
    do {
      try store.save(profile)
      saveNote = nil
      return true
    } catch {
      saveNote = Words.couldNotSave
      return false
    }
  }
}
