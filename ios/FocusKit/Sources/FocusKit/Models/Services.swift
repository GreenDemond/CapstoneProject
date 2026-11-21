import Foundation

/// The outside capabilities the app uses, each behind a protocol so tests can use fakes.
/// `Services.none` is a phone with none of them: the app must be fully usable with it.
public struct Services: Sendable {
  public var speechInput: any SpeechInput

  public init(speechInput: any SpeechInput = UnavailableSpeechInput()) {
    self.speechInput = speechInput
  }

  public static let none = Services()
}
