import XCTest

@MainActor
final class ReflectionUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  private func openPlan(_ extra: [String]) -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", "-focus-reflection-due"] + extra
    app.launch()
    app.buttons["welcome-start"].tap()
    app.tab("Plan").tap()
    return app
  }

  /// The card appears after seven days. Two answers, Done, a two-sentence reply, one rating, and
  /// the answers show up under What the app remembers about me.
  func testAnswerBothQuestionsSeeTheReplyAndRateIt() {
    let app = openPlan(["-focus-fake-ai-reflection"])
    XCTAssertTrue(app.element("reflection-card").waitForExistence(timeout: 5))
    app.buttons["reflection-open"].tap()
    let helped = app.textFields["reflection-helped"]
    XCTAssertTrue(helped.waitForExistence(timeout: 5))
    helped.tap()
    helped.typeText("talking it through")
    app.putKeyboardAway()
    let next = app.textFields["reflection-next"]
    next.tap()
    next.typeText("start earlier")
    app.putKeyboardAway()
    app.buttons["reflection-done"].tap()
    let reply = app.element("reflection-reply")
    XCTAssertTrue(reply.waitForExistence(timeout: 5))
    XCTAssertEqual(
      reply.label, "You said talking it through helped. Would you like to try that again next week?"
    )
    app.buttons["reflection-feedback-helped"].tap()
    XCTAssertTrue(app.element("reflection-feedback-thanks").waitForExistence(timeout: 5))
    app.buttons["reflection-close"].tap()
    XCTAssertTrue(app.element("reflection-card").waitForNonExistence(timeout: 5))
    app.openMe("me-row-remembered")
    XCTAssertTrue(app.staticTexts["What helped: talking it through"].waitForExistence(timeout: 5))
    XCTAssertTrue(app.staticTexts["To try next: start earlier"].exists)
  }

  /// Not now is as easy as Take a look, hides the card, and writes nothing.
  func testNotNowHidesTheCardAndWritesNothing() {
    let app = openPlan(["-focus-no-ai"])
    XCTAssertTrue(app.element("reflection-card").waitForExistence(timeout: 5))
    app.buttons["reflection-later"].tap()
    XCTAssertTrue(app.element("reflection-card").waitForNonExistence(timeout: 5))
    app.openMe("me-row-remembered")
    XCTAssertTrue(app.element("remembered-empty").waitForExistence(timeout: 5))
  }

  /// With no AI, Done with an answer shows the fixed line and no rating row.
  func testWithNoAIItShowsTheFixedLine() {
    let app = openPlan(["-focus-no-ai"])
    app.buttons["reflection-open"].tap()
    let helped = app.textFields["reflection-helped"]
    XCTAssertTrue(helped.waitForExistence(timeout: 5))
    helped.tap()
    helped.typeText("talking it through")
    app.putKeyboardAway()
    app.buttons["reflection-done"].tap()
    XCTAssertEqual(
      app.element("reflection-reply").label, "Noted. Same two questions next week.")
    XCTAssertFalse(app.buttons["reflection-feedback-helped"].exists)
  }

  /// A goal written in Me shows in the look-back with a third question. The switch hides both, and
  /// the app never says whether the goal was reached.
  func testTheGoalShowsWithAThirdQuestionAndTheSwitchHidesIt() {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", "-focus-reflection-due", "-focus-no-ai"]
    app.launch()
    app.buttons["welcome-start"].tap()
    app.openMe("me-row-goals")
    let goal = app.textFields["goal-week"]
    app.scrollTo(goal)
    goal.tap()
    goal.typeText("Read chapter 3")
    app.putKeyboardAway()
    app.tab("Plan").tap()
    app.buttons["reflection-open"].tap()
    let line = app.element("reflection-goal")
    XCTAssertTrue(line.waitForExistence(timeout: 5))
    XCTAssertEqual(line.label, "Your goal: Read chapter 3")
    XCTAssertTrue(app.textFields["reflection-toward"].exists)
    app.switches["reflection-show-goal"].tap()
    XCTAssertTrue(app.element("reflection-goal").waitForNonExistence(timeout: 5))
    XCTAssertFalse(app.textFields["reflection-toward"].exists)
  }

  /// With no goal written, the look-back is exactly as before.
  func testWithNoGoalNothingNewShows() {
    let app = openPlan(["-focus-no-ai"])
    app.buttons["reflection-open"].tap()
    XCTAssertTrue(app.textFields["reflection-helped"].waitForExistence(timeout: 5))
    XCTAssertFalse(app.element("reflection-goal").exists)
    XCTAssertFalse(app.textFields["reflection-toward"].exists)
    XCTAssertFalse(app.switches["reflection-show-goal"].exists)
  }

  /// Sending the goal to an AI is off at first and sits in Me with a plain note.
  func testTheSendSwitchIsOffAtFirstAndExplained() {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", "-focus-no-ai"]
    app.launch()
    app.buttons["welcome-start"].tap()
    app.openMe("me-row-goals")
    let send = app.switches["goal-send-switch"]
    app.scrollTo(send)
    XCTAssertTrue(send.exists)
    XCTAssertEqual(send.value as? String, "0")
    XCTAssertTrue(
      app.staticTexts[
        "Your goal is only used in the AI's reply when this is on, and goes to your own AI service if you added one."
      ].exists)
  }
}
