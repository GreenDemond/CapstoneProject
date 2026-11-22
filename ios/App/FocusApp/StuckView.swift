import FocusKit
import SwiftUI

/// The step the Stuck sheet is open for.
struct StuckTarget: Identifiable {
  let step: Step
  var id: Int { step.id }
}

/// Stuck is a ladder, not an answer. Hints first, then help wording a question for a person.
/// Look it up and Talk it through are rungs too (T08, T12).
struct StuckView: View {
  let model: AppModel
  let target: StuckTarget
  @Environment(\.dismiss) private var dismiss

  var body: some View {
    NavigationStack {
      LadderBody(model: model, ladder: model.ladder(for: target.step), dismiss: { dismiss() })
        .navigationTitle(Words.stuckTitle)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .topBarLeading) {
            Button(Words.backToStep) { dismiss() }
              .accessibilityIdentifier("stuck-close")
          }
        }
    }
    .presentationDetents([.large])
  }
}

struct LadderBody: View {
  let model: AppModel
  let ladder: LadderModel
  /// Closes the whole Stuck sheet. Nil when there is no step to go back to (the Talk tab).
  let dismiss: (() -> Void)?
  @State private var copied = false

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: Theme.Space.medium) {
        ForEach(Array(ladder.hintsShown.enumerated()), id: \.offset) { _, hint in
          Text(verbatim: hint)
            .font(Theme.Typography.body)
            .foregroundStyle(Theme.Palette.ink)
            .frame(maxWidth: .infinity, alignment: .leading)
            .cardStyle()
        }
        .accessibilityIdentifier("hint")

        if ladder.hasMoreHints {
          Button(Words.anotherHint) { ladder.nextHint() }
            .buttonStyle(
              ladder.canAskPerson
                ? AnyButtonStyle(QuietButtonStyle()) : AnyButtonStyle(MainButtonStyle())
            )
            .accessibilityIdentifier("another-hint")
        } else {
          Text(Words.noMoreHints).font(Theme.Typography.body).foregroundStyle(Theme.Palette.quiet)
        }

        LookItUpRung(model: model, ladder: ladder, dismiss: dismiss)

        TalkItThroughRung(model: model, ladder: ladder, kindId: model.saved?.kindId)

        if ladder.canAskPerson { askPerson }

        if let dismiss {
          Button(Words.backToStep, action: dismiss)
            .buttonStyle(LinkButtonStyle())
            .accessibilityIdentifier("back-to-step")
        }
      }
      .padding(Theme.Space.large)
    }
    .pageBackground()
    .keyboardDoneButton()
    .onAppear { if ladder.hintsShown.isEmpty { ladder.nextHint() } }
    .accessibilityElement(children: .contain)
    .accessibilityIdentifier("stuck-screen")
  }

  private var askPerson: some View {
    @Bindable var ladder = ladder
    return VStack(alignment: .leading, spacing: Theme.Space.small) {
      Text(Words.askAPerson).font(Theme.Typography.title).foregroundStyle(Theme.Palette.ink)
      Text(Words.askIntro).font(Theme.Typography.body).foregroundStyle(Theme.Palette.quiet)
      field(Words.askOn, text: $ladder.onStep, id: "ask-on")
      field(Words.askTried, text: $ladder.tried, id: "ask-tried")
      field(Words.askDontGet, text: $ladder.dontGet, id: "ask-dont-get")
      if let question = ladder.question {
        Button(copied ? Words.askCopied : Words.askCopy) {
          UIPasteboard.general.string = question
          ladder.markCopied()
          copied = true
        }
        .buttonStyle(MainButtonStyle())
        .accessibilityIdentifier("ask-copy")
      } else {
        Text(Words.askNeedWords)
          .font(Theme.Typography.small)
          .foregroundStyle(Theme.Palette.quiet)
          .accessibilityIdentifier("ask-need-words")
      }
    }
  }

  private func field(_ label: String, text: Binding<String>, id: String) -> some View {
    VStack(alignment: .leading, spacing: Theme.Space.tiny) {
      Text(label).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
      TextField(label, text: text, axis: .vertical)
        .font(Theme.Typography.body)
        .cardStyle()
        .accessibilityLabel(label)
        .accessibilityIdentifier(id)
        .onChange(of: text.wrappedValue) { copied = false }
    }
  }
}

/// Lets one `Button` pick between two styles.
struct AnyButtonStyle: ButtonStyle {
  private let make: (Configuration) -> AnyView

  init<S: ButtonStyle>(_ style: S) {
    make = { AnyView(style.makeBody(configuration: $0)) }
  }

  func makeBody(configuration: Configuration) -> some View {
    make(configuration)
  }
}

/// The Look it up rung: opens the search with the step's key words already in the box.
struct LookItUpRung: View {
  let model: AppModel
  let ladder: LadderModel
  let dismiss: (() -> Void)?

  var body: some View {
    if LookUpModel.isOn {
      NavigationLink {
        LookUpView(words: LookUpText.keyWords(from: ladder.onStep), backToStep: dismiss)
      } label: {
        Label(Words.lookItUpLater, systemImage: "magnifyingglass")
          .font(Theme.Typography.button)
          .foregroundStyle(Theme.Palette.ink)
          .frame(maxWidth: .infinity, minHeight: Theme.Space.touch, alignment: .leading)
          .cardStyle()
      }
      .accessibilityIdentifier("lookup-rung")
    }
  }
}

/// The Talk it through rung: opens the chat already knowing the step. Only when the AI is on.
struct TalkItThroughRung: View {
  let model: AppModel
  let ladder: LadderModel
  let kindId: String?

  var body: some View {
    if model.talk.isAvailable {
      NavigationLink {
        ChatScreen(model: model, step: (text: ladder.onStep, kindId: kindId))
      } label: {
        Label(Words.talkItThrough, systemImage: "bubble.left")
          .font(Theme.Typography.button)
          .foregroundStyle(Theme.Palette.ink)
          .frame(maxWidth: .infinity, minHeight: Theme.Space.touch, alignment: .leading)
          .cardStyle()
      }
      .accessibilityIdentifier("talk-rung")
    } else {
      VStack(alignment: .leading, spacing: Theme.Space.tiny) {
        Text(Words.talkItThrough).font(Theme.Typography.body).foregroundStyle(Theme.Palette.quiet)
        Text(Words.aiUnavailable(model.talk.availability))
          .font(Theme.Typography.small)
          .foregroundStyle(Theme.Palette.quiet)
          .accessibilityIdentifier("talk-rung-unavailable")
      }
    }
  }
}
