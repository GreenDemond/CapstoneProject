# SMALL1 Compact step tips, so the first step is visible on a shorter phone
Status: built 2026-11-26. Gate 1 fixes applied; gate 2 GO; focused tests pass on the iPhone 11 and iPhone SE simulators; the full check is run before the commit. The parent asked to fix the small-screen problem found on the iPhone 11 simulator ("ok lets fix it").

## The problem (measured)
On the iPhone 11 simulator (414 x 896 pt, iOS 26.5) at default text size, the editor shows the intro line, the full step-tips card (about 235 pt tall), the "Check my steps against the assignment" card, and then the first step row. The step row is cut off by the fixed Start bar, so the split question's **Ask me a question** link is hidden until the student scrolls. A UI test (`NudgeUITests`) tapped where the link should be and hit Start instead. It passes on the iPhone 15 Pro Max (932 pt tall) and fails on the iPhone 11. The iPhone SE (3rd generation, 375 x 667 pt) is shorter still and is not yet tested.

## Measured before the fix (2026-11-26, XCUI frames, default text size)
| Phone | Bottom bar top | "Ask me a question" bottom | Hidden by |
|---|---|---|---|
| iPhone 11 (414 x 896) | 721 pt | 737 pt | about 16 pt |
| iPhone SE 3rd gen (375 x 667) | 492 pt | 755 pt | about 263 pt |
The bottom bar (Start, Back to Today, padding) is 175 pt tall on both. XCUITest still calls the hidden link "hittable", so an `isHittable` check does not catch this; the test compares the link with the top of the whole bar instead. The link is also only 16 pt tall (below the 44 pt touch minimum); that is noted as a follow-up, not changed here.

## What the student sees and does
1. The step tips card becomes a **collapsed row** in the same place: the title "What makes a step easy to start" with a chevron. Tapping it expands the same text as before, unchanged: the two lines, the example, and **Got it**.
2. The row title is set in the body size, not the larger title size the open card used. Collapsed is the starting state **every time** the editor opens. Whether it is expanded is view state only and is not saved.
3. **Got it** still hides the tips for good, and the Me switch **Show step tips** still brings them back. Nothing else about the words changes.
4. **Check my steps against the assignment** moves from above the steps to below them (after the add-step and Get ready / Put it away rows). It checks the finished steps, so it belongs after them. Its words and behaviour do not change.
5. The collapsed row is a plain button (identifier `step-tips-toggle`, value "expanded" or "collapsed", chevron hidden from VoiceOver, 44 pt tall), not a `DisclosureGroup`, so its identifier and value are under our control. The editor's bottom bar gets the identifier `editor-bottom-bar` (a label only).
6. Always collapsed is a known discoverability cost: the tips are one tap away, and dismissing them for good now takes two taps (expand, then Got it). The parent is asked to confirm this. It will be checked with classmates. An expanded-first-time state would need a stored flag and is not done.
7. No other screen changes in this task.

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
- Failing first: the geometry test was run before any change and failed on both the iPhone 11 and the SE (numbers above).
- UI (new): at default text size, after "I'll say my steps" with one step that looks like two, `nudge-ask-0`'s bottom edge is above `editor-bottom-bar`'s top edge without scrolling. It scrolls nowhere on purpose. It records the frames and a screenshot. Run on the iPhone 11, the iPhone SE and the iPhone 15 Pro Max.
- UI (changed, not weakened): `StepTipsUITests` expand the row before tapping Got it, check that collapsed is the starting state, and check that the tips come back collapsed after Got it and the Me switch. One `StepReviewUITests` test (`testCheckingShowsAPart...`) no longer taps Got it; it scrolls to the Check button, which now sits below the steps. Got it also collapses the row, so turning the tips back on in Me shows them collapsed.
- Accessibility: the row is a plain button with the value "expanded" or "collapsed" and a chevron hidden from VoiceOver; check at the largest text size on the iPhone 11 simulator that the expanded card scrolls and Got it is reachable.
- Device only: how it reads on Ben's iPhone and iPad.

## Unverified
- Whether the change clears the iPhone SE as well as the iPhone 11. Estimated from the numbers; the focused run decides. If the SE still fails, narrow the claim to iPhone 11 and larger and log the bottom bar (175 pt on a 667 pt screen) as its own task.

## Gates
- Gate 2, 2026-11-26, same reviewer: **GO**. Suggestions not applied: move "expanded"/"collapsed" into `Words.swift`; add a top-edge check to the geometry test; device-check a result message under Check at the largest text size; the 16 pt "Ask me a question" link remains a follow-up.
- Gate 1, 2026-11-26, independent read-only reviewer (same model family as the Builder): FIX FIRST (6). Applied: SE measured before coding; geometry test without scrolling that fails before the fix; existing tests named and updated, not weakened; a plain button instead of an unverified `DisclosureGroup`; R6 amended; the discoverability trade-off stated for the parent. Extra change made because the measurement showed collapsing alone cannot clear the SE (263 pt short): the Check card moves below the steps.
