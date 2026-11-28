import XCTest

@MainActor
final class MeUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  private func launch() -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", "-focus-no-ai"]
    app.launch()
    app.buttons["welcome-start"].tap()
    app.tab("Me").tap()
    return app
  }

  /// Add a private note, see it, and delete it. The trusted-adult line is always under the notes.
  func testAddAndDeleteANote() {
    let app = launch()
    app.openMe("me-row-goals")
    // The Me screen is a lazy list, so scroll to the notes first.
    let field = app.textFields["note-text"]
    app.scrollTo(field)
    field.tap()
    field.typeText("Too noisy at home")
    app.putKeyboardAway()
    app.buttons["note-add"].tap()
    let row = app.element("note-row")
    XCTAssertTrue(row.waitForExistence(timeout: 5))
    // On iOS 18 the new row can sit under the tab bar, which XCUITest still calls hittable, so a
    // swipe would hit the tab bar. Scroll until the row is above it, judged by position.
    let barTop = app.tabBars.firstMatch.exists ? app.tabBars.firstMatch.frame.minY : app.frame.maxY
    var swipes = 0
    // Only a bottom tab bar can cover the row; on an iPad the tabs are at the top.
    while barTop > app.frame.midY && row.frame.maxY > barTop && swipes < 6 {
      app.swipeUp()
      swipes += 1
    }
    row.swipeLeft()
    app.buttons["Delete"].tap()
    app.buttons["note-delete-confirm"].firstMatch.tap()
    // The row leaves with an animation, so wait for it to go.
    let gone = expectation(
      for: NSPredicate(format: "exists == false"), evaluatedWith: app.element("note-row"))
    wait(for: [gone], timeout: 5)
    // The trusted-adult line is under the notes. It sits in a lazy list, so scroll down to it.
    let trusted = app.element("me-trusted-adult")
    app.scrollTo(trusted)
    XCTAssertTrue(trusted.exists)
  }

  /// A changed setting is used: turning on Talk shows the microphone on Today.
  func testChangingVoiceIsUsed() {
    let app = launch()
    app.openMe("me-row-voice")
    let talkSwitch = app.switches["voice-talk"]
    app.scrollTo(talkSwitch)
    // Tap the switch itself, at the right of the row, as a student would.
    talkSwitch.switches.firstMatch.tap()
    app.tab("Today").tap()
    XCTAssertTrue(app.buttons["mic-button"].waitForExistence(timeout: 5))
  }

  /// The first-guess card appears after an answer and says it is a guess.
  func testFirstGuessCard() {
    let app = launch()
    app.openMe("me-row-how")
    let question = app.buttons["how-block"]
    app.scrollTo(question)
    question.tap()
    app.buttons["Short (about 12 minutes)"].tap()
    XCTAssertTrue(app.element("first-guess").waitForExistence(timeout: 5))
  }

  /// Delete everything needs a second tap, and then the app is back at the first-run screen.
  func testDeleteEverything() {
    let app = launch()
    let about = app.element("me-about")
    app.scrollTo(about)
    about.tap()
    let delete = app.buttons["delete-everything"]
    app.scrollTo(delete)
    delete.tap()
    XCTAssertTrue(app.buttons["delete-everything-confirm"].waitForExistence(timeout: 5))
    app.buttons["delete-everything-confirm"].tap()
    XCTAssertTrue(app.element("welcome-screen").waitForExistence(timeout: 5))
  }

  /// The backup switch is there and starts on.
  func testBackupSwitchIsOnByDefault() {
    let app = launch()
    let backup = app.switches["backup-switch"]
    app.scrollTo(backup)
    XCTAssertTrue(backup.waitForExistence(timeout: 5))
    XCTAssertEqual(backup.value as? String, "1")
  }

  /// The line about what is sent is shown first, nothing is listed yet, a bad address gets a calm
  /// line, and an http address is accepted with a note that it is not encrypted.
  func testOwnAIShowsTheDisclosureFirstAndHandlesAddresses() {
    let app = launch()
    app.openMe("me-row-services")
    let disclosure = app.element("own-ai-disclosure")
    app.scrollTo(disclosure)
    XCTAssertTrue(disclosure.waitForExistence(timeout: 5))
    XCTAssertTrue(disclosure.label.contains("privacy rules"))
    let empty = app.element("own-ai-empty")
    app.scrollTo(empty)
    XCTAssertTrue(empty.waitForExistence(timeout: 5))
    let add = app.buttons["own-ai-add"]
    app.scrollTo(add)
    XCTAssertTrue(add.isEnabled)
    add.tap()

    let address = app.textFields["own-ai-address"]
    XCTAssertTrue(address.waitForExistence(timeout: 5))
    address.clearAndType("ftp://example.com/v1/chat/completions")
    XCTAssertTrue(app.element("own-ai-address-problem").waitForExistence(timeout: 5))
    address.clearAndType("http://example.com/v1/chat/completions")
    XCTAssertTrue(app.element("own-ai-address-http").waitForExistence(timeout: 5))
    XCTAssertFalse(app.element("own-ai-address-problem").exists)
    app.buttons["own-ai-cancel"].tap()
    XCTAssertFalse(app.textFields["own-ai-address"].waitForExistence(timeout: 2))
    XCTAssertTrue(app.element("own-ai-empty").waitForExistence(timeout: 5))
  }

  /// Typing Google's address fills in the model name; another address leaves a name alone.
  func testGoogleAddressFillsInTheModelName() {
    let app = launch()
    app.openMe("me-row-services")
    let add = app.buttons["own-ai-add"]
    app.scrollTo(add)
    add.tap()
    let address = app.textFields["own-ai-address"]
    XCTAssertTrue(address.waitForExistence(timeout: 5))
    address.clearAndType("https://generativelanguage.googleapis.com/v1beta/openai/")
    let model = app.textFields["own-ai-model"]
    app.scrollTo(model)
    XCTAssertEqual(model.value as? String, "models/gemini-flash-lite-latest")
    // Another address does not replace a name that is already there.
    app.scrollTo(address)
    address.clearAndType("https://api.example.com/v1")
    app.scrollTo(model)
    XCTAssertEqual(model.value as? String, "models/gemini-flash-lite-latest")
    app.buttons["own-ai-cancel"].tap()
  }

  /// A saved Google service keeps the model name the student typed when it is opened to edit.
  func testEditingASavedGoogleServiceKeepsItsModelName() {
    let app = launch()
    app.openMe("me-row-services")
    let add = app.buttons["own-ai-add"]
    app.scrollTo(add)
    add.tap()
    let label = app.textFields["own-ai-label"]
    XCTAssertTrue(label.waitForExistence(timeout: 5))
    label.clearAndType("Gem")
    // The model is typed first, so the address fill-in has nothing to replace
    // (the edit helper cannot reliably delete the 30-character default).
    let model = app.textFields["own-ai-model"]
    model.clearAndType("gemini-4-hydrogen")
    let address = app.textFields["own-ai-address"]
    address.clearAndType("https://generativelanguage.googleapis.com/v1beta/openai/")
    let key = app.secureTextFields["own-ai-key"]
    key.tap()
    key.typeText("test-key-123")
    app.putKeyboardAway()
    app.buttons["own-ai-save"].tap()
    XCTAssertTrue(app.element("own-ai-row").waitForExistence(timeout: 5))

    let edit = app.buttons["Edit Gem"]
    app.scrollTo(edit)
    edit.tap()
    let reopened = app.textFields["own-ai-model"]
    XCTAssertTrue(reopened.waitForExistence(timeout: 5))
    app.scrollTo(reopened)
    XCTAssertEqual(reopened.value as? String, "gemini-4-hydrogen")
    app.buttons["own-ai-cancel"].tap()
  }

  /// Add a service (after the disclosure), see it in the list, see it on Talk, and remove it.
  func testAddAServiceSeeItOnTalkAndRemoveIt() {
    let app = launch()
    app.openMe("me-row-services")
    let disclosure = app.element("own-ai-disclosure")
    app.scrollTo(disclosure)
    XCTAssertTrue(disclosure.waitForExistence(timeout: 5))
    let add = app.buttons["own-ai-add"]
    app.scrollTo(add)
    add.tap()

    let label = app.textFields["own-ai-label"]
    XCTAssertTrue(label.waitForExistence(timeout: 5))
    label.clearAndType("Alpha")
    let address = app.textFields["own-ai-address"]
    address.clearAndType("https://example.com/v1/chat/completions")
    let model = app.textFields["own-ai-model"]
    model.clearAndType("test-model")
    let key = app.secureTextFields["own-ai-key"]
    key.tap()
    key.typeText("test-key-123")
    app.putKeyboardAway()
    app.buttons["own-ai-save"].tap()

    let row = app.element("own-ai-row")
    XCTAssertTrue(row.waitForExistence(timeout: 5))
    XCTAssertFalse(app.element("own-ai-empty").exists)
    XCTAssertTrue(app.staticTexts["Alpha"].exists)
    XCTAssertEqual(app.staticTexts["own-ai-status"].label, "Ready")
    XCTAssertTrue(app.buttons["Edit Alpha"].exists)
    XCTAssertTrue(app.buttons["Check connection Alpha"].exists)

    app.tab("Talk").tap()
    XCTAssertTrue(app.element("talk-which-ai").waitForExistence(timeout: 5))
    app.tab("Me").tap()

    let remove = app.buttons["Remove Alpha"]
    app.scrollTo(remove)
    remove.tap()
    let sure = app.buttons["Tap again to remove Alpha"]
    XCTAssertTrue(sure.waitForExistence(timeout: 5))
    XCTAssertTrue(app.staticTexts["Alpha"].exists)  // asked once, nothing removed yet
    sure.tap()
    XCTAssertFalse(app.element("own-ai-row").waitForExistence(timeout: 2))
    XCTAssertTrue(app.element("own-ai-empty").waitForExistence(timeout: 5))
    app.tab("Talk").tap()
    XCTAssertFalse(app.element("talk-which-ai").exists)
  }

  /// Each row of the Me list opens its own screen with its control, and the back button returns.
  func testEveryMeRowOpensItsScreenAndComesBack() {
    let app = launch()
    let pairs = [
      ("me-row-goals", "goal-today"), ("me-row-how", "how-block"), ("me-row-ai-style", "ai-guide"),
      ("me-row-voice", "voice-talk"), ("me-row-services", "own-ai-disclosure"),
    ]
    for (row, control) in pairs {
      app.openMe(row)
      XCTAssertTrue(app.element(control).waitForExistence(timeout: 5), "\(row) has \(control)")
      app.navigationBars.buttons.element(boundBy: 0).tap()
      XCTAssertTrue(app.buttons["me-row-goals"].waitForExistence(timeout: 5))
    }
  }
}

extension XCUIElement {
  /// Replaces what is in a text field.
  fileprivate func clearAndType(_ text: String) {
    // Put an open keyboard away first, as a person would, so its Done bar is not in the way.
    let app = XCUIApplication()
    app.putKeyboardAway()
    var swipes = 0
    while !isHittable && swipes < 4 {
      app.swipeUp()
      swipes += 1
    }
    tap()
    if let current = value as? String, !current.isEmpty {
      typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: current.count))
    }
    typeText(text)
  }

}
