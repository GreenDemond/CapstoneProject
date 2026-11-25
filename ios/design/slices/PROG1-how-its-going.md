# PROG1 What I did
Status: built 2026-11-25 (gate 2 and full check below)

## What the parent asked for
"Coaching that helps students improve: start sooner, finish more of what they plan, need less help, and better achieve their goals" (parent, 2026-11-25). The research rules (AGENTS.md rule 8) let the app help students stay on task, plan and remember, but never claim it improves attention, raises grades, or caused a change. So the app offers the student their own record, in plain counts. It never says they are improving, never scores them, and never judges a goal.

Gate 1 found that several things in the first draft would not give the student what the parent wants, so they are not built: counting plans written in the student's own words as "needing less help" (it would push students away from suggestions, which exist to help them start), two 30-day blocks side by side (it reads as a decline after a quiet month), and goals shown above the counts (it turns the screen into a scorecard).

## What the student sees and does
1. Me has a new row, **What I did**.
2. One block, **The last 30 days**, in plain lines:
   - "4 assignments planned"
   - "14 steps finished"
   - "3 assignments where a first step was done the same day or the next day after planning"
   - "2 plans started from a suggestion" and "2 plans written by you" (two equal lines)
3. Nothing is a percentage, an arrow, a colour, a streak or a total against a target. With nothing in the window: "Nothing planned in the last 30 days." With nothing at all: "Nothing here yet. After you plan and work on an assignment, you'll see it here."
4. Below the counts, one quiet link: "Your goals are in Goals and notes." The goals themselves are not shown on this screen.
5. The lines behind the counts show in What the app remembers about me, in a group **How it went**, each deletable. Deleting one changes the counts at once.
6. The assignment being worked on now counts from the moment it is started, with the steps finished so far.

## What a line says
One line per assignment, neutral, for example: "Planned 5 steps. Finished 2. First step done after 0 days. Steps from a suggestion." The wording never says missed, late, abandoned, behind or only. "First step done after 0 days" appears only once a step is done. The line is rewritten as steps are finished, so an assignment that is left half done is already counted truthfully, with no separate "ended" event.

## Research link
Self-monitoring with feedback on one's own behaviour is a supported intervention shape (`research/00-knowledge-summary.md`, section 6 on what is honest to claim). Wording is design judgment, to be tested on a phone.

## What it stores (new)
- `Draft.plannedOn`: the day the steps first reached the editor (set once, in the one place a draft is saved with the editor showing). `Draft.suggested`: true when any step came from Suggest some, the starter steps, an AI idea or Talk's Use these as my steps; false when the student wrote every step with I'll say my steps.
- `SavedWork.plannedOn`, `suggested` and `firstDoneOn`: the same facts carried to the saved work, plus the day the first step was marked done.
- One `progress` line per assignment in `learner.json`: text as above, source "the app", id `progress-<assignment id>`, dated the plan date. Nothing the student wrote, no class label, no counts of stuck or drifted taps. At most 100 lines, newest first. A line the student deleted is not written back (the M4 deleted-id list), and `Delete everything` removes the file as for the rest of the record.
- Old draft and work files load with these fields empty. An assignment with no dates is counted as planned and left out of the first-step count. A save that fails leaves the line unwritten; the screen then simply counts less, and that is accepted.
- The window is by plan date. Days are local calendar days. A clock that went backwards counts as zero days, never as an early start.

## What leaves the phone
Nothing. No AI is involved.

## Wording and the rules
- Rule 2: only counts of what happened. An unfinished assignment counts as planned and its finished steps as finished.
- Rules 6 and 7: nothing compares students; the two "plans" lines are equal.
- Rule 8: the screen says what the student did, not what the app did or what changed. The words "improve", "progress", "better", "sooner", "less help", "attention" and "focus" appear nowhere in the title, the viewer lines or the words (a grep test).
- The goals are not shown or judged. The app does not guess whether a goal was reached.
- The parent should confirm this wording before classmates use the build.

## Distracted, stuck, back after a week
The screen only reads. After a quiet month it says "Nothing planned in the last 30 days." and nothing else.

## Differs from the web app
No.

## Tests
- Pure counts (`Logic/Progress.swift`): the 30-day window by plan date from the fake clock (day 29 in, day 31 out); steps finished; first step the same day or the next (0 and 1 days in, 2 out, unknown left out, a backwards clock counts as 0); suggested and own counted as separate equal lines; an assignment with no step done is counted as planned; the current assignment is counted; deleting a line changes the counts.
- The line text parses back from a strict fixed format, and a damaged line is ignored, never a crash.
- Writing: a line exists from Start, is rewritten as steps are done (still one line per assignment), is not written back after a delete, and a draft with no plan date still writes a line.
- `suggested` is false only after I'll say my steps; true after Suggest some, starter steps, an AI idea, Talk's Use these as my steps; a reopened draft keeps its old plan date.
- Storage: old draft and work files load; `learner.json` key set is still the pinned one with a `progress` line present (no new keys); an unknown kind is still dropped leniently; `LearnerRecord.cap(for:)` covers `progress`; no move's `sees` list can reach `progress` (a test over `content.json`).
- Viewer: the How it went group shows, a record with only progress lines is not shown as empty, each line deletable, the viewer's words pass the shame, praise and rule-8 grep.
- UI: plan and finish an assignment with I'll say my steps, open What I did, see the lines, delete a line under What the app remembers about me and see the counts change; large text reaches every line.

## Not in this task
- The weekly look-back mentioning the student's goal (it adds words to an AI request and needs its own review).
- Fading the suggestions (C7), which needs the parent's decision on what fading should mean.
- Any claim that the app helped. The record is the student's own.

## Unverified
Whether these counts are the right ones and whether students find the screen calm. Check on a phone and with Ben.

## Gates
Gate 1 (semantic_reviewer, a fresh read-only agent, 2026-11-25): FIX FIRST, seven must-fix, applied above: the "own words" count and "less help" claim dropped; one block named What I did; the window and the counts use the plan date and the assignment in progress counts; the first-step measure redefined (steps reached the editor to first step done, local days, clock clamped, wording as a fact); viewer group, cap and tests specified; goals not shown; rule 8 wording grep extended.
Gate 2 (semantic_reviewer, a fresh read-only agent, 2026-11-25): FIX FIRST, seven must-fix, applied: the viewer group is named What I did and each row shows its plan date (not a count of days); the plan date is cleared when the student goes back to the assignment and a draft left for a month counts from the day it was started; "First step done later" is gone: the line has a sentence only when the first step was soon, so a missing sentence is not a judgement ("later" and "slow" added to the banned words); the first-done day is saved with the step itself; a failed write of the line is rolled back and the test now checks disk and memory; the old saved-work test now loads a file with the new keys removed; the line follows the plan after a split (rewritten on Drifted as well as Done).
Change since gate 1, forced by an existing test: the stored line and the screen never count days, because the never-shaming words test bans the word "day" in anything a student reads. The screen says "this past month" and "soon after planning".
Gate 3: full `checks/check.sh`: 658 unit tests passed and every UI test passed except `BlockLengthUITests.testSkipWritesNothing`, whose expectation was out of date (What I did now writes a line for the assignment in progress); fixed, and that suite rerun 6 of 6. Not a clean single full-check pass. No fresh-context Checker.
