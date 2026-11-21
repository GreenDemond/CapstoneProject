import FocusKit
import SwiftUI

struct TalkView: View {
  let model: AppModel
  var body: some View {
    NavigationStack {
      VStack(alignment: .leading, spacing: Theme.Space.medium) {
        Text(Words.tabTalk).font(Theme.Typography.big).foregroundStyle(Theme.Palette.ink)
          .accessibilityAddTraits(.isHeader)
        Text(Words.talkNotReady).font(Theme.Typography.body).foregroundStyle(Theme.Palette.quiet)
        if LookUpModel.isOn {
          NavigationLink {
            LookUpView()
          } label: {
            Label(Words.lookUpTitle, systemImage: "magnifyingglass")
              .font(Theme.Typography.button)
              .foregroundStyle(Theme.Palette.ink)
              .frame(maxWidth: .infinity, minHeight: Theme.Space.touch, alignment: .leading)
              .cardStyle()
          }
          .accessibilityIdentifier("talk-lookup")
        }
        Spacer()
      }
      .padding(Theme.Space.large)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      .pageBackground()
    }
    .accessibilityIdentifier("talk-screen")
  }
}

struct PlanView: View {
  let model: AppModel
  var body: some View {
    NavigationStack { PlanListView(model: model) }
      .accessibilityIdentifier("plan-screen")
  }
}

struct MeView: View {
  var body: some View {
    PlaceholderScreen(title: Words.tabMe, line: Words.meNotReady, id: "me-screen")
  }
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
