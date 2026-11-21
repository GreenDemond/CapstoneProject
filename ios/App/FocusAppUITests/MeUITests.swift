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
    app.tabBars.buttons["Me"].tap()
    return app
  }

  /// Add a private note, see it, and delete it. The trusted-adult line is always under the notes.
  func testAddAndDeleteANote() {
    let app = launch()
    XCTAssertTrue(app.staticTexts["me-trusted-adult"].waitForExistence(timeout: 5))
    let field = app.textFields["note-text"]
    field.tap()
    field.typeText("Too noisy at home")
    app.buttons["note-add"].tap()
    let row = app.element("note-row")
    XCTAssertTrue(row.waitForExistence(timeout: 5))
    row.swipeLeft()
    app.buttons["Delete"].tap()
    XCTAssertFalse(app.element("note-row").exists)
  }

  /// A changed setting is used: turning on Talk shows the microphone on Today.
  func testChangingVoiceIsUsed() {
    let app = launch()
    let talkSwitch = app.switches["voice-talk"]
    app.scrollTo(talkSwitch)
    // Tap the switch itself, at the right of the row, as a student would.
    talkSwitch.switches.firstMatch.tap()
    app.tabBars.buttons["Today"].tap()
    XCTAssertTrue(app.buttons["mic-button"].waitForExistence(timeout: 5))
  }

  /// The first-guess card appears after an answer and says it is a guess.
  func testFirstGuessCard() {
    let app = launch()
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
}
