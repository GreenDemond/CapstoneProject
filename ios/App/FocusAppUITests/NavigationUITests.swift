import XCTest

/// Ways out and ways back: no screen is a dead end, and leaving never loses saved work.
@MainActor
final class NavigationUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  private func tap(_ app: XCUIApplication, _ id: String) {
    let button = app.buttons[id]
    XCTAssertTrue(button.waitForExistence(timeout: 5), id)
    button.tap()
  }

  /// Leave the work screen in the middle of a step, see Today, and pick up the same step.
  func testLeavingTheWorkScreenGoesToTodayAndResumesTheSameStep() {
    let app = XCUIApplication.launchedPastWelcome()
    app.startSteps(["Open the book", "Read page one"])
    XCTAssertTrue(app.element("work-screen").waitForExistence(timeout: 5))
    XCTAssertEqual(app.staticTexts["work-step"].label, "Open the book")
    // The way out is a labelled button, not only an icon.
    XCTAssertEqual(app.buttons["leave-step"].label, "Back to Today")
    tap(app, "leave-step")
    XCTAssertTrue(app.element("today-screen").waitForExistence(timeout: 5))
    XCTAssertTrue(app.tab("Today").exists)
    XCTAssertEqual(app.staticTexts["next-step"].label, "Open the book")
    tap(app, "start-this-step")
    XCTAssertTrue(app.element("work-screen").waitForExistence(timeout: 5))
    XCTAssertEqual(app.staticTexts["work-step"].label, "Open the book")
  }

  /// The way out also works from the Stuck sheet, which has its own way back.
  func testStuckSheetHasAWayBackToTheStep() {
    let app = XCUIApplication.launchedPastWelcome()
    app.startSteps(["Write one line"])
    tap(app, "choice-stuck")
    XCTAssertTrue(app.element("stuck-screen").waitForExistence(timeout: 5))
    tap(app, "stuck-close")
    XCTAssertTrue(app.element("work-screen").waitForExistence(timeout: 5))
    XCTAssertFalse(app.element("stuck-screen").exists)
    XCTAssertEqual(app.staticTexts["work-step"].label, "Write one line")
  }

  /// Start a new assignment, then change your mind: Today, with the old steps untouched.
  func testCancellingANewAssignmentGoesBackToToday() {
    let app = XCUIApplication.launchedPastWelcome()
    app.startSteps(["Step A", "Step B"])
    tap(app, "leave-step")
    XCTAssertTrue(app.element("today-screen").waitForExistence(timeout: 5))
    tap(app, "new-assignment")
    XCTAssertTrue(app.element("assignment-screen").waitForExistence(timeout: 5))
    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText("Half an idea")
    app.putKeyboardAway()
    tap(app, "cancel-planning")
    XCTAssertTrue(app.element("today-screen").waitForExistence(timeout: 5))
    XCTAssertEqual(app.staticTexts["next-step"].label, "Step A")
  }

  /// Back out of the editor to the assignment, then forward again with the steps kept.
  func testBackingOutOfTheEditorKeepsTheSteps() {
    let app = XCUIApplication.launchedPastWelcome()
    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText("Five paragraphs on courage")
    app.putKeyboardAway()
    tap(app, "suggest-steps")
    XCTAssertTrue(app.element("editor-screen").waitForExistence(timeout: 5))
    tap(app, "editor-back")
    XCTAssertTrue(app.element("assignment-screen").waitForExistence(timeout: 5))
    XCTAssertFalse(app.element("editor-screen").exists)
    // Making new steps would replace these, so the app asks first, and Keep goes back to them.
    tap(app, "suggest-steps")
    XCTAssertTrue(app.buttons["Keep my steps"].waitForExistence(timeout: 5))
    app.buttons["Keep my steps"].tap()
    XCTAssertTrue(app.element("editor-screen").waitForExistence(timeout: 5))
    tap(app, "start-steps")
    XCTAssertTrue(app.element("work-screen").waitForExistence(timeout: 5))
  }

  /// The same path through the plain "Back to my steps" link.
  func testBackToMyStepsLinkReturnsToTheEditor() {
    let app = XCUIApplication.launchedPastWelcome()
    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText("A short essay")
    app.putKeyboardAway()
    tap(app, "suggest-steps")
    tap(app, "editor-back")
    app.scrollTo(app.buttons["back-to-editor"])
    tap(app, "back-to-editor")
    XCTAssertTrue(app.element("editor-screen").waitForExistence(timeout: 5))
  }

  /// With saved steps, the editor and the typing screen both have a way to Today.
  func testEditorAndSayingScreensHaveAWayToToday() {
    let app = XCUIApplication.launchedPastWelcome()
    app.startSteps(["Step A"])
    tap(app, "leave-step")
    tap(app, "new-assignment")
    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText("Another one")
    app.putKeyboardAway()
    tap(app, "say-steps")
    XCTAssertTrue(app.element("saying-screen").waitForExistence(timeout: 5))
    app.scrollTo(app.buttons["cancel-planning"])
    tap(app, "cancel-planning")
    XCTAssertTrue(app.element("today-screen").waitForExistence(timeout: 5))
  }

  /// The Plan tab with nothing in it offers a way to make steps.
  func testEmptyPlanTabOffersAWayToMakeSteps() {
    let app = XCUIApplication.launchedPastWelcome()
    app.tab("Plan").tap()
    tap(app, "plan-make-steps")
    XCTAssertTrue(app.element("assignment-screen").waitForExistence(timeout: 5))
    XCTAssertTrue(app.tab("Today").isSelected)
  }

  /// Nothing on the typing screen is a dead end when the AI is not there: try again, hints, and
  /// the screen stays usable.
  func testTalkUnavailableCanBeRetriedAndStillOffersHelp() {
    let app = XCUIApplication.launchedPastWelcome()
    app.tab("Talk").tap()
    XCTAssertTrue(app.staticTexts["talk-unavailable"].waitForExistence(timeout: 5))
    tap(app, "talk-retry")
    XCTAssertTrue(app.staticTexts["talk-unavailable"].exists)
    XCTAssertTrue(app.buttons["talk-retry"].exists)
    // Hints open, and they have no "Back to my step" button that does nothing.
    tap(app, "talk-hints")
    XCTAssertTrue(app.element("stuck-screen").waitForExistence(timeout: 5))
    XCTAssertFalse(app.buttons["back-to-step"].exists)
    app.navigationBars.buttons.firstMatch.tap()
    XCTAssertTrue(app.staticTexts["talk-unavailable"].waitForExistence(timeout: 5))
  }

  /// Look it up with no words gives a calm line, the box stays usable, and Back works.
  func testLookUpEmptyWordsCanBeRetriedAfterTyping() {
    let app = XCUIApplication.launchedPastWelcome()
    app.tab("Talk").tap()
    tap(app, "talk-lookup")
    tap(app, "lookup-search")
    XCTAssertTrue(app.staticTexts["lookup-note"].waitForExistence(timeout: 5))
    let words = app.textFields["lookup-words"]
    words.tap()
    words.typeText("courage")
    app.putKeyboardAway()
    XCTAssertTrue(app.buttons["lookup-search"].isHittable)
    app.navigationBars.buttons.firstMatch.tap()
    XCTAssertTrue(app.buttons["talk-lookup"].waitForExistence(timeout: 5))
  }
}
