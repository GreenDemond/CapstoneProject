import Foundation

/// Remembers what it was told, for tests.
public final class FakeBackupFlag: BackupFlag, @unchecked Sendable {
  private let lock = NSLock()
  private var value: Bool?
  private var calls = 0

  public init() {}

  /// nil until the first call.
  public var excluded: Bool? { lock.withLock { value } }
  public var callCount: Int { lock.withLock { calls } }

  @discardableResult
  public func setExcluded(_ excluded: Bool) -> Bool {
    lock.withLock {
      value = excluded
      calls += 1
    }
    return true
  }
}
