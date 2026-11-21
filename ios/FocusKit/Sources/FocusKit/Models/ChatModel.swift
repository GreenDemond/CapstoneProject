import Foundation
import Observation

/// One message on the Talk screen.
public struct ChatTurn: Identifiable, Equatable, Sendable {
  public enum Kind: Equatable, Sendable {
    case normal
    /// The fixed trusted-adult line. Never saved.
    case trustedAdult
    /// One of the app's own calm lines (could not answer, hints only, too long, unavailable).
    case notice
  }

  public let id: UUID
  public var role: ChatRole
  public var text: String
  public var kind: Kind
  public var inProgress: Bool

  public init(
    id: UUID = UUID(), role: ChatRole, text: String, kind: Kind = .normal, inProgress: Bool = false
  ) {
    self.id = id
    self.role = role
    self.text = text
    self.kind = kind
    self.inProgress = inProgress
  }
}

/// The Talk screen: a hints-only chat with the AI on the phone. A message that triggers the
/// trusted-adult line is removed from the screen and never reaches `Store`.
@MainActor
@Observable
public final class ChatModel {
  public private(set) var turns: [ChatTurn] = []
  public var draft = ""
  public private(set) var isReplying = false
  public private(set) var availability: ModelAvailability
  public private(set) var chats: [Chat]
  public private(set) var saveNote: String?
  public private(set) var cutNote: String?
  /// A calm line about the student's own AI service (key not accepted, busy). Never from the service.
  public private(set) var serviceNote: String?
  /// A chat the student asked to delete and has not confirmed yet.
  public private(set) var pendingDelete: String?
  public private(set) var pendingDeleteAll = false

  /// Hands steps from a reply to the editor. Set by the app.
  public var onUseSteps: ([String], String?) -> Void = { _, _ in }
  /// The current settings (guide, reply length). Set by the app.
  public var settings: () -> Settings = { Settings() }
  /// The label of the student's own AI service when one is in use, or nil for the AI on this
  /// iPhone. Set by the app.
  public var ownServiceLabel: () -> String? = { nil }
  /// Whether that service's address starts with http://. Set by the app.
  public var ownServiceUsesHttp: () -> Bool = { false }

  private let content: Content
  private let store: any Store
  private let clock: any AppClock
  private let engine: ChatEngine
  private let speaker: SpeakerModel
  private var chatId = UUID().uuidString
  private var kindId: String?
  private var step: String?
  private var task: Task<Void, Never>?
  private var run = 0

  public init(
    content: Content, store: any Store, clock: any AppClock, model: any LanguageModel,
    speaker: SpeakerModel
  ) {
    self.content = content
    self.store = store
    self.clock = clock
    self.engine = ChatEngine(model: model, content: content)
    self.speaker = speaker
    self.availability = model.availability
    self.chats = store.load(SavedChats.self).value?.chats ?? []
  }

  // MARK: Reading

  /// The fixed opening line. It is not from the AI and is not saved.
  public var openingLine: String { content.chat.openingQuestion }

  public var isAvailable: Bool { availability == .available }

  /// The line at the top of the screen: where the messages go.
  public var privacyLine: String {
    guard let label = ownServiceLabel() else { return Words.talkPrivacy }
    return ownServiceUsesHttp()
      ? Words.talkPrivacyOwnHttp(label: label) : Words.talkPrivacyOwn(label: label)
  }

  public var unavailableLine: String? {
    availability == .available ? nil : Words.aiUnavailable(availability)
  }

  /// Re-reads whether the AI can be used. Call when the screen appears.
  public func refreshAvailability() {
    availability = engine.availability
  }

  public var canSend: Bool {
    isAvailable && !isReplying && !Text.trimmed(draft).isEmpty
  }

  /// The steps in the newest AI reply, when it is a list.
  public var offeredSteps: [String] {
    guard !isReplying,
      let last = turns.last(where: { $0.role == .assistant }), last.kind == .normal
    else { return [] }
    return StepList.extract(from: last.text, limit: content.limits.stepLength)
  }

  // MARK: Chats

  public func newChat() {
    stopAndKeep()
    startFresh(kind: nil, step: nil)
  }

  /// True while the chat is about a step from "Talk it through". Opening Talk from the tab bar
  /// starts a fresh chat when this is true, so an old step does not steer a new conversation.
  public var isAboutAStep: Bool { step != nil }

  /// The step this chat is about, for the "Talking about" line. Nil for a general chat.
  public var stepText: String? { step }

  /// "Talk it through" from Stuck: a new chat that knows the step and the kind of work.
  public func begin(stepText: String, kindId: String?) {
    stopAndKeep()
    startFresh(kind: kindId, step: stepText)
  }

  public func open(_ chat: Chat) {
    stopAndKeep()
    chatId = chat.id
    kindId = chat.kindId
    step = nil
    turns = chat.messages.map { ChatTurn(role: $0.role, text: $0.text) }
    cancelDeletes()
  }

  public func askDelete(_ id: String) {
    pendingDelete = id
    pendingDeleteAll = false
  }

  public func askDeleteAll() {
    pendingDelete = nil
    pendingDeleteAll = true
  }

  public func cancelDeletes() {
    pendingDelete = nil
    pendingDeleteAll = false
  }

  /// The second tap.
  public func confirmDelete() {
    if pendingDeleteAll {
      chats = []
      if turns.isEmpty == false { startFresh(kind: nil, step: nil) }
    } else if let id = pendingDelete {
      chats.removeAll { $0.id == id }
      if id == chatId { startFresh(kind: nil, step: nil) }
    }
    cancelDeletes()
    saveChats()
  }

  // MARK: Sending

