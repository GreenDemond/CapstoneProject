import Foundation

public enum ChatRole: String, Codable, Sendable {
  case user
  case assistant
}

public struct ChatMessage: Codable, Equatable, Sendable {
  public var role: ChatRole
  public var text: String

  public init(role: ChatRole, text: String) {
    self.role = role
    self.text = text
  }
}

public enum History {
  /// Keeps the newest messages that fit in `limit`, never starts on an assistant message, and
  /// never changes a message's words. The newest message is always kept, even if it alone is too big.
  /// `measure` says how big a message is: characters here, the model's token count in the app.
  public static func trim(
    _ messages: [ChatMessage], limit: Int,
    measure: (ChatMessage) -> Int = { $0.text.utf16.count }
  ) -> [ChatMessage] {
    var kept: [ChatMessage] = []
    var total = 0
    for message in messages.reversed() {
      total += measure(message)
      if total > limit && !kept.isEmpty { break }
      kept.insert(message, at: 0)
    }
    while kept.count > 1, kept[0].role != .user {
      kept.removeFirst()
    }
    return kept
  }
}
