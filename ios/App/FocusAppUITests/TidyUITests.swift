import XCTest

@MainActor
final class TidyUITests: XCTestCase {
  override func setUp() {
    continueAfterFailure = false
  }

  private func openAskPerson(_ argument: String) -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", argument]
    app.launch()
    app.buttons["welcome-start"].tap()
    let box = app.textViews["assignment-text"]
    box.tap()
    box.typeText("Some work")
    app.putKeyboardAway()
    app.buttons["say-steps"].tap()
    let field = app.textFields["said-step"]
    field.tap()
    field.typeText("Write one line")
    app.putKeyboardAway()
    app.buttons["add-said"].tap()
    app.buttons["thats-all"].tap()
    app.buttons["start-steps"].tap()
    app.buttons["choice-stuck"].tap()
    XCTAssertTrue(app.element("stuck-screen").waitForExistence(timeout: 5))
    app.buttons["another-hint"].tap()
    XCTAssertTrue(app.textFields["ask-tried"].waitForExistence(timeout: 5))
    return app
  }

  /// Fill the three boxes, Tidy it, see the card, Use this, then Copy.
  func testTidyItShowsACardAndUseThisThenCopy() {
    let app = openAskPerson("-focus-fake-ai-tidy")
    let tried = app.textFields["ask-tried"]
    tried.tap()
    tried.typeText("read the prompt")
    app.putKeyboardAway()
    let dontGet = app.textFields["ask-dont-get"]
    dontGet.tap()
    dontGet.typeText("what the prompt is asking")
    app.putKeyboardAway()
    let tidy = app.buttons["tidy-it"]
    XCTAssertTrue(tidy.waitForExistence(timeout: 5))
    tidy.tap()
    let card = app.element("tidy-card")
    XCTAssertTrue(card.waitForExistence(timeout: 5))
    XCTAssertEqual(
      card.label, "Could you tell me what the prompt is asking, since I tried to read the prompt?")
    app.buttons["use-tidied"].tap()
    XCTAssertFalse(app.buttons["use-tidied"].exists)
    app.buttons["ask-copy"].tap()
    XCTAssertTrue(app.buttons["Copied."].waitForExistence(timeout: 5))
  }

  /// With nothing in the "I don't get" box there is no Tidy it button.
  func testNoTidyButtonWithoutWordsInTheDontGetBox() {
    let app = openAskPerson("-focus-fake-ai-tidy")
    XCTAssertFalse(app.buttons["tidy-it"].exists)
  }
}
