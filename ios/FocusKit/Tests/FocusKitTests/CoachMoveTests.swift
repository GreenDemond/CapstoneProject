import Foundation
import Testing

@testable import FocusKit

@MainActor
@Suite struct CoachMoveTests {
  let content: Content
  let model = FakeLanguageModel()

  init() throws { content = try loadContent() }

  private func run(
    _ reply: FakeLanguageModel.Reply, shape: CoachMove.Shape = .question,
    facts: [String] = [], ask: String = "Ask."
  ) async -> CoachMove.Outcome {
    model.enqueue(reply)
    return await CoachMove(model: model, content: content)
      .run(rules: "RULES", facts: facts, ask: ask, shape: shape)
  }

  private func check(_ reply: String, _ shape: CoachMove.Shape) -> CoachMove.Outcome {
    switch CoachMove.check(
      reply, shape: shape, limit: content.limits.stepLength, word: content.safety.word,
      nothing: content.coach.nothingWord)
    {
    case .success(let line?): return .line(line)
    case .success(nil): return .nothing
    case .failure(let reason): return .fallback(reason)
    }
  }

  // MARK: Shape table

  private static let longQuote = "\"" + String(repeating: "a", count: 30) + "\""
  private static let table: [(String, CoachMove.Shape, CoachMove.Outcome)] = [
    (
      "What does the first sentence ask for?", .question,
      .line("What does the first sentence ask for?")
    ),
    ("  **How would you start?**  ", .question, .line("How would you start?")),
    ("Read the first paragraph.", .question, .fallback(.notProcess)),
    ("What is it?\nHow so?", .question, .fallback(.notProcess)),
    ("Start with the question?", .question, .fallback(.notProcess)),
    ("What did you try?\"", .question, .fallback(.notProcess)),
    ("The answer is 42?", .question, .fallback(.notProcess)),
    ("What does \(longQuote) mean?", .question, .fallback(.notProcess)),
    (
      "What " + String(repeating: "a", count: 194) + "?", .question,
      .line("What " + String(repeating: "a", count: 194) + "?")
    ),
    ("What " + String(repeating: "a", count: 195) + "?", .question, .fallback(.notProcess)),
    ("NOTHING", .question, .nothing),
    ("nothing.", .question, .nothing),
    ("**NOTHING**", .question, .nothing),
    ("Nothing!", .question, .nothing),
    ("- NOTHING", .shortLine, .nothing),
    ("NOTHING to add", .question, .fallback(.notProcess)),
    ("NOTHING\nBecause it is fine.", .question, .fallback(.notProcess)),
    ("", .question, .fallback(.nothingUsable)),
    ("   \n  ", .shortLine, .fallback(.nothingUsable)),
    ("-", .question, .fallback(.nothingUsable)),
    ("**", .shortLine, .fallback(.nothingUsable)),
    ("1.", .question, .fallback(.nothingUsable)),
    ("TRUSTED_ADULT", .question, .fallback(.notProcess)),
    ("Trusted adult", .shortLine, .fallback(.notProcess)),
    ("Open the book to page 12.", .shortLine, .line("Open the book to page 12.")),
    ("Open the book?", .shortLine, .fallback(.notProcess)),
    ("Note this: " + String(repeating: "x", count: 45), .shortLine, .fallback(.notProcess)),
  ]

  @Test func shapeTable() {
    for (reply, shape, expected) in Self.table {
      #expect(check(reply, shape) == expected, "reply: \(reply)")
    }
  }

  // MARK: Running a move

  @Test func goodReplyIsALine() async {
    #expect(await run(.init(["What does it ask?"])) == .line("What does it ask?"))
  }

  @Test func nothingReplyIsNothing() async {
    #expect(await run(.init(["NOTHING"])) == .nothing)
  }

  @Test func safetyWordWholeAndSplitIsTrustedAdult() async {
    #expect(await run(.init(["TRUSTED_ADULT"])) == .trustedAdult)
    #expect(await run(.init(["TRUSTED_", "ADULT"])) == .trustedAdult)
  }

  @Test func safetyWordWinsEvenIfTheStreamThenFails() async {
    #expect(
      await run(.init(["TRUSTED_ADULT"], failure: .refusal)) == .trustedAdult)
  }

  @Test func refusalsAndGuardrailsFallBack() async {
    #expect(await run(.failing(.refusal)) == .fallback(.refused))
    #expect(await run(.failing(.guardrail)) == .fallback(.refused))
  }

  @Test func aFailureAfterAPartialReplyNeverShowsThePartial() async {
    #expect(
      await run(.init(["What does"], failure: .refusal)) == .fallback(.refused))
  }

  @Test func emptyReplyFallsBack() async {
    #expect(await run(.init([""])) == .fallback(.nothingUsable))
  }

  @Test func unavailableModelMakesNoCall() async {
    let off = FakeLanguageModel(availability: .deviceNotEligible)
    let move = CoachMove(model: off, content: content)
    #expect(!move.isAvailable)
    let outcome = await move.run(rules: "R", facts: [], ask: "A", shape: .question)
    #expect(outcome == .fallback(.unavailable))
    #expect(off.calls.isEmpty)
  }

  @Test func rulesAndMessageAreSentAsGiven() async {
    _ = await run(.init(["What now?"]), facts: ["one", "two"], ask: "Ask this.")
    #expect(model.calls.count == 1)
    #expect(model.calls[0].instructions == "RULES")
    #expect(model.calls[0].messages.count == 1)
    #expect(model.calls[0].messages[0].text == "one\ntwo\nAsk this.")
  }

  @Test func noFactsSendsOnlyTheAsk() async {
    _ = await run(.init(["What now?"]), facts: [], ask: "Ask this.")
    #expect(model.calls[0].messages[0].text == "Ask this.")
  }

  // MARK: Content and the shared quoting

  @Test func quotedStopsAnEarlyClose() {
    let text = CoachText.quoted("say \"hi\"")
    #expect(!text.contains("\""))
  }
}
