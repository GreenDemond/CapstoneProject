import Foundation

/// Words for the phone's AI. Plain, kind, and never a finished answer.
extension Words {
  public static let aiCouldNotAnswer = "The AI on this iPhone couldn't answer that one."
  public static let aiHintsOnly =
    "I can give hints, not the finished answer. What have you tried so far?"
  public static let aiTooLong = "This chat got long. Start a new chat to keep going."
  public static let aiStopped = "Stopped."

  public static func aiUnavailable(_ reason: ModelAvailability) -> String {
    switch reason {
    case .available: ""
    case .deviceNotEligible:
      "This iPhone can't run the AI helper. Hints and Look it up still work."
    case .notEnabled:
      "The AI helper is off. You can switch on Apple Intelligence in Settings. Hints and Look it up still work."
    case .notReady:
      "The AI helper is still getting ready on this iPhone. Try again later. Hints and Look it up still work."
    case .other:
      "The AI helper isn't available right now. Hints and Look it up still work."
    }
  }
}
