# S3 Check the steps against the assignment
Status: done 2026-11-24 (gates 1 and 2 applied; full check passed)

## What the student sees and does
1. In the editor, under the steps, a link: "Check my steps against the assignment". It appears only when an AI is available and there is assignment text.
2. On a tap, the app asks the AI for the requirements the assignment states (for example "Include a graph of your data"). Only lines whose words appear, whole word for whole word and in order, in the assignment are kept, at most six. If the AI gave lines but none passed, the student sees: "I couldn't read the assignment's list clearly. Check it yourself."
3. For each requirement that no step covers, the app shows: `The assignment mentions "<line>". Is that in your steps yet?` The list is recomputed live from the steps, so adding or editing a step updates it without another tap.
4. If every requirement is covered: "Every part the assignment names has a step." If the AI says there is nothing to list: "The assignment doesn't list anything extra to check."
5. With no AI, nothing shows. The link never runs by itself; it runs only on a tap.

## Research link
`research/08-phone-ai.md` sections 9 and 10: the AI's requirement list was reliable when every line is kept only if it appears in the assignment and the app checks coverage itself. Design judgment for the wording, to be tested on a phone.

## What it stores
Nothing. The requirement lines and the check result are held in memory for the editing session and cleared when the assignment text changes.

## What leaves the phone
Only the assignment text, the fixed rules, the model name, the thinking setting and the service's key (Authorization header), sent once per tap, to whichever AI the student chose; a 400 that names the thinking setting sends the same messages once more without it. Apple's on-device model sends nothing. The D8 row for the student's own service names this check (DECISIONS, 2026-11-24). The parent must confirm it before classmates use it.

A guardrail stop shows the trusted-adult line, as for steps (rule 11).

## Distracted, stuck, back after a week
- Distracted: the check runs only on a tap; nothing happens by itself.
- Stuck: a double tap makes one call. A changed assignment hides the old result.
- Back after a week: the result is not kept.

## Differs from the web app
No.

## Rules, as fixed after gate 1
- A line is kept only if its words appear whole, in order, in the assignment (token match, not substring). "rap" does not match "paragraph".
- A requirement is covered only when one step contains ALL of its key words (whole words, four or more letters, not on the stop list). "Collect data" does not cover "Include a graph of your data".
- The stop list includes common instruction verbs: find, write, describe, include, explain, use, show, list, provide, cite, answer.
- A failed or unclear result never reads as 'nothing to check'.

## Tests
- Logic: lines not in the assignment are dropped; "NOTHING" gives no requirements; the safety word gives the trusted-adult line; a failure gives unavailable and sends nothing; lines that all fail the check give the unclear outcome; at most six; whole-word matching ("rap" in "paragraph" is refused); coverage needs all key words in one step ("Collect data" does not cover a graph requirement); "500" covers "500 words"; a changed assignment makes the result nil; a double tap makes one call; no AI means the link does not appear.
- UI (fake AI, scripted): a step without the named part shows the question; adding a step with it removes the question.
- Eval (Mac only): `StepsEval` prints requirements for the same assignments; pass: the lab report finds the graph line; the essay finds a sources line; the distress assignment gives the trusted-adult line or nothing.
- Device: device-check step 92.
- Live recompute: the list updates as steps change; no tap needed after the first check.

## Unverified
Whether the model copies requirements reliably across assignments. The eval shows a few; a phone check is needed.

## Gates
Gate 1 (semantic_reviewer, 2026-11-24): FIX FIRST, six must-fix, all applied above (coverage needs all key words; whole-word line match; guardrail gives the trusted-adult line; unclear outcome separate from nothing; D8 row written; live recompute). Suggested softer wording adopted. Second round not run separately; gate 2 on the diff covers these.
Eval (Mac, `research/phone-ai-eval/steps/I-2026-11-24-requirements.txt`): lab report gives Graph and Data (lines copied from the assignment, weaker wording than the full sentence); essay gives the sources line; distress gives the trusted-adult line.
Gate 2 (semantic_reviewer, 2026-11-24): FIX FIRST, four must-fix, applied: safety line shown even if the text changes during the call; result hidden when the AI is off; D8 row lists the thinking setting and the 400 resend; design note matches. Suggestion applied: plural matching (sources/source). Suggestion noted: number words (three/3) do not match.
Gate 3: full check/check.sh ALL CHECKS PASSED on the final code (501 unit tests, UI tests, 0 SKIPPED). No fresh-context Checker was run for S3; the parent may ask for one.
