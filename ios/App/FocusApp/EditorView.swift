import FocusKit
import SwiftUI

/// The editor: both ways of making steps end here. Suggested steps never skip it.
struct EditorView: View {
  let model: AppModel
  let planner: PlannerModel
  @State private var reordering = false

  var body: some View {
    List {
      Section {
        VStack(alignment: .leading, spacing: Theme.Space.tiny) {
          Text(
            planner.draft.fromAI
              ? (planner.draft.aiClass.map(Words.aiSuggestedFromClass) ?? Words.aiSuggestedLabel)
              : Words.suggestedBy
          )
          .font(Theme.Typography.small)
          .foregroundStyle(Theme.Palette.quiet)
          .accessibilityIdentifier(planner.draft.fromAI ? "ai-label" : "starter-label")
          if let note = planner.aiNote {
            Text(verbatim: note).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
          }
        }
        .listRowBackground(Color.clear)
      }
      if planner.canCheckRequirements || planner.checkingRequirements
        || planner.requirementsResult != nil
      {
        Section {
          Button(
            planner.checkingRequirements ? Words.checkingAssignment : Words.checkAgainstAssignment
          ) {
            Task { await planner.checkRequirements() }
          }
          .buttonStyle(LinkButtonStyle())
          .disabled(!planner.canCheckRequirements)
          .frame(minHeight: 44, alignment: .leading)
          .accessibilityIdentifier("check-requirements")
          if let own = planner.ownServiceLabel() {
            Text(Words.checkAssignmentOwn(label: own))
              .font(Theme.Typography.small)
              .foregroundStyle(Theme.Palette.quiet)
          }
          switch planner.requirementsResult {
          case .lines?:
            if let uncovered = planner.uncoveredRequirements, !uncovered.isEmpty {
              ForEach(uncovered, id: \.self) { line in
                Text(verbatim: Words.requirementNotCovered(line))
                  .font(Theme.Typography.small)
                  .accessibilityIdentifier("requirement-uncovered")
              }
            } else {
              Text(Words.requirementsAllCovered)
                .font(Theme.Typography.small)
                .foregroundStyle(Theme.Palette.quiet)
                .accessibilityIdentifier("requirements-all-covered")
            }
          case .nothing?:
            Text(Words.requirementsNone)
              .font(Theme.Typography.small)
              .foregroundStyle(Theme.Palette.quiet)
          case .unclear?:
            Text(Words.requirementsUnclear)
              .font(Theme.Typography.small)
              .foregroundStyle(Theme.Palette.quiet)
          case nil:
            EmptyView()
          }
        }
      }
      Section {
        ForEach(planner.draft.steps) { step in
          StepRow(planner: planner, step: step)
            .listRowBackground(Theme.Palette.card)
        }
        .onDelete { planner.delete(at: $0) }
        .onMove { planner.move(from: $0, to: $1) }
        Button(Words.addAStep) { planner.addStep() }
          .buttonStyle(LinkButtonStyle())
          .accessibilityIdentifier("add-step")
          .listRowBackground(Color.clear)
      }
      Section {
        if !planner.hasGetReady {
          Button(Words.addGetReady) { planner.addGetReady() }
            .buttonStyle(LinkButtonStyle())
            .accessibilityIdentifier("add-get-ready")
        }
        if !planner.hasPutAway {
          Button(Words.addPutAway) { planner.addPutAway() }
            .buttonStyle(LinkButtonStyle())
            .accessibilityIdentifier("add-put-away")
        }
      }
      .listRowBackground(Color.clear)
    }
    .scrollContentBackground(.hidden)
    .environment(\.editMode, .constant(reordering ? .active : .inactive))
    .navigationTitle(Words.editorTitle)
    .navigationBarBackButtonHidden(true)
    .toolbar {
      ToolbarItem(placement: .topBarLeading) {
        Button {
          planner.backToAssignment()
        } label: {
          Label(Words.back, systemImage: "chevron.left")
        }
        .accessibilityLabel(Words.back)
        .accessibilityHint("Your steps are kept.")
        .accessibilityIdentifier("editor-back")
      }
      ToolbarItem(placement: .topBarTrailing) {
        Button(reordering ? "Done moving" : "Move steps") { reordering.toggle() }
          .accessibilityIdentifier("move-steps")
      }
    }
    .safeAreaInset(edge: .bottom) {
      VStack(spacing: Theme.Space.small) {
        if planner.draft.steps.isEmpty {
          Text(Words.noSteps).font(Theme.Typography.body).foregroundStyle(Theme.Palette.clay)
        }
        if let note = planner.saveNote {
          Text(note).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
        }
        Button(Words.startButton) { planner.start() }
          .buttonStyle(MainButtonStyle())
          .disabled(!planner.canStart)
          .accessibilityIdentifier("start-steps")
        if model.canLeavePlanning {
          Button(Words.backToToday) { model.cancelPlanning() }
            .buttonStyle(LinkButtonStyle())
            .accessibilityIdentifier("cancel-planning")
        }
      }
      .padding(Theme.Space.medium)
      .background(Theme.Palette.sand)
    }
    .accessibilityElement(children: .contain)
    .accessibilityIdentifier("editor-screen")
  }
}

