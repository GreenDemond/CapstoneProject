import XCTest

extension XCUIApplication {
  /// Finds a screen or control by its accessibility identifier, whatever kind of element SwiftUI
  /// made it. SwiftUI turns some containers into scroll views or lists, so `otherElements` misses.
  func element(_ identifier: String) -> XCUIElement {
    descendants(matching: .any).matching(identifier: identifier).firstMatch
  }

  /// Opens the app on a fresh, empty folder and passes the welcome screen.
  static func launchedPastWelcome(extra: [String] = []) -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments = ["-focus-fresh-data", "-focus-no-ai"] + extra
    app.launch()
    app.buttons["welcome-start"].tap()
    return app
  }

  /// Puts the keyboard away with its Done button, as a person would before tapping something
  /// the keyboard may cover.
  func putKeyboardAway() {
    let done = buttons["keyboard-done"].firstMatch
    if keyboards.count > 0, done.exists { done.tap() }
  }

  /// Types an assignment, says the given steps one by one, and presses Start.
  /// Leaves the app on the work screen.
  func startSteps(_ steps: [String], assignment: String = "Some work") {
    let box = textViews["assignment-text"]
    box.tap()
    box.typeText(assignment)
    putKeyboardAway()
    buttons["say-steps"].tap()
    for words in steps {
      let field = textFields["said-step"]
      field.tap()
      field.typeText(words)
      putKeyboardAway()
      buttons["add-said"].tap()
    }
    buttons["thats-all"].tap()
    buttons["start-steps"].tap()
  }

  /// Opens one screen of Me from the Me list. If a screen is already open, goes back to the list.
  func openMe(_ row: String) {
    tabBars.buttons["Me"].tap()
    let target = buttons[row]
    if !target.waitForExistence(timeout: 2) {
      let back = navigationBars.buttons.element(boundBy: 0)
      if back.exists { back.tap() }
      _ = target.waitForExistence(timeout: 3)
    }
    scrollTo(target)
    target.tap()
  }

  /// Scrolls the front list or page up until the element can be tapped.
  func scrollTo(_ target: XCUIElement, maxSwipes: Int = 8) {
    var swipes = 0
    while !(target.exists && target.isHittable) && swipes < maxSwipes {
      swipeUp()
      swipes += 1
    }
  }
}
