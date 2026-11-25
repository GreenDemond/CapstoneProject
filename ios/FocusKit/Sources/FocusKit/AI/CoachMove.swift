import Foundation

/// Text helpers shared by every coaching call.
enum CoachText {
  /// A student's words, cut and cleaned so they cannot close the quoted block early.
  static func quoted(_ text: String) -> String {
    Guide.clean(Text.cut(text, to: 1000))
  }

  /// One fact line. The label comes from content.json; the student's words go in last, so words
  /// that look like a placeholder are never filled in.
  static func fact(_ label: String, _ text: String, content: Content) -> String {
    content.coach.factTemplate
      .replacingOccurrences(of: "{label}", with: label)
      .replacingOccurrences(of: "{text}", with: quoted(text))
  }

  /// Words of 5 or more letters, lower-cased, letters only.
  static func longWords(_ text: String) -> [String] {
    text.split(whereSeparator: { !$0.isLetter }).map { $0.lowercased() }.filter { $0.count >= 5 }
  }

  /// Words of `minLetters` or more letters, lower-cased, letters only.
  static func words(_ text: String, minLetters: Int) -> [String] {
    text.split(whereSeparator: { !$0.isLetter }).map { $0.lowercased() }
      .filter { $0.count >= minLetters }
  }

  /// Runs of digits, such as a year or a number.
  static func numbers(_ text: String) -> [String] {
    text.split(whereSeparator: { !$0.isNumber }).map(String.init)
  }

  /// Every word of 5 or more letters in `line` is in `source` or in `allow`. With a shorter
  /// `minLetters` (a move that must only reword the student's own lines) every shorter word is
  /// checked too, and any number must appear in `source`.
  static func usesOnlyWords(
    _ line: String, from source: String, allow: [String], minLetters: Int = 5
  ) -> Bool {
    let known = Set(words(source, minLetters: minLetters)).union(allow.map { $0.lowercased() })
    guard words(line, minLetters: minLetters).allSatisfy({ known.contains($0) }) else {
      return false
    }
    if minLetters < 5 {
      let seen = Set(numbers(source))
      return numbers(line).allSatisfy { seen.contains($0) }
    }
    return true
  }

