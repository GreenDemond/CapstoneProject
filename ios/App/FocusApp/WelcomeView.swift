import FocusKit
import SwiftUI

/// First run: what the app does, "Your work stays on this iPhone", and Start.
/// It asks for no permission and no personal detail.
struct WelcomeView: View {
  let model: AppModel

  var body: some View {
    VStack(alignment: .leading, spacing: Theme.Space.large) {
      Spacer()
      Text(Words.welcomeTitle)
        .font(Theme.Typography.big)
        .foregroundStyle(Theme.Palette.ink)
        .accessibilityAddTraits(.isHeader)
      Text(Words.welcomeBody)
        .font(Theme.Typography.body)
        .foregroundStyle(Theme.Palette.ink)
      Label(Words.welcomePrivacy, systemImage: "lock")
        .font(Theme.Typography.body)
        .foregroundStyle(Theme.Palette.quiet)
      Spacer()
      Button(Words.welcomeStart) { model.finishWelcome() }
        .buttonStyle(MainButtonStyle())
        .accessibilityLabel(Words.welcomeStart)
        .accessibilityIdentifier("welcome-start")
    }
    .padding(Theme.Space.large)
    .pageBackground()
    .accessibilityElement(children: .contain)
    .accessibilityIdentifier("welcome-screen")
  }
}
