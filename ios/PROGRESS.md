# PROGRESS.md

The memory between sessions. Rewrite it each session; do not let it grow into a diary. Task-by-task status is in `TASKS.md`.

## Working

- Nothing is built. There is no Swift code and no Xcode project yet.
- The design is written (`design/01` to `04`), with rules for agents (`AGENTS.md`), decisions (`DECISIONS.md`), a task list (`TASKS.md`), the research (`research/`), and starting content with test cases (`Shared/`).

## In progress

Nothing.

## Broken or worrying

- **No iOS simulator is installed on this Mac** (checked 2026-11-20: Xcode 27.2 is present, `xcrun simctl list` shows no devices and no runtimes). Until the parent installs one, only the logic package can be checked automatically, on the Mac.
- The design has not been reviewed by an Advisor or seen by Ben. T00 covers both.
- Nothing about the phone's AI or speech has been tried on a real iPhone. Every such claim in the design is marked verified (declaration read in the kit) or unverified.
- Much of the research was read at abstract level; see the limits stated at the top of `research/01-evidence.md`.

## Waiting on

See `DECISIONS.md`, "Waiting on". Nothing past T03 should be built before the parent answers D1.

## Next

1. T00: put the questions to the parent and Ben, record the answers, and get an Advisor review of the design.
2. T01 to T03 (skeleton, content and logic, storage). These need no simulator.
