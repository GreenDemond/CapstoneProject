import Foundation

/// What the phone can do about speech to text right now.
public enum SpeechAvailability: Equatable, Sendable {
  case ready
  /// The student was never asked for the microphone.
  case needsPermission
  case permissionDenied
  /// The phone has no speech to text for the student's language.
  case languageUnsupported
  /// Supported, but the language files are not on the phone yet.
  case modelNeedsDownload
  case unavailable
}

public enum SpeechInputEvent: Equatable, Sendable {
  /// The best text for everything said so far in this go. Each one replaces the one before.
  case words(String)
  /// A phone call or another app took the audio.
  case interrupted
  case failed
}

/// Speech to text, on the phone. Only `listen()` turns the microphone on, and only
/// `DictationModel` calls it, and only after the student pressed the microphone button.
/// Implementations never write audio to disk and never send it anywhere.
public protocol SpeechInput: Sendable {
  func availability() async -> SpeechAvailability
  /// Asks iOS for the microphone. True when allowed.
  func requestPermission() async -> Bool
  /// Gets the language files from Apple (nothing of the student's is sent). True when done.
  func downloadLanguage() async -> Bool
  /// Starts listening. The stream ends after `stopListening()` and the last words are sent, or
  /// when the stream's reader goes away.
  func listen() -> AsyncStream<SpeechInputEvent>
  func stopListening() async
}

/// What a phone with no speech to text looks like. The app is fully usable with it.
public struct UnavailableSpeechInput: SpeechInput {
  public init() {}
  public func availability() async -> SpeechAvailability { .unavailable }
  public func requestPermission() async -> Bool { false }
  public func downloadLanguage() async -> Bool { false }
  public func listen() -> AsyncStream<SpeechInputEvent> {
    AsyncStream { $0.finish() }
  }
  public func stopListening() async {}
}

/// Explained once, before the first permission request.
public struct VoiceFlags: Storable {
  public static let fileName = "voiceflags.json"

  public var micExplained: Bool

  public init(micExplained: Bool = false) {
    self.micExplained = micExplained
  }
}
