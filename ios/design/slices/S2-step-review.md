# S2 Review notes on each step
Status: approved for build 2026-11-24 after gate 1 FIX FIRST (4 must-fix, applied below)

## What the student sees and does
1. In the editor, a step that is too long (more than 20 words, the same limit as the AI steps) or vague (exactly one of a short list such as "study", "do the essay"; a single word that is not on the list is not flagged) shows a quiet question under it: "This one looks big. Could you split it into two smaller steps?" or "Which part will you do first?"
2. Under a long step, a Split button appears when the step can be split. Skip and Split are at least 44 points tall and read by VoiceOver with the question.
3. Skip hides the question for that step for this editing session. Nothing is saved.
4. The question never blocks Start, and the app never rewrites a step.
5. A step that already gets the split nudge ("This looks like two steps. Split it?") gets no review question, so the student sees one question at a time.

## Research link
Design judgment, to be tested. The reasons are in `research/08-phone-ai.md` section 10: the app's own checks are reliable, the AI's judgement of steps was not, so this task uses no AI. Long, vague steps are the reason the split nudge already exists; this extends it to the other two cases.

## What it stores
Nothing. Skip is held in memory only, keyed by step id. Ids come from a counter that only goes up (`draft.nextId`), so reordering keeps each step's id and a new step never reuses one. The word limit and the vague list come from `Shared/content.json` (`stepReview`).

## What leaves the phone
Nothing.

## Distracted, stuck, back after a week
- Distracted: the question is quiet and can be ignored; Start works.
- Stuck: a single word that is not on the vague list is not flagged, so typing a first word does not trigger a question.
- After a week: the question is not kept between sessions, so it appears again for a step that is still vague. That is intended.

## Differs from the web app
No.

## Tests
- Logic (`StepReviewTests`): vague words and phrases; long steps at 20 words (no question) and 21 words (question); blank text; starter steps never get a note; through `PlannerModel`: dismissing hides the note; a step with the split nudge gets no review note; nothing is saved by dismissing; Start still works.
- UI (`StepReviewUITests`): type "Study", the question appears; Skip hides it; Start opens the work screen; the same checks at the largest text size.
- Device: device-check step 91.

## Unverified
Whether the question feels calm on a phone. Checked on the device, not in tests.

## Gates
Gate 2 (semantic_reviewer, 2026-11-24): FIX FIRST, one must-fix (note said 18 and 19 words; tests use 20 and 21). Corrected in this note.
Gate 1: FIX FIRST (semantic_reviewer, 2026-11-24). Must-fix applied as above: one-word rule removed; limit 20 to match S1; ids stable (checked in code); 44 pt tap targets and largest-text test; gentler wording. The second round was not run separately: the fixes are exact and gate 2 on the diff covers them.
Gate 3: pending (full check running).
