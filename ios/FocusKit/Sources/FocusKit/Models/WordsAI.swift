import Foundation

/// Words for the phone's AI. Plain, kind, and never a finished answer.
extension Words {
  public static let aiCouldNotAnswer = "The AI couldn't answer that one."
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
  public static func talkPrivacyOwn(label: String) -> String {
    "Your messages go to \(label), the AI service you added in Me, and its own privacy rules apply. It can still be wrong."
  }
  /// For a service whose address starts with http://: the messages travel unencrypted.
  public static func talkPrivacyOwnHttp(label: String) -> String {
    "Your messages go to \(label), the AI service you added in Me, and its own privacy rules apply. They are not encrypted on the way, because its address starts with http://. It can still be wrong."
  }
  public static let talkPlaceholder = "Say or type what you're stuck on"
  public static let talkSend = "Send"
  public static let talkStop = "Stop"
  public static let talkNewChat = "New chat"
  public static let talkKeyboardDone = "Done"
  /// Above the picker on the assignment screen. Talk and steps use the same choice.
  public static let stepsFrom = "Steps will be made by"
  public static let talkNewChatForAI =
    "This is a new chat, because you changed which AI to use. Your earlier chat is saved in My chats and was not sent."
  public static let talkingAbout = "Talking about"
  public static let talkClearStep = "Clear"
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
  public static let aiSuggestedLabel = "Suggested by the AI. Change any you like."
  public static let coachFallback =
    "The AI's steps weren't usable, so these are starter steps. Change any you like."
  public static let coachThinking = "Thinking of some steps"
  public static let giveIdea = "Give me an idea"
  public static let ideaUse = "Use it"
  public static let ideaNo = "No thanks"
  public static let ideaFromAI = "An idea from the AI:"
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
    "No account and no sync. Your things stay on this iPhone and, when \"Include in my iPhone backup\" is on (it starts on), in your own iPhone backup, in iCloud or on your computer. You can switch that off in Me. Delete everything clears this iPhone; an older backup keeps its copy until your iPhone makes a new one.",
    "Your voice is turned into words on this iPhone. It is never recorded and never leaves it.",
    "The AI runs on this iPhone unless you add your own AI service in Me and choose it on Talk. Messages to the AI on this iPhone do not leave it.",
    "Leaves this iPhone only when you ask: Look it up sends the words you search for to Wikipedia. Opening a source is a normal visit to that website.",
    "Only if you add an AI service in Me and choose it on Talk (none is added at first): your chat messages, the step and assignment text the step coach uses, and this app's rules (with your AI guide) are sent to the address you entered for that service, and that service's own privacy rules apply. Your key for it is kept only in this iPhone's Keychain, is never in a backup, and is sent only to that address. If that address starts with http:// instead of https://, what is sent to it is not encrypted.",
    "Check connection sends one short test message, not your words, and that service's key, to the address you entered for that service.",
    "Look up models, if you tap it, asks the address you entered for that service for its list of model names, with that service's key. It sends none of your words.",
    "Nothing else. No analytics, no crash reports, no ads, and no code from anyone else.",
    "Asked only when first needed, with one sentence each: the microphone.",
  ]
}

