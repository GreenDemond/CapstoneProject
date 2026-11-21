import FocusKit
import SwiftUI

/// The Me tab: goals, private notes, how I like to work, how the AI talks, voice, about and privacy.
struct MeView: View {
  let model: AppModel
  @State private var note = ""

  private var me: MeModel { model.me }

  var body: some View {
    NavigationStack {
      List {
        goals
        notes
        howILikeToWork
        howTheAITalks
        voice
        Section {
          NavigationLink(Words.meAbout) { AboutView(model: model) }
            .accessibilityIdentifier("me-about")
        }
        .listRowBackground(Theme.Palette.card)
      }
      .scrollContentBackground(.hidden)
      .pageBackground()
      .navigationTitle(Words.tabMe)
      .scrollDismissesKeyboard(.interactively)
    }
  }

  // MARK: Goals

  private var goals: some View {
    Section(Words.meGoals) {
      goalField(Words.meGoalToday, .today, id: "goal-today")
      goalField(Words.meGoalWeek, .week, id: "goal-week")
      goalField(Words.meGoalMonth, .month, id: "goal-month")
      goalField(Words.meGoalYear, .year, id: "goal-year")
    }
    .listRowBackground(Theme.Palette.card)
  }

  private func goalField(_ label: String, _ goal: Goal, id: String) -> some View {
    VStack(alignment: .leading, spacing: Theme.Space.tiny) {
      Text(label).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
      TextField(
        Words.meGoalPlaceholder,
        text: Binding(get: { me.goal(goal) }, set: { me.setGoal(goal, $0) }), axis: .vertical
      )
      .font(Theme.Typography.body)
      .foregroundStyle(Theme.Palette.ink)
      .accessibilityLabel("\(Words.meGoals): \(label)")
      .accessibilityIdentifier(id)
    }
  }

  // MARK: What got in the way

