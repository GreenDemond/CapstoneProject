import XCTest

/// Written but not run on this computer (no iOS simulator). The AI is a scripted fake, chosen by
/// a launch argument, so the chat can be driven without Apple's model.
@MainActor
final class TalkUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  private func launch(extra: String = "-focus-fake-ai") -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", extra]
    app.launch()
    app.buttons["welcome-start"].tap()
    app.tabBars.buttons["Talk"].tap()
    return app
  }

  /// A conversation, then "Use these as my steps" lands in the editor, not on the work screen.
  func testConversationAndUseAsSteps() {
    let app = launch()
    XCTAssertTrue(app.staticTexts["talk-privacy"].waitForExistence(timeout: 5))
    let input = app.textFields["talk-input"]
    input.tap()
    input.typeText("Help me plan")
    app.buttons["talk-send"].tap()
    XCTAssertTrue(app.buttons["talk-use-steps"].waitForExistence(timeout: 10))
    app.buttons["talk-use-steps"].tap()
    XCTAssertTrue(app.otherElements["editor-screen"].waitForExistence(timeout: 5))
    XCTAssertFalse(app.otherElements["work-screen"].exists)
  }

  /// The trusted-adult line replaces the reply, and the message is not in My chats.
  func testTrustedAdultLineAndNothingSaved() {
    let app = launch(extra: "-focus-fake-ai-distress")
    let input = app.textFields["talk-input"]
    input.tap()
    input.typeText("some private words")
    app.buttons["talk-send"].tap()
    XCTAssertTrue(app.staticTexts["talk-trusted-adult"].waitForExistence(timeout: 10))
    XCTAssertFalse(app.staticTexts["You: some private words"].exists)
    app.buttons["talk-chats"].tap()
    XCTAssertTrue(app.staticTexts["No saved chats yet."].waitForExistence(timeout: 5))
  }

  /// With no AI the screen says so calmly and still offers hints and Look it up.
  func testNoAIStillOffersHintsAndLookUp() {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data"]
    app.launch()
    app.buttons["welcome-start"].tap()
    app.tabBars.buttons["Talk"].tap()
    XCTAssertTrue(app.staticTexts["talk-unavailable"].waitForExistence(timeout: 5))
    XCTAssertTrue(app.buttons["talk-hints"].exists)
    XCTAssertTrue(app.buttons["talk-lookup"].exists)
  }
}

/// Step coach: with no AI both ways of making steps still work; with the scripted AI, steps carry
/// the label and open in the editor. Written, not run.
@MainActor
final class StepCoachUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  func testWithNoAISuggestedStepsStillOpenInTheEditor() {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data"]
    app.launch()
    app.buttons["welcome-start"].tap()
    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText("Five paragraphs on courage")
    app.buttons["suggest-steps"].tap()
    XCTAssertTrue(app.otherElements["editor-screen"].waitForExistence(timeout: 5))
    XCTAssertTrue(app.staticTexts["starter-label"].exists)
    XCTAssertFalse(app.staticTexts["ai-label"].exists)
    app.buttons["start-steps"].tap()
    XCTAssertTrue(app.otherElements["work-screen"].waitForExistence(timeout: 5))
  }

  func testGiveMeAnIdeaWorksWithNoAI() {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data"]
    app.launch()
    app.buttons["welcome-start"].tap()
    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText("A project")
    app.buttons["say-steps"].tap()
    app.buttons["give-idea"].tap()
    XCTAssertTrue(app.buttons["idea-use"].waitForExistence(timeout: 5))
    app.buttons["idea-use"].tap()
    app.buttons["thats-all"].tap()
    XCTAssertTrue(app.otherElements["editor-screen"].waitForExistence(timeout: 5))
  }
}
