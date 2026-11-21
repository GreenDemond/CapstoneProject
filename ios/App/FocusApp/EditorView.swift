import FocusKit
import SwiftUI

/// The editor: both ways of making steps end here. Suggested steps never skip it.
struct EditorView: View {
  let planner: PlannerModel
  @State private var reordering = false

  var body: some View {
    List {
      Section {
        Text(Words.suggestedBy)
          .font(Theme.Typography.small)
          .foregroundStyle(Theme.Palette.quiet)
          .listRowBackground(Color.clear)
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
    .toolbar {
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
      }
      .padding(Theme.Space.medium)
      .background(Theme.Palette.sand)
    }
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
          Text(Words.looksLikeTwo)
            .font(Theme.Typography.small)
            .foregroundStyle(Theme.Palette.quiet)
          Spacer()
          Button("Yes") { planner.split(step.id) }
            .accessibilityIdentifier("nudge-yes-\(step.id)")
          Button("No") { planner.dismissNudge(step.id) }
            .accessibilityIdentifier("nudge-no-\(step.id)")
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
