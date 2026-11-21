import Foundation

/// Saves each kind of data as a JSON file in one folder, written atomically.
/// On a phone the files are protected while it is locked.
public final class FileStore: Store, @unchecked Sendable {
  public let limits: Content.Limits
  private let folder: URL
  private let lock = NSLock()

  public init(folder: URL, limits: Content.Limits) {
    self.folder = folder
    self.limits = limits
  }

  public func rawRead(_ name: String) -> Data? {
    lock.lock()
    defer { lock.unlock() }
    return try? Data(contentsOf: folder.appendingPathComponent(name))
  }

  public func rawWrite(_ name: String, _ data: Data) throws {
    lock.lock()
    defer { lock.unlock() }
    do {
      try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
      // File protection exists on the phone. On a Mac it can be refused, so it is phone-only.
      #if os(iOS)
        let options: Data.WritingOptions = [.atomic, .completeFileProtection]
      #else
        let options: Data.WritingOptions = [.atomic]
      #endif
      try data.write(to: folder.appendingPathComponent(name), options: options)
    } catch {
      throw StoreError.writeFailed
    }
  }

  public func rawMoveAside(_ name: String, reason: SetAsideReason) -> Bool {
    lock.lock()
    defer { lock.unlock() }
    let manager = FileManager.default
    let target = backupName(for: name, reason: reason) {
      manager.fileExists(atPath: folder.appendingPathComponent($0).path)
    }
    do {
      try manager.moveItem(
        at: folder.appendingPathComponent(name), to: folder.appendingPathComponent(target))
      return true
    } catch {
      return false
    }
  }

  public func rawRemoveAll() throws {
    lock.lock()
    defer { lock.unlock() }
    let manager = FileManager.default
    guard manager.fileExists(atPath: folder.path) else { return }
    do {
      for item in try manager.contentsOfDirectory(atPath: folder.path) {
        try manager.removeItem(at: folder.appendingPathComponent(item))
      }
    } catch {
      throw StoreError.writeFailed
    }
  }
}
