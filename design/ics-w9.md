# W9: Put it on my calendar (a downloaded .ics file)

Status: built; logic tests pass; the browser tests (`tests/browser/ics.spec.js`) were **not run** (Chrome aborts on launch in the author's sandbox). Plan pre-approved by the parent ("go do it all"). Student-visible wording below awaits the parent's okay (W-D5).

## What the student sees and does

1. In My calendar, every open or in-progress item and every trip has a small button **Add to my phone's calendar**. A one-line hint at the top of the list says: "Add to my phone's calendar saves a small file. Open it on your phone and your calendar app adds the item."
2. The student presses it. A file such as `read-chapter-5.ics` downloads.
3. The message says: "Saved read-chapter-5.ics. Open it from your Downloads and your phone's calendar app will offer to add it."
4. If the item has no usable date: "This one has no valid date, so it cannot go to a calendar yet." Nothing downloads. If the browser fails: "That didn't work. Nothing was changed. Try again."

Completed items have no button (nothing to remind about).

## Research support

Design judgment, to be tested. Reminders in the student's own calendar are the iPhone app's CAL1 idea (`ios/design/slices/CAL1-calendar-and-reminders.md`, read only). No ADHD claim is made.

## File contents

- A task: one event starting at the due time (the phone's local time, no time zone shift), 30 minutes long, because items store only a due time.
- A trip or an item with an "Ends on" date: an all-day range. The end date is the day after the last day (RFC 5545 exclusive end).
- Title, notes and https links only. No reminder alarm: items store no reminder time, so none is invented.
- RFC 5545: CRLF line endings, lines folded at 75 bytes without splitting a character, backslash, semicolon, comma and line breaks escaped, `VERSION:2.0`, `PRODID`, `CALSCALE:GREGORIAN`, `DTSTAMP`, and a stable `UID` (`<item id>@focusapp.local`) so opening the file twice updates the same event instead of doubling it.

## Data

Stores nothing new. The file is made on the device from the item and handed to the browser as a download. Nothing is sent anywhere (rule 4, T8). Student text goes into the file only, and on screen only as text.

## Distracted, stuck, away for a week

One tap, no steps, no pressure. A quick double tap downloads twice; the same UID makes that harmless. Nothing resets or shames.

## Design review (AGENTS.md Stage 1)

- Breaks a rule 1 to 11? No. No AI, no data leaves the device, no shame wording.
- Conflicts with DECISIONS.md? No (T1, T4, T5, T8 hold).
- A listed trap? No.
- Student does the thinking? Yes, the tool only copies their own item.
- Seconds, one thing at a time? Yes, one button per item.
- Small enough? Yes.

## Tests

- `tests/logic/ics.test.js`: file shape, CRLF, midnight rollover, exclusive end, escaping, folding with multi-byte characters, invalid dates, odd ids.
- `tests/browser/ics.spec.js` (not run): timed item, trip range, escaping after refresh, long title folding with no network requests, completed item has no button.

## Wording awaiting the parent's okay

The button name, the hint line, the saved message, the no-valid-date message and the failure message above.

## Not covered

Phone and desktop browser behaviour of the download (some phone browsers ask where to save), and whether each phone's calendar app opens the file. Please test on a real phone.
