import Foundation

/// A store that keeps everything in memory, for tests. It can be told to fail.
public final class MemoryStore: Store, @unchecked Sendable {
  public let limits: Content.Limits
  private let lock = NSLock()
  private var files: [String: Data] = [:]
  private var failing = false
  private var failingName: String?

  public init(limits: Content.Limits) {
    self.limits = limits
  }

  /// When true, every write and delete throws `StoreError.writeFailed`.
  public var failWrites: Bool {
    get { lock.withLock { failing } }
    set { lock.withLock { failing = newValue } }
  }

  /// When set, writes to this one file name throw; other files still save.
  public var failWritesTo: String? {
    get { lock.withLock { failingName } }
    set { lock.withLock { failingName = newValue } }
  }

  /// The names of all saved files, backups included.
  public var fileNames: [String] {
    lock.withLock { files.keys.sorted() }
  }

  /// Puts raw bytes in a file, as if an earlier version or a crash had left them there.
  public func plant(_ name: String, _ data: Data) {
    lock.withLock { files[name] = data }
  }

  public func rawRead(_ name: String) -> Data? {
    lock.withLock { files[name] }
  }

  public func rawWrite(_ name: String, _ data: Data) throws {
    try lock.withLock {
      if failing || failingName == name { throw StoreError.writeFailed }
      files[name] = data
    }
  }

  public func rawMoveAside(_ name: String, reason: SetAsideReason) -> Bool {
    lock.withLock {
      guard let data = files[name] else { return false }
      let target = backupName(for: name, reason: reason) { files[$0] != nil }
      files[target] = data
      files[name] = nil
      return true
    }
  }

  public func rawRemoveAll() throws {
    try lock.withLock {
      if failing { throw StoreError.writeFailed }
      files.removeAll()
    }
  }
}
