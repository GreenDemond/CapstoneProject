import Foundation

/// A key store that lives in memory, for tests. It can be told to fail.
public final class FakeKeyStore: KeyStore, @unchecked Sendable {
  private let lock = NSLock()
  private var key: String?
  private var failing = false

  public init(key: String? = nil) {
    self.key = key
  }

  public func setFailing(_ on: Bool) { lock.withLock { failing = on } }

  public var hasKey: Bool { lock.withLock { key != nil } }
  public func read() -> String? { lock.withLock { key } }

  public func save(_ key: String) -> Bool {
    lock.withLock {
      guard !failing else { return false }
      self.key = key
      return true
    }
  }

  public func delete() -> Bool {
    lock.withLock {
      guard !failing else { return false }
      key = nil
      return true
    }
  }
}
