import SwiftUI
import UIKit

/// The only place colours, sizes and spacing are typed. Views use these names.
enum Theme {
  enum Palette {
    /// Warm sand, the page.
    static let sand = dynamic(light: 0xF3EAD8, dark: 0x2A241C)
    /// A slightly lighter sand for cards.
    static let card = dynamic(light: 0xFBF6EA, dark: 0x3A3228)
    /// Dark brown text.
    static let ink = dynamic(light: 0x3B2A1A, dark: 0xF1E7D3)
    /// A softer brown for secondary text.
    static let quiet = dynamic(light: 0x6B5A47, dark: 0xC9BBA3)
    /// Olive moss: the one filled button and the accent.
    static let moss = dynamic(light: 0x5B6B2E, dark: 0x9DB05A)
    /// Text on the moss button.
    static let onMoss = dynamic(light: 0xFBF6EA, dark: 0x1F2410)
    /// A little clay, for small touches.
    static let clay = dynamic(light: 0xB5694A, dark: 0xD38E6E)
    /// Thin lines.
    static let line = dynamic(light: 0xD9CCB1, dark: 0x54493A)

    private static func dynamic(light: UInt32, dark: UInt32) -> Color {
      Color(
        UIColor { traits in
          let value = traits.userInterfaceStyle == .dark ? dark : light
          return UIColor(
            red: CGFloat((value >> 16) & 0xFF) / 255, green: CGFloat((value >> 8) & 0xFF) / 255,
            blue: CGFloat(value & 0xFF) / 255, alpha: 1)
        })
    }
  }

  enum Space {
    static let tiny: CGFloat = 4
    static let small: CGFloat = 8
    static let medium: CGFloat = 16
    static let large: CGFloat = 24
    static let huge: CGFloat = 40
    /// The smallest comfortable touch area.
    static let touch: CGFloat = 44
    /// Text fields and the AI service inputs: taller than the minimum, so they are easy to hit.
    static let field: CGFloat = 56
    static let corner: CGFloat = 14
    /// The widest a screen's content gets on a large screen (an iPad).
    static let columnWidth: CGFloat = 820
    static let line: CGFloat = 1
    static let ring: CGFloat = 6
  }

  /// Type follows the phone's text-size setting because these are text styles.
  enum Typography {
    static let big = Font.largeTitle.weight(.semibold)
    static let title = Font.title2.weight(.semibold)
    static let step = Font.title.weight(.medium)
    static let body = Font.body
    static let small = Font.footnote
    static let button = Font.headline
  }
}

/// The one filled button on a screen.
struct MainButtonStyle: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(Theme.Typography.button)
      .foregroundStyle(Theme.Palette.onMoss)
      .frame(maxWidth: .infinity, minHeight: Theme.Space.touch)
      .padding(.vertical, Theme.Space.small)
      .background(Theme.Palette.moss, in: RoundedRectangle(cornerRadius: Theme.Space.corner))
      .opacity(configuration.isPressed ? 0.8 : 1)
      .onChange(of: configuration.isPressed) { _, pressed in if pressed { Haptics.press() } }
  }
}

/// Every other button: same shape, outlined, never filled.
struct QuietButtonStyle: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(Theme.Typography.button)
      .foregroundStyle(Theme.Palette.ink)
      .frame(maxWidth: .infinity, minHeight: Theme.Space.touch)
      .padding(.vertical, Theme.Space.small)
      .background(
        RoundedRectangle(cornerRadius: Theme.Space.corner).fill(Theme.Palette.card)
      )
      .onChange(of: configuration.isPressed) { _, pressed in if pressed { Haptics.press() } }
      .overlay(
        RoundedRectangle(cornerRadius: Theme.Space.corner)
          .stroke(Theme.Palette.line, lineWidth: Theme.Space.line)
      )
      .opacity(configuration.isPressed ? 0.8 : 1)
  }
}

/// A plain text link kind of button, with a full touch area.
struct LinkButtonStyle: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(Theme.Typography.body)
      .foregroundStyle(Theme.Palette.moss)
      .frame(minHeight: Theme.Space.touch)
      .opacity(configuration.isPressed ? 0.6 : 1)
      .onChange(of: configuration.isPressed) { _, pressed in if pressed { Haptics.press() } }
  }
}

extension View {
  /// The page background used by every screen.
  func pageBackground() -> some View {
    background(Theme.Palette.sand.ignoresSafeArea())
  }

  func cardStyle() -> some View {
    padding(Theme.Space.medium)
      .background(Theme.Palette.card, in: RoundedRectangle(cornerRadius: Theme.Space.corner))
      .overlay(
        RoundedRectangle(cornerRadius: Theme.Space.corner)
          .stroke(Theme.Palette.line, lineWidth: Theme.Space.line)
      )
  }
}

extension View {
  /// At least a 44-point tap area (Apple's minimum), tappable across the whole row.
  func touchTarget() -> some View {
    frame(minHeight: Theme.Space.touch, alignment: .leading).contentShape(Rectangle())
  }
}

/// A light tap when a button is pressed down, so the student feels that it registered.
enum Haptics {
  static func press() {
    UIImpactFeedbackGenerator(style: .light).impactOccurred()
  }
}

/// Every text field in the app is this tall and tappable across its whole width.
struct RoomyTextFieldStyle: TextFieldStyle {
  func _body(configuration: TextField<Self._Label>) -> some View {
    configuration
      .frame(maxWidth: .infinity, minHeight: Theme.Space.field, alignment: .leading)
      .contentShape(Rectangle())
  }
}

extension View {
  /// Keeps content in a centred column of comfortable width. On an iPhone, or in a narrow iPad
  /// window, the column is as wide as the space, so nothing changes. On a wide screen the sand
  /// background fills the sides.
  func readableColumn() -> some View {
    frame(maxWidth: Theme.Space.columnWidth)
      .frame(maxWidth: .infinity)
      .background(Theme.Palette.sand.ignoresSafeArea())
  }
}
