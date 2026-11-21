import FocusKit
import SwiftUI

/// The Talk tab: a hints-only chat with the AI on this iPhone, by typing or by voice.
struct TalkView: View {
  let model: AppModel

  var body: some View {
    NavigationStack {
      ChatScreen(model: model)
        .navigationBarTitleDisplayMode(.inline)
    }
    .accessibilityIdentifier("talk-screen")
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
      Text(Words.talkPrivacy)
        .font(Theme.Typography.small)
        .foregroundStyle(Theme.Palette.quiet)
        .padding(.horizontal, Theme.Space.medium)
        .padding(.vertical, Theme.Space.small)
        .accessibilityIdentifier("talk-privacy")
      conversation
      bottom
    }
    .pageBackground()
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
      if let step, !began {
        began = true
        talk.begin(stepText: step.text, kindId: step.kindId)
      }
    }
    .onDisappear { talk.leave() }
  }

  // MARK: The conversation

  private var conversation: some View {
    ScrollViewReader { proxy in
      ScrollView {
        VStack(alignment: .leading, spacing: Theme.Space.medium) {
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
    .accessibilityLabel(mine ? "You: \(turn.text)" : "AI: \(turn.text)")
    .accessibilityIdentifier(mine ? "talk-you" : "talk-ai")
    .onTapGesture { model.speaker.stop() }
  }

  // MARK: The bottom

  @ViewBuilder
  private var bottom: some View {
    VStack(alignment: .leading, spacing: Theme.Space.small) {
      if let line = talk.unavailableLine {
        Text(verbatim: line)
          .font(Theme.Typography.body)
          .foregroundStyle(Theme.Palette.quiet)
          .accessibilityIdentifier("talk-unavailable")
        NavigationLink {
          if let hints { LadderBody(model: model, ladder: hints, dismiss: {}) }
        } label: {
          Label(Words.talkHints, systemImage: "lightbulb")
            .font(Theme.Typography.button)
            .foregroundStyle(Theme.Palette.ink)
            .frame(maxWidth: .infinity, minHeight: Theme.Space.touch, alignment: .leading)
            .cardStyle()
        }
        .accessibilityIdentifier("talk-hints")
        lookUpLink
      } else {
        if let cut = talk.cutNote {
          Text(cut).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
        }
        MicButton(
          model: model,
          text: Binding(get: { talk.draft }, set: { talk.draft = $0 }),
          onFinished: { if model.voiceMode == .weTalk { talk.send() } })
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
