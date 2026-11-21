import FocusKit
import SwiftUI
import UIKit

/// The work screen: one step, five equal buttons in a fixed grid, nothing else asking for attention.
struct WorkView: View {
  let model: AppModel
  @State private var message: String?
  @State private var stuckStep: StuckTarget?
  @State private var askingSmaller = false
  @State private var smallerPiece = ""
  @State private var recallStepId: Int?
  @State private var recallText = ""
  @State private var parkText = ""
  @State private var parkedNote = false
  @State private var timerEnds: Date?

  var body: some View {
    VStack(alignment: .leading, spacing: Theme.Space.medium) {
      header
      if let step = model.currentStep {
        stepCard(step)
        ChoiceGrid(choices: ChoiceGrid.layout) { choice in choose(choice, step: step) }
        if askingSmaller { smallerBox(step) }
        if let message {
          Text(message)
            .font(Theme.Typography.body)
            .foregroundStyle(Theme.Palette.quiet)
            .accessibilityIdentifier("work-message")
        }
        parkBox
      } else if recallStepId != nil {
        recallCard
      } else {
        Color.clear.onAppear { model.leaveStep() }
      }
      Spacer(minLength: 0)
    }
    .padding(Theme.Space.large)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .pageBackground()
    .accessibilityElement(children: .contain)
    .accessibilityIdentifier("work-screen")
    .sheet(item: $stuckStep) { target in
      StuckView(model: model, target: target)
    }
    .sheet(
      isPresented: Binding(
        get: { recallStepId != nil && model.currentStep != nil },
        set: { if !$0 { finishRecall() } })
    ) {
      recallCard.padding(Theme.Space.large).presentationDetents([.medium])
    }
  }

  private var header: some View {
    HStack {
      if let position = model.stepPosition {
        Text("Step \(position.number) of \(position.total)")
          .font(Theme.Typography.small)
          .foregroundStyle(Theme.Palette.quiet)
          .accessibilityIdentifier("step-position")
      }
      Spacer()
      Menu {
        Button(Words.timerOff) { timerEnds = nil }
        Button("12 minutes") { timerEnds = Date().addingTimeInterval(12 * 60) }
        Button("25 minutes") { timerEnds = Date().addingTimeInterval(25 * 60) }
      } label: {
        Image(systemName: "timer").frame(minWidth: Theme.Space.touch, minHeight: Theme.Space.touch)
      }
      .accessibilityLabel(Words.timerMenu)
      Button {
        model.leaveStep()
      } label: {
        Image(systemName: "xmark").frame(minWidth: Theme.Space.touch, minHeight: Theme.Space.touch)
      }
      .accessibilityLabel("Back to Today")
      .accessibilityIdentifier("leave-step")
    }
  }

