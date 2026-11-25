import XCTest

/// The largest accessibility text size: every main control on Today, the editor, the work screen,
/// Me and Talk can still be reached (by scrolling if needed) and tapped. Screenshots of each screen
/// are kept in the result bundle. Run on the smallest iPhone available as well as a large one.
@MainActor
final class LargeTextUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  private func launch(extra: [String] = []) -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments =
      [
        "-focus-fresh-data", "-focus-no-ai",
        "-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL",
      ] + extra
    app.launch()
    return app
  }

  private func shot(_ app: XCUIApplication, _ name: String) {
    let attachment = XCTAttachment(screenshot: app.screenshot())
    attachment.name = name
    attachment.lifetime = .keepAlways
    add(attachment)
  }

  /// Scrolls until the control can be tapped, and fails with its name if it never can.
  /// Lists build rows only when they scroll into view, so scroll until it exists and can be tapped.
  private func reach(_ app: XCUIApplication, _ element: XCUIElement, _ name: String) {
    _ = element.waitForExistence(timeout: 3)
    var swipes = 0
    while !(element.exists && element.isHittable) && swipes < 20 {
      app.swipeUp()
      swipes += 1
    }
    XCTAssertTrue(element.exists, "\(name) does not exist")
    XCTAssertTrue(element.isHittable, "\(name) cannot be reached at the largest text size")
  }

  func testPlanningAndWorkScreensAtTheLargestTextSize() {
    let app = launch()
    let start = app.buttons["welcome-start"]
    reach(app, start, "Start on the welcome screen")
    shot(app, "large-01-welcome")
    start.tap()

    let box = app.textViews["assignment-text"]
    reach(app, box, "the assignment box")
    box.tap()
    box.typeText("Read chapter 3")
    app.putKeyboardAway()
    shot(app, "large-02-assignment")
    let suggest = app.buttons["suggest-steps"]
    reach(app, suggest, "Suggest some to start")
    suggest.tap()

    let begin = app.buttons["start-steps"]
    reach(app, begin, "Start in the editor")
    shot(app, "large-03-editor")
    begin.tap()

    XCTAssertTrue(app.element("work-screen").waitForExistence(timeout: 5))
    shot(app, "large-04-work")
    let leave = app.buttons["leave-step"]
    XCTAssertTrue(leave.isHittable, "Back to Today must stay on screen")
    for choice in ["done", "still", "stuck", "drifted", "later"] {
      reach(app, app.buttons["choice-\(choice)"], "the \(choice) button")
    }
    shot(app, "large-05-work-scrolled")
    XCTAssertTrue(leave.isHittable, "Back to Today must stay on screen after scrolling")

    app.buttons["choice-drifted"].tap()
    let smaller = app.textFields["smaller-piece"]
    reach(app, smaller, "the smaller-piece box")
    smaller.tap()
    smaller.typeText("Read the first page")
    app.putKeyboardAway()
    reach(app, app.buttons["drifted-confirm"], "the Drifted confirm button")
    shot(app, "large-06-drifted")
  }

  func testMeAndTalkAtTheLargestTextSize() {
    let app = launch()
    app.buttons["welcome-start"].tap()

    app.tab("Me").tap()
    shot(app, "large-07-me")
    // In screen order: the test only scrolls down.
    reach(app, app.buttons["me-row-goals"], "Goals and notes")
    reach(app, app.buttons["me-row-how"], "How I like to work")
    reach(app, app.buttons["me-row-ai-style"], "How the AI talks")
    reach(app, app.buttons["me-row-voice"], "Voice")
    reach(app, app.buttons["me-row-services"], "My AI services")
    reach(app, app.switches["backup-switch"], "the backup switch")
    reach(app, app.buttons["me-about"], "About and privacy")
    shot(app, "large-08-me-scrolled")
    app.openMe("me-row-services")
    reach(app, app.buttons["own-ai-add"], "Add a service")
    app.navigationBars.buttons.element(boundBy: 0).tap()

    app.tab("Talk").tap()
    shot(app, "large-09-talk")
    reach(app, app.buttons["talk-hints"], "the hints in Talk")
    reach(app, app.buttons["talk-new"], "New chat")
  }
}
