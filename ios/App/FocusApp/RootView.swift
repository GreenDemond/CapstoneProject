import FocusKit
import SwiftUI

struct RootView: View {
  @Bindable var model: AppModel
  @Environment(\.scenePhase) private var scenePhase

  var body: some View {
    Group {
      if model.welcomed {
        MainTabs(model: model)
      } else {
        WelcomeView(model: model)
      }
    }
    .tint(Theme.Palette.moss)
    .onChange(of: scenePhase) { _, phase in
      if phase == .active { model.refreshWelcome() }
    }
  }
}

struct MainTabs: View {
  @Bindable var model: AppModel

  var body: some View {
    TabView {
      Tab(Words.tabToday, systemImage: "sun.max") {
        TodayView(model: model)
      }
      Tab(Words.tabTalk, systemImage: "bubble.left") {
        TalkView(model: model)
      }
      Tab(Words.tabPlan, systemImage: "list.bullet") {
        PlanView(model: model)
      }
      Tab(Words.tabMe, systemImage: "person") {
        MeView()
      }
    }
    .fullScreenCover(
      isPresented: Binding(
        get: { model.inStep },
        set: { if !$0 { model.leaveStep() } })
    ) {
      WorkView(model: model)
    }
  }
}
