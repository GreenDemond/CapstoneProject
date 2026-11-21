import XCTest

/// Written but not run on this computer (no iOS simulator).
final class WorkUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  func launchWithSteps(_ steps: [String], kind: String? = nil) -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data"]
    app.launch()
    app.buttons["welcome-start"].tap()
    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText("Some work")
    if let kind { app.buttons["kind-\(kind)"].tap() }
    app.buttons["say-steps"].tap()
    for words in steps {
      let field = app.textFields["said-step"]
      field.tap()
      field.typeText(words)
      app.buttons["add-said"].tap()
    }
    app.buttons["thats-all"].tap()
    app.buttons["start-steps"].tap()
    XCTAssertTrue(app.otherElements["work-screen"].waitForExistence(timeout: 5))
    return app
  }

  func tap(_ app: XCUIApplication, _ id: String) {
    let button = app.buttons[id]
    XCTAssertTrue(button.waitForExistence(timeout: 5), id)
    button.tap()
    // The app counts two taps within half a second as one, so wait between buttons.
    Thread.sleep(forTimeInterval: 0.7)
  }

  /// Finishes a whole assignment using each of the five buttons at least once.
  func testAllFiveButtonsThroughToTodayDone() {
    let app = launchWithSteps(["Step A", "Step B", "Step C"])
    tap(app, "choice-still")
    XCTAssertTrue(app.staticTexts["work-step"].label == "Step A")
    tap(app, "choice-stuck")
    XCTAssertTrue(app.otherElements["stuck-screen"].waitForExistence(timeout: 5))
    tap(app, "back-to-step")
    // Drifted: the first tap opens the box, the second splits.
    tap(app, "choice-drifted")
    let smaller = app.textFields["smaller-piece"]
    smaller.tap()
    smaller.typeText("A small piece")
    tap(app, "drifted-confirm")
    XCTAssertEqual(app.staticTexts["work-step"].label, "A small piece")
    tap(app, "choice-later")
    XCTAssertTrue(app.otherElements["today-screen"].waitForExistence(timeout: 5))
    tap(app, "start-this-step")
    for _ in 0..<3 { tap(app, "choice-done") }
    XCTAssertTrue(app.staticTexts["today-done"].waitForExistence(timeout: 5))
  }

  func testNoShameWordsOnTodayOrWork() {
    let app = launchWithSteps(["Step A", "Step B"])
    let banned = ["missed", "behind", "overdue", "failed"]
    for text in app.staticTexts.allElementsBoundByIndex.map { $0.label } {
      for word in banned { XCTAssertFalse(text.lowercased().contains(word), text) }
    }
  }
}
