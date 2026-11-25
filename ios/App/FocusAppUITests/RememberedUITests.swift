import XCTest

@MainActor
final class RememberedUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  private func launch(fresh: Bool = true, extra: [String] = []) -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments = (fresh ? ["-focus-fresh-data"] : []) + ["-focus-no-ai"] + extra
    app.launch()
    if app.buttons["welcome-start"].waitForExistence(timeout: 3) {
      app.buttons["welcome-start"].tap()
    }
    return app
  }

  private func addNote(_ app: XCUIApplication, _ text: String) {
    app.openMe("me-row-goals")
    let field = app.textFields["note-text"]
    app.scrollTo(field)
    field.tap()
    field.typeText(text)
    app.putKeyboardAway()
    app.buttons["note-add"].tap()
    XCTAssertTrue(app.element("note-row").waitForExistence(timeout: 5))
  }

  /// A note shows up under What the app remembers about me with who wrote it, can be deleted with
  /// one confirmation, and stays gone after the app is closed and opened again.
  func testANoteAppearsCanBeDeletedAndStaysGone() {
    let app = launch()
    addNote(app, "Too noisy at home")
    app.openMe("me-row-remembered")
    XCTAssertTrue(app.element("remembered-screen").waitForExistence(timeout: 5))
    let line = app.element("remembered-line")
    XCTAssertTrue(line.waitForExistence(timeout: 5))
    XCTAssertEqual(line.label, "Too noisy at home")
    XCTAssertTrue(app.staticTexts["You wrote this"].exists)
    app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'remembered-delete-'"))
      .element(boundBy: 0).tap()
    app.buttons["remembered-delete-confirm"].firstMatch.tap()
    XCTAssertTrue(app.element("remembered-line").waitForNonExistence(timeout: 5))
    XCTAssertTrue(app.element("remembered-empty").waitForExistence(timeout: 5))

    app.terminate()
    let again = launch(fresh: false)
    again.openMe("me-row-remembered")
    XCTAssertTrue(again.element("remembered-empty").waitForExistence(timeout: 5))
    XCTAssertFalse(again.element("remembered-line").exists)
  }

  /// With nothing saved, the screen says so calmly.
  func testNothingSavedShowsACalmLine() {
    let app = launch()
    app.openMe("me-row-remembered")
    XCTAssertTrue(app.element("remembered-empty").waitForExistence(timeout: 5))
    XCTAssertTrue(app.element("remembered-intro").exists)
  }

  /// At the largest text size the Delete button for a line can be reached and used.
  func testDeleteIsReachableAtTheLargestTextSize() {
    let app = launch(
      extra: ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"])
    addNote(app, "A long note that wraps over several lines when the text is very large indeed")
    app.openMe("me-row-remembered")
    let delete = app.buttons.matching(
      NSPredicate(format: "identifier BEGINSWITH 'remembered-delete-'")
    ).element(boundBy: 0)
    // The list is lazy, so scroll to the button before asking whether it can be reached.
    app.scrollTo(delete, maxSwipes: 12)
    XCTAssertTrue(delete.exists, "Delete is not on the screen at the largest text size")
    XCTAssertTrue(delete.isHittable, "Delete cannot be reached at the largest text size")
  }
}