  public func send() {
    refreshAvailability()
    let cut = Text.cut(Text.trimmed(draft), to: content.limits.message)
    guard isAvailable, !isReplying, !cut.isEmpty else { return }
    cutNote = Text.trimmed(draft).utf16.count > content.limits.message ? Words.messageCut : nil
    serviceNote = nil
    draft = ""
    turns.append(ChatTurn(role: .user, text: cut))
    turns.append(ChatTurn(role: .assistant, text: "", inProgress: true))
    isReplying = true
    run += 1
    let mine = run
    let history = turns.dropLast().filter { $0.kind != .trustedAdult }
      .map { ChatMessage(role: $0.role, text: $0.text) }
    let context = ChatContext(
      kindLabel: content.kinds.first { $0.id == kindId }?.label ?? "Something else",
      guide: guide(), length: length(), step: step)
    let events = engine.reply(to: Array(history), context: context)
    task = Task { [weak self] in
      for await event in events {
        guard let self, self.run == mine else { return }
        self.handle(event)
      }
      self?.endRun(mine)
    }
  }

  /// Stop mid-reply: nothing more arrives. Nothing is shown until the whole reply has been checked.
  public func stop() {
    guard isReplying else { return }
    stopAndKeep()
    saveChat()
  }

  /// The student left the screen.
  public func leave() {
    stop()
    speaker.stop()
  }

  /// "Use these as my steps": opens the editor, never the work screen.
  public func useAsSteps() {
    let steps = offeredSteps
    guard !steps.isEmpty else { return }
    onUseSteps(steps, kindId)
  }

  // MARK: Inside

  private func handle(_ event: ChatEvent) {
    guard let index = turns.indices.last, turns[index].role == .assistant else { return }
    switch event {
    case .finished(let text):
      turns[index].text = text
      turns[index].inProgress = false
      speaker.speak(text, kind: .reply)
      finishRun()
      saveChat()
    case .trustedAdult:
      // The message and any reply text are removed from the screen and are never saved.
      if index > 0, turns[index - 1].role == .user { turns.remove(at: index - 1) }
      let last = turns.count - 1
      turns[last] = ChatTurn(
        role: .assistant, text: content.safety.line, kind: .trustedAdult)
      speaker.stop()
      speaker.speak(content.safety.line, kind: .trustedAdult)
      finishRun()
    case .answerRefused:
      turns[index] = ChatTurn(role: .assistant, text: Words.aiHintsOnly, kind: .notice)
      speaker.stop()
      finishRun()
      saveChat()
    case .couldNotAnswer:
      if turns[index].text.isEmpty {
        turns[index] = ChatTurn(role: .assistant, text: Words.aiCouldNotAnswer, kind: .notice)
      } else {
        turns[index].inProgress = false
        turns.append(ChatTurn(role: .assistant, text: Words.aiCouldNotAnswer, kind: .notice))
      }
      finishRun()
      saveChat()
    case .tooLong:
      turns[index] = ChatTurn(role: .assistant, text: Words.aiTooLong, kind: .notice)
      finishRun()
      saveChat()
    case .keyNotAccepted, .busy:
      serviceNote = event == .busy ? Words.ownAIBusy : Words.ownAIKeyNotAccepted
      turns.removeLast()
      if let last = turns.last, last.role == .user {
        draft = last.text
        turns.removeLast()
      }
      finishRun()
    case .unavailable(let reason):
      availability = reason
      turns.removeLast()
      if let last = turns.last, last.role == .user {
        draft = last.text
        turns.removeLast()
      }
      finishRun()
    }
  }

  private func endRun(_ mine: Int) {
    guard run == mine, isReplying else { return }
    // The stream ended without a final event (it was cancelled). Keep what was shown.
    stopAndKeep()
  }

  private func finishRun() {
    isReplying = false
    task = nil
  }

  /// Ends the current reply, keeping the text shown so far. An empty reply is dropped.
  private func stopAndKeep() {
    run += 1
    task?.cancel()
    task = nil
    speaker.stop()
    guard isReplying else { return }
    isReplying = false
    if let index = turns.indices.last, turns[index].role == .assistant {
      if Text.trimmed(turns[index].text).isEmpty {
        turns.removeLast()
      } else {
        turns[index].inProgress = false
      }
    }
  }

  private func startFresh(kind: String?, step: String?) {
    chatId = UUID().uuidString
    kindId = kind
    self.step = step
    turns = []
    draft = ""
    cutNote = nil
    serviceNote = nil
    cancelDeletes()
  }

  private func guide() -> String {
    let all = settings()
    return all.guides[kindId ?? ""] ?? all.guides["all"] ?? ""
  }

  private func length() -> String {
    let all = settings()
    return all.lengths[kindId ?? ""] ?? all.lengths["all"] ?? content.chat.defaultLength
  }

  private var savableMessages: [ChatMessage] {
    turns.filter { $0.kind != .trustedAdult && !$0.inProgress && !Text.trimmed($0.text).isEmpty }
      .map { ChatMessage(role: $0.role, text: $0.text) }
  }

  private func saveChat() {
    let messages = savableMessages
    guard !messages.isEmpty else { return }
    let chat = Chat(id: chatId, kindId: kindId, updatedOn: clock.now, messages: messages)
    chats.removeAll { $0.id == chatId }
    chats.insert(chat, at: 0)
    saveChats()
  }

  private func saveChats() {
    do {
      try store.save(SavedChats(chats: chats))
      chats = Array(chats.prefix(content.limits.chats))
      saveNote = nil
    } catch {
      saveNote = Words.couldNotSave
    }
  }

  /// Forgets everything held in memory. Used by "Delete everything on this iPhone".
  public func reset() {
    stopAndKeep()
    chats = []
    startFresh(kind: nil, step: nil)
  }
}
