import Foundation

/// The app's words and rules, read from `Shared/content.json`.
public struct Content: Codable, Equatable, Sendable {
  public struct Kind: Codable, Equatable, Sendable {
    public let id: String
    public let label: String
    public let starterSteps: [String]
  }

  public struct Limits: Codable, Equatable, Sendable {
    public let pasteLength: Int
    public let stepLength: Int
    public let savedSteps: Int
    public let savedStepLength: Int
    public let message: Int
    public let sentCharacters: Int
    public let guide: Int
    public let sources: Int
    public let chats: Int
    public let chatCharacters: Int
  }

  public struct Safety: Codable, Equatable, Sendable {
    public let word: String
    public let line: String
  }

  public struct ReplyLength: Codable, Equatable, Sendable {
    public let label: String
    public let text: String
  }

  public struct ReplyLengths: Codable, Equatable, Sendable {
    public let short: ReplyLength
    public let medium: ReplyLength
    public let long: ReplyLength
  }

  public struct Chat: Codable, Equatable, Sendable {
    public let openingQuestion: String
    public let rules: String
    public let defaultGuide: String
    public let lengths: ReplyLengths
    public let defaultLength: String
    public let rulesReminder: String
    public let searchLine: String
    public let trimNote: String
  }

  public struct StepCoach: Codable, Equatable, Sendable {
    public let rules: String
    /// What the learner record may show the step coach (C9). Reviewed at gate 2.
    public let sees: [Sees]
  }

  /// The word limit and the short list of vague steps the step review asks about.
  public struct StepReview: Codable, Equatable, Sendable {
    public let maxWords: Int
    public let vaguePhrases: [String]
    /// The rules for copying the assignment's requirements (the AI's copying step, S3).
    public let extractRules: String
    /// Words that never count as a requirement's key words.
    public let stopWords: [String]
  }

  public struct CoachMoveText: Codable, Equatable, Sendable {
    public let rules: String
    /// The one request line sent after the facts.
    public let ask: String
    /// The words a question may start with. Empty means the default list.
    public let starts: [String]
    /// Extra words of 5 or more letters a question may use, besides the student's own words.
    public let allow: [String]
    /// The most words the line may have. Zero means no cap.
    public let maxWords: Int
    public let fallback: String
    /// What the learner record may show this move (M1). Empty means nothing. Reviewed at gate 2.
    public let sees: [Sees]
    /// The shortest word the reply is checked against the student's words, in letters. Absent means 5.
    public let minWord: Int?
  }

  /// One allow-list rule: which kind of record line, with which tags, and how many.
  public struct Sees: Codable, Equatable, Sendable {
    /// A `LearnerRecord.Kind` raw value.
    public let kind: String
    /// Any of these tags qualifies. Empty means any line of the kind.
    public let tags: [String]
    /// The newest this many lines.
    public let limit: Int
    /// Only lines for the current course label.
    public let thisCourse: Bool
  }

  public struct CoachFacts: Codable, Equatable, Sendable {
    public let kind: String
    public let step: String
    public let tried: String
    public let dontGet: String
  }

  public struct Coach: Codable, Equatable, Sendable {
    public let common: String
    public let nothingWord: String
    public let moves: [String: CoachMoveText]
    /// The names of the facts a move may send.
    public let facts: CoachFacts
    /// How one fact is written: `{label}` and `{text}` are filled in.
    public let factTemplate: String
  }

  public struct Pickup: Codable, Equatable, Sendable {
    public let sameDay: String
    public let laterDay: String
  }

  public struct Option: Codable, Equatable, Sendable {
    public let value: String
    public let label: String
  }

  public struct Question: Codable, Equatable, Sendable {
    public let id: String
    public let text: String
    public let options: [Option]
  }

  public struct HowILikeToWork: Codable, Equatable, Sendable {
    public let notSure: String
    public let notSureText: String
    public let questions: [Question]
  }

  public let version: Int
  public let kinds: [Kind]
  public let defaultStepCount: Int
  public let twoMinuteStep: String
  public let stuckHints: [String]
  public let limits: Limits
  public let safety: Safety
  public let chat: Chat
  public let stepCoach: StepCoach
  public let stepReview: StepReview
  public let coach: Coach
  public let pickup: Pickup
  public let howILikeToWork: HowILikeToWork
}

public enum ContentError: Error, Equatable {
  case missingFile
  case unreadable
}

extension Content {
  /// Reads and decodes a content file. Missing or damaged files throw; unknown extra keys are ignored.
  public static func load(from url: URL) throws -> Content {
    let data: Data
    do {
      data = try Data(contentsOf: url)
    } catch {
      throw ContentError.missingFile
    }
    do {
      return try JSONDecoder().decode(Content.self, from: data)
    } catch {
      throw ContentError.unreadable
    }
  }

  /// Reads the `content.json` shipped inside this package.
  public static func bundled() throws -> Content {
    guard
      let url = Bundle.module.url(
        forResource: "content", withExtension: "json", subdirectory: "Shared")
    else {
      throw ContentError.missingFile
    }
    return try load(from: url)
  }
}