  private var notes: some View {
    Section {
      TextField(Words.meNotePlaceholder, text: $note, axis: .vertical)
        .font(Theme.Typography.body)
        .accessibilityIdentifier("note-text")
      MicButton(model: model, text: $note)
      Button(Words.meAddNote) {
        if me.addNote(note) { note = "" }
      }
      .accessibilityIdentifier("note-add")
      if me.profile.notes.isEmpty {
        Text(Words.meNoNotes).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
      }
      ForEach(me.profile.notes) { item in
        VStack(alignment: .leading, spacing: Theme.Space.tiny) {
          Text(verbatim: item.text).font(Theme.Typography.body).foregroundStyle(Theme.Palette.ink)
          Text(item.date, style: .date).font(Theme.Typography.small).foregroundStyle(
            Theme.Palette.quiet)
        }
        .swipeActions {
          Button(Words.talkDelete, role: .destructive) { me.deleteNote(item.id) }
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("note-row")
      }
      if let saveNote = me.saveNote {
        Text(saveNote).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
      }
    } header: {
      Text(Words.meGotInTheWay)
    } footer: {
      Text(Words.meTrustedAdult)
        .font(Theme.Typography.small)
        .accessibilityIdentifier("me-trusted-adult")
    }
    .listRowBackground(Theme.Palette.card)
  }

  // MARK: How I like to work

  private var howILikeToWork: some View {
    Section(Words.meHowILike) {
      ForEach(me.questions, id: \.id) { question in
        VStack(alignment: .leading, spacing: Theme.Space.tiny) {
          Text(question.text).font(Theme.Typography.body).foregroundStyle(Theme.Palette.ink)
          Picker(
            question.text,
            selection: Binding(
              get: { me.answer(question.id) ?? "" },
              set: { me.setAnswer(question.id, $0) })
          ) {
            Text(Words.meChoose).tag("")
            ForEach(question.options, id: \.value) { Text($0.label).tag($0.value) }
          }
          .pickerStyle(.menu)
          .accessibilityIdentifier("how-\(question.id)")
        }
      }
      if let guess = me.firstGuess {
        VStack(alignment: .leading, spacing: Theme.Space.small) {
          Text(Words.meGuessTitle).font(Theme.Typography.title).foregroundStyle(Theme.Palette.ink)
          ForEach(guess.lines, id: \.self) {
            Text(verbatim: $0).font(Theme.Typography.body).foregroundStyle(Theme.Palette.ink)
          }
          Text(Words.meGuessNote).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
        }
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("first-guess")
      }
    }
    .listRowBackground(Theme.Palette.card)
  }

  // MARK: How the AI talks

  private var howTheAITalks: some View {
    Section {
      TextField(
        Words.meGuidePlaceholder,
        text: Binding(get: { me.guide }, set: { me.setGuide($0) }), axis: .vertical
      )
      .font(Theme.Typography.body)
      .accessibilityIdentifier("ai-guide")
      Picker(
        Words.meReplyLength,
        selection: Binding(get: { me.lengthId }, set: { me.setLength($0) })
      ) {
        ForEach(me.lengths, id: \.id) { Text($0.label).tag($0.id) }
      }
      .pickerStyle(.segmented)
      .accessibilityIdentifier("ai-length")
    } header: {
      Text(Words.meHowTheAITalks)
    } footer: {
      Text(Words.meGuideNote)
    }
    .listRowBackground(Theme.Palette.card)
  }

  // MARK: Voice

  private var voice: some View {
    Section {
      Toggle(
        Words.meReadAloud,
        isOn: Binding(get: { model.settings.readAloud }, set: { me.setReadAloud($0) })
      )
      .accessibilityIdentifier("voice-read-aloud")
      Toggle(
        Words.meTalk,
        isOn: Binding(get: { model.settings.talk }, set: { me.setTalk($0) })
      )
      .accessibilityIdentifier("voice-talk")
      Text(modeNote).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
      Toggle(
        Words.meHeadphonesOnly,
        isOn: Binding(
          get: { model.settings.headphonesOnly }, set: { me.setHeadphonesOnly($0) })
      )
      .accessibilityIdentifier("voice-headphones")
      Picker(
        Words.meVoiceChoice,
        selection: Binding(
          get: { model.settings.voiceId ?? "" }, set: { me.setVoice($0.isEmpty ? nil : $0) })
      ) {
        Text(Words.meVoiceDefault).tag("")
        ForEach(model.speaker.voices) { Text($0.name).tag($0.id) }
      }
      .accessibilityIdentifier("voice-choice")
      VStack(alignment: .leading) {
        Text(Words.meSpeed).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
        Slider(
          value: Binding(
            get: { model.settings.speechRate }, set: { me.setSpeechRate($0) }), in: 0...1
        )
        .accessibilityLabel(Words.meSpeed)
        .accessibilityIdentifier("voice-speed")
      }
    } header: {
      Text(Words.meVoice)
    }
    .listRowBackground(Theme.Palette.card)
  }

  private var modeNote: String {
    let s = model.settings
    switch (s.readAloud, s.talk) {
    case (false, false): return Words.meVoiceOffNote
    case (true, false): return Words.meReadAloudNote
    case (false, true): return Words.meTalkNote
    case (true, true): return Words.meReadAloudNote + " " + Words.meTalkNote
    }
  }
}

/// What is stored, what leaves the phone, and Delete everything (second tap).
struct AboutView: View {
  let model: AppModel

  var body: some View {
    List {
      Section {
        ForEach(Words.privacyLines, id: \.self) {
          Text(verbatim: $0).font(Theme.Typography.body).foregroundStyle(Theme.Palette.ink)
        }
      }
      .listRowBackground(Theme.Palette.card)
      Section {
        Text(Words.meDeleteExplain).font(Theme.Typography.small).foregroundStyle(
          Theme.Palette.quiet)
        if model.me.confirmingDelete {
          Button(Words.meDeleteSure, role: .destructive) { model.me.confirmDeleteEverything() }
            .accessibilityIdentifier("delete-everything-confirm")
          Button(Words.meDeleteCancel) { model.me.cancelDelete() }
            .accessibilityIdentifier("delete-everything-cancel")
        } else {
          Button(Words.meDeleteAll, role: .destructive) { model.me.askDeleteEverything() }
            .accessibilityIdentifier("delete-everything")
        }
        if let note = model.me.eraseNote {
          Text(note).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
        }
      }
      .listRowBackground(Theme.Palette.card)
    }
    .scrollContentBackground(.hidden)
    .pageBackground()
    .navigationTitle(Words.meAbout)
    .accessibilityElement(children: .contain)
    .accessibilityIdentifier("about-screen")
  }
}
