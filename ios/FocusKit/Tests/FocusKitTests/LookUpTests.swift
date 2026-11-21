import Foundation
import Testing

@testable import FocusKit

private let sample = """
  {"pages":[
   {"id":1,"key":"Courage","title":"Courage","excerpt":"<span class=\\"searchmatch\\">Courage</span> (also called bravery) is the choice &amp; willingness","description":"Ability to deal with fear"},
   {"id":2,"key":"Courage_(disambiguation)","title":"Courage (disambiguation)","excerpt":"courage in <b>Wiktionary</b>&nbsp;the free dictionary&#39;s entry","description":""},
   {"id":3,"title":"No key here","excerpt":"x"},
   {"id":4,"key":"Caf\\u00e9_/_odd?title#1","title":"Caf\\u00e9 <i>odd</i>","excerpt":"","description":null}
  ]}
  """

private func result(_ title: String) -> LookUpResult {
  LookUpResult(
    title: title, line: "line", url: URL(string: "https://en.wikipedia.org/wiki/\(title)")!)
}

@MainActor
@Suite struct LookUpTests {
  @Test func markupIsStrippedAndEntitiesDecoded() {
    #expect(
      LookUpText.plain("<span class=\"searchmatch\">Courage</span> is &quot;it&quot; &amp; more")
        == "Courage is \"it\" & more")
    #expect(LookUpText.plain("a&nbsp;b &#39;c&#x27; &unknown; &") == "a b 'c' &unknown; &")
    #expect(LookUpText.plain("<script>alert(1)</script>hi") == "alert(1) hi")
    #expect(LookUpText.plain(nil) == "")
    #expect(LookUpText.plain(String(repeating: "x", count: 500)).count == LookUpText.lineLength)
    // Unclosed tag: left alone, never crashes.
    #expect(LookUpText.plain("3 < 5 and more") == "3 < 5 and more")
  }

  @Test func wikipediaAnswerBecomesPlainResults() throws {
    let results = try WikipediaLookUp.parse(Data(sample.utf8), limit: 5)
    #expect(results.count == 3)
    #expect(results[0].title == "Courage")
    #expect(results[0].line == "Ability to deal with fear")
    #expect(results[0].url.absoluteString == "https://en.wikipedia.org/wiki/Courage")
    // No description: the cleaned snippet is used.
    #expect(results[1].line == "courage in Wiktionary the free dictionary's entry")
    // Odd characters in a title become a safe address on the same host.
    #expect(results[2].title == "Café odd")
    #expect(results[2].url.host == "en.wikipedia.org")
    #expect(results[2].url.scheme == "https")
    #expect(!results[2].url.absoluteString.contains("?title"))
  }

  @Test func noPagesGivesNoResultsAndBadDataIsTrouble() throws {
    #expect(try WikipediaLookUp.parse(Data("{\"pages\":[]}".utf8), limit: 5).isEmpty)
    #expect(throws: LookUpError.trouble) {
      try WikipediaLookUp.parse(Data("<html>nope</html>".utf8), limit: 5)
    }
  }

  @Test func resultsStopAtTheLimit() throws {
    let pages = (1...9).map { "{\"key\":\"P\($0)\",\"title\":\"P\($0)\"}" }.joined(separator: ",")
    let results = try WikipediaLookUp.parse(Data("{\"pages\":[\(pages)]}".utf8), limit: 5)
    #expect(results.count == 5)
  }

  @Test func theRequestGoesToWikipediaOnlyWithThePlainWordsAndADescriptiveAgent() throws {
    let request = try #require(WikipediaLookUp.request(for: "naïve & odd? words#1", limit: 5))
    let url = try #require(request.url)
    #expect(url.host == "en.wikipedia.org")
    #expect(url.scheme == "https")
    #expect(url.path == "/w/rest.php/v1/search/page")
    let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
    #expect(items.map(\.name).sorted() == ["limit", "q"])
    #expect(items.first { $0.name == "q" }?.value == "naïve & odd? words#1")
    #expect(!url.absoluteString.contains(" "))
    #expect(request.value(forHTTPHeaderField: "User-Agent")?.hasPrefix("FocusApp/") == true)
  }

  @Test func keyWordsComeFromTheStep() {
    #expect(
      LookUpText.keyWords(from: "Write your main answer in one sentence about photosynthesis")
        == "main answer sentence photosynthesis")
    #expect(LookUpText.keyWords(from: "Read the chapter") == "chapter")
    #expect(LookUpText.keyWords(from: "") == "")
    #expect(LookUpText.keyWords(from: "the a an of") == "")
  }

  @Test func resultsShowAndTheWordsSent() async {
    let fake = FakeLookUp(.results([result("Courage")]))
    let model = LookUpModel(lookUp: fake, words: "  courage   in   fiction ")
    model.search()
    #expect(model.state == .loading)
    await model.waitForSearch()
    #expect(model.state == .results([result("Courage")]))
    #expect(fake.searches == ["courage in fiction"])
  }

  @Test func noResults() async {
    let model = LookUpModel(lookUp: FakeLookUp(.results([])), words: "zzzz")
    model.search()
    await model.waitForSearch()
    #expect(model.state == .none)
  }

  @Test func offline() async {
    let model = LookUpModel(lookUp: FakeLookUp(.fail(.offline)), words: "x")
    model.search()
    await model.waitForSearch()
    #expect(model.state == .offline)
  }

  @Test func timeoutFromTheNetworkAndFromASlowAnswer() async {
    let first = LookUpModel(lookUp: FakeLookUp(.fail(.timeout)), words: "x")
    first.search()
    await first.waitForSearch()
    #expect(first.state == .slow)
    let second = LookUpModel(lookUp: FakeLookUp(.slow(seconds: 5)), words: "x", timeLimit: 0.05)
    second.search()
    await second.waitForSearch()
    #expect(second.state == .slow)
  }

  @Test func troubleIsCalm() async {
    let model = LookUpModel(lookUp: FakeLookUp(.fail(.trouble)), words: "x")
    model.search()
    await model.waitForSearch()
    #expect(model.state == .trouble)
  }

  @Test func emptyWordsSendNothing() async {
    let fake = FakeLookUp(.results([result("A")]))
    let model = LookUpModel(lookUp: fake, words: "   ")
    model.search()
    #expect(model.state == .emptyWords)
    #expect(fake.searches.isEmpty)
  }

  @Test func leavingWhileItLoadsIgnoresTheAnswer() async {
    let fake = FakeLookUp(.slow(seconds: 0.2))
    let model = LookUpModel(lookUp: fake, words: "x")
    model.search()
    model.cancel()
    #expect(model.state == .idle)
    try? await Task.sleep(for: .seconds(0.4))
    #expect(model.state == .idle)
  }

  @Test func aNewSearchReplacesAnOlderOne() async {
    let fake = FakeLookUp(.slow(seconds: 0.2))
    let model = LookUpModel(lookUp: fake, words: "old")
    model.search()
    fake.set(.results([result("New")]))
    model.words = "new"
    model.search()
    await model.waitForSearch()
    #expect(model.state == .results([result("New")]))
  }

  @Test func onlyOneSourceFileOpensAConnection() throws {
    let here = URL(fileURLWithPath: #filePath)
    let root = here.deletingLastPathComponent().deletingLastPathComponent()
      .deletingLastPathComponent()
      .deletingLastPathComponent()
    var hits: [String] = []
    for folder in ["FocusKit/Sources", "App"] {
      let base = root.appendingPathComponent(folder)
      let walker = FileManager.default.enumerator(at: base, includingPropertiesForKeys: nil)
      while let file = walker?.nextObject() as? URL {
        guard file.pathExtension == "swift" else { continue }
        let text = try String(contentsOf: file, encoding: .utf8)
        if text.contains("URLSession") || text.contains("URLRequest(") {
          hits.append(file.lastPathComponent)
        }
      }
    }
    #expect(hits == ["WikipediaLookUp.swift"])
  }
}
