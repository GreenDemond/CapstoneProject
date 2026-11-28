# W11: Class name, and the return visit (look-back card, set-aside thoughts, all-done line)

Status: built; browser tests written but **not run** (Chrome aborts in the author's sandbox). Logic tests pass.

Reference (read only): `ios/design/slices/M0b-class-and-courses.md`, `ios/design/slices/C5-weekly-reflection.md`, iPhone `AssignmentView`, `NextStepView`, `ReflectionView`, `Words.swift`.

## What the student sees and does

1. **Class name.** On the paste screen, under the assignment box: a text line "Class (optional)" with the hint "For example: History". Up to 40 characters. Empty is fine and nothing else changes. When the student presses Start (with written or suggested steps), the name is kept with that assignment. It shows as "Class: History" on the work screen and on the "pick up where you left off" card. The box is empty again for the next assignment.
2. **Weekly look-back card.** On home, once seven days have passed since the card was last dealt with, one quiet card says "A quick look back at your week" with two buttons, **Take a look** and **Not now**. **Take a look** opens the existing What I did screen (W6: the fixed "Your week" lines, no AI). Either button waits another seven days. On the very first visit there is no card; that visit only starts the week. It is a card on the page, not a pop-up.
3. **Thoughts you set aside.** If the student parked thoughts while working (W4), home shows the newest three as plain text under "Thoughts you set aside", with a pointer to where they can be read or deleted (What I did).
4. **All done.** When the student closes the work screen with every step done, home says "That's today done." and "A good time to close the app." The line also shows after a refresh if saved steps are all done. It goes when a new assignment is started.

## Research basis

Design judgment, to be tested. The weekly card follows the iPhone C5 shape (a once-a-week, easy-to-dismiss prompt; self-monitoring as in `00-knowledge-summary.md`) but the web version has no typed reflection and no AI. The class name follows M0b (the parent allowed a free-typed class label, DECISIONS 2026-11-23). No research claim is made.

## Data stored

- `work.classLabel`: the student's own words, trimmed, spaces tidied, cut to 40, left out when blank. Older saved steps load with none. It goes in a saved copy (Me and my data) and is removed by Delete everything, like the rest of the steps.
- `lookbackCard.on`: one date, the day the card was last dealt with. No counts, nothing about days away. Not part of a saved copy; removed by Delete everything. Damaged data, or a date in the future, counts as no date: no card, and the week starts again.
- Nothing else new. No course memory: the iPhone app's per-class course lines (M0b) are not built on the web, and plan/calendar items are not given a class (the web calendar is separate and unchanged).

## Distracted, stuck, away

- Away for a month: one card, the same words, no number of days or weeks. A first-ever visit has no card.
- Not now costs nothing and is as easy to press as Take a look.
- Blank, spaces-only, very long or tag-like class names: blank means none, long is cut at 40, tags show as plain text (textContent).
- Damaged saved data for the card, the thoughts or the class name never stops home from loading.
- Refresh mid-way loses nothing saved. The all-done line survives a refresh only while saved steps are all done.

## Student-visible wording (for the parent's okay, W-D5)

New:
- "Class (optional)" (label) and "For example: History" (hint). Same as the iPhone app.
- "Class: " followed by the student's own words (work screen and pick-up card).
- "A quick look back at your week" (card, same as iPhone)
- "Take a look" (button, same as iPhone) and "Not now" (button, same as iPhone)
- "Thoughts you set aside" (heading) and "You can read or delete these in What I did." (hint)
- "That's today done." and "A good time to close the app." (same as iPhone `todayDone`, `todayDoneSuggestion`)

Not changed: What I did and its "Your week" lines (W6).

## Design review (AGENTS.md Stage 1)

- [x] Breaks no rule: no shame, no counts or mention of days away, no diagnosis, nothing leaves the device, no AI, no comparison.
- [x] No conflict with DECISIONS (T5 no AI needed; T8 nothing leaves the device).
- [x] Not a listed trap: no streaks, no overdue wording, no points. Not now and Take a look both just wait a week.
- [x] The student does the thinking: the card only offers the existing look-back; the class name is their own word.
- [x] Seconds to use, one thing at a time: one card, two buttons. The class box is optional.
- [x] Small: reuses W6, W4 data and the work screen.

## Tests

`tests/logic/class-and-return.test.js` (label cleaning, damaged work data, saved copy, card timing at six and seven days, future and damaged dates, card date storage, thought list, wording check); `tests/browser/class-and-return.spec.js` (main and awkward paths, phone and desktop), not run.
