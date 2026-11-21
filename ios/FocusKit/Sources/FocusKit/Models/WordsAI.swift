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

extension Words {
  public static let talkPrivacy =
    "This AI runs on this iPhone. Your messages don't leave it. It can still be wrong."
  public static let talkPlaceholder = "Say or type what you're stuck on"
  public static let talkSend = "Send"
  public static let talkStop = "Stop"
  public static let talkNewChat = "New chat"
  public static let talkMyChats = "My chats"
  public static let talkNoChats = "No saved chats yet."
  public static let talkDelete = "Delete"
  public static let talkDeleteSure = "Tap again to delete"
  public static let talkDeleteAll = "Delete all chats"
  public static let talkUseSteps = "Use these as my steps"
  public static let talkHints = "Get a hint"
  public static let messageCut = "That was long, so the end was cut off."
  public static let talkItThrough = "Talk it through"
}

extension Words {
  public static let aiSuggestedLabel = "Suggested by the AI on this iPhone. Change any you like."
  public static let coachFallback =
    "The AI's steps weren't usable, so these are starter steps. Change any you like."
  public static let coachThinking = "Thinking of some steps"
  public static let giveIdea = "Give me an idea"
  public static let ideaUse = "Use it"
  public static let ideaNo = "No thanks"
  public static let ideaFromAI = "An idea from the AI on this iPhone:"
  public static let ideaFromStarter = "An idea for this kind of work:"
  public static let ideaNone = "You have all the starter ideas. Add your own."
}
