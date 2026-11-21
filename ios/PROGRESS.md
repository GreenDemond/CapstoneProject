# PROGRESS.md

The memory between sessions. Rewrite it each session; do not let it grow into a diary. Task-by-task status is in `TASKS.md`.

## Working

- Nothing is built. There is no Swift code and no Xcode project yet.
- The design is written (`design/01` to `04`), with rules for agents (`AGENTS.md`), decisions (`DECISIONS.md`), a task list (`TASKS.md`), the research (`research/`), and starting content with test cases (`Shared/`).

## In progress

Nothing.

## Broken or worrying

- **The computer this was written on has no iOS simulator** (2026-11-20). The parent says the work moves to a computer that has one. The first session there must confirm it and its Xcode version, and rewrite this line. The design's API facts were read from the iOS 27.2 kit; an older Xcode may differ.
- **Ben's phone is on iOS 26.2**, older than the kit the design was read from. Token counting (iOS 26.4) is not available on it; the design allows for that. Whether Apple Intelligence is switched on is not yet known.
- The design has not been reviewed by an Advisor or seen by Ben. T00 covers both.
- Nothing about the phone's AI or speech has been tried on a real iPhone. Every such claim in the design is marked verified (declaration read in the kit) or unverified.
- Much of the research was read at abstract level; see the limits stated at the top of `research/01-evidence.md`.

## Waiting on

See `DECISIONS.md`, "Waiting on". Nothing past T03 should be built before the parent answers D1.

## Next

0. If this folder was moved out of the web project: run `git init` here and make a first commit before anything else.
1. T00: put the questions to the parent and Ben, record the answers, and get an Advisor review of the design.
2. T01 to T03 (skeleton, content and logic, storage). These need no simulator.
