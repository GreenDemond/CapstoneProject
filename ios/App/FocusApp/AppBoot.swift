import FocusKit
import Foundation

/// Opens the saved data and the shared content. Kept apart from the views.
@MainActor
enum AppBoot {
  /// Launch arguments used only by the UI tests.
  static let freshArgument = "-focus-fresh-data"

  static func make() -> AppModel? {
    guard let content = try? Content.bundled() else { return nil }
    let folder = dataFolder()
    let store = FileStore(folder: folder, limits: content.limits)
    let services = Services(speechInput: AppleSpeechInput())
    return AppModel(content: content, store: store, services: services)
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
