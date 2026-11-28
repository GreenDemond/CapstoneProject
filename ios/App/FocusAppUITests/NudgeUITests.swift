import XCTest

@MainActor
final class NudgeUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  private func openEditor(_ argument: String, step: String) -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", argument]
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

  /// A step with two jobs shows the fixed line. Ask me a question swaps in the AI's question, and
  /// No keeps the step as it was.
  func testAskMeAQuestionReplacesTheFixedLineAndNoKeepsTheStep() {
    let app = openEditor("-focus-fake-ai-yesno", step: "Read the chapter and write the notes")
    let line = app.element("nudge-line-0")
    XCTAssertTrue(line.waitForExistence(timeout: 5))
    XCTAssertEqual(line.label, "This looks like two steps. Split it?")
    app.buttons["nudge-ask-0"].tap()
    let swapped = expectation(
      for: NSPredicate(format: "label == %@", "Is that one job or two?"),
      evaluatedWith: app.element("nudge-line-0"))
    wait(for: [swapped], timeout: 5)
    XCTAssertFalse(app.buttons["nudge-ask-0"].exists)
    app.buttons["nudge-no-0"].tap()
    let gone = expectation(
      for: NSPredicate(format: "exists == false"), evaluatedWith: app.element("nudge-line-0"))
    wait(for: [gone], timeout: 5)
    XCTAssertEqual(
      app.element("step-text-0").value as? String, "Read the chapter and write the notes")
  }

  /// With no AI there is no link and the fixed line still shows.
  func testWithoutAnAITheFixedLineShowsAndThereIsNoLink() {
    let app = openEditor("-focus-no-ai", step: "Read the chapter and write the notes")
    XCTAssertTrue(app.element("nudge-line-0").waitForExistence(timeout: 5))
    XCTAssertFalse(app.buttons["nudge-ask-0"].exists)
  }
}
