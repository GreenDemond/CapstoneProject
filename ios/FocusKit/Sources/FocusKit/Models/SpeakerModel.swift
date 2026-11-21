import Foundation
import Observation

/// Everything the app says aloud goes through here, so the rules in `VoicePolicy` cannot be
/// skipped: in Quiet nothing is ever spoken, and with "only through headphones" on and none
/// connected nothing is spoken either. The text is always shown by the screen itself.
@MainActor
@Observable
public final class SpeakerModel {
  public private(set) var isSpeaking = false
  /// A calm line to show when the student asked to hear something and could not.
  public private(set) var note: String?

  /// The current settings. Set by the app.
  public var settings: () -> Settings = { Settings() }

  private let output: any SpeechOutput
  private let headphones: any HeadphoneStatus

  public init(output: any SpeechOutput, headphones: any HeadphoneStatus) {
    self.output = output
    self.headphones = headphones
    output.onStopped = { [weak self] in self?.isSpeaking = false }
    headphones.onChange = { [weak self] in self?.headphonesChanged() }
  }

  public var headphonesConnected: Bool { headphones.isConnected }

  public var voices: [VoiceChoice] { output.voices() }

  /// Speaks `text` if the rules allow. Returns what was decided.
  @discardableResult
  public func speak(_ text: String, kind: SpokenKind) -> VoicePolicy.Verdict {
    let current = settings()
    let verdict = VoicePolicy.verdict(
      readAloud: current.readAloud, headphonesOnly: current.headphonesOnly,
      headphonesConnected: headphones.isConnected, kind: kind)
    note = nil
    guard verdict == .speak else {
      if verdict == .needsHeadphones && kind == .step { note = Words.readNoHeadphones }
      return verdict
    }
    let said = Text.trimmed(text)
    guard !said.isEmpty else { return .silent }
    isSpeaking = true
    output.speak(said, voiceId: current.voiceId, rate: current.speechRate)
    return .speak
  }

  /// One tap stops the voice at once.
  public func stop() {
    guard isSpeaking else { return }
    output.stop()
    isSpeaking = false
  }

  /// Headphones came out in the middle of a sentence: the voice stops rather than moving to the
  /// phone's speaker.
  private func headphonesChanged() {
    if !headphones.isConnected { stop() }
  }

  /// A call or another app took the audio.
  public func interrupted() {
    output.stop()
    isSpeaking = false
  }
}
