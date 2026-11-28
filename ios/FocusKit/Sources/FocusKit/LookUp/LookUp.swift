import Foundation

/// One reference page in the results list: a title, one plain line, and where it lives.
public struct LookUpResult: Equatable, Sendable, Identifiable {
  public var id: String { url.absoluteString }
  public let title: String
  public let line: String
  public let url: URL

  public init(title: String, line: String, url: URL) {
    self.title = title
    self.line = line
    self.url = url
  }
}

public enum LookUpError: Error, Equatable, Sendable {
  /// The phone has no network.
  case offline
  /// The answer took too long.
  case timeout
  /// Anything else: a bad answer, a server problem.
  case trouble
}

/// Looks words up in a reference. The only implementation that touches the network is
/// `WikipediaLookUp`; tests use `FakeLookUp`.
public protocol LookUp: Sendable {
  func search(_ words: String) async throws -> [LookUpResult]
}

/// Turning what comes back into plain text, and the student's words into a safe search.
public enum LookUpText {
  public static let lineLength = 200
  static let wordsLength = 200

  /// Trims the look-up words, collapses spaces and cuts them to a sensible length.
  public static func cleanWords(_ input: String) -> String {
    Text.cut(Text.collapsed(input), to: wordsLength)
  }

  /// Plain text from a snippet that may hold markup: tags removed, entities decoded, spaces
  /// collapsed, cut to one line. Text is never shown as markup.
  public static func plain(_ markup: String?, limit: Int = lineLength) -> String {
    guard let markup else { return "" }
    var text = markup
    while let open = text.range(of: "<"),
      let close = text.range(of: ">", range: open.upperBound..<text.endIndex)
    {
      text.replaceSubrange(open.lowerBound..<close.upperBound, with: " ")
    }
    text = decodeEntities(text)
    return Text.cut(Text.collapsed(text), to: limit)
  }

  private static let named: [String: String] = [
    "amp": "&", "lt": "<", "gt": ">", "quot": "\"", "apos": "'", "nbsp": " ", "ndash": "-",
    "mdash": "-",
  ]

  private static func decodeEntities(_ text: String) -> String {
    var result = ""
    var rest = Substring(text)
    while let amp = rest.firstIndex(of: "&") {
      result += rest[..<amp]
      let after = rest[rest.index(after: amp)...]
      if let semi = after.firstIndex(of: ";"), after.distance(from: after.startIndex, to: semi) <= 8
      {
        let name = String(after[..<semi])
        if let value = decoded(name) {
          result += value
          rest = after[after.index(after: semi)...]
          continue
        }
      }
      result += "&"
      rest = after
    }
    result += rest
    return result
  }

  private static func decoded(_ name: String) -> String? {
    if let value = named[name.lowercased()] { return value }
    guard name.hasPrefix("#") else { return nil }
    let digits = name.dropFirst()
    let number: UInt32?
    if digits.hasPrefix("x") || digits.hasPrefix("X") {
      number = UInt32(digits.dropFirst(), radix: 16)
    } else {
      number = UInt32(digits)
    }
    guard let number, let scalar = Unicode.Scalar(number) else { return nil }
    return String(Character(scalar))
  }

  private static let stopWords: Set<String> = [
    "a", "an", "and", "the", "of", "to", "in", "on", "for", "with", "about", "your", "my", "it",
    "is", "are", "be", "this", "that", "then", "from", "at", "by", "as", "or", "write", "read",
    "open", "make", "list", "check", "find", "one", "two", "three", "first", "next", "down",
    "again", "what", "how", "you", "each", "any", "can", "will", "get", "set", "do", "use",
  ]

  /// Key words from a step, to put in the look-up box. The student can change them.
  public static func keyWords(from step: String, limit: Int = 5) -> String {
    var seen = Set<String>()
    var kept: [String] = []
    let pieces = step.split { !$0.isLetter && !$0.isNumber && $0 != "'" }
    for piece in pieces {
      let word = String(piece)
      let lower = word.lowercased()
      guard lower.count >= 3, !stopWords.contains(lower), seen.insert(lower).inserted else {
        continue
      }
      kept.append(word)
      if kept.count == limit { break }
    }
    return kept.joined(separator: " ")
  }
}
