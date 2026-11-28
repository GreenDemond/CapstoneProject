# M0b Class label, course entries and note lines
Status: built 2026-11-23 (gate 1 FIX FIRST, seven must-fix applied; gate 2 pending)

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
- Course entry (`learner.json`, kind `course`, source `app`): `courseLabel` (the class label), `text` = the kind of work and the steps still in the assignment at finish, the first 8, joined with " / ", cut to 300 characters. The counts are their own fields, `stuckCount` and `driftedCount`, so a long text can never cut them off. The steps are the list order at finish (a Later reorder is kept). No dread or crux answers in M0b (MEMORY-plan 2.2 lists them; they need their own decision).
- Entry id for a course line: `course-<assignmentId>`. Each assignment has one id, so a second write replaces the first and cannot double count.
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
- Per class: at most 10 course lines for the same label (case-insensitive, trimmed). The newest 10 are kept. A busy class can use up the overall course cap of 20 and push out a quiet class's lines; this is known and accepted for now.
- Overall: course lines 20 and obstacle lines 200, as M0a. Newest kept.
- A finished assignment with no kept steps (cannot happen through Done, but guarded) writes no course line.
- Finishing with a label of only spaces writes nothing (the label is treated as none).
- Existing notes from before M0b are not copied into the record (no backfill). Say so to the parent.
- Each note has one obstacle line with the note's own id. Notes are brought up to date with their lines after each successful notes save: a line is added for each note that lacks one, and a line for a note that is gone (deleted, or dropped past the 200-note cap) is removed.
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
- Never-stores, scoped: over the code of `LearnerRecord.swift` (M0a), and over the strings that can become stored text: starter steps, stuck hints, and move fallbacks in `Shared/content.json`, as whole words. Two starter lines name a teacher ("Write down what you would ask a teacher"; "Ask a teacher or classmate what part is unclear."). They are advice about the student's work, not a fact about the student, so they are kept as exact phrases in the test's allow-list, reviewed at gate 2. UI labels (such as "Model name") and the privacy sentence in `WordsAI` are not stored text and are not scanned.
Also: a failed record write still finishes the assignment (per-file failure in `MemoryStore.failWritesTo`); Delete everything clears the record in memory.
UI (`ClassLabelUITests`): type a class label on the assignment screen; the field keeps "History" after tapping elsewhere.
Visibility (decision needed): course lines and note lines are stored; the student cannot yet see the course lines (a viewer and per-line delete come with M4). Until the parent decides, course lines are removed only by Delete everything, which the student can use at any time.

## Unverified
Whether a real history of course lines helps students (a later research question, not M0b).

## Gates
Gate 2 (2026-11-23, `semantic_reviewer`, model not stated, read-only): FIX FIRST, 4 must-fix, all applied:
- The label is kept as typed in the draft (spaces survive while typing) and trimmed only when saved with the assignment (test and two-word UI test).
- The never-stores scan is scoped to the content.json strings only. The student's own typed steps and class label are stored as typed and are not scanned; the design says so now.
- A failed save of the final Done keeps the step open, so the student can tap Done again (test). The earlier steps still move on even when their save fails, as before.
- Note lines are brought up to date with the Me notes after every successful notes save, so a note whose save failed gets its line later (test). This also gives a line to notes saved before the record existed, the first time a note is saved after this change. This was a change of plan from "no backfill", recorded in DECISIONS.
Suggestions applied: the profile is trimmed to the notes cap before it is written.
Gate 1 (2026-11-23, `semantic_reviewer`, model not stated): FIX FIRST, 7 must-fix. Applied: counts as their own fields (not cut off by the 300-character text); counting rules written down, and a Stuck tap now saves its count; the never-stores scan scoped to stored-text sources with an exact allow-list for two starter lines naming a teacher (the design now says so); a failing record write is isolated per file and never shows "could not save"; the course line is written only after the work save succeeds, under a stable id; the visibility gap is stated and left to the parent; the label has its own field (`courseLabel`) and the 10-per-class cap is implemented and tested.
