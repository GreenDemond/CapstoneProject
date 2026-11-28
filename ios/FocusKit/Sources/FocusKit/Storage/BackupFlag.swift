import Foundation

/// Whether the app's data folder is left out of the phone's own backup.
/// The decision is in the app's model; this is only the one file-system call, so tests can fake it.
public protocol BackupFlag: Sendable {
  /// Excludes the data folder from backup (true) or includes it (false). Returns whether it worked.
  @discardableResult
  func setExcluded(_ excluded: Bool) -> Bool
}

/// The real thing: sets `isExcludedFromBackup` on the data folder.
public struct FolderBackupFlag: BackupFlag {
  private let folder: URL

  public init(folder: URL) {
    self.folder = folder
  }

  @discardableResult
  public func setExcluded(_ excluded: Bool) -> Bool {
    var url = folder
    do {
      try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
      var values = URLResourceValues()
      values.isExcludedFromBackup = excluded
      try url.setResourceValues(values)
      return true
    } catch {
      return false
    }
  }
}

/// For a phone with no folder to mark (tests and previews).
public struct NoBackupFlag: BackupFlag {
  public init() {}
  @discardableResult
  public func setExcluded(_ excluded: Bool) -> Bool { true }
}
