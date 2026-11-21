import XCTest

/// Written but not run on this computer (no iOS simulator).
@MainActor
final class MeUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  private func launch() -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data"]
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
    let row = app.otherElements["note-row"]
    XCTAssertTrue(row.waitForExistence(timeout: 5))
    row.swipeLeft()
    app.buttons["Delete"].tap()
    XCTAssertFalse(app.otherElements["note-row"].exists)
  }

  /// A changed setting is used: turning on I talk shows the microphone on Today.
  func testChangingVoiceIsUsed() {
    let app = launch()
    app.buttons["I talk"].tap()
    app.tabBars.buttons["Today"].tap()
    XCTAssertTrue(app.buttons["mic-button"].waitForExistence(timeout: 5))
  }

  /// The first-guess card appears after an answer and says it is a guess.
  func testFirstGuessCard() {
    let app = launch()
    app.buttons["how-block"].tap()
    app.buttons["Short (about 12 minutes)"].tap()
    XCTAssertTrue(app.otherElements["first-guess"].waitForExistence(timeout: 5))
  }

  /// Delete everything needs a second tap, and then the app is back at the first-run screen.
  func testDeleteEverything() {
    let app = launch()
    app.buttons["me-about"].tap()
    app.buttons["delete-everything"].tap()
    XCTAssertTrue(app.buttons["delete-everything-confirm"].waitForExistence(timeout: 5))
    app.buttons["delete-everything-confirm"].tap()
    XCTAssertTrue(app.otherElements["welcome-screen"].waitForExistence(timeout: 5))
  }
}
