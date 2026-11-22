import FocusKit
import SwiftUI

/// The Talk tab: a hints-only chat with the AI in use, by typing or by voice.
struct TalkView: View {
  let model: AppModel

  var body: some View {
    NavigationStack {
      ChatScreen(model: model)
        .navigationBarTitleDisplayMode(.inline)
    }
  }
}

/// The conversation. Also opened from Stuck, where it already knows the step.
struct ChatScreen: View {
  let model: AppModel
  /// Set when opened from Stuck: the step and the kind of work.
  var step: (text: String, kindId: String?)?
  @State private var showingChats = false
  @State private var hints: LadderModel?
  @State private var began = false

  private var talk: ChatModel { model.talk }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      if model.ownAI.showsPicker {
        whichAI
      }
      if let line = model.ownAI.fellBackLine {
        Text(verbatim: line)
          .font(Theme.Typography.small)
          .foregroundStyle(Theme.Palette.quiet)
          .padding(.horizontal, Theme.Space.medium)
          .padding(.top, Theme.Space.small)
          .accessibilityIdentifier("talk-fell-back")
      }
      conversation
      if talk.unavailableLine == nil { bottom }
    }
    .pageBackground()
    .keyboardDoneButton()
    .navigationTitle(Words.tabTalk)
    .toolbar {
      ToolbarItemGroup(placement: .topBarTrailing) {
        Button(Words.talkNewChat) { talk.newChat() }
          .accessibilityIdentifier("talk-new")
        Button(Words.talkMyChats) { showingChats = true }
          .accessibilityIdentifier("talk-chats")
      }
    }
    .sheet(isPresented: $showingChats) { ChatListView(talk: talk, close: { showingChats = false }) }
    .onAppear {
      talk.refreshAvailability()
      if hints == nil { hints = model.freshHints() }
      if step == nil, talk.isAboutAStep { talk.newChat() }
      if let step, !began {
        began = true
        talk.begin(stepText: step.text, kindId: step.kindId)
      }
    }
    .onDisappear { talk.leave() }
  }

  // MARK: Which AI

  /// "On this iPhone" first, then each ready service by its label. Always visible, one tap: a
  /// segmented control for up to two services, a menu that shows the choice for more.
  @ViewBuilder
  private var whichAI: some View {
    AIChoicePicker(model: model)
      .padding(.horizontal, Theme.Space.medium)
      .padding(.top, Theme.Space.small)
      .accessibilityIdentifier("talk-which-ai")
  }

  // MARK: The conversation

  private var conversation: some View {
    ScrollViewReader { proxy in
      ScrollView {
        VStack(alignment: .leading, spacing: Theme.Space.medium) {
          header
          if talk.unavailableLine != nil { unavailable }
          Text(talk.openingLine)
            .font(Theme.Typography.body)
            .foregroundStyle(Theme.Palette.ink)
            .frame(maxWidth: .infinity, alignment: .leading)
            .cardStyle()
            .accessibilityIdentifier("talk-opening")
          ForEach(talk.turns) { turn in
            bubble(turn).id(turn.id)
          }
          if !talk.offeredSteps.isEmpty {
            Button(Words.talkUseSteps) { talk.useAsSteps() }
              .buttonStyle(QuietButtonStyle())
              .accessibilityIdentifier("talk-use-steps")
          }
          if let note = talk.saveNote {
            Text(note).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
          }
        }
        .padding(Theme.Space.medium)
      }
      .scrollDismissesKeyboard(.interactively)
      .onChange(of: talk.turns.last?.text) {
        if let id = talk.turns.last?.id { proxy.scrollTo(id, anchor: .bottom) }
      }
    }
  }

  @ViewBuilder
  private func bubble(_ turn: ChatTurn) -> some View {
    let mine = turn.role == .user
    VStack(alignment: .leading, spacing: Theme.Space.tiny) {
      if turn.kind == .trustedAdult {
        Text(verbatim: turn.text)
          .font(Theme.Typography.body)
          .foregroundStyle(Theme.Palette.ink)
          .accessibilityIdentifier("talk-trusted-adult")
      } else if turn.text.isEmpty && turn.inProgress {
        Text(verbatim: "…").foregroundStyle(Theme.Palette.quiet)
          .accessibilityLabel("The AI is thinking")
      } else {
        Text(verbatim: turn.text)
          .font(Theme.Typography.body)
          .foregroundStyle(turn.kind == .notice ? Theme.Palette.quiet : Theme.Palette.ink)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(Theme.Space.medium)
    .background(
      mine ? Theme.Palette.sand : Theme.Palette.card,
      in: RoundedRectangle(cornerRadius: Theme.Space.corner)
    )
    .overlay(
      RoundedRectangle(cornerRadius: Theme.Space.corner)
        .stroke(Theme.Palette.line, lineWidth: Theme.Space.line)
    )
    .accessibilityElement(children: .combine)
    .accessibilityLabel(bubbleLabel(turn, mine: mine))
    .accessibilityIdentifier(bubbleIdentifier(turn, mine: mine))
    .accessibilityAction(named: Text(Words.stopReading)) { model.speaker.stop() }
    .onTapGesture { model.speaker.stop() }
  }

  /// Says who wrote the line. Only the model's own replies are "AI"; the safety line and the app's
  /// notices came from the app.
  private func bubbleLabel(_ turn: ChatTurn, mine: Bool) -> String {
    if mine { return "You: \(turn.text)" }
    switch turn.kind {
    case .trustedAdult: return turn.text
    case .notice: return "App message: \(turn.text)"
    default: return "AI: \(turn.text)"
    }
  }

  /// The combined bubble hides inner identifiers, so the trusted-adult line is named on the bubble.
  private func bubbleIdentifier(_ turn: ChatTurn, mine: Bool) -> String {
    if turn.kind == .trustedAdult { return "talk-trusted-adult" }
    return mine ? "talk-you" : "talk-ai"
  }

  /// Where the messages go, and the step the chat is about. Scrolls with the chat, so it is never
  /// cut off at large text sizes.
  @ViewBuilder
  private var header: some View {
    Text(talk.privacyLine)
      .font(Theme.Typography.small)
      .foregroundStyle(Theme.Palette.quiet)
      .padding(.vertical, Theme.Space.small)
      .accessibilityIdentifier("talk-privacy")
    if let about = talk.stepText {
      HStack(spacing: Theme.Space.small) {
        Text(verbatim: "\(Words.talkingAbout): \(about)")
          .font(Theme.Typography.small)
          .foregroundStyle(Theme.Palette.ink)
          .lineLimit(2)
          .accessibilityIdentifier("talk-about-step")
        Spacer(minLength: 0)
        Button(Words.talkClearStep) { talk.newChat() }
          .buttonStyle(LinkButtonStyle())
          .accessibilityIdentifier("talk-clear-step")
      }
      .padding(.vertical, Theme.Space.small)
    }
  }

  /// No AI on this iPhone right now: one calm line, Try again, hints and Look it up.
  @ViewBuilder
  private var unavailable: some View {
    if let line = talk.unavailableLine {
      Text(verbatim: line)
        .font(Theme.Typography.body)
        .foregroundStyle(Theme.Palette.quiet)
        .accessibilityIdentifier("talk-unavailable")
      Button(Words.tryAgain) { talk.refreshAvailability() }
        .buttonStyle(LinkButtonStyle())
        .accessibilityIdentifier("talk-retry")
      NavigationLink {
        if let hints { LadderBody(model: model, ladder: hints, dismiss: nil) }
      } label: {
        Label(Words.talkHints, systemImage: "lightbulb")
          .font(Theme.Typography.button)
          .foregroundStyle(Theme.Palette.ink)
          .frame(maxWidth: .infinity, minHeight: Theme.Space.touch, alignment: .leading)
          .cardStyle()
      }
      .accessibilityIdentifier("talk-hints")
      lookUpLink
    }
  }

  // MARK: The bottom

  @ViewBuilder
  private var bottom: some View {
    VStack(alignment: .leading, spacing: Theme.Space.small) {
      Group {
        if let note = talk.serviceNote {
          Text(verbatim: note).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
            .accessibilityIdentifier("talk-service-note")
        }
        if let cut = talk.cutNote {
          Text(cut).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
        }
        MicButton(
          model: model,
          text: Binding(get: { talk.draft }, set: { talk.draft = $0 }),
          onFinished: { if model.talkOn && model.readAloudOn { talk.send() } })
        HStack(alignment: .bottom, spacing: Theme.Space.small) {
          TextField(
            Words.talkPlaceholder,
            text: Binding(get: { talk.draft }, set: { talk.draft = $0 }), axis: .vertical
          )
          .font(Theme.Typography.body)
          .lineLimit(1...5)
          .cardStyle()
          .accessibilityLabel(Words.talkPlaceholder)
          .accessibilityIdentifier("talk-input")
          if talk.isReplying {
            Button(Words.talkStop) { talk.stop() }
              .buttonStyle(QuietButtonStyle())
              .frame(maxWidth: Theme.Space.huge * 3)
              .accessibilityIdentifier("talk-stop")
          } else {
            Button(Words.talkSend) { talk.send() }
              .buttonStyle(MainButtonStyle())
              .frame(maxWidth: Theme.Space.huge * 3)
              .disabled(!talk.canSend)
              .accessibilityIdentifier("talk-send")
          }
        }
        lookUpLink
      }
    }
    .padding(Theme.Space.medium)
    .background(Theme.Palette.sand)
  }

  @ViewBuilder
  private var lookUpLink: some View {
    if LookUpModel.isOn {
      NavigationLink {
        LookUpView()
      } label: {
        Label(Words.lookUpTitle, systemImage: "magnifyingglass")
          .font(Theme.Typography.body)
          .foregroundStyle(Theme.Palette.moss)
          .frame(minHeight: Theme.Space.touch, alignment: .leading)
      }
      .accessibilityIdentifier("talk-lookup")
    }
  }
}

/// My chats: the newest ten. Deleting needs a second tap.
struct ChatListView: View {
  let talk: ChatModel
  let close: () -> Void

  var body: some View {
    NavigationStack {
      List {
        if talk.chats.isEmpty {
          Text(Words.talkNoChats).foregroundStyle(Theme.Palette.quiet)
            .listRowBackground(Color.clear)
        }
        ForEach(talk.chats) { chat in
          HStack {
            Button {
              talk.open(chat)
              close()
            } label: {
              Text(verbatim: title(chat))
                .font(Theme.Typography.body)
                .foregroundStyle(Theme.Palette.ink)
                .frame(maxWidth: .infinity, minHeight: Theme.Space.touch, alignment: .leading)
            }
            .accessibilityIdentifier("chat-open")
            Button(talk.pendingDelete == chat.id ? Words.talkDeleteSure : Words.talkDelete) {
              if talk.pendingDelete == chat.id {
                talk.confirmDelete()
              } else {
                talk.askDelete(chat.id)
              }
            }
            .buttonStyle(.borderless)
            .accessibilityIdentifier("chat-delete")
          }
          .listRowBackground(Theme.Palette.card)
        }
        if !talk.chats.isEmpty {
          Button(talk.pendingDeleteAll ? Words.talkDeleteSure : Words.talkDeleteAll) {
            if talk.pendingDeleteAll { talk.confirmDelete() } else { talk.askDeleteAll() }
          }
          .accessibilityIdentifier("chat-delete-all")
          .listRowBackground(Color.clear)
        }
      }
      .scrollContentBackground(.hidden)
      .pageBackground()
      .navigationTitle(Words.talkMyChats)
      .toolbar {
        ToolbarItem(placement: .topBarTrailing) { Button("Done", action: close) }
      }
    }
  }

  private func title(_ chat: Chat) -> String {
    let first = chat.messages.first { $0.role == .user }?.text ?? Words.talkNewChat
    return first.count > 48 ? String(first.prefix(48)) + "…" : first
  }
}
