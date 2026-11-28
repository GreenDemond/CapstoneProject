# M1 Rule selector
Status: done 2026-11-24

## What the student sees and does
Nothing new on screen. When the student taps **Ask me a question** on the Stuck sheet, the question can now use the student's own saved words: up to two of their recorded patterns tagged "stuck" or "starting", and one line for the same class, if they gave one. The question still comes from the same fixed rules and the same checks. M3 later shows these lines under "What the AI knew".

## Research link
`design/slices/MEMORY-plan.md` section 3.1 (rules first, no search). The reason to use the student's own words is the same as for the existing Stuck question: a question that fits their pattern is likelier to be useful. Design judgment, to be tested on a phone.

## What it stores
Nothing new. It only reads `learner.json`.

## What leaves the phone
Nothing new for Apple's on-device model. With the student's own AI service, the same Stuck request now carries up to five short lines from the record, quoted as information. The D8 row for "Ask me a question on Stuck" is extended to say so (DECISIONS 2026-11-24); parent to confirm before classmates. Lines are the student's own words or plain app summaries (never a diagnosis; the record's own rules).

## Distracted, stuck, back after a week
Unchanged. An empty record sends exactly what was sent before.

## Differs from the web app
No (the web app has no record).

## How it works
- `coach.moves.<key>.sees` in `Shared/content.json` lists, per move, which kind of record line it may see, with which tags, how many, and whether only for the current class. `stuckQuestion`: patterns tagged stuck or starting (2), course line for this class (1). `splitNudge`: nothing. A move with no `sees` rule sees nothing.
- `LearnerSelector` (pure) picks the lines: newest first per rule, no duplicates, at most 5 lines and 600 UTF-16 characters in all, oldest dropped first. Each line is quoted with the same helper as every other student word.
- The Stuck question may use words from the lines it was given, so it can refer to the student's own words and nothing else.

## Tests
Allow-list per move (every move has a `sees` list; the split nudge sees nothing; an unknown move sees nothing); stuck question sees only stuck/starting patterns and this class's course line; another class's line, obstacles, settings and feedback never; class label compared without case; newest two patterns; budget by lines and by characters; quoting; the request text has the record lines before the ask; an empty record sends nothing extra. All in `LearnerSelectorTests`.

## Unverified
Whether the question reads better with the record lines, on a real model. Phone check later (T14-C).

## Gates
Gate 1 and gate 2: combined, run on the finished diff, because the code was written before this note. This departs from `ios/AGENTS.md` section 3; it is recorded here and in DECISIONS 2026-11-24.
Verdict (fresh read-only agent, `semantic_reviewer`, 2026-11-24): FIX FIRST, five must-fix, all applied: D8 row now names earlier steps and the kind of work; verdict and departure recorded; only pattern-line words widen what the question may say (course-line words never do, because they may be the AI's steps), with tests for both; the allow-list rows are pinned and checked against a record holding every kind and tag; the empty-record test now compares the whole request. Suggestion not taken: dropping by rule priority instead of oldest first.
For classmate builds: M4 (How I work) must exist first, so a student can see and delete each line.
Gate 3: full `checks/check.sh` ALL CHECKS PASSED (518 unit tests, UI tests, 0 SKIPPED) on the iPhone 15 Pro Max simulator. No fresh-context Checker was run.
