import FocusKit
import SwiftUI

/// Today: the planner when there are no steps, otherwise the next step (T06).
struct TodayView: View {
  let model: AppModel

  var body: some View {
    NavigationStack {
      Group {
        if model.showsPlanner {
          PlannerFlow(model: model, planner: model.planner)
        } else {
          NextStepView(model: model)
        }
      }
      .pageBackground()
      .navigationBarTitleDisplayMode(.inline)
    }
  }
}

/// Which planning screen is showing, from the saved draft.
struct PlannerFlow: View {
  let model: AppModel
  let planner: PlannerModel

  var body: some View {
    switch planner.draft.stage {
    case .assignment:
      AssignmentView(model: model, planner: planner)
    case .saying:
      SayingView(model: model, planner: planner)
    case .editor:
      EditorView(model: model, planner: planner)
    }
  }
}
