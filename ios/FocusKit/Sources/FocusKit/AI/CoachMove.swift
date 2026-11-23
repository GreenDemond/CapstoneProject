import Foundation

/// Text helpers shared by every coaching call.
enum CoachText {
  /// A student's words, cut and cleaned so they cannot close the quoted block early.
  static func quoted(_ text: String) -> String {
    Guide.clean(Text.cut(text, to: 1000))
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
  public enum Shape: Sendable { case question, shortLine }

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
  public func run(rules: String, facts: [String], ask: String, shape: Shape) async -> Outcome {
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
      nothing: content.coach.nothingWord)
    {
    case .success(let line?): return .line(line)
    case .success(nil): return .nothing
    case .failure(let reason): return .fallback(reason)
    }
  }

  private static let questionWords: Set<String> = [
    "what", "how", "which", "where", "when", "who", "could", "would", "is", "are", "do", "does",
    "did", "can",
  ]

  /// Checks a whole reply. `.success(nil)` means the model said NOTHING. Fails closed.
  static func check(
    _ reply: String, shape: Shape, limit: Int, word: String, nothing: String
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

    if text.utf16.count > limit { return .failure(.notProcess) }
    if AnswerGuard.looksFinished(text, length: "short") { return .failure(.notProcess) }
    if CoachText.hasLongQuote(text) { return .failure(.notProcess) }

    switch shape {
    case .question:
      guard text.hasSuffix("?") else { return .failure(.notProcess) }
      let firstWord = text.split(whereSeparator: { $0.isWhitespace }).first.map(String.init) ?? ""
      let letters = firstWord.lowercased().filter { $0.isLetter }
      guard questionWords.contains(letters) else { return .failure(.notProcess) }
    case .shortLine:
      if text.hasSuffix("?") || CoachText.hasColonSentence(text) { return .failure(.notProcess) }
    }
    return .success(text)
  }
}
