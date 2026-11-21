import Foundation

/// Words for the phone's AI. Plain, kind, and never a finished answer.
extension Words {
  public static let aiCouldNotAnswer = "The AI on this iPhone couldn't answer that one."
  public static let aiHintsOnly =
    "I can give hints, not the finished answer. What have you tried so far?"
  public static let aiTooLong = "This chat got long. Start a new chat to keep going."

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

/// Words for the Me tab.
extension Words {
  public static let meGoals = "My goals"
  public static let meGoalToday = "Today"
  public static let meGoalWeek = "This week"
  public static let meGoalMonth = "This month"
  public static let meGoalYear = "This year"
  public static let meGoalPlaceholder = "Optional"
  public static let meGotInTheWay = "What got in the way?"
  public static let meNotePlaceholder = "A private note"
  public static let meAddNote = "Add note"
  public static let meNoNotes = "No notes yet. Nobody else can see them."
  public static let meTrustedAdult =
    "If something serious is getting in the way, talk to an adult you trust."
  public static let meHowILike = "How I like to work"
  public static let meGuessTitle = "A first guess"
  public static let meChoose = "Choose one"
  public static let meGuessNote =
    "This is a starting guess from your answers, not a test result. Try it, and change it any time."
  public static let guessQuiet = "You like it quiet while you work."
  public static let guessHiss = "You'd like to try a steady background hiss, like a fan."
  public static let guessShort = "You'll start with a short block: about 12 minutes."
  public static let guessLong = "You'll start with a longer block: about 25 minutes."
  public static let guessPull = "What usually pulls you away:"
  public static let guessSmallStep = "To restart after a break, a very small first step helps."
  public static let guessNotes = "To restart after a break, a quick look at your notes helps."
  public static let guessJustStart = "To restart after a break, you just start."
  public static let meHowTheAITalks = "How the AI talks"
  public static let meGuidePlaceholder = "Tell the AI how you like to be helped"
  public static let meGuideNote =
    "This changes the tone and length. The AI still gives hints, never the answer."
  public static let meReplyLength = "Reply length"
  public static let meVoice = "Voice"
  public static let meReadAloud = "Read aloud"
  public static let meTalk = "Talk"
  public static let meReadAloudNote =
    "The app speaks. It reads your steps and the AI's replies out loud."
  public static let meTalkNote =
    "You speak. Your voice becomes text on this phone. Nothing is recorded."
  public static let meVoiceOffNote =
    "With both off, the app makes no sound and shows no microphone."
  public static let meHeadphonesOnly = "Only speak through headphones"
  public static let meVoiceChoice = "Which voice"
  public static let meVoiceDefault = "The phone's usual voice"
  public static let meSpeed = "Speed"
  public static let meAbout = "About and privacy"
  public static let meDeleteAll = "Delete everything on this iPhone"
  public static let meDeleteSure = "Tap again to delete everything"
  public static let meDeleteExplain =
    "This removes your steps, notes, goals, chats and settings from this iPhone. It can't be undone."
  public static let meDeleteCancel = "Keep my things"
  public static let couldNotErase = "That couldn't be deleted just now. Nothing was changed."
  public static let timerSuggested = "your pick"

  /// What the app stores and what leaves the phone: `design/03` section 3.7 and `DECISIONS.md` D8.
  public static let privacyLines: [String] = [
    "Stored only on this iPhone, in this app's own private folder: your steps and progress, your goals and notes, your answers to How I like to work, your settings, up to 10 chats, your recall answers and parked thoughts.",
    "Never stored: audio, a name, an age, a school, a diagnosis, contacts, or location.",
    "No account and no sync. The app does not back your things up anywhere.",
    "Your voice is turned into words on this iPhone. It is never recorded and never leaves it.",
    "The AI runs on this iPhone. Your messages to it do not leave it.",
    "Leaves this iPhone only when you ask: Look it up sends the words you search for to Wikipedia. Opening a source is a normal visit to that website.",
    "Nothing else. No analytics, no crash reports, no ads, and no code from anyone else.",
    "Asked only when first needed, with one sentence each: the microphone.",
  ]
}
