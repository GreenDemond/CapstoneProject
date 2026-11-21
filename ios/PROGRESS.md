# PROGRESS.md

The memory between sessions. Rewrite it each session; do not let it grow into a diary. Task-by-task status is in `TASKS.md`.

## Working

- T01 skeleton: `FocusKit` package with the content loader and 7 passing tests; `checks/check.sh`; `.swift-format`; `.gitignore`. No Xcode project yet.
- T02 logic: work steps and the five choices, hints, starter steps, paste cleaning, welcome line, guide cleaning and AI instructions, safe sources, history trimming. All eight `Shared/cases` files pass; 27 tests.
- T03 storage: `Store`, `FileStore`, `MemoryStore`, six versioned saved types, damaged and newer-version data set aside once. 48 tests in all.
- The design is written (`design/01` to `04`), with rules for agents (`AGENTS.md`), decisions (`DECISIONS.md`), a task list (`TASKS.md`), the research (`research/`), and starting content with test cases (`Shared/`).

## In progress

Nothing.

## Broken or worrying

- **This computer has Xcode 27.2 (27B52) and Swift 6.4.2 but no usable iOS simulator** (`xcrun simctl` fails, 2026-11-20). `checks/check.sh` therefore exits 3 (`SKIPPED: no iOS simulator`) after the FocusKit checks pass. In this environment SwiftPM needs `--disable-sandbox` (check.sh passes it). The parent says the work may move to a computer that has a simulator; confirm there.
- **Ben's phone is on iOS 26.2**, older than the kit the design was read from. Token counting (iOS 26.4) is not available on it; the design allows for that. Whether Apple Intelligence is switched on is not yet known.
- T02 and T03 were self-reviewed only; no Advisor or separate Checker ran.
- The design has not been reviewed by an Advisor or seen by Ben. T00 covers both.
- Nothing about the phone's AI or speech has been tried on a real iPhone. Every such claim in the design is marked verified (declaration read in the kit) or unverified.
- Much of the research was read at abstract level; see the limits stated at the top of `research/01-evidence.md`.

## Waiting on

See `DECISIONS.md`, "Waiting on". D1 is answered (2026-11-20). Other questions stay open; see `DECISIONS.md`.

## Next

0. If this folder was moved out of the web project: run `git init` here and make a first commit before anything else.
1. T00: put the questions to the parent and Ben, record the answers, and get an Advisor review of the design.
2. Advisor gate 2 review of T02 and T03 (none was available; `Storage/` always needs one).
