# M0 Learner record and courses
Status: M0a built 2026-11-22 (gate 1 FIX FIRST on the full M0; M0a narrowed to address it, see Gates)

## Scope note
M0 is split. **M0a (this build):** the record file `learner.json`, its fields, caps, lenient loading, deletion with Delete everything, and the never-stores test. Nothing writes an entry yet. **M0b (waits):** the class label, course entries on finish, obstacle lines from notes, and a per-line delete for course entries. M0b needs the parent's explicit yes on the class label (MEMORY-plan section 7, item 2) before it is built. The recent-course picker moves to M0b or later with its view.

## What the student sees and does (M0b; M0a shows nothing new)
1. On the assignment screen, an optional line "Class (optional)" with a text box. The student types, for example, "History". Up to 40 characters. Empty is fine.
2. Nothing else changes on screen. The record is written in the background.
3. When the student finishes an assignment that has a class label, nothing new is shown. The record keeps one short entry for that class.
4. Notes under Me: when the student adds a note, the app also keeps it as an "obstacle" line in the record. Deleting the note deletes that line too. The note list looks as it does now.
5. Delete everything removes the record file with everything else.

## Research link
`design/slices/MEMORY-plan.md` section 2 (learner record, courses, caps, tags); `research/` finding that students benefit from keeping their own plans per class is the parent's point (MEMORY-plan 2.2), design judgment, to be tested. Not a research claim.

## What it stores
`learner.json` (Storable, version 1). M0a defines the shape and nothing writes to it yet:
- `LearnerRecord { entries: [Entry] }`. An `Entry` has `id` (UUID string), `kind`, `date`, `text` (cut to 300 UTF-16 units, blank text dropped), `source` (`app`, `student`, `confirmed`), and `tags` (fixed app tags only).
- `kind` is one of `setting`, `pattern`, `obstacle`, `reflection`, `course`, `feedback`. An entry with a kind this build does not know is left out on load; the rest still load.
- Course entries (M0b) will hold kind id, the kept steps (up to 8), and the Drifted and Stuck counts as tags or text. Dread and crux answers are NOT in M0 (MEMORY-plan 2.2 lists them; deferred to a decision).
- Caps per kind (named constants): settings 40, patterns 30, obstacles 200, reflections 26, courses 20 entries in total, feedback 500. Newest kept. M0b adds a per-class limit of 10 entries per course (MEMORY-plan 2.1); M0a has no per-class rule.
- Tags are a closed set in code (`LearnerRecord.Tag`): starting, stuck, drifting, finishing, time, place, sound. Unknown tags are dropped on load; the line is kept.
- Text is trimmed, then cut to 300 UTF-16 units, on creation and on load.
- Stored course entry: kind id, the kept steps the student did not drop (up to 8, their own words, each cut to the step length), counts of Drifted and Stuck on that assignment, the class label (cut to 40). Date.
- Never stored: attention, focus, mood, effort, diagnosis, name, school, teacher. Enforced by a test over the type and the words.
- The class label is the student's own words, not a school.

## What leaves the phone
Nothing. The record stays on the phone. It is only sent to an AI if a later slice names it and D8 allows (M1 and later). This slice adds no network call.

## Distracted, stuck, back after a week
- Distracted: an unfinished assignment writes nothing to the record until it is finished.
- Stuck: no effect on the work screen.
- Back after a week: the record is unchanged; nothing about the gap is written.

## Differs from the web app
Yes: the web app has no learner record or class label.

## Caps and rules
- Obstacles 200 (newest kept), courses 20 with up to 10 entries each (newest kept per class), settings 40, patterns 30, reflections 26, feedback 500. Only the first two are written here.
- A course entry is written on finish only when the assignment has a label. No label, no entry.
- A label of only spaces is treated as no label.
- Delete one obstacle when its note is deleted.

## Tests (M0a)
Logic (`LearnerRecordTests`):
- Round trip for every kind; caps keep the newest; an old `learner.json` with no version or missing kinds loads as empty for those kinds, never a crash; a damaged file is set aside (the existing store behaviour).
- Never-stores check over the code (not the comments) of `LearnerRecord.swift`: no attention, focus, mood, effort, diagnosis, adhd, name, school, teacher, missed, behind, late, overdue, failed, great, awesome. `Words*.swift` and `content.json` are checked in M0b, when course text appears.
- Course label: cut to 40; spaces only is no label; the label is kept on the draft and on the saved work.
- Finish with a label writes one course entry with at most 8 steps; finish without a label writes none; Drifted and Stuck counts match the taps.
- Adding a note writes one obstacle line; deleting the note deletes it.
- Delete everything removes `learner.json`; extend the existing delete-everything test.
UI: none in M0a. M0b adds the class box test.
Device-only: none.

## Unverified
The never-stores check in M0a scans only the code of `LearnerRecord.swift` and the saved file's key names. `Words*.swift` and `content.json` are checked in M0b. Whether the record stays small after months of use (caps should hold; check the file size after a long fake run, in a test).

## Gates
Gate 1, full M0 (2026-11-22, `semantic_reviewer`, model not stated, read-only): FIX FIRST, 7 must-fix: field spec; define counts and "kept"; student-typed text and the grep scope; deletion of course entries before M4; the parent's explicit yes on the class label (not yet recorded: the change-log row says "recommendation accepted", which is not a yes); scope vs TASKS M0 picker; obstacle sync and missing tests. Response: split. M0a covers field spec, caps, deletion and the never-stores check. Items 2, 3 (student text), 4, 5, 6 and the M0b parts of 7 are for M0b and wait on the parent's yes. Suggestions taken: M0 split; caps as named constants.
Gate 2, M0a (2026-11-22, `semantic_reviewer`, model not stated, read-only): FIX FIRST, 7 items. Applied: loaded text is trimmed and cut on load (a test loads 10,000 characters); tags are a closed type; a test pins the exact saved-file key set; `try!` removed; the course cap wording corrected; Unverified updated. Build and tests: `swift test` 427 passed after these changes. Nothing leaves the phone (no network call, no Apple framework, no logging in these files). Backup flake (found in this session, not M0's own code): `BackupTests.theRealFolderResourceValueIsSetAndCleared` read back a cleared flag too early. Measured on this Mac: about 1 read in 30 right after clearing still reads excluded; none after one second. The test now polls for up to 2 seconds and keeps the same final check. This is the one place a test waits on the system (no fake clock exists for the OS flag). 12 of 12 runs pass.
Final check: see TASKS-coaching.md.
