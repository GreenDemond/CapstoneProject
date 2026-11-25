import FocusKit
import SwiftUI

/// What I did (PROG1): plain counts of what the student did in the last 30 days, from their own
/// lines under What the app remembers about me. Not a score, not a comparison, no arrows, no
/// percentages, and no claim that anything got better. A line with a count of zero is not shown.
struct WhatIDidView: View {
  let model: AppModel

  var body: some View {
    let summary = model.progressSummary
    List {
      Section {
        if !model.hasProgress {
          Text(Words.didNothingYet)
            .font(Theme.Typography.body)
            .foregroundStyle(Theme.Palette.quiet)
            .accessibilityIdentifier("did-nothing-yet")
        } else if summary.isEmpty {
          Text(Words.didNothingLately)
            .font(Theme.Typography.body)
            .foregroundStyle(Theme.Palette.quiet)
            .accessibilityIdentifier("did-nothing-lately")
        } else {
          line(Words.didAssignments(summary.assignments), id: "did-assignments")
          if summary.stepsFinished > 0 {
            line(Words.didSteps(summary.stepsFinished), id: "did-steps")
          }
          if summary.firstStepSoon > 0 {
            line(Words.didFirstStep(summary.firstStepSoon), id: "did-first-step")
          }
          if summary.fromSuggestion > 0 {
            line(Words.didFromSuggestion(summary.fromSuggestion), id: "did-suggested")
          }
          if summary.writtenByStudent > 0 {
            line(Words.didWrittenByYou(summary.writtenByStudent), id: "did-written")
          }
        }
      } header: {
        Text(Words.didLast30)
      }
      .listRowBackground(Theme.Palette.card)
      Section {
        Text(Words.didGoalsLink)
          .font(Theme.Typography.small)
          .foregroundStyle(Theme.Palette.quiet)
      }
      .listRowBackground(Color.clear)
    }
    .scrollContentBackground(.hidden)
    .pageBackground()
    .navigationTitle(Words.meRowDid)
    .navigationBarTitleDisplayMode(.inline)
    .accessibilityIdentifier("did-screen")
  }

  private func line(_ text: String, id: String) -> some View {
    Text(verbatim: text)
      .font(Theme.Typography.body)
      .foregroundStyle(Theme.Palette.ink)
      .frame(maxWidth: .infinity, alignment: .leading)
      .accessibilityIdentifier(id)
  }
}
