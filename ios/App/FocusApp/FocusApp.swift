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
        ProblemView()
      }
    }
  }
}

/// Shown only if the app's own words file cannot be read. Calm, and no jargon.
struct ProblemView: View {
  var body: some View {
    VStack(spacing: Theme.Space.medium) {
      Text("The app couldn't start.")
        .font(Theme.Typography.title)
        .foregroundStyle(Theme.Palette.ink)
      Text("Close it and open it again. If it keeps happening, tell the person who set it up.")
        .font(Theme.Typography.body)
        .foregroundStyle(Theme.Palette.quiet)
        .multilineTextAlignment(.center)
    }
    .padding(Theme.Space.large)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .pageBackground()
  }
}