/// Words for "My AI services" and the backup switch. Nothing here quotes the service.
extension Words {
  public static let ownAITitle = "My AI services"
  public static let ownAIEmpty = "No services added. The AI on this iPhone is used."
  public static let ownAIAdd = "Add a service"
  public static let ownAIFull = "That's five services. Remove one to add another."
  public static let ownAIEdit = "Edit"
  public static let ownAIRemove = "Remove"
  public static let ownAIRemoveSure = "Tap again to remove"
  public static let ownAIRemoveKeep = "Keep it"
  public static let ownAISave = "Save service"
  public static let ownAICancel = "Cancel"
  public static let ownAIEditorAdd = "Add a service"
  public static let ownAIEditorEdit = "Edit service"
  public static let ownAILabel = "Label"
  public static let ownAILabelPlaceholder = "For example OpenRouter"
  /// What a new service starts with. The student can change any of it.
  public static let ownAIDefaultLabel = "OpenRouter"
  public static let ownAIDefaultAddress = "https://openrouter.ai/api/v1"
  public static let ownAIDefaultModel = "openrouter/free"
  public static let ownAIKeyHelp = "How to get an OpenRouter key"
  public static let ownAIKeyHelpURL = "https://openrouter.ai/docs/api-reference/authentication"
  public static let ownAIAddressHelp =
    "Paste the address your provider shows. You don't need to add the rest; the app fills it in."
  public static let ownAILabelNeeded = "Give it a short label so you can tell it apart."
  public static let ownAILabelTaken = "You already have a service with that label."
  public static let ownAIAddress = "Address"
  public static let ownAIAddressPlaceholder = ownAIDefaultAddress
  public static let ownAIAddressNote =
    "An OpenAI-compatible chat address. It should start with https://"
  public static let ownAIAddressBad =
    "That address can't be used. It must be a full address that starts with https:// or http://"
  public static let ownAIAddressHttp =
    "This address starts with http://, so your key and messages are not encrypted on the way. Use https:// if the service has it."
  public static let ownAIKey = "Key"
  public static let ownAIKeyPlaceholder = "Paste your key"
  public static let ownAIKeySaved = "A key is saved on this iPhone."
  public static let ownAIKeyNone = "No key saved."
  public static let ownAIKeyRemove = "Remove key"
  public static let ownAIKeyNote =
    "The key stays in this iPhone's Keychain. It is not in your backup and is sent only to this service's address."
  public static let ownAIKeyCouldNotSave =
    "The key couldn't be saved just now. Nothing was changed."
  public static let ownAIHttpTick = "I understand my key and messages are not encrypted"
  public static let ownAIHttpNeedsTick =
    "Tick the box to save an address that starts with http://."
  public static let ownAIKeyClearedForNewAddress =
    "The address changed, so the saved key was removed. Paste a key for the new address."
  public static let ownAIKeyKeepNote = "Leave this empty to keep the saved key."
  public static let ownAIModel = "Model name"
  public static let ownAIModelPlaceholder = "For example openrouter/free"
  public static let ownAILookUpModels = "Look up models"
  public static let ownAILookingUp = "Looking…"
  public static let ownAIPickModel = "Pick a model"
  public static func ownAIModelsFound(_ count: Int) -> String {
    "Found \(count) models. Pick one, or type a name above."
  }
  public static let ownAIModelsNoAddress =
    "The app can't tell where this service lists its models. Type the model name instead."
  public static let ownAIModelsProblem = "Couldn't get a list. Type the model name instead."
  public static let ownAICheck = "Check connection"
  public static let ownAIChecking = "Checking…"
  public static let ownAICheckWorks = "It works."
  public static let ownAIKeyNotAccepted =
    "The key wasn't accepted. You can check it in Me, under My AI services."
  public static let ownAIBusy = "That service is busy. Try again in a moment."
  public static let ownAICheckProblem =
    "Couldn't get an answer. Check the address and the model name, and your connection."
  public static let ownAIStatusReady = "Ready"
  public static let ownAIStatusNeedsAddress = "Needs a good address"
  public static let ownAIStatusNeedsModel = "Needs a model name"
  public static let ownAIStatusNeedsKey = "Needs a key"
  public static let ownAIWhichAI = "Which AI"
  public static let ownAIThisPhone = "On this iPhone"
  public static let ownAIFellBack =
    "That AI isn't ready any more, so the AI on this iPhone is being used."

  /// Shown before a service can be added. No address yet, so it speaks of "the address you entered".
  public static let ownAIDisclosure =
    "When you choose one of these services on Talk, your chat messages, the step and assignment text the step coach uses, and this app's rules (with your AI guide) are sent to the address you entered for it. That service's own privacy rules apply to them. Until you choose one, nothing is sent."

  public static let meBackup = "Include in my iPhone backup"
  public static let meBackupNote =
    "On: your things are also in your own iPhone backup (iCloud or your computer). Off: they stay only on this iPhone. Your AI key is never in a backup."
}

extension Words {
  public static let askQuestion = "Ask me a question"
  public static let askQuestionThinking = "Thinking of a question"
  public static func askQuestionOwn(label: String) -> String {
    "Your step and what you tried go to \(label), the AI service you added in Me."
  }
}

extension Words {
  public static let askNudge = "Ask me a question"
  public static func askNudgeOwn(label: String) -> String {
    "This step goes to \(label), the AI service you added in Me."
  }
}

extension Words {
  /// Shown at the foot of About, so a tester can say which build they have.
  public static func appVersion(_ version: String, build: String) -> String {
    "Version \(version) (build \(build))"
  }
}

extension Words {
  public static let ownAIThinking = "Thinking"
  public static let ownAIThinkingNote =
    "Low is the usual choice. More thinking can be slower and can use more of the service's allowance. A service that does not support this setting is asked again without it."
  public static func thinkingName(_ level: ThinkingLevel) -> String {
    switch level {
    case .none: "None"
    case .low: "Low"
    case .medium: "Medium"
    case .high: "High"
    }
  }
}