  private func stepCard(_ step: Step) -> some View {
    HStack(alignment: .center) {
      VStack(alignment: .leading, spacing: Theme.Space.small) {
        Text(step.text)
          .font(Theme.Typography.step)
          .foregroundStyle(Theme.Palette.ink)
          .accessibilityIdentifier("work-step")
        if let line = model.currentDoneLine {
          Text(verbatim: "\(Words.doneWhen) \(line)")
            .font(Theme.Typography.small)
            .foregroundStyle(Theme.Palette.quiet)
        }
      }
      Spacer(minLength: 0)
      if let end = timerEnds { CountdownRing(end: end) }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .cardStyle()
  }

  private func choose(_ choice: Choice, step: Step) {
    if choice == .drifted && !askingSmaller {
      askingSmaller = true
      return
    }
    let result = model.choose(choice, stepId: step.id, smallerPiece: smallerPiece)
    switch result {
    case .ignored:
      return
    case .stuck:
      stuckStep = StuckTarget(step: step)
    case .done(let text, let ask), .allDone(let text, let ask):
      message = text
      if ask { recallStepId = step.id }
      reset()
    case .stillWorking(let text), .laterNotPossible(let text):
      message = text
    case .needsSmallerPiece(let text):
      message = text
      return
    case .drifted(let text):
      message = text
      reset()
    case .later:
      reset()
    }
    UIImpactFeedbackGenerator(style: .light).impactOccurred()
  }

  private func reset() {
    askingSmaller = false
    smallerPiece = ""
  }

  private func smallerBox(_ step: Step) -> some View {
    VStack(alignment: .leading, spacing: Theme.Space.small) {
      Text(Words.driftedPrompt).font(Theme.Typography.body).foregroundStyle(Theme.Palette.ink)
      TextField(Words.driftedPrompt, text: $smallerPiece, axis: .vertical)
        .font(Theme.Typography.body)
        .cardStyle()
        .accessibilityIdentifier("smaller-piece")
      Button(Words.driftedConfirm) { choose(.drifted, step: step) }
        .buttonStyle(QuietButtonStyle())
        .accessibilityIdentifier("drifted-confirm")
    }
  }

  private var parkBox: some View {
    DisclosureGroup(Words.parkAThought) {
      HStack {
        TextField(Words.parkPlaceholder, text: $parkText)
          .font(Theme.Typography.body)
          .accessibilityIdentifier("park-text")
        Button("Save") {
          if model.park(parkText) {
            parkText = ""
            parkedNote = true
          }
        }
        .accessibilityIdentifier("park-save")
      }
      if parkedNote {
        Text(Words.parkSaved).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
      }
    }
    .font(Theme.Typography.body)
    .foregroundStyle(Theme.Palette.ink)
    .accessibilityIdentifier("park-thought")
  }

  private var recallCard: some View {
    VStack(alignment: .leading, spacing: Theme.Space.medium) {
      Text(Words.recallQuestion).font(Theme.Typography.title).foregroundStyle(Theme.Palette.ink)
      TextField(Words.recallQuestion, text: $recallText, axis: .vertical)
        .font(Theme.Typography.body)
        .cardStyle()
        .accessibilityIdentifier("recall-text")
      Button(Words.recallSave) {
        model.saveRecall(recallText, stepId: recallStepId)
        finishRecall()
      }
      .buttonStyle(QuietButtonStyle())
      .accessibilityIdentifier("recall-save")
      Button(Words.recallSkip) { finishRecall() }
        .buttonStyle(LinkButtonStyle())
        .accessibilityIdentifier("recall-skip")
    }
  }

  private func finishRecall() {
    recallText = ""
    recallStepId = nil
    if model.currentStep == nil { model.leaveStep() }
  }
}

/// The five buttons: same size, same style, in a grid that never reflows.
struct ChoiceGrid: View {
  /// Two columns, in this order. The sixth cell stays empty so nothing moves.
  static let layout: [Choice?] = [.done, .still, .stuck, .drifted, .later, nil]

  let choices: [Choice?]
  let action: (Choice) -> Void

  var body: some View {
    Grid(horizontalSpacing: Theme.Space.small, verticalSpacing: Theme.Space.small) {
      ForEach(0..<(choices.count / 2), id: \.self) { row in
        GridRow {
          cell(choices[row * 2])
          cell(choices[row * 2 + 1])
        }
      }
    }
  }

  @ViewBuilder
  private func cell(_ choice: Choice?) -> some View {
    if let choice {
      Button(Words.label(for: choice)) { action(choice) }
        .buttonStyle(QuietButtonStyle())
        .accessibilityIdentifier("choice-\(choice.rawValue)")
    } else {
      Color.clear.frame(height: Theme.Space.touch)
    }
  }
}

/// A silent ring that shrinks as the time passes. It reads the clock, so it is right after sleep.
struct CountdownRing: View {
  let end: Date
  private let total: TimeInterval

  init(end: Date) {
    self.end = end
    self.total = max(end.timeIntervalSinceNow, 1)
  }

  var body: some View {
    TimelineView(.periodic(from: .now, by: 1)) { context in
      let left = max(end.timeIntervalSince(context.date), 0)
      ZStack {
        Circle().stroke(Theme.Palette.line, lineWidth: Theme.Space.ring)
        Circle()
          .trim(from: 0, to: left / total)
          .stroke(
            Theme.Palette.moss, style: StrokeStyle(lineWidth: Theme.Space.ring, lineCap: .round)
          )
          .rotationEffect(.degrees(-90))
      }
      .frame(width: Theme.Space.huge, height: Theme.Space.huge)
      .accessibilityElement()
      .accessibilityLabel("Timer")
      .accessibilityValue(
        "\(Int(left / 60) + (left.truncatingRemainder(dividingBy: 60) > 0 ? 1 : 0)) minutes left")
    }
  }
}
