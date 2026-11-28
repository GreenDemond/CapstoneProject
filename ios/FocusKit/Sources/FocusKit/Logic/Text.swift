import Foundation

/// Small text helpers shared by the logic files. Lengths count UTF-16 units, as the web app did.
enum Text {
  /// Cuts text to at most `limit` UTF-16 units, never leaving half of a character.
  static func cut(_ text: String, to limit: Int) -> String {
    guard limit > 0 else { return "" }
    var length = min(limit, text.utf16.count)
    while length > 0 {
      if let result = String(text.utf16.prefix(length)) { return result }
      length -= 1
    }
    return ""
  }

  static func trimmed(_ text: String) -> String {
    text.trimmingCharacters(in: .whitespacesAndNewlines)
  }

  /// All runs of whitespace become one space; the ends are trimmed.
  static func collapsed(_ text: String) -> String {
    text.split(whereSeparator: { $0.isWhitespace }).joined(separator: " ")
  }
}

/// The result of cutting pasted text to the paste limit.
public struct PasteResult: Equatable, Sendable {
  public let text: String
  public let truncated: Bool
}

public enum PastedText {
  /// Normalizes line endings, trims each line, collapses runs of blank lines to one, trims the ends.
  /// Anything that is not text becomes an empty string.
  public static func clean(_ input: String?) -> String {
    guard let input else { return "" }
    let unified = input.replacingOccurrences(of: "\r\n", with: "\n")
      .replacingOccurrences(of: "\r", with: "\n")
    var lines: [String] = []
    var blankRun = 0
    for line in unified.split(separator: "\n", omittingEmptySubsequences: false) {
      let tidy = Text.trimmed(String(line))
      if tidy.isEmpty {
        blankRun += 1
        if blankRun > 1 { continue }
      } else {
        blankRun = 0
      }
      lines.append(tidy)
    }
    return Text.trimmed(lines.joined(separator: "\n"))
  }

  /// Cleans, then cuts to `limit` characters. Says whether anything was cut.
  public static func limit(_ input: String, to limit: Int) -> PasteResult {
    let cleaned = clean(input)
    if cleaned.utf16.count <= limit {
      return PasteResult(text: cleaned, truncated: false)
    }
    return PasteResult(text: Text.cut(cleaned, to: limit), truncated: true)
  }
}
