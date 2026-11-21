import FocusKit
import SwiftUI

/// Today, with steps: one card and nothing else.
struct NextStepView: View {
  let model: AppModel

  var body: some View {
    VStack(alignment: .leading, spacing: Theme.Space.large) {
      Spacer()
      if model.allDone {
        Text(Words.todayDone)
          .font(Theme.Typography.big)
          .foregroundStyle(Theme.Palette.ink)
          .accessibilityAddTraits(.isHeader)
          .accessibilityIdentifier("today-done")
        Text(Words.todayDoneSuggestion)
          .font(Theme.Typography.body)
          .foregroundStyle(Theme.Palette.quiet)
      } else if let step = model.currentStep {
        Text(model.welcomeLine)
          .font(Theme.Typography.body)
          .foregroundStyle(Theme.Palette.quiet)
          .accessibilityIdentifier("welcome-line")
        Text(step.text)
          .font(Theme.Typography.step)
          .foregroundStyle(Theme.Palette.ink)
          .frame(maxWidth: .infinity, alignment: .leading)
          .cardStyle()
          .accessibilityIdentifier("next-step")
      }
      Spacer()
      if !model.allDone {
        Button(Words.startThisStep) { model.startStep() }
          .buttonStyle(MainButtonStyle())
          .accessibilityIdentifier("start-this-step")
      }
      HStack {
        if !model.allDone {
          NavigationLink(Words.allMySteps) { PlanListView(model: model) }
            .buttonStyle(LinkButtonStyle())
            .accessibilityIdentifier("all-my-steps")
          Spacer()
        }
        Button(Words.newAssignment) { model.startNewAssignment() }
          .buttonStyle(LinkButtonStyle())
          .accessibilityIdentifier("new-assignment")
      }
    }
    .padding(Theme.Space.large)
    .accessibilityElement(children: .contain)
    .accessibilityIdentifier("today-screen")
  }
}

/// All the steps of the current assignment, in order. Nothing about time or misses.
struct PlanListView: View {
  let model: AppModel

  var body: some View {
    Group {
      if let steps = model.work?.steps, !steps.isEmpty {
        List(steps, id: \.id) { step in
          HStack {
            Image(systemName: step.done ? "checkmark.circle.fill" : "circle")
              .foregroundStyle(step.done ? Theme.Palette.moss : Theme.Palette.quiet)
              .accessibilityHidden(true)
            Text(step.text)
              .font(Theme.Typography.body)
              .foregroundStyle(step.done ? Theme.Palette.quiet : Theme.Palette.ink)
          }
          .accessibilityElement(children: .combine)
          .accessibilityValue(step.done ? Words.stepDoneMark : "")
          .listRowBackground(Theme.Palette.card)
        }
        .scrollContentBackground(.hidden)
      } else {
        VStack(alignment: .leading, spacing: Theme.Space.medium) {
          Text(Words.planEmpty)
            .font(Theme.Typography.body)
            .foregroundStyle(Theme.Palette.quiet)
          Button(Words.planMakeSteps) { model.goToPlanning() }
            .buttonStyle(MainButtonStyle())
            .accessibilityIdentifier("plan-make-steps")
        }
        .padding(Theme.Space.large)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      }
    }
    .navigationTitle(Words.allStepsTitle)
    .navigationBarTitleDisplayMode(.inline)
    .pageBackground()
    .accessibilityElement(children: .contain)
    .accessibilityIdentifier("plan-list")
  }
}
