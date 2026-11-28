import XCTest

@MainActor
final class WhatIDidUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  private func launch(extra: [String] = []) -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", "-focus-no-ai"] + extra
    app.launch()
    app.buttons["welcome-start"].tap()
    return app
  }

  private func planOwnSteps(_ app: XCUIApplication) {
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
  }

  /// With nothing planned, the screen says so calmly.
  func testNothingYetShowsACalmLine() {
    let app = launch()
    app.openMe("me-row-did")
    XCTAssertTrue(app.element("did-nothing-yet").waitForExistence(timeout: 5))
  }

  /// A plan written by the student shows as plain counts, and deleting the line behind it under
  /// What the app remembers about me changes the counts at once.
  func testPlanningShowsPlainCountsAndDeletingTheLineChangesThem() {
    let app = launch()
    planOwnSteps(app)
    app.buttons["leave-step"].tap()
    app.openMe("me-row-did")
    XCTAssertTrue(app.element("did-assignments").waitForExistence(timeout: 5))
    XCTAssertEqual(app.element("did-assignments").label, "1 assignment planned")
    XCTAssertEqual(app.element("did-written").label, "1 plan written by you")
    XCTAssertFalse(app.element("did-suggested").exists)
    // No percentage, arrow or score on the screen.
    XCTAssertFalse(app.staticTexts.matching(NSPredicate(format: "label CONTAINS '%'")).count > 0)

    app.openMe("me-row-remembered")
    let line = app.element("remembered-line")
    XCTAssertTrue(line.waitForExistence(timeout: 5))
    XCTAssertEqual(line.label, "Planned 1 step. Finished 0. Steps written by you.")
    app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'remembered-delete-'"))
      .element(boundBy: 0).tap()
    app.buttons["remembered-delete-confirm"].firstMatch.tap()
    XCTAssertTrue(app.element("remembered-empty").waitForExistence(timeout: 5))
    app.openMe("me-row-did")
    XCTAssertTrue(app.element("did-nothing-yet").waitForExistence(timeout: 5))
  }

  /// Finishing the step shows steps finished, and the first step done soon after planning.
  func testFinishingAStepShowsStepsFinishedAndASoonFirstStep() {
    let app = launch()
    planOwnSteps(app)
    app.buttons["choice-done"].tap()
    // The only step is done, so the work screen closes by itself.
    XCTAssertTrue(app.element("work-screen").waitForNonExistence(timeout: 10))
    app.openMe("me-row-did")
    XCTAssertTrue(app.element("did-steps").waitForExistence(timeout: 5))
    XCTAssertEqual(app.element("did-steps").label, "1 step finished")
    XCTAssertEqual(
      app.element("did-first-step").label, "1 with a first step done soon after planning")
  }

  /// At the largest text size every line can be reached.
  func testLinesAreReachableAtTheLargestTextSize() {
    let app = launch(extra: [
      "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL",
    ])
    planOwnSteps(app)
    app.buttons["leave-step"].tap()
    app.openMe("me-row-did")
    let written = app.element("did-written")
    app.scrollTo(written, maxSwipes: 10)
    XCTAssertTrue(written.exists, "The last line is not on the screen at the largest text size")
  }
}