/// One step: words you can change, a gentle "two steps?" nudge, and a small menu.
struct StepRow: View {
  let planner: PlannerModel
  let step: DraftStep
  @State private var showDoneLine = false

  var body: some View {
    VStack(alignment: .leading, spacing: Theme.Space.small) {
      HStack(alignment: .top) {
        TextField(
          Words.addAStep,
          text: Binding(get: { step.text }, set: { planner.setStepText(step.id, $0) }),
          axis: .vertical
        )
        .font(Theme.Typography.body)
        .foregroundStyle(Theme.Palette.ink)
        .accessibilityLabel("Step")
        .accessibilityIdentifier("step-text-\(step.id)")
        Menu {
          Button("Split") { planner.split(step.id) }
          Button("Join with next") { planner.joinWithNext(step.id) }
          Button(Words.doneLinePrompt) { showDoneLine.toggle() }
          Button("Delete", role: .destructive) { planner.delete(step.id) }
        } label: {
          Image(systemName: "ellipsis.circle")
            .frame(minWidth: Theme.Space.touch, minHeight: Theme.Space.touch)
        }
        .accessibilityLabel("More for this step")
        .accessibilityIdentifier("step-menu-\(step.id)")
      }
      if planner.looksLikeTwo(step.id) {
        HStack {
          Text(verbatim: planner.nudgeQuestion(for: step.id) ?? Words.looksLikeTwo)
            .font(Theme.Typography.small)
            .foregroundStyle(Theme.Palette.quiet)
            .accessibilityIdentifier("nudge-line-\(step.id)")
          Spacer()
          Button("Yes") { planner.split(step.id) }
            .accessibilityIdentifier("nudge-yes-\(step.id)")
          Button("No") { planner.dismissNudge(step.id) }
            .accessibilityIdentifier("nudge-no-\(step.id)")
        }
        .buttonStyle(.borderless)
        // Only the AI's question can be rated, never the fixed line.
        if planner.nudgeQuestion(for: step.id) != nil {
          FeedbackRow(
            rated: planner.nudgeRated(step.id), idPrefix: "nudge-feedback-\(step.id)",
            about: "the AI question"
          ) { planner.rateNudge(step.id, $0) }
        }
        if planner.canAskNudge(step.id) {
          Button(Words.askNudge) { Task { await planner.askNudge(step.id) } }
            .font(Theme.Typography.small)
            .buttonStyle(.borderless)
            .accessibilityIdentifier("nudge-ask-\(step.id)")
          if let own = planner.ownServiceLabel() {
            Text(Words.askNudgeOwn(label: own))
              .font(Theme.Typography.small)
              .foregroundStyle(Theme.Palette.quiet)
          }
        }
      }
      if let note = planner.reviewNote(for: step.id) {
        HStack {
          Text(Words.stepNote(note))
            .font(Theme.Typography.small)
            .foregroundStyle(Theme.Palette.quiet)
            .accessibilityIdentifier("review-note-\(step.id)")
          Spacer()
          if note == .tooLong, planner.canSplit(step.id) {
            Button(Words.splitStep) { planner.split(step.id) }
              .frame(minHeight: 44)
              .accessibilityIdentifier("review-split-\(step.id)")
          }
          Button(Words.stepNoteSkip) { planner.dismissReview(step.id) }
            .frame(minHeight: 44)
            .accessibilityIdentifier("review-skip-\(step.id)")
        }
        .buttonStyle(.borderless)
      }
      if showDoneLine || !step.doneLine.isEmpty {
        TextField(
          Words.doneLinePrompt,
          text: Binding(get: { step.doneLine }, set: { planner.setDoneLine(step.id, $0) })
        )
        .font(Theme.Typography.small)
        .foregroundStyle(Theme.Palette.quiet)
      }
    }
  }
}
