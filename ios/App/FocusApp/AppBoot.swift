import FocusKit
import Foundation

/// Opens the saved data and the shared content. Kept apart from the views.
@MainActor
enum AppBoot {
  /// Launch arguments used only by the UI tests.
  static let freshArgument = "-focus-fresh-data"
  /// A phone with no AI, no microphone and no voice, whatever the simulator has.
  static let noAIArgument = "-focus-no-ai"
  static let fakeAIArgument = "-focus-fake-ai"
  static let fakeAIDistressArgument = "-focus-fake-ai-distress"
  /// A fake AI whose every reply is one short question, for the coaching-move UI tests.
  static let fakeAIQuestionArgument = "-focus-fake-ai-question"
  /// The same, with a yes or no question (the split nudge asks one).
  static let fakeAIYesNoArgument = "-focus-fake-ai-yesno"
  static let fakeAIRequirementsArgument = "-focus-fake-ai-requirements"
  static let fakeAITidyArgument = "-focus-fake-ai-tidy"

  static func make() -> AppModel? {
    guard let content = try? Content.bundled() else { return nil }
    let folder = dataFolder()
    let store = FileStore(folder: folder, limits: content.limits)
    let fresh = CommandLine.arguments.contains(freshArgument)
    // UI tests never touch the real Keychain or the network.
    let keys: any KeyStore = fresh ? FakeKeyStore() : KeychainKeyStore()
    let transport: any HTTPTransport = fresh ? FakeHTTPTransport() : LiveHTTPTransport()
    let backup = FolderBackupFlag(folder: folder)
    if var fake = fakeServices() {
      fake.keys = keys
      fake.transport = transport
      fake.backup = backup
      return AppModel(content: content, store: store, services: fake)
    }
    if CommandLine.arguments.contains(noAIArgument) {
      let none = Services(keys: keys, transport: transport, backup: backup)
      return AppModel(content: content, store: store, services: none)
    }
    let services = Services(
      speechInput: AppleSpeechInput(), speechOutput: AppleSpeechOutput(),
      headphones: AppleHeadphones(), languageModel: AppleLanguageModel(), keys: keys,
      transport: transport, backup: backup)
    return AppModel(content: content, store: store, services: services)
  }

  /// Used only by the UI tests: a scripted AI, so the chat can be driven without Apple's model.
  private static func fakeServices() -> Services? {
    let arguments = CommandLine.arguments
    guard
      arguments.contains(fakeAIArgument) || arguments.contains(fakeAIDistressArgument)
        || arguments.contains(fakeAIQuestionArgument) || arguments.contains(fakeAIYesNoArgument)
        || arguments.contains(fakeAIRequirementsArgument) || arguments.contains(fakeAITidyArgument)
    else {
      return nil
    }
    let model = FakeLanguageModel()
    if arguments.contains(fakeAIDistressArgument) {
      model.enqueue(.init(["TRUSTED_ADULT"]))
    } else if arguments.contains(fakeAIYesNoArgument) {
      model.enqueue(.init(["Is that one job or two?"]))
    } else if arguments.contains(fakeAIRequirementsArgument) {
      model.enqueue(.init(["Include a graph of your data"]))
    } else if arguments.contains(fakeAITidyArgument) {
      model.enqueue(
        .init(["Could you tell me what the prompt is asking, since I tried to read the prompt?"]))
    } else if arguments.contains(fakeAIQuestionArgument) {
      model.enqueue(.init(["Which part would you do first?"]))
    } else {
      model.enqueue(
        .init([
          "Let's start small. Here is a plan.\n1. Read the question\n2. Underline the verb\n3. Write one line"
        ]
        ))
    }
    return Services(languageModel: model)
  }

  /// The app's own private folder. For UI tests a new empty folder is used each launch.
  private static func dataFolder() -> URL {
    let manager = FileManager.default
    if CommandLine.arguments.contains(freshArgument) {
      return manager.temporaryDirectory.appendingPathComponent("focus-ui-\(UUID().uuidString)")
    }
    let base =
      (try? manager.url(
        for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true))
      ?? manager.temporaryDirectory
    let folder = base.appendingPathComponent("FocusData", isDirectory: true)
    try? manager.createDirectory(at: folder, withIntermediateDirectories: true)
    // Whether the folder is in the phone's backup follows the student's switch (set by AppModel).
    return folder
  }
}
