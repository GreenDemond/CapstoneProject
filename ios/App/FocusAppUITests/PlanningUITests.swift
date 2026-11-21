import XCTest

/// Written but not run on this computer (no iOS simulator).
final class PlanningUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  func launchPastWelcome() -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data"]
    app.launch()
    app.buttons["welcome-start"].tap()
    XCTAssertTrue(app.otherElements["assignment-screen"].waitForExistence(timeout: 5))
    return app
  }

  func typeAssignment(_ app: XCUIApplication, _ words: String) {
    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText(words)
  }

  /// Empty app to the work screen by "Suggest some to start", through the editor.
  func testSuggestedStepsGoThroughTheEditor() {
    let app = launchPastWelcome()
    typeAssignment(app, "Five paragraphs on courage")
    app.buttons["suggest-steps"].tap()
    XCTAssertTrue(app.otherElements["editor-screen"].waitForExistence(timeout: 5))
    XCTAssertFalse(app.otherElements["work-screen"].exists)
    app.buttons["start-steps"].tap()
    XCTAssertTrue(app.otherElements["work-screen"].waitForExistence(timeout: 5))
  }

  /// The same by typing three steps.
  func testTypingThreeSteps() {
    let app = launchPastWelcome()
    typeAssignment(app, "Read chapter three")
    app.buttons["say-steps"].tap()
    XCTAssertTrue(app.otherElements["saying-screen"].waitForExistence(timeout: 5))
    for words in ["Open the book", "Read page one", "Write one line"] {
      let field = app.textFields["said-step"]
      field.tap()
      field.typeText(words)
      app.buttons["add-said"].tap()
    }
    app.buttons["thats-all"].tap()
    XCTAssertTrue(app.otherElements["editor-screen"].waitForExistence(timeout: 5))
    app.buttons["start-steps"].tap()
    XCTAssertTrue(app.otherElements["work-screen"].waitForExistence(timeout: 5))
  }

  /// Nothing entered: a calm line, nothing else happens.
  func testNothingEnteredShowsACalmLine() {
    let app = launchPastWelcome()
    app.buttons["suggest-steps"].tap()
    XCTAssertTrue(app.staticTexts["empty-note"].waitForExistence(timeout: 5))
    XCTAssertTrue(app.otherElements["assignment-screen"].exists)
  }
}
