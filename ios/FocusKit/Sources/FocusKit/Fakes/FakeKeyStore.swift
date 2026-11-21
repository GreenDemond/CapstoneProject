import Foundation

/// A key store that lives in memory, for tests. It can be told to fail.
public final class FakeKeyStore: KeyStore, @unchecked Sendable {
  private let lock = NSLock()
  private var keys: [String: String]
  private var failing = false

  public init(keys: [String: String] = [:]) {
    self.keys = keys
  }

  public func setFailing(_ on: Bool) { lock.withLock { failing = on } }

  /// The accounts that hold a key. Never the keys.
  public var accounts: [String] { lock.withLock { keys.keys.sorted() } }

  public func hasKey(account: String) -> Bool { lock.withLock { keys[account] != nil } }
  public func read(account: String) -> String? { lock.withLock { keys[account] } }

  public func save(_ key: String, account: String) -> Bool {
    lock.withLock {
      guard !failing else { return false }
      keys[account] = key
      return true
    }
  }

  public func delete(account: String) -> Bool {
    lock.withLock {
      guard !failing else { return false }
      keys[account] = nil
      return true
    }
  }

  public func deleteAll() -> Bool {
    lock.withLock {
      guard !failing else { return false }
      keys = [:]
      return true
    }
  }
}
