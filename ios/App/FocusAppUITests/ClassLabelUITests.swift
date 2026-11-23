import XCTest

@MainActor
final class ClassLabelUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  /// The class box keeps what the student typed, spaces included, when they tap somewhere else.
  func testTheClassLabelStaysInTheBox() {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", "-focus-no-ai"]
    app.launch()
    app.buttons["welcome-start"].tap()
    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText("Some work")
    app.putKeyboardAway()
    let course = app.textFields["class-label"]
    app.scrollTo(course)
    XCTAssertTrue(course.waitForExistence(timeout: 5))
    course.tap()
    course.typeText("Social Studies")
    app.putKeyboardAway()
    XCTAssertEqual(app.textFields["class-label"].value as? String, "Social Studies")
  }
}
