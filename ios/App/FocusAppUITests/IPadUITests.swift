import XCTest

/// Runs only on an iPad. The iPhone stays portrait, so these tests are skipped there by design
/// (not a failure): `checks/check.sh` runs the whole suite on an iPad simulator as well.
@MainActor
final class IPadUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  override func tearDown() {
    XCUIDevice.shared.orientation = .portrait
  }

  /// The main path works in landscape: assignment, steps, editor, Start, the work screen.
  func testMainPathInLandscape() throws {
    try XCTSkipUnless(UIDevice.current.userInterfaceIdiom == .pad, "iPad only")
    XCUIDevice.shared.orientation = .landscapeLeft
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
    field.typeText("Read chapter 3")
    app.putKeyboardAway()
    app.buttons["add-said"].tap()
    app.buttons["thats-all"].tap()
    app.buttons["start-steps"].tap()
    XCTAssertTrue(app.element("work-screen").waitForExistence(timeout: 5))
  }
}