  /// A quotation of 25 or more characters: that is content, not a step or a question.
  static func hasLongQuote(_ text: String) -> Bool {
    text.firstMatch(of: /["“][^"”]{25,}["”]/) != nil
  }

  /// A colon followed by a sentence: that is content, not a step.
  static func hasColonSentence(_ text: String) -> Bool {
    text.firstMatch(of: /:\s*\S.{40,}/) != nil
  }
}

/// One coaching move: fixed rules, one user message, one line back (or nothing). The line is
/// checked by `check` before anything can show or speak it.
public struct CoachMove: Sendable {
  /// `askLine` is one line ending in a single question mark, any first word: a student's own
  /// question reworded for a person.
  public enum Shape: Sendable { case question, shortLine, askLine }

  public enum Outcome: Equatable, Sendable {
    /// Passed every check.
    case line(String)
    /// The model said NOTHING.
    case nothing
    /// The AI said the safety word: show the trusted-adult line.
    case trustedAdult
    /// Use the move's own non-AI line.
    case fallback(CoachFallback)
  }

  private let model: any LanguageModel
  private let content: Content

  public init(model: any LanguageModel, content: Content) {
    self.model = model
    self.content = content
  }

  public var isAvailable: Bool { model.availability == .available }

  /// `rules` is the whole instruction text (common rules then the move's own). `facts` are lines
  /// already quoted by the caller.
  public func run(
    rules: String, facts: [String], ask: String, shape: Shape, starts: [String] = [],
    maxWords: Int = 0, source: String? = nil, allow: [String] = [], minWord: Int = 5
  ) async -> Outcome {
    guard isAvailable else { return .fallback(.unavailable) }
    var latest = ""
    do {
      for try await snapshot in model.stream(
        instructions: rules,
        messages: [ChatMessage(role: .user, text: (facts + [ask]).joined(separator: "\n"))])
      {
        latest = snapshot
        if Safety.containsSignal(latest, word: content.safety.word) { return .trustedAdult }
      }
    } catch {
      return .fallback(.refused)
    }
    switch Self.check(
      latest, shape: shape, limit: content.limits.stepLength, word: content.safety.word,
      nothing: content.coach.nothingWord, starts: starts)
    {
    case .success(let line?):
      if maxWords > 0, line.split(whereSeparator: { $0.isWhitespace }).count > maxWords {
        return .fallback(.notProcess)
      }
      if let source,
        !CoachText.usesOnlyWords(line, from: source, allow: allow, minLetters: minWord)
      {
        return .fallback(.notProcess)
      }
      return .line(line)
    case .success(nil): return .nothing
    case .failure(let reason): return .fallback(reason)
    }
  }

  /// Runs a move named in content.json: the common rules then the move's rules, the move's own
  /// ask line and allowed question starts. An unknown name uses the fallback.
  /// With `source`, the reply may only use words from that text or the move's `allow` list.
  public func run(
    moveKey: String, facts: [String], shape: Shape, source: String? = nil
  ) async -> Outcome {
    guard let move = content.coach.moves[moveKey] else { return .fallback(.unavailable) }
    return await run(
      rules: content.coach.common + "\n" + move.rules, facts: facts, ask: move.ask, shape: shape,
      starts: move.starts, maxWords: move.maxWords, source: source, allow: move.allow,
      minWord: move.minWord ?? 5)
  }

  /// The non-AI line for a move, or nil for an unknown name.
  public func fallbackLine(for moveKey: String) -> String? {
    content.coach.moves[moveKey]?.fallback
  }

  private static let questionWords: Set<String> = [
    "what", "how", "which", "where", "when", "who", "could", "would", "is", "are", "do", "does",
    "did", "can",
  ]

  /// Checks a whole reply. `.success(nil)` means the model said NOTHING. Fails closed.
  static func check(
    _ reply: String, shape: Shape, limit: Int, word: String, nothing: String,
    starts: [String] = []
  ) -> Result<String?, CoachFallback> {
    if Safety.containsSignal(reply, word: word) { return .failure(.notProcess) }
    let lines = reply.split(separator: "\n", omittingEmptySubsequences: true)
      .map { Text.trimmed(String($0)) }
      .filter { !$0.isEmpty }
    guard let first = lines.first else { return .failure(.nothingUsable) }
    if lines.count > 1 { return .failure(.notProcess) }
    let text = StepCoach.cleaned(first)
    // Nothing but marks (`-`, `**`, `1.`) is an empty reply.
    if !text.contains(where: { $0.isLetter }) { return .failure(.nothingUsable) }

    let bare = Text.trimmed(text.trimmingCharacters(in: CharacterSet(charactersIn: ".! ")))
    if bare.caseInsensitiveCompare(nothing) == .orderedSame { return .success(nil) }

    // A question for a person can be longer than a step.
    let cap = shape == .askLine ? max(limit, 300) : limit
    if text.utf16.count > cap { return .failure(.notProcess) }
    if AnswerGuard.looksFinished(text, length: "short") { return .failure(.notProcess) }
    if CoachText.hasLongQuote(text) { return .failure(.notProcess) }

    switch shape {
    case .question:
      guard text.hasSuffix("?") else { return .failure(.notProcess) }
      let firstWord = text.split(whereSeparator: { $0.isWhitespace }).first.map(String.init) ?? ""
      let letters = firstWord.lowercased().filter { $0.isLetter }
      let allowed = starts.isEmpty ? questionWords : Set(starts)
      guard allowed.contains(letters) else { return .failure(.notProcess) }
    case .shortLine:
      if text.hasSuffix("?") || CoachText.hasColonSentence(text) { return .failure(.notProcess) }
    case .askLine:
      guard text.hasSuffix("?"), text.filter({ $0 == "?" }).count == 1,
        !CoachText.hasColonSentence(text)
      else { return .failure(.notProcess) }
    }
    return .success(text)
  }
}
