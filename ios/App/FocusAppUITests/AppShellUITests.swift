import XCTest

@MainActor
final class AppShellUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  func launch() -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", "-focus-no-ai"]
    app.launch()
    return app
  }

  func testFirstRunScreenThenFourTabs() {
    let app = launch()
    XCTAssertTrue(app.element("welcome-screen").waitForExistence(timeout: 5))
    XCTAssertTrue(app.buttons["Start"].exists)
    app.buttons["Start"].tap()
    for name in ["Today", "Talk", "Plan", "Me"] {
      XCTAssertTrue(app.tabBars.buttons[name].waitForExistence(timeout: 5), "Missing tab \(name)")
    }
  }

  func testFirstRunAsksForNoPermission() {
    let app = launch()
    XCTAssertTrue(app.buttons["Start"].waitForExistence(timeout: 5))
    app.buttons["Start"].tap()
    XCTAssertTrue(app.tabBars.buttons["Today"].waitForExistence(timeout: 5))
    // No system permission alert may appear on first run.
    let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
    XCTAssertFalse(springboard.alerts.firstMatch.exists)
  }
}
