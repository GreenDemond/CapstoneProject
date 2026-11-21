import FocusKit
import SwiftUI

/// "I'll say my steps", by typing for now: one small step at a time.
struct SayingView: View {
  let model: AppModel
  let planner: PlannerModel
  @State private var words = ""
  @State private var needOne = false

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: Theme.Space.medium) {
        Text(planner.draft.steps.isEmpty ? Words.firstStepQuestion : Words.nextStepQuestion)
          .font(Theme.Typography.title)
          .foregroundStyle(Theme.Palette.ink)
          .accessibilityAddTraits(.isHeader)

        ForEach(Array(planner.draft.steps.enumerated()), id: \.element.id) { index, step in
          Text(verbatim: "\(index + 1). \(step.text)")
            .font(Theme.Typography.body)
            .foregroundStyle(Theme.Palette.quiet)
            .frame(maxWidth: .infinity, alignment: .leading)
        }

        TextField(Words.nextStepQuestion, text: $words, axis: .vertical)
          .font(Theme.Typography.body)
          .foregroundStyle(Theme.Palette.ink)
          .lineLimit(1...4)
          .cardStyle()
          .accessibilityLabel(Words.firstStepQuestion)
          .accessibilityIdentifier("said-step")
          .onSubmit(add)

        MicButton(model: model, text: $words)

        Button(Words.addStepButton, action: add)
          .buttonStyle(QuietButtonStyle())
          .accessibilityIdentifier("add-said")

        if needOne {
          Text(Words.needOneStep)
            .font(Theme.Typography.body)
            .foregroundStyle(Theme.Palette.clay)
        }

        if let idea = planner.idea {
          VStack(alignment: .leading, spacing: Theme.Space.small) {
            Text(idea.fromAI ? Words.ideaFromAI : Words.ideaFromStarter)
              .font(Theme.Typography.small)
              .foregroundStyle(Theme.Palette.quiet)
            Text(verbatim: idea.text).font(Theme.Typography.body).foregroundStyle(Theme.Palette.ink)
            HStack {
              Button(Words.ideaUse) { planner.useIdea() }
                .buttonStyle(QuietButtonStyle())
                .accessibilityIdentifier("idea-use")
              Button(Words.ideaNo) { planner.dismissIdea() }
                .buttonStyle(LinkButtonStyle())
                .accessibilityIdentifier("idea-no")
            }
          }
          .cardStyle()
          .accessibilityElement(children: .contain)
          .accessibilityIdentifier("idea-card")
        } else {
          Button(planner.thinking ? Words.coachThinking : Words.giveIdea) {
            Task { await planner.giveIdea() }
          }
          .buttonStyle(LinkButtonStyle())
          .disabled(planner.thinking)
          .accessibilityIdentifier("give-idea")
        }
        if let note = planner.aiNote {
          Text(verbatim: note).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
        }

        Button(Words.thatsAll) {
          if !words.isEmpty { add() }
          needOne = !planner.thatsAll()
        }
        .buttonStyle(MainButtonStyle())
        .accessibilityIdentifier("thats-all")

        Button(Words.back) { planner.backToAssignment() }
          .buttonStyle(LinkButtonStyle())
          .accessibilityHint("Your steps are kept.")
          .accessibilityIdentifier("back-to-assignment")
        if model.canLeavePlanning {
          Button(Words.backToToday) { model.cancelPlanning() }
            .buttonStyle(LinkButtonStyle())
            .accessibilityIdentifier("cancel-planning")
        }
      }
      .padding(Theme.Space.medium)
    }
    .scrollDismissesKeyboard(.interactively)
    .accessibilityElement(children: .contain)
    .accessibilityIdentifier("saying-screen")
  }

  private func add() {
    if planner.addSaid(words) {
      words = ""
      needOne = false
    }
  }
}
