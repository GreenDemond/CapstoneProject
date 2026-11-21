import FocusKit
import SwiftUI

struct TodayView: View {
  let model: AppModel
  var body: some View {
    PlaceholderScreen(title: Words.tabToday, line: Words.assignmentTitle, id: "today-screen")
  }
}

struct TalkView: View {
  let model: AppModel
  var body: some View {
    PlaceholderScreen(title: Words.tabTalk, line: Words.talkNotReady, id: "talk-screen")
  }
}

struct PlanView: View {
  let model: AppModel
  var body: some View {
    PlaceholderScreen(title: Words.tabPlan, line: Words.planEmpty, id: "plan-screen")
  }
}

struct MeView: View {
  var body: some View {
    PlaceholderScreen(title: Words.tabMe, line: Words.meNotReady, id: "me-screen")
  }
}

struct WorkView: View {
  let model: AppModel
  var body: some View { Text("") }
}

struct PlaceholderScreen: View {
  let title: String
  let line: String
  let id: String

  var body: some View {
    VStack(alignment: .leading, spacing: Theme.Space.medium) {
      Text(title).font(Theme.Typography.big).foregroundStyle(Theme.Palette.ink)
        .accessibilityAddTraits(.isHeader)
      Text(line).font(Theme.Typography.body).foregroundStyle(Theme.Palette.quiet)
      Spacer()
    }
    .padding(Theme.Space.large)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .pageBackground()
    .accessibilityIdentifier(id)
  }
}
