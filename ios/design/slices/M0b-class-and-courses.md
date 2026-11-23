# M0b Class label, course entries and note lines
Status: draft (builds on M0a, commit abee515)

Parent's yes (DECISIONS 2026-11-23): storing a free-typed class label is allowed.

## What the student sees and does
1. On the assignment screen, under the assignment box, a text line "Class (optional)" with the hint "For example: History". Up to 40 characters. Empty is fine. Nothing else on that screen changes.
2. The label stays with that assignment when it is started and while the steps are worked on.
3. Finishing an assignment (every step done) with a label quietly writes one course line for that class. No message is shown.
4. Notes under Me: each note the student adds also appears as one line in the record. Deleting the note deletes that line. The Me screen looks the same.
5. Delete everything removes the record (already true from M0a).

## Research link
MEMORY-plan section 2.2 (courses, course memory, ladder link). Design judgment, to be tested: keeping a student's own past plan per class is the parent's point; the research basis for the approach is the same as the M0a record.

## What it stores
- Class label: the student's own words, trimmed, cut to 40 characters, blank means none. Stored on the draft and on the saved assignment. Not a school, not a teacher.
- Course entry (`learner.json`, kind `course`, source `app`): `courseLabel` (the class label), `text` = the kind of work, then the steps still in the assignment at finish, up to 8, joined with " / ", then "Stuck N, drifted N." Cut to 300 characters. No dread or crux answers in M0b (MEMORY-plan 2.2 lists them; they need their own decision).
- Counts: `stuck` counts each Stuck tap that the app accepted; `drifted` counts each Drifted tap that changed the steps (a Drifted tap that splits a step counts once). Both are per assignment, stored on the saved work, and start at 0 for each new assignment. Edits to steps do not change them.
- Obstacle line (kind `obstacle`, source `student`): the note's text, cut to 300 characters. The line's id is the note's id, so delete is exact.
- A note is never edited in the app (only added or deleted), so the line never needs an update.

## What leaves the phone
Nothing. The record stays on the phone (inside the backup folder when the backup switch is on, as now).

## Distracted, stuck, back after a week
- Distracted: an assignment not finished writes no course line; leaving it does not write one.
- Stuck: a Stuck tap counts once; the ladder is unchanged.
- Back after a week: nothing about the gap is written.

## Caps and rules
- Per class: at most 10 course lines for the same label (case-insensitive, trimmed). The newest 10 are kept.
- Overall: course lines 20 and obstacle lines 200, as M0a. Newest kept.
- A finished assignment with no kept steps (cannot happen through Done, but guarded) writes no course line.
- Finishing with a label of only spaces writes nothing (the label is treated as none).
- Existing notes from before M0b are not copied into the record (no backfill). Say so to the parent.
- A failed write of the record does not stop the assignment from finishing; the steps still save.

## Differs from the web app
Yes: the web app has no class label or course memory.

## Tests
Logic (`CourseRecordTests`):
- Class label: cut to 40; blank is none; kept on the draft and on the saved work; an older saved work without the field loads with none.
- Finish with a label: exactly one course line; at most 8 steps; stuck and drifted counts match the taps; a Drifted tap that splits counts once.
- Finish without a label, or with only spaces: no course line. Finishing with Later: no course line.
- Per-class limit: 11 lines for one class keep the newest 10; another class is not affected.
- Note added: one obstacle line with the same id; deleted: the line is gone; a long note is cut to 300.
- Delete everything: the record is empty in memory and the file is gone.
- A failed record write (MemoryStore failWrites) still finishes the assignment and keeps the steps.
- Never-stores: over the code of `LearnerRecord.swift` (already), and now over the `Words*.swift` strings and the `fallback` / starter strings in `Shared/content.json` (whole words; list as in M0a). Any hit fails the test; if an existing string hits, it is reported and fixed, not excluded.
UI (`ClassLabelUITests`): type a class label on the assignment screen; the field keeps "History" after tapping elsewhere.

## Unverified
Whether a real history of course lines helps students (a later research question, not M0b).

## Gates
