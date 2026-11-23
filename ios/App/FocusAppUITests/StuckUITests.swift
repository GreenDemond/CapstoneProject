import XCTest

@MainActor
final class StuckUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  /// Walks the ladder: hints, then a three-part question that can be copied.
  func testLadderToACopiedQuestion() {
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
    field.typeText("Write one line")
    app.putKeyboardAway()
    app.buttons["add-said"].tap()
    app.buttons["thats-all"].tap()
    app.buttons["start-steps"].tap()
    app.buttons["choice-stuck"].tap()
    XCTAssertTrue(app.element("stuck-screen").waitForExistence(timeout: 5))
    // Ask a person is not offered until two hints have been shown.
    XCTAssertFalse(app.buttons["ask-copy"].exists)
    app.buttons["another-hint"].tap()
    let tried = app.textFields["ask-tried"]
    XCTAssertTrue(tried.waitForExistence(timeout: 5))
    // "I'm on" starts with the step's words, so the question can be copied at once. With every
    // box empty it cannot.
    let on = app.textFields["ask-on"]
    XCTAssertEqual(on.value as? String, "Write one line")
    // Tap at the far right so the cursor lands after the words.
    on.coordinate(withNormalizedOffset: CGVector(dx: 0.98, dy: 0.5)).tap()
    on.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: "Write one line".count))
    XCTAssertFalse(app.buttons["ask-copy"].exists)
    XCTAssertTrue(app.staticTexts["ask-need-words"].exists)
    app.putKeyboardAway()
    tried.tap()
    tried.typeText("Reading the example")
    app.putKeyboardAway()
    XCTAssertTrue(app.buttons["ask-copy"].waitForExistence(timeout: 5))
    app.buttons["ask-copy"].tap()
    XCTAssertTrue(app.buttons["Copied."].waitForExistence(timeout: 5))
  }

  /// With the AI on, Stuck can ask one question. The fake AI answers with a real question.
  func testAskMeAQuestionShowsAQuestion() {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", "-focus-fake-ai-question"]
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
    app.buttons["choice-stuck"].tap()
    XCTAssertTrue(app.element("stuck-screen").waitForExistence(timeout: 5))
    let ask = app.buttons["ask-question"]
    XCTAssertTrue(ask.waitForExistence(timeout: 5))
    ask.tap()
    let card = app.element("stuck-question")
    XCTAssertTrue(card.waitForExistence(timeout: 5))
    XCTAssertEqual(card.label, "Which part would you do first?")
    // Awkward path: a second tap is allowed once more, then the button goes away.
    app.buttons["ask-question"].tap()
    let gone = expectation(
      for: NSPredicate(format: "exists == false"), evaluatedWith: app.buttons["ask-question"])
    wait(for: [gone], timeout: 5)
  }

  /// With the AI on but a reply that is not a question, the fixed question shows and the button
  /// goes away (asking again would show the same line).
  func testAFailedReplyShowsTheFixedQuestion() {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", "-focus-fake-ai"]
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
    app.buttons["choice-stuck"].tap()
    XCTAssertTrue(app.element("stuck-screen").waitForExistence(timeout: 5))
    app.buttons["ask-question"].tap()
    let card = app.element("stuck-question")
    XCTAssertTrue(card.waitForExistence(timeout: 5))
    XCTAssertEqual(card.label, "What is the very first small thing this step asks you to do?")
    XCTAssertFalse(app.buttons["ask-question"].exists)
  }
}
