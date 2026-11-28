# SMALL1 Compact step tips, so the first step is visible on a shorter phone
Status: draft 2026-11-26. The parent asked to fix the small-screen problem found on the iPhone 11 simulator ("ok lets fix it").

## The problem (measured)
On the iPhone 11 simulator (414 x 896 pt, iOS 26.5) at default text size, the editor shows the intro line, the full step-tips card (about 235 pt tall), the "Check my steps against the assignment" card, and then the first step row. The step row is cut off by the fixed Start bar, so the split question's **Ask me a question** link is hidden until the student scrolls. A UI test (`NudgeUITests`) tapped where the link should be and hit Start instead. It passes on the iPhone 15 Pro Max (932 pt tall) and fails on the iPhone 11. The iPhone SE (3rd generation, 375 x 667 pt) is shorter still and is not yet tested.

## What the student sees and does
1. The step tips card becomes a **collapsed row** in the same place: the title "What makes a step easy to start" with a chevron. Tapping it expands the same text as before, unchanged: the two lines, the example, and **Got it**.
2. Collapsed is the starting state **every time** the editor opens. Whether it is expanded is view state only and is not saved.
3. **Got it** still hides the tips for good, and the Me switch **Show step tips** still brings them back. Nothing else about the words changes.
4. No other screen changes in this task.

## Research link
Design judgment, to be tested. It follows the existing principle of one thing at a time (`research/04` section 2) and the earlier gate-1 note that the card would crowd the editor at large text sizes.

## What it stores
Nothing new. `stepTipsHidden` is unchanged. The expanded state is not stored.

## What leaves the phone
Nothing.

## Distracted, stuck, back after a week
- Distracted: the tips are one quiet row, not a block above the work.
- Stuck: the tips are one tap away; Give me an idea is still there.
- Back after a week: unchanged; the row shows until Got it or the Me switch hides it.

## Differs from the web app
No.

## Tests
- Logic: no new logic. The existing `StepTipsTests` still pass.
- UI (new): at default text size on the iPhone 11 and iPhone 15 Pro Max simulators, after "I'll say my steps" with one step that looks like two, the **Ask me a question** link (`nudge-ask-0`) is hittable without scrolling and the Start button is not covering it.
- UI (changed, not weakened): `StepTipsUITests` expand the row before tapping Got it, and check that collapsed is the starting state and that the row collapses again on the next editor. The two `StepReviewUITests` that tapped Got it only to make room no longer need to, since the card is compact.
- Accessibility: the row is a native disclosure control, so VoiceOver announces expanded or collapsed; check at the largest text size on the iPhone 11 simulator that the expanded card scrolls and Got it is reachable.
- Device only: how it reads on Ben's iPhone and iPad.

## Unverified
- How the editor reads on the iPhone SE (3rd generation) simulator. It will be run after this change and any further problem logged as its own task.

## Gates
(none yet)
