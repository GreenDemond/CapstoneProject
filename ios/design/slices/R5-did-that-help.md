# R5 Did that help?
Status: done 2026-11-25

## What the student sees and does
1. On the work screen, when a 12- or 25-minute countdown the student started runs out, one quiet card asks: "Was 12 minutes about right?" with three equal buttons: **Shorter**, **About right**, **Longer**, and a link **Skip**. It shows once for that countdown and never blocks the step.
2. One tap saves the answer as one line in What the app remembers about me ("12-minute block: too long", "12-minute block: about right" or "12-minute block: too short"). The student can delete any line there.
3. After three answers for a block length in the last five, if most say "too long" the timer menu offers the shorter length as the suggested one (25 becomes 12); if most say "too short" it offers the longer one (12 becomes 25). The How I like to work card says so in one line: "Your answers so far point to 12 minutes." One answer, or a mixed set, changes nothing.
4. Nothing is shown about totals, and nothing is a score. Skip, or ignoring the card, costs nothing.

## Research link
`ROADMAP.md` item 5 and `research/00-knowledge-summary.md` (a questionnaire does not predict what helps; trying and asking afterwards does). Design judgment for the thresholds, to be tested on a phone.

## What it stores
One `setting` line per answer (a plain app summary, source "student" because the student tapped it). The setting cap of 40 keeps the newest. No dates shown, no counts stored apart from the lines.

## What leaves the phone
Nothing.

## Distracted, stuck, back after a week
The card shows only when a countdown ends. Leaving the step drops it. Old answers older than 30 days do not count.

## Differs from the web app
No.

## Tests
Three answers change the suggestion, one does not, a mixed set does not; "too long" for 12 changes nothing (no shorter length exists); only the newest five within 30 days count; the lines read "12-minute block: too long"; the card appears once when a countdown ends and not for the manual "off"; Skip writes nothing; the words contain no shame, score or praise words. UI: start a countdown (a test flag makes it end at once), tap Shorter, nothing shaming shows.

## Unverified
Whether three answers is the right amount. Phone check.

## Gates
Gate 1 (semantic_reviewer, a fresh read-only agent, 2026-11-24): FIX FIRST, applied in the Gate 1 response below. Gate 2: not required by the task list (no AI, no Shared change beyond words), but the diff touches words a student reads, so it is run. Gate 3: full check 600 unit tests passed and 54 of 55 UI tests passed (the one failure was a stale expectation in the new UI test, fixed; that suite rerun 4 of 4). No fresh-context Checker.

## Gate 1 response (changes to this design)
- **One answer per countdown.** Each countdown has its own state; answering or skipping clears it, so a double tap or a re-fire writes one line.
- **No stale card.** The card shows only if the end of the countdown passes while the app is in the foreground and the question is raised within two minutes of it. Otherwise it is dropped silently. The logic is in `FocusKit` and tested with the fake clock.
- **A shorter length.** The timer menu gains a 5-minute length: 5, 12 and 25. Otherwise "Shorter" at 12 would never change anything and the student would not be heard. This is a product choice made for the parent and Ben (easy to remove: one list in `BlockLength`). "Shorter" at 5 and "Longer" at 25 are not offered.
- **Threshold.** At least three of the newest five answers for that length within 30 days, and none of them pointing the other way. Three "too long" for 25 minutes suggests 12; three "too short" for 12 suggests 25. The learned suggestion wins over the questionnaire's block answer.
- **Computed, not stored.** The suggestion is worked out from the remaining lines each time, so deleting an answer takes effect at once and nothing is counted separately.
- **Where it appears.** A pure function in `Logic/` takes the record and the clock. The timer menu marks the suggested length "(suggested)", and one line, "Your answers so far point to 12 minutes.", shows on the How I like to work screen. It does not depend on the questionnaire card.
- **Source.** The line is source `app` ("The app noted this" in M4).
- **Other setting lines.** The cap of 40 is shared; the newest are kept.
- **Tests added.** Delete an answer and the suggestion recomputes; a large-text UI test for the card.
Gate 2 (semantic_reviewer, 2026-11-24, one review for C6, C9 and R5): R5 FIX FIRST, one must-fix, applied: Shorter is not offered at 5 minutes and Longer not at 25 (unit test). Open: the 5-minute length is a product choice for Ben, who should be asked before the beta; one list entry removes it.
