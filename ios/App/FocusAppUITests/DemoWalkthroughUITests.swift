import XCTest

/// A walk through the app with sample data, for looking at the screens. Each step takes a
/// screenshot, kept in the test result bundle. Uses a fake key and a scripted AI, never a real one.
@MainActor
final class DemoWalkthroughUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  private func shot(_ app: XCUIApplication, _ name: String) {
    let attachment = XCTAttachment(screenshot: app.screenshot())
    attachment.name = name
    attachment.lifetime = .keepAlways
    add(attachment)
  }

  func testWalkthroughWithSampleData() {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", "-focus-fake-ai"]
    app.launch()
    app.buttons["welcome-start"].tap()
    XCTAssertTrue(app.element("assignment-screen").waitForExistence(timeout: 5))
    shot(app, "01-assignment")

    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText("Read chapter 3 and answer the questions at the end")
    app.putKeyboardAway()
    app.buttons["suggest-steps"].tap()
    XCTAssertTrue(app.element("editor-screen").waitForExistence(timeout: 5))
    shot(app, "02-editor")

    app.buttons["start-steps"].tap()
    XCTAssertTrue(app.element("work-screen").waitForExistence(timeout: 5))
    shot(app, "03-work-screen")

    app.buttons["Back to Today"].tap()
    XCTAssertTrue(app.element("today-screen").waitForExistence(timeout: 5))
    app.openMe("me-row-services")
    let disclosure = app.element("own-ai-disclosure")
    app.scrollTo(disclosure)
    XCTAssertTrue(disclosure.waitForExistence(timeout: 5))
    let add = app.buttons["own-ai-add"]
    app.scrollTo(add)
    add.tap()
    let address = app.textFields["own-ai-address"]
    XCTAssertTrue(address.waitForExistence(timeout: 5))
    shot(app, "04-own-ai-editor-openrouter-defaults")

    let key = app.secureTextFields["own-ai-key"]
    app.scrollTo(key)
    key.tap()
    key.typeText("sk-or-test-not-a-real-key")
    app.putKeyboardAway()
    app.buttons["own-ai-save"].tap()
    let row = app.element("own-ai-row")
    XCTAssertTrue(row.waitForExistence(timeout: 5))
    shot(app, "05-own-ai-saved")
  }
}
