import XCTest

@MainActor
final class StepTipsUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  private func openEditor(_ app: XCUIApplication) {
    app.buttons["welcome-start"].tap()
    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText("Some work")
    app.putKeyboardAway()
    app.buttons["say-steps"].tap()
    let field = app.textFields["said-step"]
    field.tap()
    field.typeText("Read the first page")
    app.putKeyboardAway()
    app.buttons["add-said"].tap()
    app.buttons["thats-all"].tap()
  }

  /// The card shows above the steps, Got it hides it, and a later editor does not bring it back.
  func testTheCardShowsGotItHidesItAndItStaysHidden() {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", "-focus-no-ai"]
    app.launch()
    openEditor(app)
    XCTAssertTrue(app.element("step-tips").waitForExistence(timeout: 5))
    app.buttons["step-tips-got-it"].tap()
    XCTAssertTrue(app.element("step-tips").waitForNonExistence(timeout: 5))
    app.buttons["start-steps"].tap()
    XCTAssertTrue(app.element("work-screen").waitForExistence(timeout: 5))
  }

  /// The card also shows after Suggest some, and the Me switch brings it back after Got it.
  func testTheCardShowsAfterSuggestAndTheMeSwitchBringsItBack() {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", "-focus-no-ai"]
    app.launch()
    app.buttons["welcome-start"].tap()
    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText("Some work")
    app.putKeyboardAway()
    app.buttons["suggest-steps"].tap()
    XCTAssertTrue(app.element("step-tips").waitForExistence(timeout: 5))
    app.buttons["step-tips-got-it"].tap()
    XCTAssertTrue(app.element("step-tips").waitForNonExistence(timeout: 5))
    app.openMe("me-row-how")
    let toggle = app.switches["me-step-tips"]
    XCTAssertTrue(toggle.waitForExistence(timeout: 5))
    app.scrollTo(toggle)
    XCTAssertEqual(toggle.value as? String, "0", "the tips start hidden after Got it")
    // Tap the switch itself, at the right of the row, as a student would.
    toggle.switches.firstMatch.tap()
    XCTAssertEqual(toggle.value as? String, "1", "the switch turned on")
    app.tab("Today").tap()
    XCTAssertTrue(
      app.element("step-tips").waitForExistence(timeout: 5),
      "the editor should still be open with the card back")
  }
}
