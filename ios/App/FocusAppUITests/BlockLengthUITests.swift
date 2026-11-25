import XCTest

@MainActor
final class BlockLengthUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  /// A one-step plan on the work screen, with a timer that runs fast (a 5-minute block lasts one
  /// second), so the end of the countdown can be reached in a test.
  private func startWork(extra: [String] = []) -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", "-focus-no-ai", "-focus-fast-timer"] + extra
    app.launch()
    app.buttons["welcome-start"].tap()
    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText("Some work")
    app.putKeyboardAway()
    app.buttons["say-steps"].tap()
    let field = app.textFields["said-step"]
    field.tap()
    field.typeText("Write one line")
    app.putKeyboardAway()
    app.buttons["add-said"].tap()
    app.buttons["thats-all"].tap()
    app.buttons["start-steps"].tap()
    XCTAssertTrue(app.element("work-screen").waitForExistence(timeout: 5))
    return app
  }

  private func runShortCountdown(_ app: XCUIApplication) {
    app.element("timer-menu").tap()
    app.buttons["5 minutes"].tap()
  }

  /// When a block ends, one quiet question appears. One tap saves one line, which shows under
  /// What the app remembers about me with a delete, and the question goes.
  func testAnAnswerIsSavedAndShownInWhatTheAppRemembers() {
    let app = startWork()
    runShortCountdown(app)
    XCTAssertTrue(app.element("block-question").waitForExistence(timeout: 10))
    XCTAssertEqual(app.element("block-question").label, "Was 5 minutes about right?")
    // Shorter is not offered at 5 minutes: it could never change anything.
    XCTAssertFalse(app.buttons["block-shorter"].exists)
    app.buttons["block-longer"].tap()
    XCTAssertTrue(app.element("block-question").waitForNonExistence(timeout: 5))
    app.buttons["leave-step"].tap()
    app.openMe("me-row-remembered")
    let line = app.element("remembered-line")
    XCTAssertTrue(line.waitForExistence(timeout: 5))
    XCTAssertEqual(line.label, "5-minute block: too short")
    XCTAssertTrue(app.staticTexts["The app noted this"].exists)
  }

  /// Skip writes nothing and never blocks the step.
  func testSkipWritesNothing() {
    let app = startWork()
    runShortCountdown(app)
    XCTAssertTrue(app.element("block-question").waitForExistence(timeout: 10))
    app.buttons["block-skip"].tap()
    XCTAssertTrue(app.element("block-question").waitForNonExistence(timeout: 5))
    XCTAssertTrue(app.buttons["choice-done"].exists)
    app.buttons["leave-step"].tap()
    app.openMe("me-row-remembered")
    XCTAssertTrue(app.element("remembered-empty").waitForExistence(timeout: 5))
  }

  /// Turning the timer off never asks.
  func testNoTimerNeverAsks() {
    let app = startWork()
    runShortCountdown(app)
    app.element("timer-menu").tap()
    app.buttons["No timer"].tap()
    sleep(2)
    XCTAssertFalse(app.element("block-question").exists)
  }

  /// At the largest text size the three answers can be reached.
  func testTheAnswersAreReachableAtTheLargestTextSize() {
    let app = startWork(extra: [
      "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL",
    ])
    runShortCountdown(app)
    XCTAssertTrue(app.element("block-question").waitForExistence(timeout: 10))
    let longer = app.buttons["block-longer"]
    var swipes = 0
    while !longer.isHittable && swipes < 10 {
      app.swipeUp()
      swipes += 1
    }
    XCTAssertTrue(longer.isHittable, "Longer cannot be reached at the largest text size")
  }
}
