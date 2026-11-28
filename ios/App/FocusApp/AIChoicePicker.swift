import FocusKit
import SwiftUI

/// Which AI answers: "On this iPhone" or one of the student's ready services. Talk and the
/// assignment screen both show this, and both change the same setting.
struct AIChoicePicker: View {
  let model: AppModel

  var body: some View {
    let choice = Binding<String?>(
      get: { model.ownAI.chosenId }, set: { model.ownAI.use($0) })
    Group {
      if model.ownAI.usesSegments {
        Picker(Words.ownAIWhichAI, selection: choice) { choices }
          .pickerStyle(.segmented)
          .touchTarget()
      } else {
        Picker(Words.ownAIWhichAI, selection: choice) { choices }
          .pickerStyle(.menu)
          .touchTarget()
      }
    }
    .accessibilityLabel(Words.ownAIWhichAI)
    .accessibilityIdentifier("ai-choice")
  }

  @ViewBuilder
  private var choices: some View {
    Text(Words.ownAIThisPhone).tag(String?.none)
    ForEach(model.ownAI.readyServices) { service in
      Text(verbatim: service.label).tag(Optional(service.id))
    }
  }
}
