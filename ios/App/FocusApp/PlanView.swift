import FocusKit
import SwiftUI

struct PlanView: View {
  let model: AppModel
  var body: some View {
    NavigationStack { PlanListView(model: model) }
      .accessibilityIdentifier("plan-screen")
  }
}
