# C4 Setting follow-up
Status: done 2026-11-25

## What the student sees and does
1. After the student answers "Was 12 minutes about right?" with **Shorter** or **Longer** (R5), the card shows one short question suggesting one small change to try next time, for example "Would you like to try 5 minutes next time?". It is the AI's question when an AI is on, and the app's own fixed line when not: "Want to try the other length next time?".
2. **About right** gets nothing more: no question and no AI call.
3. The question shows once, in place of the three answer buttons, with a quiet **Done** link. It is not saved and never blocks the step.
4. If the AI cannot give a good question (a refusal, a bad shape, NOTHING), the fixed line shows. A safety word shows the trusted-adult line.

## Research link
`design/slices/COACH-plan.md` COACH-4: ask afterwards what to change, so the questionnaire becomes an experiment. Design judgment for the wording, to be tested on a phone.

## What it stores
Nothing. The question is not saved. (The answer itself was saved by R5.)

## What leaves the phone
Nothing with Apple's on-device model. With the student's own AI service, up to three of the student's own block-length answer lines (for example "12-minute block: too long"), quoted, and the fixed rules go to that service once, after a Shorter or Longer. A D8 row names this; parent to confirm before classmates.

## Rules for the AI line
Shape `question` with its own start words: Would, Could, What, How, Which, Want, Will, Do. At most 15 words. Every word of five letters or more must come from the three answer lines or a short allowed list (minutes, minute, block, length, shorter, longer, time, next, would, could, which, try, again). It must not name a number of minutes the app does not offer. A reply that names attention or focus is rejected by the words check, since those words are not in the source or the list.

## Distracted, stuck, back after a week
The card only exists for a moment after an answer. Leaving the step drops it. A double tap makes one call (state per card).

## Differs from the web app
No.

## Tests
About right makes no call; Shorter and Longer make exactly one call each; the fixed line shows for a refusal, a guardrail, NOTHING, a bad shape and an unavailable AI; the safety word shows the line; a question that names a length the timer lacks is rejected; the answer-seeker and injector personas (a reply that is a statement or contains a new noun); the instructions equal the common rules plus the move's rules; the allow-list is pinned (setting lines only, newest three); nothing is saved; a double tap makes one call. UI: with the fake AI, answer Shorter and see a question, then Done.

## Unverified
Whether a real model gives a useful question. Phone check later.

## Gates
Gate 1 (semantic_reviewer, a fresh read-only agent, 2026-11-24): FIX FIRST, applied in the Gate 1 response below. Gate 2 (semantic_reviewer, 2026-11-25, one review for C4 and C5): FIX FIRST, one must-fix, applied: the reply must name exactly the new length (a reply with no number could point the wrong way; test added). Suggestions taken: the follow-up is dismissed when the step changes, and the text is announced for VoiceOver. Gate 3: full `checks/check.sh` ALL CHECKS PASSED (633 unit tests, UI tests, 0 SKIPPED). No fresh-context Checker was run.

## Gate 1 response (changes to this design)
- **The AI sees no record lines and no student words.** The three lengths are 5, 12 and 25, so "the other length" is ambiguous. The code works out the target the same way R5 does: Shorter means the next shorter entry in `BlockLength.lengths`, Longer the next longer one. The facts sent are built in code from the answer just given: the length tried, the answer, and the target length. `sees` for this move is empty, so no stored line leaves the phone for it. The D8 row names only these three facts.
- **Fixed line.** A template filled in by code: "Want to try {n} minutes next time?". At 5 minutes there is no Shorter and at 25 no Longer, so no follow-up is offered there.
- **Numbers.** After the shape and word checks, every digit run in the reply must equal the target length, and number or size words (one to ten, half, double, hour, seconds) are rejected. A reply naming any other length falls back to the fixed line. Direction is checked: Shorter never names a longer length than the one tried.
- **The card while the AI works.** The three buttons are replaced by "Thinking of a question" and a Done link. Done, or leaving the step, cancels the call.
- **A safety word is spurious here** (no student words are sent), so the fixed line shows, not the trusted-adult line.
- **Start words** in `content.json` are lowercase: would, could, what, how, which, want, will, do.
- **Not changed:** the card has only Done to tap. The question is something to think about for next time, not a form. Whether it is worth an AI call at all, when code can build the question, is put to the parent in the final report.
