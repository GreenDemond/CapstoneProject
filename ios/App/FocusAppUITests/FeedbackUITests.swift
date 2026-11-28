import XCTest

@MainActor
final class FeedbackUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  /// Opens the Stuck sheet on a one-step plan and asks the AI for a question.
  private func askOnStuck(_ argument: String, extra: [String] = []) -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", argument] + extra
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
    return app
  }

  /// Three equal buttons appear under the AI's question. One tap rates it and the row becomes one
  /// quiet line.
  func testRatingTheStuckQuestionReplacesTheButtonsWithThanks() {
    let app = askOnStuck("-focus-fake-ai-question")
    XCTAssertTrue(app.element("stuck-question").waitForExistence(timeout: 5))
    let helped = app.buttons["stuck-feedback-helped"]
    let meh = app.buttons["stuck-feedback-meh"]
    let notThis = app.buttons["stuck-feedback-notthis"]
    XCTAssertTrue(helped.waitForExistence(timeout: 5))
    XCTAssertTrue(meh.exists && notThis.exists)
    // The three buttons share one size, so no answer looks more welcome than another.
    XCTAssertEqual(helped.frame.size.height, meh.frame.size.height, accuracy: 1)
    XCTAssertEqual(meh.frame.size.height, notThis.frame.size.height, accuracy: 1)
    XCTAssertEqual(helped.frame.size.width, notThis.frame.size.width, accuracy: 1)
    notThis.tap()
    XCTAssertTrue(app.element("stuck-feedback-thanks").waitForExistence(timeout: 5))
    XCTAssertFalse(app.buttons["stuck-feedback-helped"].exists)
  }

  /// No rating row under the trusted-adult line.
  func testNoFeedbackRowUnderTheSafetyLine() {
    let app = askOnStuck("-focus-fake-ai-distress")
    XCTAssertTrue(app.element("stuck-question-note").waitForExistence(timeout: 5))
    XCTAssertFalse(app.buttons["stuck-feedback-helped"].exists)
    XCTAssertFalse(app.buttons["stuck-feedback-notthis"].exists)
  }

  /// At the largest text size the row is still there and a button can be reached and tapped.
  func testTheRowIsReachableAtTheLargestTextSize() {
    let app = askOnStuck(
      "-focus-fake-ai-question",
      extra: ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"])
    let notThis = app.buttons["stuck-feedback-notthis"]
    XCTAssertTrue(notThis.waitForExistence(timeout: 5))
    var swipes = 0
    while !notThis.isHittable && swipes < 10 {
      app.swipeUp()
      swipes += 1
    }
    XCTAssertTrue(notThis.isHittable, "Not this cannot be reached at the largest text size")
    notThis.tap()
    XCTAssertTrue(app.element("stuck-feedback-thanks").waitForExistence(timeout: 5))
  }
}
