# M4 What the app remembers about me
Status: approved for build 2026-11-24 after gate 1 FIX FIRST (seven must-fix, applied below)

## What the student sees and does
1. Me has a new row, **What the app remembers about me**, next to the existing "How I like to work" (which stays as it is: the question list). One name everywhere.
2. The screen opens with: "This is what the app remembers about how you work. The AI sees only a few of these lines at a time, and only ones that fit what you're doing. Delete anything."
3. Below, every kind of line the app holds, newest first, in five groups: "Things I told it" (notes from Me), "Reflections", "Patterns", "Settings", "Classes". Every line says who wrote it: "You wrote this" (the student's own words, or a pattern the student confirmed) or "The app noted this" (an app summary). Nothing the app holds is left out of view.
4. A class line reads as a heading (the class name) and a short list of the steps kept, not a joined string. Raw counts such as stuck or drifted taps are not shown.
5. Each line has a Delete control, and a VoiceOver Delete action. Delete asks once with a native confirmation, as for notes. A note line deletes the note itself, because the lines mirror the notes and deleting only the line would bring it back.
6. If a delete cannot be saved, the line stays on screen with "That didn't delete. Try again."
7. A "Ratings" group shows plain names (not internal keys) and only the moves that have ratings: for example "Stuck question: Helped 2, Meh 1, Not this 0". One "Clear my ratings" button, with the same confirmation, which also puts the AI question first again. The screen says so in one line.
8. Nothing here is a chart, a score or a streak. Empty: "Nothing yet. As you use the app, short notes about how you work will show up here."

## Research link
`design/slices/MEMORY-plan.md` section 5: the open learner model, so there is never a hidden profile (rule 5). Design judgment for grouping and words.

## What it stores
One new thing: a short list of deleted line ids (ids only, no text, at most 200) in `learner.json`. It stops the app from writing back a line the student deleted: a class line is rewritten when the same assignment is finished again, and later writers (R5 settings, C8 patterns) will check the same list. An old file without the list loads with it empty.

## What leaves the phone
Nothing.

## Distracted, stuck, back after a week
The screen only shows and deletes. A deleted line stays deleted, including a class line for an assignment finished again, and after a relaunch.

## Differs from the web app
No.

## Changes to code that already exists (found at gate 1)
- `syncNoteLines` removed every obstacle line that was not a note. It now touches only lines it mirrored from notes, so a line written by another feature (ids that start with `why-` by rule) survives a note save or delete.
- `writeCourseLine` checks the deleted list and skips a deleted id.
- `MeModel.deleteNote` removed the note before saving and never restored it on a failed save. It now restores the note and says so.
- `saveLearner` failed silently. A delete from this screen now checks the save and restores the line on failure.

## Rules for later writers
Any feature that writes a line the student can delete (R5 settings, C8 patterns, C5 reflections) must check the deleted-id list before writing, and needs a test that a deleted line is not proposed again.

## Tests
- Groups and order; every kind has a place (reflections included); who wrote it; plain class layout without counts; empty state.
- Delete a pattern, a setting, a reflection and a class line; a note line deletes the note and does not return after the next sync; a line with a `why-` id survives a note save; a deleted class line is not rewritten when the assignment is finished again; the deleted list is capped at 200 and an old file loads with it empty.
- A failed save for a note and for a record line leaves it on screen with the message.
- Clear my ratings removes only feedback lines and resets the fixed-line-first bias; per-move counts use plain names and hide zero rows.
- A deleted line never appears in the facts sent on the next move.
- A grep test: no word on the screen is on the never-shame or praise list.
- UI: add a note, see it under the new screen, delete it with the confirmation, it is gone and stays gone after relaunch; every row labelled for VoiceOver with a Delete action; large text reaches every row, a 300-character line wraps, and Delete and Clear are reachable.
- A restored backup cannot bring back a deleted line (the deleted list is in the same file).

## Unverified
Whether students find the screen useful or alarming. Check on a phone, and with Ben.

## Gates
Gate 1 (semantic_reviewer, a fresh read-only agent, 2026-11-24): FIX FIRST, seven must-fix, applied above. The reviewer's suggestion of a one-line subtitle on each of the two Me rows is not taken: the two names are different enough.
Gate 2: pending. Gate 3: pending.
