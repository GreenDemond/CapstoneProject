# A2 The step count is a guide, not a rule
Status: built 2026-11-26. Asked for by the parent: "the number of steps should be approximate guidance, the ai should be able to adjust if it needs."

## What the student sees and does
1. The question stays "About how many steps?" with 3, 5 or 8. Picking 5 and tapping Suggest some to start may now give 4 or 7 steps, when that fits the assignment. The student edits them in the editor as before.
2. With no AI (starter steps) nothing changes: the number picked is the number of starter steps, up to what exists.

## Research link
Design judgment, to be tested. No research file is cited.

## What it stores
Nothing new. The picked count is still saved in the draft.

## What leaves the phone
Nothing new. The same request now carries one different sentence (see below), to the same AI the student already chose. With Apple's on-device model nothing leaves.

## What changes
- `Shared/content.json` `stepCoach.rules`: "Give the number of steps asked for" becomes "Give about the number of steps asked for. Give fewer if the assignment is small, or a few more if it needs them." One sentence; the other rules (verbs, no answers, under 15 words, the trusted-adult word) are untouched.
- `StepCoach.suggest`: the request line "Give about N steps." becomes "Give about N steps. You may give fewer or a few more if the assignment needs it." The reply is cut to at most N + 3 steps (was N), so an AI that over-delivers cannot flood the editor. At least one step is still needed. Every step must still pass the process-step check; one bad step still means no AI steps.
- The rules and the request line use the same words, "fewer or a few more", so the cap of 3 matches what the model is told.
- Records: gate 2 (it touches `AI/` and `Shared/`), and a `DECISIONS.md` change-log row with the parent's quote.
- Words: the screen question already says "About", so no new student words.

## Distracted, stuck, back after a week
- No change. The editor is where the student trims or adds.

## Differs from the web app
No. The web app has no step-count wording (searched `js/`); this is iOS only.

## Tests
- Logic with a fake AI: asked for 5, the AI gives 3, then 7, then 9: the first two are used as they are, the third is cut to 8 (5 + 3). Asked for 3 and the AI gives 7: cut to 6. Asked for 8, AI gives 12: cut to 11.
- The request text contains "fewer or a few more" and still says the number asked for.
- A reply with one bad (non-process) step still fails closed, whatever the count.
- An empty reply is still unusable.
- Asked for 8 and the AI returns 1: accepted (a small assignment may legitimately get 1 or 2 steps).
- `StepCoachTests.twentyStepsKeepsTheFirstFew` (20 steps, count 5) now expects 8, not 5 (N + 3). It is the only test that relied on exactly N. It is changed to an exact value, not loosened.
- `PlannerTests` use the starter path and are unchanged. No UI test depends on the AI count.
- Existing checks that read `stepCoach.rules` (safety word, "Only if the text suggests", "serious distress") and the "Give about" check in `ClassFactsForStepsTests` still hold; the `TRUSTED_ADULT` sentence is kept byte for byte. No `Shared/cases` file pins `stepCoach.rules`, so none changes.

## Unverified
Whether the on-device model and the parent's own service actually vary the count when told they may. Checked on a phone with a few assignments of different sizes, recorded in `checks/device-checks.md`.

## Gates
- Gate 1, 2026-11-26, independent read-only reviewer (same model family as the Builder): FIX FIRST (5, all about the note itself: name the right test, gate 2 and change-log row, no case file changes, web app answer, one-step case). Applied above. No code objection; N + 3 kept as relative.
- Gate 2, 2026-11-26, same reviewer: GO. Code matches the note; nothing new leaves the phone; `idea()` unaffected; tests not weakened.
