# PROGRESS.md

The memory between sessions. Rewrite it each session; do not let it grow into a diary. Task-by-task status is in `TASKS.md`.

## Working

- T01 to T03: `FocusKit` (content, logic matching all eight shared case files, versioned storage). 
- T04 app shell: hand-written `App/FocusApp.xcodeproj` (no signing team, placeholder bundle id `example.focusapp`), four tabs, `Theme`, first-run screen. Builds for a generic iOS device.
- T05 assignment and editor: paste or type, kind, 3/5/8 steps, "I'll say my steps" (typing), "Suggest some to start", editor (edit, reorder, delete, add, split, join, done-when line, Get ready, Put it away), the "two steps?" nudge, Start only from the editor. Draft survives closing the app.
- T06 Today and the work screen: welcome line, next step, five equal buttons, double tap counted once, park a thought, recall question, optional silent timer, state saved after every tap.
- T07 stuck ladder without AI: hints in order, Ask a person with a copyable three-part question.
- T08 Look it up: Wikipedia search, plain-text results, in-app Safari page with a way back, offline and other calm lines. On (`LookUpModel.isOn`).
- 97 FocusKit tests pass. `checks/check.sh` compile-checks the app and its UI tests for a generic iOS device.

## In progress

Nothing.

## Broken or worrying

- **Nothing in the app has been run.** This computer has Xcode 27.2 but no usable iOS simulator (`xcrun simctl` fails). The app and the UI tests (`App/FocusAppUITests`, 8 tests) compile, but the UI tests were **written, not run**, and no screen has been seen. `checks/check.sh` exits 3 (`SKIPPED: no iOS simulator`). First thing on a computer with a simulator: run `checks/check.sh` and fix what the UI tests find; then work through `checks/device-checks.md` steps 1 to 18.
- **No Advisor or Checker agent ran** for T04 to T08 (same model as Builder, self-review only). Advisor gate 2 is owed for T02 to T08 (storage, wording, the one network file). Words a student reads: all in `Models/Words.swift` and `Shared/content.json`.
- **Look it up needs a real contact** in `WikipediaLookUp.userAgent` (currently `set-by-owner@example.invalid`) before anyone else uses the app. No search was run from the app; none could be run from this Mac's shell (no network). The two addresses were checked with a fetch tool on 2026-11-20.
- Shared starter step "Check what you missed" (test practice) uses a word on the "never shame" list. Left as is; see `design/slices/T06`.
- Ben's phone is on iOS 26.2; Apple Intelligence on or off is not yet known (T11).
- The bundle identifier and signing team are the parent's to set in Xcode. The app's data folder is excluded from the phone's backup (the recommendation; the parent has not confirmed).
- Inside a sandboxed agent shell, Swift cannot start its macro plug-ins and SwiftPM cannot write its caches. `check.sh` detects this and adds the needed flags. Normal Macs need none.
- Much of the research was read at abstract level; see the limits at the top of `research/01-evidence.md`.

## Waiting on

See `DECISIONS.md`, "Waiting on". D1 is answered (2026-11-20). Other questions stay open; see `DECISIONS.md`.

## Next

1. On a computer with a simulator: run `checks/check.sh`; fix UI test failures; look at every screen at the largest text size, in dark mode, on the smallest iPhone.
2. Advisor gate 2 on T02 to T08, then the parent sets the User-Agent contact and confirms D8 row 1 (T08), D6 and D7 (T09 to T12).
3. T09 voice in, T10 voice out, T11 the phone's AI, T12 Talk, T15 Me, T17a first build on Ben's phone (the parent does the Apple account steps).
