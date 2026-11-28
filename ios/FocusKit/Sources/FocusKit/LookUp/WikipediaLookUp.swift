import Foundation

/// The only file that opens a network connection. It sends the look-up words to Wikipedia's public
/// search address and nothing else: no account, no identifier, no cookies.
public struct WikipediaLookUp: LookUp {
  public static let host = "en.wikipedia.org"
  /// Wikimedia asks every client for a descriptive User-Agent with a way to contact the owner.
  /// The contact address is set by the app's owner before release (`design/slices/T08`).
  public static let userAgent =
    "FocusApp/0.1 (iOS homework helper for students; contact: set-by-owner@example.invalid)"
  public static let timeLimit: TimeInterval = 8

  private let session: URLSession

  public init() {
    let configuration = URLSessionConfiguration.ephemeral
    configuration.timeoutIntervalForRequest = Self.timeLimit
    configuration.timeoutIntervalForResource = Self.timeLimit * 2
    configuration.waitsForConnectivity = false
    configuration.httpCookieStorage = nil
    configuration.urlCache = nil
    session = URLSession(configuration: configuration)
  }

  /// The search request for some words. Odd characters are percent-encoded by `URLComponents`.
  public static func request(for words: String, limit: Int) -> URLRequest? {
    var parts = URLComponents()
    parts.scheme = "https"
    parts.host = host
    parts.path = "/w/rest.php/v1/search/page"
    parts.queryItems = [
      URLQueryItem(name: "q", value: words),
      URLQueryItem(name: "limit", value: String(limit)),
    ]
    guard let url = parts.url else { return nil }
    var request = URLRequest(url: url, timeoutInterval: timeLimit)
    request.setValue(userAgent, forHTTPHeaderField: "User-Agent")
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    return request
  }

  /// Reads Wikipedia's answer into plain results. Entries without a usable title or page are
  /// dropped; markup in the snippet is removed.
  public static func parse(_ data: Data, limit: Int) throws -> [LookUpResult] {
    struct Answer: Decodable {
      struct Page: Decodable {
        let key: String?
        let title: String?
        let excerpt: String?
        let description: String?
      }
      let pages: [Page]
    }
    guard let answer = try? JSONDecoder().decode(Answer.self, from: data) else {
      throw LookUpError.trouble
    }
    var results: [LookUpResult] = []
    for page in answer.pages {
      let title = LookUpText.plain(page.title, limit: 120)
      guard !title.isEmpty, let key = page.key, let url = pageURL(key: key) else { continue }
      let described = LookUpText.plain(page.description)
      let line = described.isEmpty ? LookUpText.plain(page.excerpt) : described
      results.append(LookUpResult(title: title, line: line, url: url))
      if results.count == limit { break }
    }
    return results
  }

  /// The address of an article, only ever on the Wikipedia host over https.
  static func pageURL(key: String) -> URL? {
    var parts = URLComponents()
    parts.scheme = "https"
    parts.host = host
    parts.percentEncodedPath =
      "/wiki/" + (key.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? "")
    guard let url = parts.url, url.host == host else { return nil }
    return url
  }

  public func search(_ words: String) async throws -> [LookUpResult] {
    let limit = 5
    guard let request = Self.request(for: words, limit: limit) else { throw LookUpError.trouble }
    do {
      let (data, response) = try await session.data(for: request)
      guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
        throw LookUpError.trouble
      }
      return try Self.parse(data, limit: limit)
    } catch let error as LookUpError {
      throw error
    } catch let error as URLError {
      switch error.code {
      case .notConnectedToInternet, .networkConnectionLost, .dataNotAllowed,
        .internationalRoamingOff, .cannotFindHost, .cannotConnectToHost, .dnsLookupFailed:
        throw LookUpError.offline
      case .timedOut:
        throw LookUpError.timeout
      case .cancelled:
        throw CancellationError()
      default:
        throw LookUpError.trouble
      }
    } catch {
      throw LookUpError.trouble
    }
  }
}
