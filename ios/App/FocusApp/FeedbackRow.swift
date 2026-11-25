import FocusKit
import SwiftUI

/// Three small equal buttons under an AI line: Helped, Meh, Not this. One tap, a light haptic, no
/// words to type. Once rated, the row is one quiet line. The same row for every move, so no answer
/// looks more welcome than another (M3).
struct FeedbackRow: View {
  let rated: Bool
  let idPrefix: String
  /// Says which line the buttons rate, for VoiceOver: "the AI question" or "the AI reply".
  var about = "the AI line"
  let onRate: (FeedbackRating) -> Void

  var body: some View {
    if rated {
      Text(Words.feedbackThanks)
        .font(Theme.Typography.small)
        .foregroundStyle(Theme.Palette.quiet)
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityIdentifier("\(idPrefix)-thanks")
    } else {
      // Three across; stacked when the text size is too large for one row.
      ViewThatFits(in: .horizontal) {
        HStack(spacing: Theme.Space.small) { buttons }
        VStack(spacing: Theme.Space.small) { buttons }
      }
    }
  }

  @ViewBuilder
  private var buttons: some View {
    ForEach(FeedbackRating.allCases, id: \.self) { rating in
      Button(Words.feedbackLabel(rating)) { onRate(rating) }
        .buttonStyle(QuietButtonStyle())
        .accessibilityLabel("\(Words.feedbackLabel(rating)), \(about)")
        .accessibilityIdentifier("\(idPrefix)-\(rating.rawValue)")
    }
  }
}
