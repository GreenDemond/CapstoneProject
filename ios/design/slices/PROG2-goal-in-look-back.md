# PROG2 The student's goal in the weekly look-back
Status: done 2026-11-25

## What the parent asked for
The parent wants coaching that helps students better achieve their goals. This connects the weekly look-back (C5) to a goal the student wrote in Me. Parent, 2026-11-25: do the simple version, and also use the AI.

## What the student sees and does
1. In the weekly look-back sheet, when the student has written a goal (Me, Goals and notes) and the switch is on, one line shows above the questions: "Your goal: <their words>". It is the most specific goal they wrote, in this order: this week, then this month, then this year. Today's goal is not used.
2. Below the two existing questions there is a third, optional one: "Did anything you did this week connect to your goal?"
3. A switch in the sheet, **Show my goal here**, is on by default and remembered. Off hides the goal line and the third question, and the goal is never sent to an AI. It can be turned back on any time.
4. Done saves the answers as the student's own deletable lines as before; the third is saved as "Toward my goal: ...". With an AI on, the reply can use the goal and the third answer (below). With no AI, or any failed check, the fixed line shows.
5. The app never says whether the goal was reached, how close the student is, or that they are on track or behind. The goal is shown only as the student wrote it.
6. A student with no goal sees no goal line and no third question, exactly as today.

## Research link
`design/slices/COACH-plan.md` COACH-5 and `design/slices/MEMORY-plan.md`: the look-back asks what helped and what to try; linking it to the student's own stated goal is the supported self-monitoring shape (`research/00-knowledge-summary.md`). Wording is design judgment, to be tested on a phone. Rule 8: nothing says the app caused or improved anything.

## What it stores
- One setting, `showGoalInLookBack` (default on), in the existing settings file.
- The third answer, when given, as a `reflection` line "Toward my goal: ...", the student's own words, source student, cut to 300, deletable under What the app remembers about me. No copy of the goal is stored in the line.

## What leaves the phone
With Apple's on-device model, nothing leaves. With the student's own AI service, and only when the switch is on and a goal exists: the goal text (quoted) and the third answer (quoted), in addition to the two answers C5 already sends, plus the fixed rules. The D8 row for the weekly look-back is extended to name them; parent to confirm before classmates.

## Rules for the AI line
Same shape and checks as C5 (two sentences, exactly one boundary, one question mark last, a start word on the second, under 40 words and 300 characters, nothing outside the student's words and a short function-word list, numbers from the student's words). The student's words now include the goal and the third answer, so a reply can restate the goal. New in the fixed rules text: "Do not say whether the goal has been reached, how close they are, or whether they are on track." A reply that contains a progress word (reached, achieved, closer, closer to, on track, behind, ahead, succeed, fail, improve, better) is rejected and the fixed line shows. A safety word shows the trusted-adult line.

## Distracted, stuck, back after a week
Optional and never blocking. A goal changed in Me shows at once. An old goal is not shown if the student has cleared it.

## Differs from the web app
No.

## Tests
Goal choice (week over month over year, today ignored, none gives no line and no third question); the switch off hides both and sends no goal; the third answer saved as a deletable line of the student's words and never repeated in the goal; the request carries the goal and the third answer only when the switch is on and the goal exists, quoted, and the instructions are the fixed ones plus the new sentence; a reply that mentions reaching, closeness or being on track is rejected to the fixed line (several phrasings); the safety word shows the line; no goal means no change to the C5 request (byte for byte); a double tap makes one call; the new words have no shame, praise, score, streak or improvement words; the existing C5 tests still pass. UI: with a goal written, the look-back shows it and the third question; switch off hides both; with no goal nothing new shows; large text reaches the switch and the third box.

## Unverified
Whether students find the goal line encouraging or heavy. Whether a real model restates a goal faithfully. Check on a phone.

## Gates
Gate 1 (semantic_reviewer, a fresh read-only agent, 2026-11-25): FIX FIRST, applied in the Gate 1 response below. Gate 2 (semantic_reviewer, a fresh read-only agent, 2026-11-25): FIX FIRST, two must-fix, applied: a test where only the progress-word rule can reject a reply (every word is the student's own), with a comment that the rule mostly backs up the word-source check, which already rejects most progress words; each switch's note is attached to the switch as an accessibility hint so a screen-reader student hears that the goal goes to their own AI service before turning it on. Suggestion taken: the model's comment names the goal. Noted: a stem the student wrote clears every form of it (a goal "get better grades" lets a reply say "do better"); both are the student's own words.
Gate 3: full `checks/check.sh` ALL CHECKS PASSED in one run (675 unit tests, UI tests, 0 SKIPPED). No fresh-context Checker. A test written for the gate-2 fix found a real flaw (the student's answers were joined with a space, so a phrase could span two answers); fixed by joining with a line break.

## Gate 1 response (changes to this design)
- **Two switches, and the send one is off by default.** `showGoalInLookBack` (default on) shows the goal and the third question on the student's own screen, which is local. `sendGoalToAI` (default off) lets the goal and the third answer go into the AI's reply request. It sits in Me, Goals and notes, with one line: "Your goal is only used in the AI's reply when this is on, and goes to your own AI service if you added one." Nothing about a goal reaches an AI until the student turns it on.
- **Distress.** The app does not screen a student's own words for distress today (only the AI's reply is checked, and the safety word in the rules stays). Choosing which words count is a safety decision for the parent, so no word list is invented here; it stays an open question (PROGRESS.md). The off-by-default send switch is the protection until then. The goal is never stored in a reflection line, and the safety word still shows the trusted-adult line.
- **Progress words, checked against what the student did not write.** A reply is rejected if it contains reach, achiev, closer, on track, behind, ahead, succe, fail, improv, better, progress, getting there, or because of, and the student's own goal and answers do not contain that word. So a goal like "get better at math" can be restated, and the app still cannot say the student is getting better. A test uses a goal with a listed word.
- **The goal is read when Done is tapped**, trimmed (whitespace only counts as no goal), so an edit or a clear while the sheet is open takes effect. The goal line can be hidden for good with the show switch, and nothing re-shows it.
- **Third answer.** Saved as "Toward my goal: ..." (student's words, source student, 300 characters, deletable in What the app remembers about me, which already lists reflections). No copy of the goal is stored. Sent to the AI only when the send switch is on.
- **D8.** The weekly look-back row is extended before any code: the goal and the third answer, each quoted, only when the send switch is on and a goal exists, to the student's own service; nothing with the switch off; nothing leaves with Apple's on-device model. The parent confirms before classmates.
- **Tests added.** Older settings load with show on and send off; a goal containing a listed word restates fine, a reply that judges progress is rejected; whitespace-only goal; edit and clear while the sheet is open; the goal never in a saved line; with send off the request messages equal the C5 request exactly; the instructions gain one fixed sentence and are pinned.

