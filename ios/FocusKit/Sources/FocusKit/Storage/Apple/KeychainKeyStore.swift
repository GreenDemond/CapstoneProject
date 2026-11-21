#if canImport(Security)
  import Foundation
  import Security

  /// Keeps the key in the iOS Keychain as a generic password. It is readable only while the phone
  /// is unlocked, stays on this phone (never in a backup, never synced to iCloud), and is sent
  /// nowhere except in the Authorization header to the address the student chose.
  /// Declarations verified in the SDK's Security headers (SecItem.h); see
  /// design/slices/AI-own-service-and-backup.md.
  public final class KeychainKeyStore: KeyStore, @unchecked Sendable {
    private let service: String
    private let account = "own-ai-key"

    public init(service: String = "com.craighagan.benssteps.own-ai") {
      self.service = service
    }

    private var match: [String: Any] {
      [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: service,
        kSecAttrAccount as String: account,
        kSecAttrSynchronizable as String: false,
      ]
    }

    public var hasKey: Bool {
      var query = match
      query[kSecMatchLimit as String] = kSecMatchLimitOne
      return SecItemCopyMatching(query as CFDictionary, nil) == errSecSuccess
    }

    public func read() -> String? {
      var query = match
      query[kSecMatchLimit as String] = kSecMatchLimitOne
      query[kSecReturnData as String] = true
      var found: CFTypeRef?
      guard SecItemCopyMatching(query as CFDictionary, &found) == errSecSuccess,
        let data = found as? Data
      else { return nil }
      return String(data: data, encoding: .utf8)
    }

    public func save(_ key: String) -> Bool {
      let data = Data(key.utf8)
      let update: [String: Any] = [
        kSecValueData as String: data,
        kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
      ]
      let status = SecItemUpdate(match as CFDictionary, update as CFDictionary)
      if status == errSecSuccess { return true }
      guard status == errSecItemNotFound else { return false }
      var add = match
      add[kSecValueData as String] = data
      add[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
      return SecItemAdd(add as CFDictionary, nil) == errSecSuccess
    }

    public func delete() -> Bool {
      let status = SecItemDelete(match as CFDictionary)
      return status == errSecSuccess || status == errSecItemNotFound
    }
  }
#endif
