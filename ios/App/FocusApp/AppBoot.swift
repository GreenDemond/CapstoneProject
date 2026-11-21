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

  static func make() -> AppModel? {
    guard let content = try? Content.bundled() else { return nil }
    let folder = dataFolder()
    let store = FileStore(folder: folder, limits: content.limits)
    if let fake = fakeServices() {
      return AppModel(content: content, store: store, services: fake)
    }
    if CommandLine.arguments.contains(noAIArgument) {
      return AppModel(content: content, store: store, services: .none)
    }
    let services = Services(
      speechInput: AppleSpeechInput(), speechOutput: AppleSpeechOutput(),
      headphones: AppleHeadphones(), languageModel: AppleLanguageModel())
    return AppModel(content: content, store: store, services: services)
  }

  /// Used only by the UI tests: a scripted AI, so the chat can be driven without Apple's model.
  private static func fakeServices() -> Services? {
    let arguments = CommandLine.arguments
    guard arguments.contains(fakeAIArgument) || arguments.contains(fakeAIDistressArgument) else {
      return nil
    }
    let model = FakeLanguageModel()
    if arguments.contains(fakeAIDistressArgument) {
      model.enqueue(.init(["TRUSTED_ADULT"]))
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
    var folder = base.appendingPathComponent("FocusData", isDirectory: true)
    try? manager.createDirectory(at: folder, withIntermediateDirectories: true)
    // Keep the student's words out of the phone's own backup, so "stays on this iPhone" is true.
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    try? folder.setResourceValues(values)
    return folder
  }
}
