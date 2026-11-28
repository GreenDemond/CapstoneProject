import FocusKit
import SwiftUI

/// Everything the app holds about how the student works, in plain view, with a delete on every
/// line (M4). Nothing here is a chart, a score or a streak.
struct RememberedView: View {
  let model: AppModel

  /// What the one confirmation dialog on this list is asking about.
  private enum Ask: Equatable {
    case line(String)
    case ratings
  }

  @State private var asking: Ask?
  /// Kept apart from `asking`: the dialog clears that before its button runs.
  @State private var chosen: Ask?

  private var learner: LearnerRecord { model.learner }

  private var groups: [(title: String, kind: LearnerRecord.Kind)] {
    [
      (Words.rememberedGroupNotes, .obstacle), (Words.rememberedGroupReflections, .reflection),
      (Words.rememberedGroupPatterns, .pattern), (Words.rememberedGroupSettings, .setting),
      (Words.rememberedGroupClasses, .course),
      (Words.rememberedGroupProgress, .progress),
    ]
  }

  private var isEmpty: Bool {
    groups.allSatisfy { learner.entries(of: $0.kind).isEmpty } && model.ratingCounts.isEmpty
  }

  var body: some View {
    List {
      Section {
        Text(Words.rememberedIntro)
          .font(Theme.Typography.body)
          .foregroundStyle(Theme.Palette.ink)
          .accessibilityIdentifier("remembered-intro")
        if isEmpty {
          Text(Words.rememberedEmpty)
            .font(Theme.Typography.body)
            .foregroundStyle(Theme.Palette.quiet)
            .accessibilityIdentifier("remembered-empty")
        }
      }
      .listRowBackground(Theme.Palette.card)
      ForEach(groups, id: \.kind) { group in
        let lines = learner.entries(of: group.kind).sorted { $0.date > $1.date }
        if !lines.isEmpty {
          Section(group.title) {
            ForEach(lines) { line in row(line) }
          }
          .listRowBackground(Theme.Palette.card)
        }
      }
      if !model.ratingCounts.isEmpty {
        Section(Words.rememberedGroupRatings) {
          ForEach(model.ratingCounts) { count in
            Text(Words.ratingLine(count))
              .font(Theme.Typography.body)
              .foregroundStyle(Theme.Palette.ink)
          }
          Button(Words.rememberedClearRatings) {
            chosen = .ratings
            asking = .ratings
          }
          .frame(minHeight: Theme.Space.touch)
          .accessibilityIdentifier("remembered-clear-ratings")
          Text(Words.rememberedClearNote)
            .font(Theme.Typography.small)
            .foregroundStyle(Theme.Palette.quiet)
        }
        .listRowBackground(Theme.Palette.card)
      }
    }
    // One dialog on the whole list: a dialog on a row or a section does not always appear.
    .confirmationDialog(
      asking == .ratings ? Words.rememberedClearConfirm : Words.rememberedConfirm,
      isPresented: Binding(get: { asking != nil }, set: { if !$0 { asking = nil } }),
      titleVisibility: .visible
    ) {
      Button(Words.rememberedDelete, role: .destructive) {
        switch chosen {
        case .line(let id): model.deleteLearnerLine(id)
        case .ratings: model.clearRatings()
        case nil: break
        }
        chosen = nil
      }
      .accessibilityIdentifier("remembered-delete-confirm")
      Button(Words.savedThoughtKeep, role: .cancel) { asking = nil }
    } message: {
      if case .line(let id)? = asking, model.isNoteLine(id) {
        Text(Words.rememberedConfirmNote)
      }
    }
    // Pinned, so a failed delete is seen even when the list is long.
    .safeAreaInset(edge: .top) {
      if let note = model.learnerNote {
        Text(verbatim: note)
          .font(Theme.Typography.body)
          .foregroundStyle(Theme.Palette.ink)
          .frame(maxWidth: .infinity, alignment: .leading)
          .padding(Theme.Space.medium)
          .background(Theme.Palette.card)
          .accessibilityIdentifier("remembered-note")
      }
    }
    .onChange(of: model.learnerNote) { _, note in
      if let note { AccessibilityNotification.Announcement(note).post() }
    }
    .onAppear { model.clearLearnerNote() }
    .scrollContentBackground(.hidden)
    .pageBackground()
    .navigationTitle(Words.meRowRemembered)
    .navigationBarTitleDisplayMode(.inline)
    .accessibilityIdentifier("remembered-screen")
  }

  @ViewBuilder
  private func row(_ line: LearnerRecord.Entry) -> some View {
    VStack(alignment: .leading, spacing: Theme.Space.tiny) {
      if line.kind == .course {
        classLine(line)
      } else {
        Text(verbatim: line.text)
          .font(Theme.Typography.body)
          .foregroundStyle(Theme.Palette.ink)
          .frame(maxWidth: .infinity, alignment: .leading)
          .accessibilityIdentifier("remembered-line")
      }
      if line.kind == .progress {
        // Which assignment: its plain date, so the lines can be told apart.
        Text(line.date, style: .date)
          .font(Theme.Typography.small)
          .foregroundStyle(Theme.Palette.quiet)
      }
      Text(line.source == .app ? Words.rememberedAppNoted : Words.rememberedYouWrote)
        .font(Theme.Typography.small)
        .foregroundStyle(Theme.Palette.quiet)
      Button(Words.rememberedDelete) {
        chosen = .line(line.id)
        asking = .line(line.id)
      }
      .buttonStyle(.borderless)
      .frame(minHeight: Theme.Space.touch)
      .accessibilityLabel(
        "\(Words.rememberedDelete): \(line.courseLabel.map { $0 + ", " } ?? "")\(String(line.text.prefix(60)))"
      )
      .accessibilityIdentifier("remembered-delete-\(line.id)")
    }
    .accessibilityElement(children: .contain)
    .accessibilityAction(named: Words.rememberedDelete) {
      chosen = .line(line.id)
      asking = .line(line.id)
    }
  }

  /// A class line: the class as a heading, then the steps that were kept, one to a line. The
  /// stuck and drifted counts the line carries are not shown.
  @ViewBuilder
  private func classLine(_ line: LearnerRecord.Entry) -> some View {
    let steps = Self.steps(of: line.text)
    Text(verbatim: line.courseLabel ?? Words.rememberedGroupClasses)
      .font(Theme.Typography.button)
      .foregroundStyle(Theme.Palette.ink)
      .accessibilityIdentifier("remembered-class")
    ForEach(steps, id: \.self) { step in
      Text(verbatim: "• \(step)")
        .font(Theme.Typography.small)
        .foregroundStyle(Theme.Palette.ink)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
  }

  /// "<kind of work>: step / step / step" into its steps. A line in any other shape is one step.
  static func steps(of text: String) -> [String] {
    let body = text.split(separator: ":", maxSplits: 1).dropFirst().first.map(String.init) ?? text
    return body.split(separator: "/").map {
      String($0).trimmingCharacters(in: .whitespacesAndNewlines)
    }.filter { !$0.isEmpty }
  }
}
