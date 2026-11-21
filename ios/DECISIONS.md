# DECISIONS.md

Choices already made for the iPhone app, with reasons, so agents do not re-ask. A choice marked **(waiting)** is a proposal until the named person agrees; do not build past it. New and changed decisions go in the change log at the bottom.

## Standing decisions

| # | Decision | Why | Status |
|---|---|---|---|
| D1 | A native iPhone app in Swift and SwiftUI. No web view | Voice, the phone's own AI, and a publishable app all need it (`design/01-what-it-is.md` section 1.2) | **(waiting: parent)** |
| D2 | No third-party code, in the app or in tooling. Only what ships with Xcode | Nothing can break that nobody here can repair; nothing unknown handles a student's words | Decided |
| D3 | Everything the student enters is stored on the phone only. No account, no sign-in, no sync | Rule 4; no data about minors held anywhere | Decided |
| D4 | The app never asks for a name, age, school, or diagnosis | Rules 3 and 4 | Decided |
| D5 | The app is fully usable with no AI | Not every phone has the AI, and the no-AI path must always exist | Decided |
| D6 | Version 1 uses only the AI that runs on the phone. Apple's cloud model is never used. No AI keys in version 1 | Keeps every word on the device; needs no adult, account or money | **(waiting: parent)** |
| D7 | Voice: speech is turned into text on the phone; the microphone is on only while the student holds or taps the button; recordings are never kept; the app is silent unless the student turns its voice on | Rules 4 and 5; "no sound by default" | **(waiting: parent and Ben)** |
| D8 | What may leave the phone: see the table below. Nothing else, ever | Rule 4 stated openly | **(draft: parent to confirm before classmates)** |
| D9 | Ben never runs a command or edits a file. The parent does every Apple account step (sign-in, signing, TestFlight, App Store). Agents never handle account details | Ben does not code; the account is the parent's | Decided |
| D10 | One check command, `checks/check.sh`. A skipped part is reported as skipped | A wrong "it works" cannot be caught by anyone | Decided |
| D11 | Work is done by a Builder, with an Advisor (strongest model, read-only) at fixed gates and a Checker (fresh context) before "done" (`AGENTS.md` sections 2 to 4) | Nobody reviews the code; the roles are the review | Decided |
| D12 | Engineering choices I1 to I13 in `design/04-engineering-and-plan.md` section 4.1 | Chosen so the next agent does not have to | Decided, except I3 (minimum iOS), which waits on the testers' phones |

### D8. What may leave the phone

| When | What | To |
|---|---|---|
| The student taps Look it up | The look-up words | Wikipedia |
| The AI looks something up (only if the answer-giving checks pass) | The search words the AI chose | Wikipedia |
| The student opens a source | A normal web page visit | That website |

No analytics, crash reporting, advertising, or sync. Audio never leaves and is never stored.

## Product defaults

Chosen from the research so that work can start. Ben can change any of them.

| # | Default | Source in `research/` |
|---|---|---|
| P1 | The student makes or edits the steps before starting: change words, delete, reorder, add, split, join | `04`, idea D2 |
| P2 | The student picks how many steps to aim for: about 3, 5, or 8 | `05`, section 3 |
| P3 | The work screen shows one step at a time, with "step 3 of 7" | `04`, idea D3 |
| P4 | Each step offers Done, Still working, Stuck, Drifted, Later | `04`, idea D4 |
| P5 | Drifted splits the current step in two and earns the same as Done | `05`, section 4 |
| P6 | Stuck gives a hint or a pointer to a resource, never the answer | `00`, section 2 |
| P7 | A weekly goal, not a streak that resets (not in version 1) | `04`, idea G4 |
| P8 | After a day or more away, the app opens to one "pick up here" button and nothing about the gap | `05`, section 4 |
| P9 | After a study or reading step, one optional recall question | `00`, section 2 |
| P10 | No sound by default | `00`, section 5 |
| P11 | The check-in is always a silent tap, never a spoken exchange | The tested form of self-monitoring; usable in class |
| P12 | Suggested steps always open in the editor, never straight on the work screen | `04`, idea D2; rule 1 |

## Waiting on

The questions, options and recommendations are in `design/04-engineering-and-plan.md` section 4.7. Task T00 records the answers here.

**Parent:** go-ahead for a native app (D1); install the iOS simulator; sign in to Xcode and set the team; confirm D8; exclude the app's data from phone backup; the two extra safety signals; microphone use by students; who may receive a build.

**Ben:** voice at first launch; which way of making steps comes first; whether a suggested step must be changed before Start; the four places; what waits until after version 1; the app's name, the words for drifting and stuck, and how progress is shown; which iPhone he has.

Already answered:

- The parent has a paid Apple developer account and Ben may publish through it (2026-11-20).
- Ben would prefer to talk to the app (reported by the parent, 2026-11-20).

## Change log

| Date | Change | Reason | Decided by |
|---|---|---|---|
| 2026-11-20 | Folder created as a self-contained design for a native iPhone app. Words, rules and test cases seeded from the web app into `Shared/` | The parent asked for an iPhone design in a new folder that can be handed off whole | Parent asked; agent wrote |
