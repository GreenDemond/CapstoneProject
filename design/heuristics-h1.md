# H1: Suggestions from the pasted text (no AI)

Slice H1 of `design/web-parity-plan.md`. Mirrors iPhone `FEATURES.md` F6 items 1, 2 and 3. Status: design, wording awaiting the parent's okay.

## What the student sees and does

1. On the paste screen the student pastes the assignment. If the text clearly points at one kind of work and the student has not picked a kind, a line appears under the kind buttons: **"Looks like: Essay."** with a button **"Use this"**. Tapping it picks the kind. Nothing is picked for them. If the student picks a kind themselves, the line goes away.
2. After **Show my steps**, the steps screen shows the steps as before. If the pasted text contains lines that say what the finished work must have (a length, a number of sources, "include", "must", "cite", "due"), a box above the steps shows them under **"What your assignment says"**, with the line **"Copied from what you pasted. Does each one have a step?"** The lines are the student's own words, copied exactly.
3. If the text says something like "Answer questions 1-10" or "problems 1 to 20", the steps include chunks: "Do questions 1 to 2", "Do questions 3 to 4", and so on, up to the number of steps shown first (5). The student edits or removes them like any step.

## Research support

None of these claims an effect on attention or learning. They save the student typing and point at the instructions, which `00-knowledge-summary.md` lists as part of splitting a task (starting is the hard part; students doing the splitting themselves is supported in `research/` as quoted in root `DECISIONS.md` T5). The requirement box is a prompt for the student to check their own plan, which fits "the student does the thinking". Design judgment, to be tested with classmates.

## What it stores

Nothing new. The suggestion and the requirement lines are computed from the text on screen each time and are not saved.

## Distracted, stuck, back after a week

- Nothing pasted: no suggestion, no box, same message as today.
- Nonsense pasted: no suggestion, no box, starter steps as today.
- Leaving mid-step: nothing was stored, nothing is lost beyond what the app already keeps.
- Back after a week: unchanged; these only run on the paste screen.

## Rules for the logic (fail closed)

- Kind: counts distinct keyword hits per kind. A kind is suggested only if one kind has strictly the most hits. A tie or no hits gives no suggestion.
- Requirements: split the text into lines and sentences, keep those containing a cue word or a number-plus-unit. **Every returned line must be an exact piece of the pasted text.** At most 6 lines, each at most 200 characters; longer ones are skipped, never cut.
- Chunks: only when the text has no numbered or bulleted lines of its own, and only for one clear range like "questions 1-10". If there are two different ranges, or "odd" or "even" follows, or fewer than 2 or more than 200 items, no chunks. Steps start with "Do", a process verb, and never include answers.
- No function throws on empty, huge, or odd text.

## Review checklist (stage 1)

- [x] Breaks no rule: no answers written, no shame wording, no data stored or sent, no comparison.
- [x] Conflicts with `DECISIONS.md`: no. T1 (plain JS), T3 (nothing new stored), T5 (no-AI path).
- [x] Listed as a trap in `05-adhd-ideation.md` or "Things to avoid"? Not found: it does not reward, track or compare. Rechecked while writing the code.
- [x] The student does the thinking: they confirm the kind, and the requirement box asks a question rather than checking for them.
- [x] Seconds to use, one thing at a time: one line under the kind buttons, one box on the steps screen.
- [x] Small enough for one session.

## Student-visible words for the parent to approve

- `Looks like: <kind>.` and button `Use this`
- `What your assignment says`
- `Copied from what you pasted. Does each one have a step?`
- Chunk steps: `Do questions 1 to 2`, `Do problem 5`

## How it is tested

A fixture file (`tests/fixtures/assignments.json`, written for this project, no student data) lists assignments with the expected kind, requirement lines and chunks. Logic tests run it, plus properties: requirement lines are always substrings of the input; no throw on empty, 100,000 characters, emoji or control characters. A browser test pastes text and checks the suggestion line and the requirement box, at phone and desktop width.
