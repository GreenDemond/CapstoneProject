import Foundation

/// Short words the app shows that are not part of the shared content file. They are kept in one
/// place so they can be read together: no shame, no medical claims, no answers.
public enum Words {
  // First run
  public static let welcomeTitle = "Let's get one small thing done."
  public static let welcomeBody =
    "Tell the app about your work. It helps you split it into small steps and pick one at a time."
  public static let welcomePrivacy =
    "Your work stays on this iPhone, and in your own iPhone backup if that is on."
  public static let welcomeStart = "Start"

  // Assignment
  public static let assignmentTitle = "What's the assignment?"
  public static let assignmentPlaceholder = "Paste or type it here"
  public static let emptyAssignment = "Add a few words about the assignment first."
  public static let pasteCut = "That was a lot, so the end was cut off to fit."
  public static let kindQuestion = "What kind of work is this?"
  public static let countQuestion = "About how many steps?"
  public static let saySteps = "I'll say my steps"
  public static let suggestSteps = "Suggest some to start"
  public static let suggestedBy =
    "These are starter steps for this kind of work. Change any you like."

  // Saying steps (by typing for now)
  public static let firstStepQuestion = "What's the first small thing you could do? It can be tiny."
  public static let nextStepQuestion = "And after that?"
  public static let thatsAll = "That's all"
  public static let addStepButton = "Add"
  public static let needOneStep = "Add one step first. It can be tiny."

  // Editor
  public static let editorTitle = "Your steps"
  public static let addAStep = "Add a step"
  public static let getReadyStep = "Open the document. Get the book."
  public static let putAwayStep = "Save. Write down what's next."
  public static let addGetReady = "Add a Get ready step"
  public static let addPutAway = "Add a Put it away step"
  public static let looksLikeTwo = "This looks like two steps. Split it?"
  public static let doneLinePrompt = "How will I know it's done?"
  public static let noSteps = "Add a step first."
  public static let startButton = "Start"
  public static let couldNotSave =
    "That couldn't be saved just now. Your steps are still on screen."

  // Today
  public static let startThisStep = "Start this step"
  public static let allMySteps = "All my steps"
  public static let newAssignment = "New assignment"
  public static let todayDone = "That's today done."
  public static let todayDoneSuggestion = "A good time to close the app."

  // Work screen
  public static let readThisStep = "Read this step"
  public static let parkAThought = "Park a thought"
  public static let parkPlaceholder = "A thought for later"
  public static let parkSaved = "Saved for later."
  public static let doneAck = "Nice. On to the next one."
  public static let stillAck = "Okay. Keep going."
  public static let driftedAck = "Good catch."
  public static let driftedPrompt = "What smaller piece can you start with?"
  public static let driftedNeedsWords = "Write a smaller piece first. The step stays as it is."
  public static let driftedConfirm = "Split it"
  public static let laterOnly = "This is the only step left, so it stays."
  public static let recallQuestion = "One thing you just learned?"
  public static let recallSave = "Save"
  public static let recallSkip = "Skip"

  public static let choiceDone = "Done"
  public static let choiceStill = "Still working"
  public static let choiceStuck = "Stuck"
  public static let choiceDrifted = "Drifted"
  public static let choiceLater = "Later"
  public static let doneWhen = "Done when:"
  public static let timerOff = "No timer"
  public static let timerMenu = "Timer"
  public static let allStepsTitle = "All my steps"
  public static let stepDoneMark = "done"

  // Stuck
  public static let stuckTitle = "Stuck is okay."
  public static let anotherHint = "Another hint"
  public static let noMoreHints = "That's all the hints I have."
  public static let askAPerson = "Ask a person"
  public static let askIntro = "A person can help most. Fill this in, then copy it or show it."
  public static let askOn = "I'm on:"
  public static let askTried = "I tried:"
  public static let askDontGet = "I don't get:"
  public static let askCopy = "Copy my question"
  public static let askCopied = "Copied."
  public static let askNeedWords = "Write a little in at least one box first."
  public static let lookItUpLater = "Look it up"
  public static let backToStep = "Back to my step"

  // Look it up
  public static let lookUpTitle = "Look it up"
  public static let lookUpPrivacy =
    "The words you search for are sent to Wikipedia. Nothing else is sent."
  public static let lookUpPlaceholder = "What do you want to look up?"
  public static let lookUpButton = "Search"
  public static let lookUpOffline = "You're offline. Try again later."
  public static let lookUpNone = "Nothing found. Try different words."
  public static let lookUpSlow = "That's taking a while. Try again in a moment."
  public static let lookUpTrouble = "Look up isn't working right now. Try again later."
  public static let lookUpEmpty = "Type a word or two first."
  public static let lookUpOff = "Look it up is switched off in this version."

  // Tabs
  public static let tabToday = "Today"
  public static let tabTalk = "Talk"
  public static let tabPlan = "Plan"
  public static let tabMe = "Me"
  public static let planEmpty = "No steps yet."
  public static let planMakeSteps = "Make some steps"

  // Ways out
  public static let backToToday = "Back to Today"
  public static let backToMySteps = "Back to my steps"
  public static let back = "Back"
  public static let tryAgain = "Try again"
  public static let replaceTitle = "You already have steps here."
  public static let replaceKeep = "Keep my steps"
  public static let replaceGo = "Make new ones"
}

extension Words {
  /// The label of one of the five buttons.
  public static func label(for choice: Choice) -> String {
    switch choice {
    case .done: choiceDone
    case .still: choiceStill
    case .stuck: choiceStuck
    case .drifted: choiceDrifted
    case .later: choiceLater
    }
  }
}
