import FocusKit
import SwiftUI

/// The Me tab: goals, private notes, how I like to work, how the AI talks, voice, about and privacy.
struct MeView: View {
  let model: AppModel
  @State private var note = ""
  @State private var pendingNote: String?
  /// Kept apart from `pendingNote`: the dialog clears that before its buttons run.
  @State private var chosenNote: String?

  private var me: MeModel { model.me }

  var body: some View {
    NavigationStack {
      List {
        goals
        notes
        howILikeToWork
        howTheAITalks
        OwnAISection(model: model)
        voice
        backup
        Section {
          NavigationLink(Words.meAbout) { AboutView(model: model) }
            .accessibilityIdentifier("me-about")
        }
        .listRowBackground(Theme.Palette.card)
      }
      .scrollContentBackground(.hidden)
      .pageBackground()
      .keyboardDoneButton()
      // One dialog on the whole list: a dialog on a row or a section does not always appear.
      .confirmationDialog(
        Words.savedThoughtConfirm,
        isPresented: Binding(
          get: { pendingNote != nil },
          set: { if !$0 { pendingNote = nil } })
      ) {
        Button(Words.savedThoughtDelete, role: .destructive) {
          if let id = chosenNote { me.deleteNote(id) }
          chosenNote = nil
        }
        .accessibilityIdentifier("note-delete-confirm")
        Button(Words.savedThoughtKeep, role: .cancel) { pendingNote = nil }
      }
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
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
          Button(Words.talkDelete, role: .destructive) {
            chosenNote = item.id
            pendingNote = item.id
          }
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

  // MARK: Backup

  private var backup: some View {
    Section {
      Toggle(
        Words.meBackup,
        isOn: Binding(get: { me.includeInBackup }, set: { me.setIncludeInBackup($0) })
      )
      .accessibilityIdentifier("backup-switch")
    } footer: {
      Text(Words.meBackupNote)
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

/// "My AI services": none at first. The line about what is sent is always shown at the top, and
/// nothing can be added until it has been shown. All behaviour is in `OwnAIModel`.
struct OwnAISection: View {
  let model: AppModel
  @State private var editing: ServiceTarget?

  private var own: OwnAIModel { model.ownAI }

  var body: some View {
    Section {
      Text(verbatim: own.disclosure)
        .font(Theme.Typography.small)
        .foregroundStyle(Theme.Palette.ink)
        .onAppear { own.noteDisclosureShown() }
        .accessibilityIdentifier("own-ai-disclosure")
      if own.services.isEmpty {
        Text(Words.ownAIEmpty).font(Theme.Typography.body).foregroundStyle(Theme.Palette.quiet)
          .accessibilityIdentifier("own-ai-empty")
      }
      ForEach(own.services) { service in
        ServiceRow(
          model: model, service: service, edit: { editing = ServiceTarget(id: service.id) })
      }
      Button(Words.ownAIAdd) { editing = ServiceTarget(id: nil) }
        .disabled(!own.canAdd)
        .accessibilityLabel(Words.ownAIAdd)
        .accessibilityIdentifier("own-ai-add")
        .sheet(item: $editing) { target in
          ServiceEditor(model: model, id: target.id, close: { editing = nil })
        }
      if own.isFull {
        Text(Words.ownAIFull).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
          .accessibilityIdentifier("own-ai-full")
      }
      if let note = own.note {
        Text(verbatim: note).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
          .accessibilityIdentifier("own-ai-note")
      }
    } header: {
      Text(Words.ownAITitle)
    }
    .listRowBackground(Theme.Palette.card)
  }
}

/// Which service the editor is open for: nil is a new one.
private struct ServiceTarget: Identifiable {
  let id: String?
}

/// One service in the list: its label and state, and Edit, Check connection and Remove.
private struct ServiceRow: View {
  let model: AppModel
  let service: OwnAIService
  let edit: () -> Void

  private var own: OwnAIModel { model.ownAI }

  var body: some View {
    VStack(alignment: .leading, spacing: Theme.Space.tiny) {
      Text(verbatim: service.label).font(Theme.Typography.body).foregroundStyle(Theme.Palette.ink)
      Text(verbatim: own.status(service)).font(Theme.Typography.small)
        .foregroundStyle(Theme.Palette.quiet)
        .accessibilityIdentifier("own-ai-status")
      if let line = own.checkLine(service.id) {
        Text(verbatim: line).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
          .accessibilityIdentifier("own-ai-check-line")
      }
      HStack(spacing: Theme.Space.medium) {
        Button(Words.ownAIEdit, action: edit)
          .accessibilityLabel("\(Words.ownAIEdit) \(service.label)")
          .accessibilityIdentifier("own-ai-edit")
        Button(own.checkState(service.id) == .checking ? Words.ownAIChecking : Words.ownAICheck) {
          Task { await own.checkConnection(service.id) }
        }
        .disabled(!own.canCheck(service.id))
        .accessibilityLabel("\(Words.ownAICheck) \(service.label)")
        .accessibilityIdentifier("own-ai-check")
        if own.pendingRemove == service.id {
          Button(Words.ownAIRemoveSure, role: .destructive) { own.confirmRemove(service.id) }
            .accessibilityLabel("\(Words.ownAIRemoveSure) \(service.label)")
            .accessibilityIdentifier("own-ai-remove-sure")
          Button(Words.ownAIRemoveKeep) { own.cancelRemove() }
            .accessibilityLabel("\(Words.ownAIRemoveKeep) \(service.label)")
            .accessibilityIdentifier("own-ai-remove-keep")
        } else {
          Button(Words.ownAIRemove, role: .destructive) { own.askRemove(service.id) }
            .accessibilityLabel("\(Words.ownAIRemove) \(service.label)")
            .accessibilityIdentifier("own-ai-remove")
        }
      }
      .buttonStyle(.borderless)
      .font(Theme.Typography.small)
    }
    .accessibilityElement(children: .contain)
    .accessibilityIdentifier("own-ai-row")
  }
}

/// Add or edit one service. The key box empties after Save and the screen never shows a saved key.
private struct ServiceEditor: View {
  let model: AppModel
  let id: String?
  let close: () -> Void

  @State private var label = ""
  @State private var endpoint = ""
  @State private var modelId = ""
  @State private var key = ""
  @State private var problem: String?
  @State private var loaded = false

  private var own: OwnAIModel { model.ownAI }

  var body: some View {
    NavigationStack {
      Form {
        Section {
          field(Words.ownAILabel) {
            TextField(Words.ownAILabelPlaceholder, text: $label)
              .font(Theme.Typography.body)
              .accessibilityLabel(Words.ownAILabel)
              .accessibilityIdentifier("own-ai-label")
          }
          field(Words.ownAIAddress) {
            TextField(Words.ownAIAddressPlaceholder, text: $endpoint)
              .textInputAutocapitalization(.never)
              .autocorrectionDisabled()
              .keyboardType(.URL)
              .font(Theme.Typography.body)
              .accessibilityLabel(Words.ownAIAddress)
              .accessibilityIdentifier("own-ai-address")
            Text(verbatim: Words.ownAIAddressHelp).font(Theme.Typography.small)
              .foregroundStyle(Theme.Palette.quiet)
              .accessibilityIdentifier("own-ai-address-help")
            if let bad = own.addressProblem(endpoint) {
              Text(verbatim: bad).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
                .accessibilityIdentifier("own-ai-address-problem")
            } else if let http = own.addressNote(endpoint) {
              Text(verbatim: http).font(Theme.Typography.small)
                .foregroundStyle(Theme.Palette.quiet)
                .accessibilityIdentifier("own-ai-address-http")
              Toggle(
                Words.ownAIHttpTick,
                isOn: Binding(
                  get: { own.httpUnderstood }, set: { own.setHttpUnderstood($0) })
              )
              .font(Theme.Typography.small)
              .accessibilityLabel(Words.ownAIHttpTick)
              .accessibilityIdentifier("own-ai-http-tick")
            } else {
              Text(Words.ownAIAddressNote).font(Theme.Typography.small)
                .foregroundStyle(Theme.Palette.quiet)
            }
          }
          field(Words.ownAIKey) {
            if let id, own.hasKey(id) {
              Text(Words.ownAIKeySaved).font(Theme.Typography.body)
                .foregroundStyle(Theme.Palette.ink)
                .accessibilityIdentifier("own-ai-key-line")
            } else {
              Text(Words.ownAIKeyNone).font(Theme.Typography.body)
                .foregroundStyle(Theme.Palette.ink)
                .accessibilityIdentifier("own-ai-key-line")
            }
            SecureField(Words.ownAIKeyPlaceholder, text: $key)
              .textInputAutocapitalization(.never)
              .autocorrectionDisabled()
              .font(Theme.Typography.body)
              .accessibilityLabel(Words.ownAIKey)
              .accessibilityIdentifier("own-ai-key")
            if let help = own.keyHelpURL(endpoint: endpoint) {
              Link(Words.ownAIKeyHelp, destination: help)
                .font(Theme.Typography.small)
                .accessibilityIdentifier("own-ai-key-help")
            }
            if let id, own.hasKey(id) {
              Text(Words.ownAIKeyKeepNote).font(Theme.Typography.small)
                .foregroundStyle(Theme.Palette.quiet)
              Button(Words.ownAIKeyRemove, role: .destructive) { own.removeKey(id) }
                .accessibilityLabel(Words.ownAIKeyRemove)
                .accessibilityIdentifier("own-ai-key-remove")
            }
            Text(Words.ownAIKeyNote).font(Theme.Typography.small)
              .foregroundStyle(Theme.Palette.quiet)
          }
          field(Words.ownAIModel) {
            TextField(Words.ownAIModelPlaceholder, text: $modelId)
              .textInputAutocapitalization(.never)
              .autocorrectionDisabled()
              .font(Theme.Typography.body)
              .accessibilityLabel(Words.ownAIModel)
              .accessibilityIdentifier("own-ai-model")
            Button(own.lookup == .looking ? Words.ownAILookingUp : Words.ownAILookUpModels) {
              Task { await own.lookUpModels(endpoint: endpoint, key: key, serviceId: id) }
            }
            .disabled(!own.canLookUp(endpoint: endpoint))
            .accessibilityLabel(Words.ownAILookUpModels)
            .accessibilityIdentifier("own-ai-lookup")
            if !own.modelNames.isEmpty {
              Picker(Words.ownAIPickModel, selection: $modelId) {
                ForEach(own.modelNames, id: \.self) { Text(verbatim: $0).tag($0) }
              }
              .pickerStyle(.menu)
              .accessibilityLabel(Words.ownAIPickModel)
              .accessibilityIdentifier("own-ai-model-menu")
            }
            if let line = own.lookupLine {
              Text(verbatim: line).font(Theme.Typography.small)
                .foregroundStyle(Theme.Palette.quiet)
                .accessibilityIdentifier("own-ai-lookup-line")
            }
          }
          if let problem {
            Text(verbatim: problem).font(Theme.Typography.small)
              .foregroundStyle(Theme.Palette.quiet)
              .accessibilityIdentifier("own-ai-editor-problem")
          }
          if let note = own.note {
            Text(verbatim: note).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
          }
        }
        .listRowBackground(Theme.Palette.card)
      }
      .scrollContentBackground(.hidden)
      .pageBackground()
      .keyboardDoneButton()
      .navigationTitle(id == nil ? Words.ownAIEditorAdd : Words.ownAIEditorEdit)
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button(Words.ownAICancel) { finish() }
            .accessibilityLabel(Words.ownAICancel)
            .accessibilityIdentifier("own-ai-cancel")
        }
        ToolbarItem(placement: .confirmationAction) {
          Button(Words.ownAISave) { save() }
            .accessibilityLabel(Words.ownAISave)
            .accessibilityIdentifier("own-ai-save")
        }
      }
      .onAppear(perform: load)
      .onChange(of: endpoint) { own.addressTyped(endpoint) }
    }
  }

  private func field<Content: View>(_ title: String, @ViewBuilder content: () -> Content)
    -> some View
  {
    VStack(alignment: .leading, spacing: Theme.Space.tiny) {
      Text(title).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
      content()
    }
  }

  private func load() {
    guard !loaded else { return }
    loaded = true
    own.resetEditor()
    if let id, let existing = own.service(id: id) {
      label = existing.label
      endpoint = existing.endpoint
      modelId = existing.modelId
    } else {
      label = Words.ownAIDefaultLabel
      endpoint = Words.ownAIDefaultAddress
      modelId = Words.ownAIDefaultModel
    }
  }

  private func save() {
    let result = own.save(id: id, label: label, endpoint: endpoint, modelId: modelId, key: key)
    key = ""
    if case .saved = result {
      finish()
    } else {
      problem = own.line(for: result)
    }
  }

  private func finish() {
    key = ""
    own.resetEditor()
    close()
  }
}
