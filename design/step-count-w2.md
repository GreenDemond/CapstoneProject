# Slice W2: step count and the good-step card (web)

Status: built, logic tests pass, **browser tests written but could not be run** (see Testing). Plan pre-approved by the parent ("go do it all", 2026-11-27, `design/web-parity-plan.md`). Student-visible wording below awaits the parent's okay (W-D5).

## What the student sees and does
1. On the paste screen, under the kind buttons, a group **About how many steps?** with three choices: 3 steps, 5 steps (picked at first), 8 steps.
2. Show my steps shows that many steps first. It is a guide, not a limit: "Showing 3 of 7. Show more steps adds the rest." still works, and the two-minute start keeps the same count. Start runs exactly the steps on screen (unchanged). If the list has fewer steps than picked (the starter lists have 7), all of them show.
3. In Change my steps, under the intro line, a folded row **What makes a step easy to start**. Tapping it opens three fixed lines and a **Got it** button:
   - "It starts with something you do, like read, write, list or find."
   - "It's small enough to begin in about two minutes."
   - "For example: Write down what the question asks for."
4. Got it hides the card for good (saved on the device). A small **Show step tips** button then sits in its place and brings the card back. The card never reads the student's steps and never marks them.

Ideas read (not imported) from the iPhone app notes `R6-good-step-card.md` (as amended by SMALL1: folded by default) and `A2-steps-approximate.md`. Not copied: the AI part of A2 (W-D2), the Me switch (the web has no Me screen until W7; Show step tips does that job).

## Research link
Card line "about two minutes": `00-knowledge-summary.md` section 4 point 6, design judgment, not research-backed. The card never asks for more steps (section 4 caution: long lists of tiny steps can look worse). "Starts with something you do" is design judgment, to be tested. No claim that the card helps students write better steps. The step count choice is design judgment, to be tested.

## What it stores
One new setting `stepTipsHidden` (true only), in its own section `tips` in `js/storage.js` (`loadStepTipsHidden`, `saveStepTipsHidden`). Anything else, damaged or missing, loads as "card shown". The picked count is not saved: a refresh goes back to 5 (it is a per-plan choice, and the paste screen is not saved either). Nothing leaves the device. No AI.

## Distracted, stuck, away
- Distracted: the card is folded and optional; one tap to open, one to dismiss.
- Stuck: the card is the help.
- Back after a week: the card shows (folded) until Got it. Count back to 5.

## Wording awaiting the parent's okay
About how many steps?; 3 steps; 5 steps; 8 steps; What makes a step easy to start; the three card lines above; Got it; Show step tips.

## Design review (AGENTS.md)
- Breaks no rule 1 to 11: no shame, no AI, no diagnosis, nothing leaves the device, no claim of treating attention. [x]
- Not a trap in `05-adhd-ideation.md` or "Things to avoid"; the student still writes the steps; the card is advice before typing. [x]
- One thing at a time: the card is folded so it does not push the first step down. [x]
- Fits one session. [x]

## Self-review notes
- Additive: default stays 5, so every existing test that expects five steps still holds (checked `paste-and-split`, `work-screen`, `suggestions`, `steps-editor`, `home`). The editor's existing button and label names are untouched. New names ("3 steps", "5 steps", "8 steps", "What makes a step easy to start", "Got it", "Show step tips") were checked against `tests/browser`: no `getByLabel`/`getByRole` there matches them as a substring ("Step 1" etc. are matched `exact: true`).
- The card redraws only itself, so keyboard focus stays on the toggle; after Got it focus goes to the editor heading.
- Student text is not involved; all card words are set with textContent.

## Testing
- `tests/logic/step-count.test.js` (9 tests, all pass): count choices and fallback for bad values, starter lists long enough, fixed card words (no shaming words), the setting default, round trip, damaged values, other sections kept.
- `tests/browser/step-count.spec.js` (7 tests, phone and desktop): default 5; 3 steps then Show more steps then Start; 8 steps of a longer list; two-minute start keeps the count; refresh goes back to 5; card folded, opens, steps still editable with it open, Got it hides for good across a refresh, Show step tips brings it back; damaged saved tips data; the card is folded again on each editor open.
- **The author's sandbox could not start Chrome (it aborts on launch), so the browser spec and the existing browser suite have NOT been run for this slice.** It was checked by reading it against the code. Run `tests/browser/step-count.spec.js` and the full suite first on a normal machine.

## Not done
- The starter lists have 7 steps, so "8 steps" gives 7 when there are no pasted list items. The label says "About". Adding an eighth starter step per kind would be new student-visible wording; left for the parent.
- The AI path shows the picked count of the AI's steps too, but the AI is not told the number (no AI change here).
