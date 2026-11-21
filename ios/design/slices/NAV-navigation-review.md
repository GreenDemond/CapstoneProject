# NAV Navigation review: no dead ends
Status: built 2026-11-21

Asked for by the parent: "I don't see obvious ways to get back from steps to planning/home, ditto if I want to cancel or retry. Think through all of the workflows."

## What the student sees and does

Every screen has a visible way back one level and a way to Today. Leaving never loses saved work and is never counted against the student.

| Screen | How you get there | Ways out after this change | Dead end found before |
|---|---|---|---|
| Work screen (one step) | Today, Next step card | **Back to Today** (step saved, same step on return); the five buttons | Only an unlabelled "x" icon; tab bar hidden |
| Stuck sheet | Work screen, Stuck | **Back** to the step; Back to Today | No visible way back |
| New assignment | Today, New assignment | **Back to Today**; **Back to my steps** when steps exist | Exit was labelled "All my steps" |
| Say my steps (typing) | New assignment | Back; **Back to Today** when steps exist | No way to Today |
| Editor | Suggest some / Say my steps / Use these as my steps | **Back** (steps kept); **Back to Today** when steps are saved; Start | No Back or Cancel |
| Replacing steps | Suggest or Say again with steps already made | Asks: **Keep my steps** / **Make new ones** | Old steps were silently wiped |
| Talk it through, then Use these as my steps | Stuck, Talk it through | Leaves the step and opens the editor on top | Editor opened hidden behind the work screen |
| Talk tab | Tab bar | Tabs; **Try again** when the AI is unavailable; hints and Look it up still offered | "Back to my step" did nothing on the tab |
| Look it up | Stuck or Talk | Back; **Try again** when offline, slow, or a problem | No retry |
| Microphone | Any voice box | **Try again** when denied or unavailable; typing always works | No retry |
| Plan tab, empty | Tab bar | **Make some steps** | Text only |
| Me, How I like to work | Me | Menus say **Choose one** | Blank, nearly invisible menus |

## Research link
Design judgment, to be tested. Supports rule 2 (never shame: leaving and coming back is the behaviour to reward) and P8 (pick up where you left off).

## What it stores
Nothing new. Uses the existing autosave of steps and the current step.

## What leaves the phone
Nothing.

## Distracted, stuck, back after a week
Distracted: Back to Today is always one tap and keeps the step. Stuck: the sheet has Back. After a week: Today shows the same step to pick up.

## Differs from the web app
No.

## Tests
- Logic: 14 navigation tests in `FocusKit/Tests/FocusKitTests/NavigationTests.swift` (leaving keeps the step, replace asks first, Use these as my steps opens the editor, retry states).
- UI: 9 tests in `App/FocusAppUITests/NavigationUITests.swift`, covering each row above.
- The 15 UI tests that failed before were fixed:
  - App bug: container accessibility identifiers hid the buttons inside them (for example "start-steps" and the trusted-adult line). Fixed in the views.
  - Test environment: the simulator has Apple's real AI, so "no AI" tests now pass `-focus-no-ai`. `-focus-fake-ai-distress` now turns on the scripted AI by itself. Both are test-only launch arguments.
  - Wrong tests: rows that need scrolling, the Stuck "I'm on" box being pre-filled, and a tap on a label instead of a switch.
  - No test was weakened.
- Result 2026-11-21, iPhone 15 Pro Max simulator, iOS 26.5: UI tests 27 passed, 0 failed. `swift test`: 278 passed.
- Device-only: steps 54 to 61 in `checks/device-checks.md`.

## Unverified
How the new controls feel on a real phone at the largest text size. Checked only by the UI tests; to be checked by Ben with the device steps.

## Gates
- Gate 2 (words a student reads), 2026-11-21: GO. Same model as Builder. Strings checked: "Back to Today", "Back to my steps", "Back", "Try again", "You already have steps here.", "Keep my steps", "Make new ones", "No steps yet.", "Make some steps", "Choose one". No shame words.
- Gate 3 (checks run), 2026-11-21: UI 27/27 and unit 278/278 run by the Builder. Same model as Builder.
