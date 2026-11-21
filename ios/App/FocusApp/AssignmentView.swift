import FocusKit
import SwiftUI

/// "What's the assignment?": paste or type, pick the kind and how many steps, then choose a way
/// of making steps.
struct AssignmentView: View {
  let model: AppModel
  let planner: PlannerModel

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: Theme.Space.medium) {
        Text(Words.assignmentTitle)
          .font(Theme.Typography.big)
          .foregroundStyle(Theme.Palette.ink)
          .accessibilityAddTraits(.isHeader)

        ZStack(alignment: .topLeading) {
          TextEditor(
            text: Binding(get: { planner.draft.text }, set: { planner.setText($0) })
          )
          .scrollContentBackground(.hidden)
          .font(Theme.Typography.body)
          .foregroundStyle(Theme.Palette.ink)
          .frame(minHeight: Theme.Space.huge * 3)
          .accessibilityLabel(Words.assignmentPlaceholder)
          .accessibilityIdentifier("assignment-text")
          if planner.draft.text.isEmpty {
            Text(Words.assignmentPlaceholder)
              .font(Theme.Typography.body)
              .foregroundStyle(Theme.Palette.quiet)
              .padding(.top, Theme.Space.small)
              .padding(.leading, Theme.Space.small)
              .allowsHitTesting(false)
              .accessibilityHidden(true)
          }
        }
        .cardStyle()

        MicButton(
          model: model,
          text: Binding(get: { planner.draft.text }, set: { planner.setText($0) }))

        if planner.draft.truncated {
          Text(Words.pasteCut).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
        }

        Text(Words.kindQuestion).font(Theme.Typography.body).foregroundStyle(Theme.Palette.ink)
        LazyVGrid(
          columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: Theme.Space.small
        ) {
          ForEach(planner.kinds, id: \.id) { kind in
            KindChip(
              label: kind.label, selected: planner.draft.kindId == kind.id,
              action: { planner.setKind(kind.id) })
          }
        }

        Text(Words.countQuestion).font(Theme.Typography.body).foregroundStyle(Theme.Palette.ink)
        Picker(
          Words.countQuestion,
          selection: Binding(get: { planner.draft.stepCount }, set: { planner.setStepCount($0) })
        ) {
          ForEach(PlannerModel.stepCounts, id: \.self) { Text(String($0)).tag($0) }
        }
        .pickerStyle(.segmented)
        .accessibilityIdentifier("step-count")

        if planner.showEmptyNote {
          Text(Words.emptyAssignment)
            .font(Theme.Typography.body)
            .foregroundStyle(Theme.Palette.clay)
            .accessibilityIdentifier("empty-note")
        }

        Button(Words.saySteps) { planner.beginSaying() }
          .buttonStyle(MainButtonStyle())
          .accessibilityIdentifier("say-steps")
        Button(planner.thinking ? Words.coachThinking : Words.suggestSteps) {
          Task { await planner.suggest() }
        }
        .buttonStyle(QuietButtonStyle())
        .disabled(planner.thinking)
        .accessibilityIdentifier("suggest-steps")
        if let note = planner.aiNote {
          Text(verbatim: note)
            .font(Theme.Typography.body)
            .foregroundStyle(Theme.Palette.ink)
            .accessibilityIdentifier("ai-note")
        }

        if model.hasSteps {
          Button(Words.allMySteps) { model.cancelPlanning() }
            .buttonStyle(LinkButtonStyle())
            .accessibilityIdentifier("cancel-planning")
        }
        if let note = planner.saveNote {
          Text(note).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
        }
      }
      .padding(Theme.Space.medium)
    }
    .scrollDismissesKeyboard(.interactively)
    .accessibilityIdentifier("assignment-screen")
  }
}

/// One of the six kinds. Selected is shown with a thicker outline and a tick, not only colour.
struct KindChip: View {
  let label: String
  let selected: Bool
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      HStack {
        if selected { Image(systemName: "checkmark") }
        Text(label)
      }
      .font(Theme.Typography.body)
      .foregroundStyle(Theme.Palette.ink)
      .frame(maxWidth: .infinity, minHeight: Theme.Space.touch)
      .background(
        selected ? Theme.Palette.card : Theme.Palette.sand,
        in: RoundedRectangle(cornerRadius: Theme.Space.corner)
      )
      .overlay(
        RoundedRectangle(cornerRadius: Theme.Space.corner)
          .stroke(
            selected ? Theme.Palette.moss : Theme.Palette.line,
            lineWidth: selected ? Theme.Space.tiny / 2 : Theme.Space.line)
      )
    }
    .accessibilityLabel(label)
    .accessibilityAddTraits(selected ? .isSelected : [])
    .accessibilityIdentifier("kind-\(label)")
  }
}
