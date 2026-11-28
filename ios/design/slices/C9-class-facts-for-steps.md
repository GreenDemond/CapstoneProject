# C9 Class steps for step suggestions
Status: done 2026-11-25

## What the student sees and does
1. When the student gave a class label on the assignment screen and has finished an assignment for that class before, "Suggest some to start" and "Give me an idea" can start from those earlier steps.
2. The editor then says "Suggested by the AI, starting from your History steps" (with the class label) instead of the plain label. The student sees the same list and can change any step.
3. With no class label, no earlier lines, or no AI, nothing changes.

## Research link
`design/slices/MEMORY-plan.md` sections 2.2 and 3.1. Steps the student already used for a class fit that class. Design judgment, to be tested on a phone.

## What it stores
Nothing new. The draft remembers only the class label used, so the label can show.

## What leaves the phone
Nothing with Apple's on-device model. With the student's own AI service, the step-suggestion request already sends the assignment text; it now also sends up to one earlier class line (the kind of work and up to eight kept steps) and one of the student's "starting" patterns, each quoted. The D8 row for the step coach is extended (DECISIONS). Parent to confirm before classmates. Class lines can hold steps the AI suggested earlier; the student can see and delete each in What the app remembers about me (M4).

## Distracted, stuck, back after a week
Unchanged.

## Differs from the web app
No.

## Tests
The fact appears in the request before the ask; with no class label, or no matching line, nothing extra is sent; a different class's line is never sent; the label shows only when a class fact was used; an old draft file loads with no class label; steps still go through every existing check.

## Unverified
Whether suggestions improve. Phone check later.

## Gates
Gate 1 (semantic_reviewer, a fresh read-only agent, 2026-11-24): FIX FIRST, applied in the Gate 1 response below. Gate 2 (semantic_reviewer, 2026-11-24, one review for C6, C9 and R5): C9 GO, two nits applied: the class is captured before the call and the label is set only when the import succeeded. Gate 3: full check 600 unit tests passed and 54 of 55 UI tests passed (the one failure was a stale expectation in the new UI test, fixed; that suite rerun 4 of 4). No fresh-context Checker.

## Gate 1 response (changes to this design)
- **Label.** The label says what is true: "Suggested by the AI, using steps you kept in History". Class lines hold every kept step, including ones the AI suggested earlier, so the label never says they are the student's own.
- **Where the allow-list lives.** `stepCoach.sees` in `content.json` (not a fake move in `coach.moves`): one `course` line for this class, one `pattern` tagged `starting`. `LearnerSelector` reads it for the key `stepCoach`, and the allow-list test covers it.
- **Quoting.** Facts are built with `CoachText.fact`, so the class line's steps are quoted. The instructions sent stay exactly `content.stepCoach.rules`, tested, and an injected step text stays quoted.
- **Draft marker.** `Draft.aiClass` is set only when facts were sent and AI steps were used, not on a starter fallback. It is cleared wherever `fromAI` is. An old draft loads without it.
- **Wiring.** `PlannerModel.recordLines` is a closure the app model sets, returning the selector's lines for a class. A line the student deleted is no longer in the record, so it is never sent. No network call is added to the model.
- **What the student sees about what was sent.** The label names the class whose steps were used. The record lines are also listed in M4. That is enough for steps because the lines are only a starting point and the student sees and edits the whole list.
- **Tests added.** A deleted class line is never sent; another class's line is never sent; a fallback shows no label; `idea` carries facts like `suggest`.
