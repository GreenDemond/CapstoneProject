# W5 Check my steps against the assignment (no AI, word matching)
Status: built 2026-11-27. Browser tests written, **not run** (Chrome aborts on launch in this sandbox). Plan pre-approved by the parent ("go do it all", `design/web-parity-plan.md`).

Ideas from the iPhone app's S3 and S2 notes (read only). Nothing is imported from `ios/`.

## What the student sees and does
1. After Show my steps, if the pasted text had lines that say what the work must have (the "What your assignment says" box), a button appears: "Check my steps against the assignment". With no such lines there is no button and nothing is said.
2. On a tap, for each assignment line with no step that contains all of its key words, the student sees: `The assignment says "<line>"` and the question "Is this covered by a step?". If every line is matched: "Every line you checked has a step with its words in it." Always followed by: "This is from matching words, not from understanding your work."
3. In Change my steps, a section "Lines from your assignment" shows the same result and updates as the student types, moves, splits or removes steps. No tap needed.
4. The old check result is cleared whenever the steps are redrawn.

## How the matching works
A line's key words are its whole words of four or more letters (and any number), minus a stop list (common small words and instruction verbs such as include, write, find, cite), with a trailing "s" folded ("sources" matches "source"). A line is covered only if one step contains ALL of its key words. Lines with no key word are skipped. Number words (three, 3) do not match each other. "5" does not match "500".

## Research link
None directly. Design judgment, to be tested. It sorts and compares the student's own words and never judges the work (AGENTS.md rules 1, 2, 8).

## Stores
Nothing.

## Distracted, stuck, away a week
Nothing runs by itself; the button is a tap. Nothing is kept, so there is nothing to come back to.

## Review checklist (AGENTS.md Stage 1)
- Breaks a rule? No: no AI, no shame (an uncovered line is a question, never red or "missing"), nothing stored or sent, no claim about attention.
- Conflicts with DECISIONS.md? No (T1, T5, T8, T11 held; student text via textContent only).
- A listed trap? No.
- Student does the thinking? Yes: the app only asks; it never writes or edits a step.
- Fast, one thing at a time? One tap, one short list (at most six lines).
- Small enough? Yes.

## Student-visible wording (awaiting the parent's okay, W-D5)
- Check my steps against the assignment
- The assignment says "..."
- Is this covered by a step?
- Every line you checked has a step with its words in it.
- This is from matching words, not from understanding your work.
- Lines from your assignment

## Tests
- Logic: `tests/logic/step-check.test.js` with `tests/fixtures/step-checks.json` (covered, open, plural, all-words-in-one-step, number, substring is not a match, skipped short lines, empty input, bad input, six-line cap, long input). Pass.
- Browser: `tests/browser/step-check.spec.js` (main path with live editor update, no-lines path, html in a line plus double tap and refresh, damaged storage). **Not run.** Read against the code by hand. New button name does not substring-collide with existing ones.
- Not tested: a real phone, screen reader, that the editor's live region is read out well.

## Differences from the iPhone app
No AI-extracted lines, so only the lines the heuristic finds are checked. Plain word matching only.
