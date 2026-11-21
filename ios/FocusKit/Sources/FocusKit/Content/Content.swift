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
