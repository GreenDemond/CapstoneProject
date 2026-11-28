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
  /// The block length of the countdown running now, so the end can ask about it.
  @State private var timerMinutes: Int?
  /// Set when a countdown just ended: the length to ask "Was N minutes about right?" about.
  @State private var askMinutes: Int?

  /// Seconds in a minute of the timer. A UI test can launch with a fast timer.
  private static var secondsPerMinute: Double {
    CommandLine.arguments.contains("-focus-fast-timer") ? 0.2 : 60
  }

  var body: some View {
    VStack(alignment: .leading, spacing: Theme.Space.medium) {
      header
      ScrollView {
        VStack(alignment: .leading, spacing: Theme.Space.medium) {
          content
        }
      }
      .scrollDismissesKeyboard(.interactively)
    }
    .padding(Theme.Space.large)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .pageBackground()
    .keyboardDoneButton()
    .accessibilityElement(children: .contain)
    .accessibilityIdentifier("work-screen")
    .onDisappear { model.dismissBlockFollowUp() }
    .onChange(of: model.currentStep?.id) { model.dismissBlockFollowUp() }
    .onChange(of: model.blockFollowUp?.line) { _, line in
      if let line { AccessibilityNotification.Announcement(line).post() }
    }
    .sheet(item: $stuckStep) { target in
      StuckView(model: model, target: target)
    }
    .sheet(
      isPresented: Binding(
        get: { recallStepId != nil && model.currentStep != nil },
        set: { if !$0 { finishRecall() } })
    ) {
      recallCard.padding(Theme.Space.large).presentationDetents([.medium]).keyboardDoneButton()
    }
  }

  @ViewBuilder
  private var content: some View {
    Group {
      if let step = model.currentStep {
        if let position = model.stepPosition {
          Text("Step \(position.number) of \(position.total)")
            .font(Theme.Typography.small)
            .foregroundStyle(Theme.Palette.quiet)
            .accessibilityIdentifier("step-position")
        }
        if let minutes = askMinutes { blockQuestion(minutes) }
        if let followUp = model.blockFollowUp { blockFollowUp(followUp) }
        stepCard(step)
        readButton(step)
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
    }
  }

  private var header: some View {
    HStack {
      Button {
        model.leaveStep()
      } label: {
        // One line at every text size: the short label is used when the long one does not fit.
        ViewThatFits(in: .horizontal) {
          Label(Words.backToToday, systemImage: "chevron.left").lineLimit(1)
          Label(Words.tabToday, systemImage: "chevron.left").lineLimit(1)
        }
      }
      .buttonStyle(LinkButtonStyle())
      .accessibilityLabel(Words.backToToday)
      .accessibilityHint("Your step is saved. You can pick it up again from Today.")
      .accessibilityIdentifier("leave-step")
      Spacer()
      Menu {
        Button(Words.timerOff) {
          timerEnds = nil
          timerMinutes = nil
          askMinutes = nil
          model.dismissBlockFollowUp()
        }
        ForEach(BlockLength.lengths, id: \.self) { minutes in
          Button(timerLabel(minutes)) {
            timerEnds = Date().addingTimeInterval(Double(minutes) * Self.secondsPerMinute)
            timerMinutes = minutes
            askMinutes = nil
            model.dismissBlockFollowUp()
          }
        }
      } label: {
        Image(systemName: "timer").frame(minWidth: Theme.Space.touch, minHeight: Theme.Space.touch)
      }
      .accessibilityLabel(Words.timerMenu)
      .accessibilityIdentifier("timer-menu")
    }
  }

  /// One quiet question when a block ends: Shorter, About right, Longer, or Skip. One answer
  /// writes one line; Skip writes nothing. Never blocks the step.
  private func blockQuestion(_ minutes: Int) -> some View {
    VStack(alignment: .leading, spacing: Theme.Space.small) {
      Text(Words.blockQuestion(minutes))
        .font(Theme.Typography.body)
        .foregroundStyle(Theme.Palette.ink)
        .accessibilityIdentifier("block-question")
      ViewThatFits(in: .horizontal) {
        HStack(spacing: Theme.Space.small) { blockButtons(minutes) }
        VStack(spacing: Theme.Space.small) { blockButtons(minutes) }
      }
      Button(Words.blockSkip) { askMinutes = nil }
        .buttonStyle(LinkButtonStyle())
        .accessibilityIdentifier("block-skip")
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .cardStyle()
  }

  /// After Shorter or Longer: one question for next time, or a moment of thinking. Done closes it.
  private func blockFollowUp(_ followUp: AppModel.BlockFollowUp) -> some View {
    VStack(alignment: .leading, spacing: Theme.Space.small) {
      Text(followUp.line ?? Words.blockFollowUpThinking)
        .font(Theme.Typography.body)
        .foregroundStyle(followUp.line == nil ? Theme.Palette.quiet : Theme.Palette.ink)
        .accessibilityIdentifier("block-followup")
      Button(Words.blockFollowUpDone) { model.dismissBlockFollowUp() }
        .buttonStyle(LinkButtonStyle())
        .accessibilityIdentifier("block-followup-done")
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .cardStyle()
  }

  @ViewBuilder
  private func blockButtons(_ minutes: Int) -> some View {
    ForEach(BlockLength.Answer.allCases.filter { BlockLength.offers($0, at: minutes) }, id: \.self)
    {
      answer in
      Button(blockLabel(answer)) {
        model.answerBlockLength(minutes: minutes, answer)
        model.startBlockFollowUp(minutes: minutes, answer)
        askMinutes = nil
      }
      .buttonStyle(QuietButtonStyle())
      .accessibilityIdentifier("block-\(answer.rawValue)")
    }
  }

  private func blockLabel(_ answer: BlockLength.Answer) -> String {
    switch answer {
    case .shorter: Words.blockShorter
    case .aboutRight: Words.blockAboutRight
    case .longer: Words.blockLonger
    }
  }

  /// "12 minutes", with "(your pick)" on the one chosen under How I like to work.
  private func timerLabel(_ minutes: Int) -> String {
    let base = "\(minutes) minutes"
    if model.me.learnedCountdownMinutes() == minutes { return "\(base) (\(Words.timerLearned))" }
    return model.me.startingCountdownMinutes == minutes ? "\(base) (\(Words.timerSuggested))" : base
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
      if let end = timerEnds {
        CountdownRing(end: end) {
          // Only a fresh end, with the app in front, raises the question.
          if let minutes = timerMinutes, BlockLength.shouldAsk(end: end, now: Date()) {
            askMinutes = minutes
          }
        }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .cardStyle()
  }

  @ViewBuilder
  private func readButton(_ step: Step) -> some View {
    if model.readAloudOn {
      VStack(alignment: .leading, spacing: Theme.Space.tiny) {
        Button {
          if model.speaker.isSpeaking {
            model.speaker.stop()
          } else {
            model.speaker.speak(step.text, kind: .step)
          }
        } label: {
          Label(
            model.speaker.isSpeaking ? Words.stopReading : Words.readThisStep,
            systemImage: model.speaker.isSpeaking ? "speaker.slash" : "speaker.wave.2")
        }
        .buttonStyle(LinkButtonStyle())
        .accessibilityIdentifier("read-step")
        if let note = model.speaker.note {
          Text(note).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
            .accessibilityIdentifier("read-note")
        }
      }
    }
  }

  private func choose(_ choice: Choice, step: Step) {
    model.speaker.stop()
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
    Haptics.press()
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
    .accessibilityElement(children: .contain)
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
  let onEnd: () -> Void

  init(end: Date, onEnd: @escaping () -> Void = {}) {
    self.end = end
    self.total = max(end.timeIntervalSinceNow, 0.1)
    self.onEnd = onEnd
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
      .onChange(of: left <= 0) { _, over in if over { onEnd() } }
      .accessibilityElement()
      .accessibilityLabel("Timer")
      .accessibilityValue(
        "\(Int(left / 60) + (left.truncatingRemainder(dividingBy: 60) > 0 ? 1 : 0)) minutes left")
    }
  }
}
