import FocusKit
import SwiftUI

/// The weekly look-back (C5): two optional questions, then one reply. The answers become the
/// student's own lines under What the app remembers about me. The reply is never saved.
struct ReflectionView: View {
  let model: AppModel
  let close: () -> Void
  @State private var helped = ""
  @State private var next = ""
  @State private var submitted = false

  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: Theme.Space.medium) {
          if !submitted {
            questions
          } else {
            reply
          }
        }
        .padding(Theme.Space.large)
      }
      .scrollDismissesKeyboard(.interactively)
      .keyboardDoneButton()
      .pageBackground()
      .navigationTitle(Words.reflectionTitle)
      .navigationBarTitleDisplayMode(.inline)
    }
    .onChange(of: model.reflectionReply) { _, reply in
      if let reply { AccessibilityNotification.Announcement(reply.line).post() }
    }
    .accessibilityIdentifier("reflection-screen")
  }

  @ViewBuilder
  private var questions: some View {
    field(Words.reflectionHelpedQuestion, text: $helped, id: "reflection-helped")
    field(Words.reflectionNextQuestion, text: $next, id: "reflection-next")
    Button(Words.reflectionDone) {
      submitted = true
      Task { await model.submitReflection(helped: helped, next: next) }
    }
    .buttonStyle(MainButtonStyle())
    .accessibilityIdentifier("reflection-done")
    Button(Words.reflectionNotNow) {
      model.laterReflection()
      close()
    }
    .buttonStyle(LinkButtonStyle())
    .accessibilityIdentifier("reflection-not-now")
  }

  @ViewBuilder
  private var reply: some View {
    if let reply = model.reflectionReply {
      Text(verbatim: reply.line)
        .font(Theme.Typography.body)
        .foregroundStyle(Theme.Palette.ink)
        .frame(maxWidth: .infinity, alignment: .leading)
        .cardStyle()
        .accessibilityIdentifier("reflection-reply")
      if !reply.fixed {
        FeedbackRow(
          rated: model.reflectionRated, idPrefix: "reflection-feedback",
          about: "the weekly look-back reply"
        ) { model.rateReflection($0) }
      }
    } else if model.reflectionBusy {
      Text(Words.reflectionThinking)
        .font(Theme.Typography.body)
        .foregroundStyle(Theme.Palette.quiet)
        .accessibilityIdentifier("reflection-thinking")
    }
    Button(Words.reflectionClose) {
      model.closeReflection()
      close()
    }
    .buttonStyle(MainButtonStyle())
    .disabled(model.reflectionBusy)
    .accessibilityIdentifier("reflection-close")
  }

  private func field(_ label: String, text: Binding<String>, id: String) -> some View {
    VStack(alignment: .leading, spacing: Theme.Space.tiny) {
      Text(label).font(Theme.Typography.body).foregroundStyle(Theme.Palette.ink)
      TextField(label, text: text, axis: .vertical)
        .font(Theme.Typography.body)
        .cardStyle()
        .accessibilityLabel(label)
        .accessibilityIdentifier(id)
    }
  }
}
