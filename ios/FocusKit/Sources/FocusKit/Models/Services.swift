import Foundation

/// The outside capabilities the app uses, each behind a protocol so tests can use fakes.
/// `Services.none` is a phone with none of them: the app must be fully usable with it.
@MainActor
public struct Services {
  public var speechInput: any SpeechInput
  public var speechOutput: any SpeechOutput
  public var headphones: any HeadphoneStatus
  public var languageModel: any LanguageModel
  /// Where the student's own AI key is kept.
  public var keys: any KeyStore
  /// How requests to the student's own AI service are sent.
  public var transport: any HTTPTransport
  /// Includes or excludes the app's data folder from the phone's backup.
  public var backup: any BackupFlag

  public init(
    speechInput: any SpeechInput = UnavailableSpeechInput(),
    speechOutput: any SpeechOutput = SilentSpeechOutput(),
    headphones: any HeadphoneStatus = NoHeadphones(),
    languageModel: any LanguageModel = UnavailableLanguageModel(),
    keys: any KeyStore = FakeKeyStore(),
    transport: any HTTPTransport = FakeHTTPTransport(),
    backup: any BackupFlag = NoBackupFlag()
  ) {
    self.speechInput = speechInput
    self.speechOutput = speechOutput
    self.headphones = headphones
    self.languageModel = languageModel
    self.keys = keys
    self.transport = transport
    self.backup = backup
  }

  public static var none: Services { Services() }
}
