import Foundation
import Observation

/// The microphone button, without any screen code. The microphone is turned on only by
/// `pressDown` or `toggle` (the student's own press) and never by anything else. A press and
/// release shorter than `tapGap` leaves listening on until the next press (tap to start, tap to stop).
@MainActor
@Observable
public final class DictationModel {
  public enum State: Equatable, Sendable {
    case idle
    /// Checking what the phone can do. The microphone is not on.
    case starting
    /// Showing the one sentence about the microphone, before the first permission request.
    case explaining
    case listening
    case needsDownload
    case denied
    /// No speech to text for this language. The button is hidden.
    case unsupported
    case unavailable
  }

  /// A press shorter than this many seconds is a tap.
  public static let tapGap: TimeInterval = 0.4

  public private(set) var state: State = .idle
  /// What the text box should hold, while and after listening: what was there before, then the words.
  public private(set) var liveText: String?
  /// A calm line to show under the button, if any.
  public private(set) var note: String?
  /// Called just before the microphone goes on, so the app can stop speaking first.
  public var willListen: () -> Void = {}

  private let input: any SpeechInput
  private let store: any Store
  private let clock: any AppClock
  private let limit: Int

  private var explained: Bool
  private var base = ""
  private var downAt: Date?
  private var sticky = false
  private var swallowUp = false
  private var cancelStart = false
  private var reader: Task<Void, Never>?

  public init(input: any SpeechInput, store: any Store, clock: any AppClock, limit: Int) {
    self.input = input
    self.store = store
    self.clock = clock
    self.limit = limit
    self.explained = store.load(VoiceFlags.self).value?.micExplained ?? false
  }

  /// The button is shown unless the language is not supported.
  public var isOffered: Bool { state != .unsupported }
  public var isListening: Bool { state == .listening }

  /// Looks at what the phone can do. Never turns the microphone on and never asks permission.
  public func refresh() async {
    guard
      state == .idle || state == .unsupported || state == .denied || state == .unavailable
        || state == .needsDownload
    else { return }
    apply(await input.availability(), askingNow: false)
  }

  /// The student pressed the button down.
  public func pressDown(existing: String) async {
    if state == .listening {
      swallowUp = true
      stop()
      return
    }
    guard state == .idle || state == .denied || state == .unavailable || state == .needsDownload
    else { return }
    downAt = clock.now
    sticky = false
    cancelStart = false
    base = existing
    note = nil
    state = .starting
    let availability = await input.availability()
    guard state == .starting else { return }
    switch availability {
    case .ready:
      if cancelStart {
        state = .idle
        return
      }
      begin()
    default:
      apply(availability, askingNow: true)
    }
  }

  /// The student lifted their finger.
  public func pressUp() {
    if swallowUp {
      swallowUp = false
      return
    }
    let quick = downAt.map { clock.now.timeIntervalSince($0) < Self.tapGap } ?? false
    switch state {
    case .listening:
      if quick { sticky = true } else { stop() }
    case .starting:
      if quick { sticky = true } else { cancelStart = true }
    default:
      break
    }
  }

  /// For VoiceOver and keyboards: one activation starts, the next stops.
  public func toggle(existing: String) async {
    if state == .listening {
      stop()
    } else {
      await pressDown(existing: existing)
      sticky = true
    }
  }

  /// The student read the one sentence and chose to go on. Asks iOS for the microphone. Does not
  /// turn the microphone on: the student presses again.
  public func confirmExplanation() async {
    guard state == .explaining else { return }
    explained = true
    save()
    let allowed = await input.requestPermission()
    if allowed {
      state = .idle
      note = Words.micAfterAllowed
    } else {
      state = .denied
    }
  }

  public func dismissExplanation() {
    guard state == .explaining else { return }
    state = .idle
  }

  /// The student tapped Download for the speech files.
  public func downloadLanguage() async {
    guard state == .needsDownload else { return }
    if await input.downloadLanguage() {
      state = .idle
      note = Words.micAfterAllowed
    } else {
      note = Words.micDownloadFailed
    }
  }

  /// The app left the front. Listening stops at once; words so far stay.
  public func appWentToBackground() {
    if state == .listening || state == .starting {
      if state == .starting { cancelStart = true }
      stop()
    }
  }

  // MARK: Inside

  private func apply(_ availability: SpeechAvailability, askingNow: Bool) {
    switch availability {
    case .ready:
      if state == .unsupported || state == .denied || state == .unavailable
        || state == .needsDownload || state == .starting
      {
        state = .idle
      }
    case .needsPermission:
      if askingNow {
        state = explained ? .idle : .explaining
        if explained {
          Task { await requestAgain() }
        }
      } else if state != .idle {
        state = .idle
      }
    case .permissionDenied:
      state = .denied
    case .languageUnsupported:
      state = .unsupported
    case .modelNeedsDownload:
      state = .needsDownload
    case .unavailable:
      state = .unavailable
    }
  }

  /// Already explained once, but iOS has never been asked (for example after a reset).
  private func requestAgain() async {
    state = .starting
    if await input.requestPermission() {
      state = .idle
      note = Words.micAfterAllowed
    } else {
      state = .denied
    }
  }

  private func begin() {
    willListen()
    state = .listening
    liveText = nil
    let stream = input.listen()
    reader = Task { [weak self] in
      for await event in stream {
        guard let self else { return }
        self.handle(event)
      }
      self?.finished()
    }
  }

  private func handle(_ event: SpeechInputEvent) {
    switch event {
    case .words(let spoken):
      let joined = Self.join(base, spoken, limit: limit)
      liveText = joined.text
      if joined.full {
        note = Words.micTooLong
        stop()
      }
    case .interrupted:
      note = Words.micInterrupted
      stop()
    case .failed:
      note = Words.micTrouble
      stop()
    }
  }

  private func finished() {
    reader = nil
    if state == .listening { state = .idle }
    sticky = false
  }

  private func stop() {
    let input = self.input
    Task { await input.stopListening() }
  }

  private func save() {
    try? store.save(VoiceFlags(micExplained: explained))
  }

  static func join(_ base: String, _ spoken: String, limit: Int) -> (text: String, full: Bool) {
    let said = Text.collapsed(spoken)
    guard !said.isEmpty else { return (base, false) }
    let separator = base.isEmpty || base.hasSuffix(" ") || base.hasSuffix("\n") ? "" : " "
    let whole = base + separator + said
    if whole.utf16.count >= limit { return (Text.cut(whole, to: limit), true) }
    return (whole, false)
  }
}
