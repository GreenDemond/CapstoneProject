import Foundation

/// The checks every piece of AI text passes before the student sees or hears it.
public enum Safety {
  /// Upper case; every run of characters that are not letters, digits or spaces becomes one "_".
  static func normalized(_ text: String) -> String {
    var result = ""
    var lastWasMark = false
    for character in text.uppercased() {
      if character.isLetter || character.isNumber || character.isWhitespace {
        result.append(character)
        lastWasMark = false
      } else if !lastWasMark {
        result.append("_")
        lastWasMark = true
      }
    }
    return result
  }

  /// True when the text holds the safety word, in any letter case and with punctuation around or
  /// inside it (TRUSTED_ADULT, trusted-adult, "Trusted_Adult."), or is nothing but the two words.
  public static func containsSignal(_ text: String, word: String) -> Bool {
    let target = normalized(word)
    let form = normalized(text)
    if form.contains(target) { return true }
    let spaced = target.replacingOccurrences(of: "_", with: " ")
    let bare = form.trimmingCharacters(in: CharacterSet(charactersIn: "_").union(.whitespaces))
    return Text.collapsed(bare) == spaced
  }
}

/// A last net against a reply that looks like finished work. It is a heuristic and does not replace
/// the answer-giving checks on a real phone (T14). It errs toward replacing the reply.
public enum AnswerGuard {
  private static var phrases: [Regex<Substring>] {
    [
      /(?i)\bhere(?:'s| is| are)\s+(?:your|the|my|a|an)\s+(?:finished|final|complete|full|sample|example|rewritten|polished)?\s*(?:essay|answers?|solutions?|paragraphs?|summary|response|draft|version|report|conclusion|introduction)\b/,
      /(?i)\bthe\s+(?:correct\s+|final\s+)?answer\s+is\b/,
      /(?i)^\s*(?:final\s+answer|answer|solution|essay)\s*:/,
      /(?i)\bin\s+conclusion,/,
      /(?i)\btherefore,?\s+the\s+answer\b/,
      /(?i)\bhere\s+(?:it\s+is|you\s+go)\s*:/,
    ]
  }

  /// The longest reply, in characters, for each reply length. A finished essay is longer.
  static func cap(for length: String) -> Int {
    switch length {
    case "long": 2000
    case "medium": 1200
    default: 700
    }
  }

  public static func looksFinished(_ reply: String, length: String) -> Bool {
    if reply.utf16.count > cap(for: length) { return true }
    if phrases.contains(where: { reply.firstMatch(of: $0) != nil }) { return true }
    let paragraphs = reply.components(separatedBy: "\n\n").filter { !Text.trimmed($0).isEmpty }
    return paragraphs.count >= 3 && reply.utf16.count > 500 && !reply.contains("?")
  }
}
