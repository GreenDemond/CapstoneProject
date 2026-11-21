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
      if phase != .active { model.dictation.appWentToBackground() }
    }
  }
}

struct MainTabs: View {
  @Bindable var model: AppModel
  @State private var selection = Words.tabToday

  var body: some View {
    TabView(selection: $selection) {
      Tab(Words.tabToday, systemImage: "sun.max", value: Words.tabToday) {
        TodayView(model: model)
      }
      Tab(Words.tabTalk, systemImage: "bubble.left", value: Words.tabTalk) {
        TalkView(model: model)
      }
      Tab(Words.tabPlan, systemImage: "list.bullet", value: Words.tabPlan) {
        PlanView(model: model)
      }
      Tab(Words.tabMe, systemImage: "person", value: Words.tabMe) {
        MeView(model: model)
      }
    }
    .onChange(of: model.showToday) { _, wanted in
      if wanted {
        selection = Words.tabToday
        model.showToday = false
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
