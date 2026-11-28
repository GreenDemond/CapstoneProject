import Foundation

/// A source link as it arrives, before it is checked.
public struct SourceCandidate: Equatable, Sendable {
  public var url: String?
  public var title: String?

  public init(url: String?, title: String?) {
    self.url = url
    self.title = title
  }
}

public struct Source: Equatable, Sendable {
  public let url: String
  public let title: String
}

public enum Sources {
  static let titleLength = 120

  /// Keeps only usable links: an https address, no duplicates, at most `content.limits.sources`.
  /// A missing or blank title falls back to the site's name.
  public static func clean(_ list: [SourceCandidate], in content: Content) -> [Source] {
    var links: [Source] = []
    var seen = Set<String>()
    for entry in list {
      guard let url = entry.url, url.hasPrefix("https://"), !seen.contains(url),
        let host = URL(string: url)?.host, !host.isEmpty
      else { continue }
      let title = Text.trimmed(Text.cut(Text.trimmed(entry.title ?? ""), to: titleLength))
      seen.insert(url)
      links.append(Source(url: url, title: title.isEmpty ? host : title))
      if links.count == content.limits.sources { break }
    }
    return links
  }
}
