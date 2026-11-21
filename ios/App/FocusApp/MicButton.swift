import FocusKit
import SwiftUI
import UIKit

/// The microphone button. Hold to talk, or tap once to start and once to stop. Shown only when
/// the student has turned voice on under Me, and hidden when the language is not supported.
struct MicButton: View {
  let model: AppModel
  @Binding var text: String
  var onFinished: (() -> Void)?
  @State private var pressed = false

  private var dictation: DictationModel { model.dictation }

  var body: some View {
    if model.talkOn && dictation.isOffered {
      VStack(alignment: .leading, spacing: Theme.Space.small) {
        HStack(spacing: Theme.Space.small) {
          button
          if dictation.isListening {
            Label(Words.micListening, systemImage: "waveform")
              .font(Theme.Typography.body)
              .foregroundStyle(Theme.Palette.moss)
              .accessibilityIdentifier("mic-listening")
          }
        }
        status
      }
      .task { await dictation.refresh() }
      .onChange(of: dictation.liveText) { _, new in
        if let new { text = new }
      }
      .onChange(of: dictation.state) { old, new in
        if old == .listening && new == .idle { onFinished?() }
      }
    }
  }

  private var button: some View {
    Image(systemName: dictation.isListening ? "mic.fill" : "mic")
      .font(Theme.Typography.title)
      .foregroundStyle(dictation.isListening ? Theme.Palette.onMoss : Theme.Palette.ink)
      .frame(
        width: Theme.Space.huge + Theme.Space.small, height: Theme.Space.huge + Theme.Space.small
      )
      .background(
        dictation.isListening ? Theme.Palette.moss : Theme.Palette.card, in: Circle()
      )
      .overlay(Circle().stroke(Theme.Palette.line, lineWidth: Theme.Space.line))
      .contentShape(Circle())
      .gesture(
        DragGesture(minimumDistance: 0)
          .onChanged { _ in
            guard !pressed else { return }
            pressed = true
            Task { await dictation.pressDown(existing: text) }
          }
          .onEnded { _ in
            pressed = false
            dictation.pressUp()
          }
      )
      .accessibilityElement()
      .accessibilityLabel(Words.micLabel)
      .accessibilityHint(Words.micHint)
      .accessibilityAddTraits(.isButton)
      .accessibilityAction { Task { await dictation.toggle(existing: text) } }
      .accessibilityIdentifier("mic-button")
  }

  @ViewBuilder
  private var status: some View {
    switch dictation.state {
    case .explaining:
      VStack(alignment: .leading, spacing: Theme.Space.small) {
        Text(Words.micExplain).font(Theme.Typography.body).foregroundStyle(Theme.Palette.ink)
        HStack {
          Button(Words.micOkay) { Task { await dictation.confirmExplanation() } }
            .buttonStyle(MainButtonStyle())
            .accessibilityIdentifier("mic-okay")
          Button(Words.micNotNow) { dictation.dismissExplanation() }
            .buttonStyle(QuietButtonStyle())
            .accessibilityIdentifier("mic-not-now")
        }
      }
      .cardStyle()
    case .denied:
      VStack(alignment: .leading, spacing: Theme.Space.small) {
        Text(Words.micDenied).font(Theme.Typography.body).foregroundStyle(Theme.Palette.quiet)
        Button(Words.micOpenSettings) {
          if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
          }
        }
        .buttonStyle(LinkButtonStyle())
      }
      .accessibilityIdentifier("mic-denied")
    case .needsDownload:
      VStack(alignment: .leading, spacing: Theme.Space.small) {
        Text(Words.micNeedsDownload).font(Theme.Typography.body).foregroundStyle(
          Theme.Palette.quiet)
        Button(Words.micDownload) { Task { await dictation.downloadLanguage() } }
          .buttonStyle(QuietButtonStyle())
          .accessibilityIdentifier("mic-download")
      }
    case .unavailable:
      Text(Words.micUnavailable).font(Theme.Typography.body).foregroundStyle(Theme.Palette.quiet)
    default:
      if let note = dictation.note {
        Text(note).font(Theme.Typography.small).foregroundStyle(Theme.Palette.quiet)
          .accessibilityIdentifier("mic-note")
      }
    }
  }
}
