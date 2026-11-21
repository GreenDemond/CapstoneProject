import Foundation

/// Where the student's own AI keys are kept, one per service. A key lives only here: never in the
/// JSON settings files, a log, an error message, or a screen label. The phone's version is the
/// Keychain (`Storage/Apple/KeychainKeyStore.swift`).
///
/// Each key has an `account`, made from the service's id (`KeyAccount.forService`), never from the
/// label the student typed, so one service's key can never be found by another's name.
public protocol KeyStore: Sendable {
  /// Whether a key is saved for the account. Never says what it is.
  func hasKey(account: String) -> Bool
  /// The key, for the one request that needs it. Callers must not keep it, show it, or log it.
  func read(account: String) -> String?
  /// Saves (replaces) the key. Returns false if it could not be saved.
  func save(_ key: String, account: String) -> Bool
  /// Removes the key. Returns true when no key is left for the account.
  func delete(account: String) -> Bool
  /// Removes every key this app holds, including any left behind by an older build. Returns true
  /// when none is left.
  func deleteAll() -> Bool
}

public enum KeyAccount {
  /// Where build 5 kept its single key. Only read to move it to the first service.
  public static let legacy = "own-ai-key"

  public static func forService(id: String) -> String { "service-" + id }
}
