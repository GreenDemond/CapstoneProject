import XCTest

/// Written but not run on this computer (no iOS simulator). They never depend on the network.
@MainActor
final class LookUpUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  func testPrivacyLineIsShownBeforeTheFirstSearchAndEmptyWordsGiveACalmLine() {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data"]
    app.launch()
    app.buttons["welcome-start"].tap()
    app.tabBars.buttons["Talk"].tap()
    app.buttons["talk-lookup"].tap()
    XCTAssertTrue(app.staticTexts["lookup-privacy"].waitForExistence(timeout: 5))
    app.buttons["lookup-search"].tap()
    XCTAssertTrue(app.staticTexts["lookup-note"].waitForExistence(timeout: 5))
  }
}
