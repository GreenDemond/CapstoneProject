import FocusKit
import SwiftUI
import UIKit

/// A Done button above the keyboard that puts the keyboard away, so the rest of the screen can be
/// reached. Added once at the top of each screen that has a text box.
struct KeyboardDone: ViewModifier {
  // `Self.Content` is SwiftUI's; FocusKit also has a type named Content.
  func body(content: Self.Content) -> some View {
    content.toolbar {
      ToolbarItemGroup(placement: .keyboard) {
        Spacer()
        Button(Words.talkKeyboardDone) {
          UIApplication.shared.sendAction(
            #selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
        }
        .accessibilityIdentifier("keyboard-done")
      }
    }
  }
}

extension View {
  func keyboardDoneButton() -> some View { modifier(KeyboardDone()) }
}
