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

        Button(Words.thatsAll) {
          if !words.isEmpty { add() }
          needOne = !planner.thatsAll()
        }
        .buttonStyle(MainButtonStyle())
        .accessibilityIdentifier("thats-all")

        Button("Back") { planner.backToAssignment() }
          .buttonStyle(LinkButtonStyle())
          .accessibilityIdentifier("back-to-assignment")
      }
      .padding(Theme.Space.medium)
    }
    .scrollDismissesKeyboard(.interactively)
    .accessibilityIdentifier("saying-screen")
  }

  private func add() {
    if planner.addSaid(words) {
      words = ""
      needOne = false
    }
  }
}
