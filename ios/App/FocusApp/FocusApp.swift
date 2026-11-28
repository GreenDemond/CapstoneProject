import FocusKit
import SwiftUI

@main
struct FocusApp: App {
  @State private var model = AppBoot.make()

  var body: some Scene {
    WindowGroup {
      if let model {
        RootView(model: model)
      } else {
        ProblemView(retry: { model = AppBoot.make() })
      }
    }
  }
}

/// Shown only if the app's own words file cannot be read. Calm, and no jargon.
struct ProblemView: View {
  let retry: () -> Void

  var body: some View {
    VStack(spacing: Theme.Space.medium) {
      Text("The app couldn't start.")
        .font(Theme.Typography.title)
        .foregroundStyle(Theme.Palette.ink)
      Text(
        "Try again. If it keeps happening, close the app and open it again, then tell the person who set it up."
      )
      .font(Theme.Typography.body)
      .foregroundStyle(Theme.Palette.quiet)
      .multilineTextAlignment(.center)
      Button(Words.tryAgain, action: retry)
        .buttonStyle(MainButtonStyle())
        .accessibilityIdentifier("startup-retry")
    }
    .padding(Theme.Space.large)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .pageBackground()
  }
}
