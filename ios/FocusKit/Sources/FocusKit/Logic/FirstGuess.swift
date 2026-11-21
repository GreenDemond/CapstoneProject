import Foundation

/// The "How I like to work" card. It restates what the student chose and offers starting choices.
/// It is a first guess: nothing in it says what will help the student focus, and it makes no
/// claim about attention.
public struct FirstGuess: Equatable, Sendable {
  public let lines: [String]
  /// The countdown length to preselect in the timer menu, if the student chose one.
  public let countdownMinutes: Int?

  /// nil when nothing has been answered (or every answer is "not sure").
  public static func make(answers: [String: String], in content: Content) -> FirstGuess? {
    let unsure = content.howILikeToWork.notSure
    let chosen = answers.filter { $0.value != unsure && !$0.value.isEmpty }
    guard !chosen.isEmpty else { return nil }
    var lines: [String] = []
    var minutes: Int?
    switch chosen["sound"] {
    case "quiet": lines.append(Words.guessQuiet)
    case "hiss": lines.append(Words.guessHiss)
    default: break
    }
    switch chosen["block"] {
    case "short":
      minutes = 12
      lines.append(Words.guessShort)
    case "long":
      minutes = 25
      lines.append(Words.guessLong)
    default: break
    }
    if let pull = chosen["pull"], let label = optionLabel("pull", pull, in: content) {
      lines.append("\(Words.guessPull) \(label.lowercased()).")
    }
    switch chosen["restart"] {
    case "small-step": lines.append(Words.guessSmallStep)
    case "notes": lines.append(Words.guessNotes)
    case "just-start": lines.append(Words.guessJustStart)
    default: break
    }
    return FirstGuess(lines: lines, countdownMinutes: minutes)
  }

  private static func optionLabel(_ question: String, _ value: String, in content: Content)
    -> String?
  {
    content.howILikeToWork.questions.first { $0.id == question }?
      .options.first { $0.value == value }?.label
  }
}
