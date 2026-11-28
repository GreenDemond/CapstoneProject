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
  @State private var pendingDelete: String?
  /// Kept apart from `pendingDelete`: the dialog clears that before its buttons run.
  @State private var chosenDelete: String?
  @State private var lookingBack = false

  private var steps: [Step] { model.work?.steps ?? [] }
  private var hasThoughts: Bool { !model.parked.items.isEmpty || !model.recall.items.isEmpty }

  var body: some View {
    planBody
      // One quiet card when seven days have passed. Not now is as easy to tap as Take a look.
      .safeAreaInset(edge: .top) {
        if model.reflectionDue {
          reflectionCard
        }
      }
      .onAppear { model.startReflectionClock() }
      .sheet(isPresented: $lookingBack) {
        ReflectionView(model: model) { lookingBack = false }
      }
  }

  private var reflectionCard: some View {
    VStack(alignment: .leading, spacing: Theme.Space.small) {
      Text(Words.reflectionCard)
        .font(Theme.Typography.body)
        .foregroundStyle(Theme.Palette.ink)
      // Side by side; stacked when the text size is too large for one row.
      ViewThatFits(in: .horizontal) {
        HStack(spacing: Theme.Space.small) { reflectionButtons }
        VStack(spacing: Theme.Space.small) { reflectionButtons }
      }
    }
    .padding(Theme.Space.medium)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(Theme.Palette.card)
    .accessibilityElement(children: .contain)
    .accessibilityIdentifier("reflection-card")
  }

  @ViewBuilder
  private var reflectionButtons: some View {
    Button(Words.reflectionOpen) { lookingBack = true }
      .buttonStyle(QuietButtonStyle())
      .accessibilityIdentifier("reflection-open")
    Button(Words.reflectionNotNow) { model.laterReflection() }
      .buttonStyle(QuietButtonStyle())
      .accessibilityIdentifier("reflection-later")
  }

  private var planBody: some View {
    Group {
      if !steps.isEmpty || hasThoughts {
        List {
          if !steps.isEmpty {
            Section {
              ForEach(steps, id: \.id) { step in
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
            }
          }
          if hasThoughts {
            Section {
              ForEach(model.parked.items) { item in
                thoughtRow(id: item.id, text: item.text, date: item.date)
              }
              ForEach(model.recall.items) { item in
                thoughtRow(id: item.id, text: item.answer, date: item.date)
              }
            } header: {
              Text(Words.savedThoughtsTitle)
            }
          }
        }
        .scrollContentBackground(.hidden)
        // One dialog for the list, so it is not attached to a row that the delete removes.
        .confirmationDialog(
          Words.savedThoughtConfirm,
          isPresented: Binding(
            get: { pendingDelete != nil },
            set: { if !$0 { pendingDelete = nil } })
        ) {
          Button(Words.savedThoughtDelete, role: .destructive) {
            if let id = chosenDelete {
              model.deleteParked(id)
              model.deleteRecall(id)
            }
            chosenDelete = nil
          }
          Button(Words.savedThoughtKeep, role: .cancel) { pendingDelete = nil }
        }
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

  /// One saved thought or answer. Deleting asks first, and a full swipe does not delete.
  private func thoughtRow(id: String, text: String, date: Date) -> some View {
    VStack(alignment: .leading, spacing: Theme.Space.tiny) {
      Text(verbatim: text)
        .font(Theme.Typography.body)
        .foregroundStyle(Theme.Palette.ink)
      Text(date, style: .date)
        .font(Theme.Typography.small)
        .foregroundStyle(Theme.Palette.quiet)
    }
    .accessibilityElement(children: .combine)
    .accessibilityIdentifier("saved-thought-row")
    .listRowBackground(Theme.Palette.card)
    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
      Button(Words.savedThoughtDelete, role: .destructive) {
        chosenDelete = id
        pendingDelete = id
      }
      .accessibilityIdentifier("saved-thought-delete")
    }
  }
}
