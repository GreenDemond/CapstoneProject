import Testing

@testable import FocusKit

@Suite struct AnswerGuardTests {
  private func paragraph(_ letter: Character, _ count: Int) -> String {
    String(repeating: String(letter), count: count)
  }

  private var essay: String {
    [paragraph("a", 200), paragraph("b", 200), paragraph("c", 200)].joined(separator: "\n\n")
  }

  @Test func theCapsGrowWithTheReplyLength() {
    #expect(AnswerGuard.cap(for: "short") == 700)
    #expect(AnswerGuard.cap(for: "medium") == 1200)
    #expect(AnswerGuard.cap(for: "long") == 2000)
    #expect(AnswerGuard.cap(for: "anything else") == 700)
  }

  @Test(arguments: [("short", 700), ("medium", 1200), ("long", 2000)])
  func aReplyOverTheCapLooksFinishedAndOneAtTheCapDoesNot(length: String, cap: Int) {
    #expect(!AnswerGuard.looksFinished(paragraph("x", cap), length: length))
    #expect(AnswerGuard.looksFinished(paragraph("x", cap + 1), length: length))
  }

  @Test func threeLongParagraphsWithNoQuestionLookLikeAFinishedEssay() {
    #expect(essay.utf16.count > 500)
    #expect(AnswerGuard.looksFinished(essay, length: "long"))
  }

  @Test func onlyTwoParagraphsIsNotTheEssayRule() {
    let reply = [paragraph("a", 300), paragraph("b", 300)].joined(separator: "\n\n")
    #expect(!AnswerGuard.looksFinished(reply, length: "long"))
  }

  @Test func threeParagraphsUnderFiveHundredCharactersIsNotTheEssayRule() {
    let reply = [paragraph("a", 100), paragraph("b", 100), paragraph("c", 100)]
      .joined(separator: "\n\n")
    #expect(reply.utf16.count < 500)
    #expect(!AnswerGuard.looksFinished(reply, length: "long"))
  }

  @Test func aQuestionMarkMeansItIsNotTheEssayRule() {
    #expect(!AnswerGuard.looksFinished(essay + " What do you think?", length: "long"))
  }

  @Test func blankParagraphsDoNotCountTowardsThree() {
    let reply = [paragraph("a", 300), "   ", paragraph("b", 300)].joined(separator: "\n\n")
    #expect(!AnswerGuard.looksFinished(reply, length: "long"))
  }
}
