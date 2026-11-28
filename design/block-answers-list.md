# Block-length answers, line by line, in What the app remembers

Status: built. Reference (read only): iPhone `ios/FEATURES.md` notes on block-length answers; `design/during-a-step-w12.md`. Nothing imported.

## What the student sees and does
In Me, then What the app remembers, a group "How long a block felt" lists each saved answer to "Did that time feel about right?" as one line with a short date, for example "25 minutes felt too long (3 Nov)". Each line has its own **Delete**. Deleting a line changes the suggested length at once, because the suggestion is worked out from the answers each time. **Delete all of this** removes them too (already true).

## Research link
Design judgment, to be tested. The point is that the student can see and remove what the app learned from them (AGENTS.md rule 5, the student owns their data).

## What it stores
Nothing new. It reads the existing `blocks` section (up to 50 answers). Deleting writes a shorter list through `js/storage.js`; the last delete removes the section.

## What leaves the device
Nothing.

## Distracted, stuck, away
Nothing is required. A failed delete says "That didn't delete. Try again." and keeps the line. Damaged saved answers are skipped one by one.

## Design review
- [x] No rule broken; no shame, no counts or comparison; plain words ("felt too long", not "failed").
- [x] No conflict with DECISIONS.
- [x] Small: one logic helper, one group in an existing screen.

## Wording for the parent's okay
"How long a block felt", "<n> minutes felt too long / about right / too short".

## Tests
`tests/logic/block-length.test.js` (line wording, remove by place, suggestion changes after delete); `tests/browser/block-answers-list.spec.js` (delete one by one, damaged data; phone and desktop).
