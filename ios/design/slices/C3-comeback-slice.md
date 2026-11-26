# C3 Comeback slice (includes R1, the non-AI comeback screen)
Status: NOT STARTED 2026-11-25 (sketch only, no review yet)

## Why it is bigger than its row in the table
`TASKS-coaching.md` says C3 depends on R1, "the non-AI comeback screen with Just this / The whole step". R1 does not exist in the code (checked: no screen, no words, no model state). So C3 is two pieces: R1 first (a new Today state), then the AI slice on top.

## R1, as sketched
- When the student comes back on a later day (the same test `Pickup.line` already uses) and the current step is not finished, Today shows "Start with:" and a short first piece of the step, one main button **Just this** and a quiet link **The whole step**. Either opens the work screen on that step. The first piece comes from the step's own words (`PlannerModel.splitParts`, the same split Drifted uses); a step that cannot be split shows the whole step and no choice.
- On the work screen the piece shows as one quiet line "Start with: ..." above the step. It is never saved as a step.
- Same day: nothing changes from today.

## C3, as sketched
- With an AI on, the piece comes from the `comebackSlice` move instead (rules in `design/slices/COACH-plan.md` COACH-3): shape short line, under 12 words, passes `ProcessStep.isProcess`, and every word of five or more letters appears in the step (no new nouns). Any failure shows the fixed piece. One call per step per day, never on the same day.
- `sees` rows: `setting` tagged time (newest 1) and `pattern` tagged starting (1). Nothing writes those tags yet (see C8), so today this sends the step only.
- A D8 row is needed (the step text, quoted, to the student's own service).

## Decided 2026-11-26 (parent)
1. The app must not shorten a step for the student on its own. Any shorter piece is offered, and the student approves it before it is used. So the sketch above changes: R1 offers "Just this" (the piece) and "The whole step" as two choices the student picks between, and C3's AI piece is shown only as a suggestion the student can take or leave, never swapped in.
2. Still open: see below.

## Questions for the parent and Ben before building
1. Should the app ever shorten a step for the student on its own? The Drifted split asks the student; this does it first. Rule 2 and the "student does the thinking" principle both need an answer.
2. Is "Just this" different from "The whole step" if both open the same screen? The sketch makes the piece a reminder on the work screen. Confirm that is what Ben wants.

## Tests and gates
As in `TASKS-coaching.md` C3. Needs gate 1, gate 2 (AI input) and gate 3.
