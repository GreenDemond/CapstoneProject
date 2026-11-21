import Foundation

/// Where the student's own AI key is kept. The key lives only here: never in the JSON settings
/// files, a log, an error message, or a screen label. The phone's version is the Keychain
/// (`Storage/Apple/KeychainKeyStore.swift`).
public protocol KeyStore: Sendable {
  /// Whether a key is saved. Never says what it is.
  var hasKey: Bool { get }
  /// The key, for the one request that needs it. Callers must not keep it, show it, or log it.
  func read() -> String?
  /// Saves (replaces) the key. Returns false if it could not be saved.
  func save(_ key: String) -> Bool
  /// Removes the key. Returns true when no key is left.
  func delete() -> Bool
}
