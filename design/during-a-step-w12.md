# W12: During a step (web)

Matches the iPhone app's work screen (`ios/App/FocusApp/WorkView.swift`, `BlockLength.swift`, `Words.swift`) with no AI. Ideas only from iOS; the web owns its words (W-D4).

## What the student sees and does

1. **Done when:** on the work screen, under the step, a small button **Say when this is finished** opens one box ("How will I know it's done?"). **Save that line** keeps it (Enter also saves); an empty box saves nothing. A saved line shows under the step as "Done when: ..." and the button becomes **Change that line**, with **Clear that line** inside the box. Optional; the step works the same without it. It is typed on the work screen at the start of (or during) a step. It is not added to the Change my steps editor, which keeps steps as plain text.
2. **Did that time feel about right?** When the countdown ends and the student is on the step view, one quiet card appears with **Shorter**, **About right**, **Longer**, **Skip** (Shorter is not offered at 12 minutes and Longer not at 25, as in iOS, because they could change nothing). One tap saves one answer and shows "Noted." Skip saves nothing. Nothing waits on the card. It is only raised within two minutes of the countdown ending.
3. **Suggestion.** When at least three of the newest five answers for one length (last 30 days) point the same way and none the other way, a line under the 12 / 25 buttons says "Your answers so far point to N minutes." and the next step's countdown starts at N. The student can still pick either length.
4. **Drifted** now starts the box with the first part of the step, cut the same way as Change my steps (semicolon, then, and, comma, or the middle), instead of the whole step. A short step starts as it is. The student can type anything.

Not built: the iPhone's AI follow-up question after Shorter or Longer, and the "(your pick)" starting length from How I like to work (the web has no such setting).

## Research basis

Design judgment, to be tested. The iPhone slice (R5) reasons the same way: the student's own answers choose the length, nothing is scored. Done when: line is the iPhone's `doneWhen` (see ios design notes). No claim that either improves attention (rule 8).

## Data stored

- `blocks` section of `focusapp.v1`: up to 50 entries `{ minutes, answer, on }`. No step text, no assignment text. Deleted by "Delete all" in What the app remembers and by Delete everything. Not in Save a copy of my data (a setting, small; can be added later). It has no line-by-line list yet.
- `doneWhen` on a step in the saved steps (max 100 characters, one line). Missing or damaged values are dropped on load.
- Nothing leaves the device.

## Distracted, stuck, away

- Ignore the card: it stays until the student answers, taps Skip or moves on; after two minutes it is gone when the screen next redraws. No penalty, no count.
- Refresh mid-step: the saved Done when: line is back; the card and countdown are not (the countdown never survived a refresh).
- Back after a week: answers older than 30 days stop counting. No day counts shown.
- Damaged stored answers are dropped one by one; nothing crashes.

## Student-visible wording (for the parent's okay)

- Say when this is finished / Change that line / Save that line / Clear that line
- How will I know it's done? (box label and prompt)
- Done when: (line label)
- Did that time feel about right?
- Shorter / About right / Longer / Skip
- Noted.
- Your answers so far point to N minutes.
- That could not be saved here. You can tap Skip.

## Review checklist (Stage 1)

- Breaks a rule? No: no shame, no diagnosis, local data, no comparison, no AI. About right counts the same as the others.
- Conflicts with DECISIONS.md? No.
- A listed trap? No.
- Student does the thinking? Yes: they write the line and judge the time. The suggestion is a fixed rule over their own answers.
- Seconds, one thing at a time? Yes; the card is optional and quiet.
- Small enough? Yes.

## Button names

Checked against existing names: none is a substring of another (no "Done" or "Skip" collision on the same screen: Skip in the recall question is a different mode). The 5-minute length from iOS is left out because "5 minutes" is a substring of "25 minutes".
