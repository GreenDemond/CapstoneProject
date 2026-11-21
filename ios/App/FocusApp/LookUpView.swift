import FocusKit
import SafariServices
import SwiftUI

/// Look it up: a short list of reference pages. The screen says where the words go before the
/// first search. A page opens in the system's in-app Safari view with a way back.
struct LookUpView: View {
  @State private var lookUp: LookUpModel
  @State private var opened: LookUpResult?
  /// Set when opened from a step: closes the whole Stuck sheet.
  let backToStep: (() -> Void)?

  init(words: String = "", backToStep: (() -> Void)? = nil) {
    _lookUp = State(initialValue: LookUpModel(lookUp: WikipediaLookUp(), words: words))
    self.backToStep = backToStep
  }

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: Theme.Space.medium) {
        if !LookUpModel.isOn {
          Text(Words.lookUpOff).font(Theme.Typography.body).foregroundStyle(Theme.Palette.quiet)
        } else {
          Label(Words.lookUpPrivacy, systemImage: "network")
            .font(Theme.Typography.small)
            .foregroundStyle(Theme.Palette.quiet)
            .accessibilityIdentifier("lookup-privacy")
          TextField(Words.lookUpPlaceholder, text: $lookUp.words, axis: .vertical)
            .font(Theme.Typography.body)
            .foregroundStyle(Theme.Palette.ink)
            .lineLimit(1...3)
            .cardStyle()
            .submitLabel(.search)
            .onSubmit { lookUp.search() }
            .accessibilityLabel(Words.lookUpPlaceholder)
            .accessibilityIdentifier("lookup-words")
          Button(Words.lookUpButton) { lookUp.search() }
            .buttonStyle(MainButtonStyle())
            .accessibilityIdentifier("lookup-search")
          stateView
          if lookUp.canTryAgain {
            Button(Words.tryAgain) { lookUp.search() }
              .buttonStyle(QuietButtonStyle())
              .accessibilityIdentifier("lookup-retry")
          }
        }
        if let backToStep {
          Button(Words.backToStep, action: backToStep)
            .buttonStyle(LinkButtonStyle())
            .accessibilityIdentifier("lookup-back-to-step")
        }
      }
      .padding(Theme.Space.large)
    }
    .scrollDismissesKeyboard(.interactively)
    .pageBackground()
    .navigationTitle(Words.lookUpTitle)
    .navigationBarTitleDisplayMode(.inline)
    .onDisappear { lookUp.cancel() }
    .fullScreenCover(item: $opened) { result in
      PageView(url: result.url, backLabel: backToStep == nil ? "Back to results" : Words.backToStep)
      {
        opened = nil
        if let backToStep { backToStep() }
      }
    }
    .accessibilityElement(children: .contain)
    .accessibilityIdentifier("lookup-screen")
  }

  @ViewBuilder
  private var stateView: some View {
    switch lookUp.state {
    case .idle:
      EmptyView()
    case .loading:
      ProgressView().accessibilityLabel("Searching")
    case .results(let results):
      ForEach(results) { result in
        Button {
          opened = result
        } label: {
          VStack(alignment: .leading, spacing: Theme.Space.tiny) {
            Text(verbatim: result.title).font(Theme.Typography.button).foregroundStyle(
              Theme.Palette.ink)
            if !result.line.isEmpty {
              Text(verbatim: result.line).font(Theme.Typography.small).foregroundStyle(
                Theme.Palette.quiet)
            }
          }
          .frame(maxWidth: .infinity, alignment: .leading)
          .cardStyle()
        }
        .accessibilityIdentifier("lookup-result")
      }
    case .none:
      note(Words.lookUpNone)
    case .offline:
      note(Words.lookUpOffline)
    case .slow:
      note(Words.lookUpSlow)
    case .trouble:
      note(Words.lookUpTrouble)
    case .emptyWords:
      note(Words.lookUpEmpty)
    }
  }

  private func note(_ text: String) -> some View {
    Text(text)
      .font(Theme.Typography.body)
      .foregroundStyle(Theme.Palette.clay)
      .accessibilityIdentifier("lookup-note")
  }
}

/// A page in the system's own Safari view, with a bar above it to get back.
struct PageView: View {
  let url: URL
  let backLabel: String
  let back: () -> Void

  var body: some View {
    VStack(spacing: 0) {
      Button(backLabel, action: back)
        .buttonStyle(LinkButtonStyle())
        .padding(.horizontal, Theme.Space.medium)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.Palette.sand)
        .accessibilityIdentifier("page-back")
      SafariPage(url: url)
    }
  }
}

struct SafariPage: UIViewControllerRepresentable {
  let url: URL

  func makeUIViewController(context: Context) -> SFSafariViewController {
    let configuration = SFSafariViewController.Configuration()
    configuration.entersReaderIfAvailable = false
    return SFSafariViewController(url: url, configuration: configuration)
  }

  func updateUIViewController(_ controller: SFSafariViewController, context: Context) {}
}
