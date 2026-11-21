import Foundation

/// The outside capabilities the app uses, each behind a protocol so tests can use fakes.
/// `Services.none` is a phone with none of them: the app must be fully usable with it.
@MainActor
public struct Services {
  public var speechInput: any SpeechInput
  public var speechOutput: any SpeechOutput
  public var headphones: any HeadphoneStatus

  public init(
    speechInput: any SpeechInput = UnavailableSpeechInput(),
    speechOutput: any SpeechOutput = SilentSpeechOutput(),
    headphones: any HeadphoneStatus = NoHeadphones()
  ) {
    self.speechInput = speechInput
    self.speechOutput = speechOutput
    self.headphones = headphones
  }

  public static var none: Services { Services() }
}
