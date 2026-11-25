import XCTest

@MainActor
final class StepReviewUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  private func openEditor(step: String) -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", "-focus-no-ai"]
    app.launch()
    app.buttons["welcome-start"].tap()
    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText("Some work")
    app.putKeyboardAway()
    app.buttons["say-steps"].tap()
    let field = app.textFields["said-step"]
    field.tap()
    field.typeText(step)
    app.putKeyboardAway()
    app.buttons["add-said"].tap()
    app.buttons["thats-all"].tap()
    return app
  }

  /// A vague step shows a quiet question. Skip hides it, and Start still works.
  func testAVagueStepShowsAQuestionThatSkipHidesAndStartStillWorks() {
    let app = openEditor(step: "Study")
    let note = app.element("review-note-0")
    XCTAssertTrue(note.waitForExistence(timeout: 5))
    XCTAssertEqual(note.label, "Which part will you do first?")
    app.buttons["review-skip-0"].tap()
    XCTAssertTrue(app.element("review-note-0").waitForNonExistence(timeout: 5))
    app.buttons["start-steps"].tap()
    XCTAssertTrue(app.element("work-screen").waitForExistence(timeout: 5))
  }

  /// The same checks at the largest text size: the Skip button is still there and tappable.
  func testSkipIsStillReachableAtTheLargestTextSize() {
    let app = XCUIApplication()
    app.launchArguments = [
      "-focus-fresh-data", "-focus-no-ai", "-UIPreferredContentSizeCategoryName",
      "UICTContentSizeCategoryAccessibilityXXXL",
    ]
    app.launch()
    app.buttons["welcome-start"].tap()
    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText("Some work")
    app.putKeyboardAway()
    app.buttons["say-steps"].tap()
    let field = app.textFields["said-step"]
    field.tap()
    field.typeText("Study")
    app.putKeyboardAway()
    app.buttons["add-said"].tap()
    app.buttons["thats-all"].tap()
    let skip = app.buttons["review-skip-0"]
    XCTAssertTrue(skip.waitForExistence(timeout: 5))
    XCTAssertTrue(skip.isHittable)
    skip.tap()
    XCTAssertFalse(app.element("review-note-0").exists)
  }
}
