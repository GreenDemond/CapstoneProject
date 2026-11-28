# C6 Tidy my question
Status: done 2026-11-25

## What the student sees and does
1. On the Stuck sheet's "Ask a person" part, where the student fills three boxes ("I'm on…", "I tried…", "I don't get…"), a new button **Tidy it** appears once there is a question to tidy and an AI is on.
2. A tap asks the AI to put the student's own words into one clear question for a person. The result shows in a card, with **Use this**. Nothing changes until the student taps it. The three boxes and the original question stay.
3. **Use this** swaps the copyable text for the tidy one. Editing a box goes back to the student's own words and drops the tidy one.
4. If the AI cannot tidy it (a refusal, a bad result, no AI), a quiet line says "Your words are unchanged." and nothing else changes. A safety stop shows the trusted-adult line.
5. Nothing is saved. The tidy question is never stored.

## Research link
`design/slices/COACH-plan.md` COACH-6. A clearer question makes asking a person easier, which is the point of the rung. Design judgment, to be tested on a phone.

## What it stores
Nothing.

## What leaves the phone
Nothing with Apple's on-device model. With the student's own AI service, the three lines the student typed (quoted) go to that service once per tap. A D8 row names this (DECISIONS); parent to confirm before classmates.

## Rules for the AI line
Plain text, one line, under 40 words, every word of five letters or more must come from the student's three lines or a short allowed list of connecting words. It may be a question. No new nouns, so it cannot bring in subject facts. Failing any check means the student's own words are unchanged.

## Distracted, stuck, back after a week
Optional. A double tap makes one call. Leaving the sheet drops the tidy question.

## Differs from the web app
No.

## Tests
A tidy with a new noun is rejected; the student's words survive; a refusal and a bad shape leave the words unchanged; NOTHING leaves them unchanged; the safety word shows the line; one call per tap; the original is kept and the copyable text only changes on Use this; editing a box drops the tidy; no network call inside `LadderModel` (grep). UI: fill the three boxes, Tidy it, Use this, Copy.

## Unverified
Whether a real model keeps the student's meaning. Phone check later (T14-C).

## Gates
Gate 1 (semantic_reviewer, a fresh read-only agent, 2026-11-24): FIX FIRST, applied in the Gate 1 response below. Gate 2 (semantic_reviewer, 2026-11-24, one review for C6, C9 and R5): C6 FIX FIRST, one must-fix, applied: a reply for words the student has changed since is dropped, and the Copied label resets when a tidy appears (the test fails without the guard, checked by removing it). The guardrail question for CoachMove moves (Stuck, split, tidy) is recorded as waiting on the parent: a guardrail trip can also happen on ordinary schoolwork, so the trusted-adult line may mislabel students. Gate 3: full check 600 unit tests passed and 54 of 55 UI tests passed (the one failure was a stale expectation in the new UI test, fixed; that suite rerun 4 of 4). No fresh-context Checker.

## Gate 1 response (changes to this design)
- **Shape.** A new shape `askLine`: one line that ends in exactly one `?`, any first word, no long quotation, no colon sentence, at most 300 characters (the 200-character step cap would fail a full tidy line).
- **Length.** At most 30 words.
- **What counts as adding something.** Every word of three or more letters must come from the student's three boxes or from the move's connector list, and any digit must be in the student's words. So "Is it Rome?" and "Is it 476?" are rejected. The connector list holds only function words (the, and, you, can, could, would, please, about, what, how, why, which, where, when, there, this, that, with, for, are, was, does, did, not and similar), no content nouns.
- **Rules text.** "Rewrite only. Do not answer, hint at, explain or guess. Add no name, number, date or fact. If you cannot rewrite without adding anything, reply NOTHING." NOTHING leaves the student's words unchanged.
- **Must still use their words.** When the "I don't get" box has text, the line must contain a word of four or more letters from it.
- **When the button shows.** Only when the "I don't get" box has text, an AI is on, and fewer than two tidies were made on this step (a ceiling from state, as for the Stuck question).
- **D8.** Row written now in DECISIONS: the three boxes and the step text that fills the first box, each quoted; own service only; parent to confirm.
- **No thumbs row** under the tidy card: Use this is the signal.
- **Tests added.** Four personas (earnest, answer-seeker, evader, injector), failing, guardrail and unavailable fallbacks, a reply that complies with an answer ("The answer is 42"), and a large-text UI test.
