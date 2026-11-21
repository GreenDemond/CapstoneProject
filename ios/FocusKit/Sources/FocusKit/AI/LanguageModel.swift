import Foundation

/// Whether the phone's AI can be used right now, and if not, why.
public enum ModelAvailability: Equatable, Sendable {
  case available
  /// This iPhone cannot run Apple Intelligence.
  case deviceNotEligible
  /// Apple Intelligence is switched off.
  case notEnabled
  /// The model is still downloading or getting ready.
  case notReady
  case other
}

/// Why a reply did not arrive.
public enum ModelFailure: Error, Equatable, Sendable {
  /// The conversation is too big for the model.
  case contextFull
  /// The model's own safety stopped the message or the reply.
  case guardrail
  case refusal
  case unavailable
  case other
}

/// A language model that runs on the phone. Only `ChatEngine` and `StepCoach` call it, and
/// everything it says passes `Safety` before the student sees it.
public protocol LanguageModel: Sendable {
  var availability: ModelAvailability { get }
  /// How many tokens the model can hold at once.
  var contextSize: Int { get }
  /// An exact count, or nil when this phone cannot count (before iOS 26.4).
  func tokenCount(of text: String) async -> Int?
  /// Streams a reply to the last message. Each element is the whole reply so far, not a piece.
  func stream(instructions: String, messages: [ChatMessage]) -> AsyncThrowingStream<
    String, any Error
  >
}

/// A phone with no AI. The app is fully usable with it.
public struct UnavailableLanguageModel: LanguageModel {
  public let reason: ModelAvailability

  public init(reason: ModelAvailability = .other) {
    self.reason = reason
  }

  public var availability: ModelAvailability { reason }
  public var contextSize: Int { 4096 }
  public func tokenCount(of text: String) async -> Int? { nil }
  public func stream(instructions: String, messages: [ChatMessage]) -> AsyncThrowingStream<
    String, any Error
  > {
    AsyncThrowingStream { $0.finish(throwing: ModelFailure.unavailable) }
  }
}

extension Array where Element == ChatMessage {
  /// The conversation as one prompt. Earlier turns are quoted as history, the newest message last.
  /// The rules are never in here: they go in the instructions.
  public var asPrompt: String {
    guard let newest = last else { return "" }
    let earlier = dropLast()
    var lines: [String] = []
    if !earlier.isEmpty {
      lines.append("The conversation so far, oldest first:")
      for message in earlier {
        lines.append("\(message.role == .user ? "Student" : "Helper"): \(message.text)")
      }
      lines.append("")
      lines.append("The student's newest message:")
    }
    lines.append(newest.text)
    return lines.joined(separator: "\n")
  }
}
