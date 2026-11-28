# PROMPTS.md

Copy-and-paste start messages for agent sessions on the coaching and memory work. Open the `ios/` folder as the project before pasting. One task per session.

Which prompt to use:

| Situation | Prompt |
|---|---|
| The very first coaching task, C0 | Prompt 1 |
| Any later task, Sonnet-class Builder | Prompt 2 |
| Any later task, Haiku-class Builder | Prompt 3 |
| You want a review only (no code) | Prompt 4 |
| A task in `TASKS-steps-me.md` (Haiku or Sonnet) | Prompt 5 |

**Which tasks for which model.** Sonnet: any task in `TASKS-coaching.md`. Haiku: C2, R5, C7, M4 now; C1, C4, C6, C9 once C0 and C1 exist as examples to copy. Not Haiku: C0, M0, M1, M2, C3, C5, C8. T14-C needs a person and a phone.

**The reviewer.** Gates 1, 2 and 5 must go to an independent, stronger model than the Builder. In Kiro that is the `semantic_reviewer` agent; in Claude Code it is the `ios-advisor` agent in `.claude/agents/`; elsewhere, the strongest read-only model available. The Builder must name the reviewer's model in its report.

---

## Prompt 1: the first task, C0 (Sonnet or stronger)

```
Open the folder ios/ as the project. Read, in this order: AGENTS.md (all
of it, including section 14), DECISIONS.md (the change log for 2026-11-22),
PROGRESS.md, TASKS-coaching.md, design/05-coaching-and-memory.md,
design/slices/COACH-plan.md section 0, and
design/slices/COACH-MEMORY-testing.md sections 1, 3, 5 and 11.

You are the Builder. Your task is C0 in TASKS-coaching.md: the move runner,
the shape check, and the content keys. Do only C0.

Before you change anything:
1. Run git status. If anything under ios/ is uncommitted, stop and report.
2. Run checks/check.sh from ios/. Note the result. If it fails, fixing that
   is your task instead; report and stop after fixing it.

Ask before you guess (gate 5). Whenever you are about to pick an Apple API
you have not found in the kit, choose between two files or documents that
seem to disagree, decide what a test should assert, or settle a reply
shape, ceiling or fallback without being sure, stop and brief the
independent reviewer with "GATE: 5 doubt" using the shape in AGENTS.md
section 5. Do the same for anything about what leaves the phone, the
Keychain or the safety word. The trigger list is in TASKS-coaching.md under
"When to ask a stronger model". Record each question and answer in the
slice note under Gates.

Then follow AGENTS.md section 3 exactly:
3. Set C0 to `in progress` in TASKS-coaching.md.
4. Write design/slices/C0-move-runner.md using the template in AGENTS.md
   section 6. Put the exact text of coach.common from COACH-plan.md
   section 0.4 in the note. Do not reword it.
5. Gate 1: ask the independent reviewer for a design review. Paste its
   verdict line and model name into the note. Fix every must-fix. Do not
   start code before the verdict.
6. Write the failing tests first: Tests/FocusKitTests/CoachMoveTests.swift
   with the table-driven shape test (Testing file section 3) and the
   fallback tests (section 5), and the ContentTests addition. Then build
   AI/CoachMove.swift, move quoted() to CoachText, and add Content.Coach
   plus the "coach" object in Shared/content.json in the same commit.
7. Self-review against AGENTS.md section 7.
8. Gate 2: ask the same independent reviewer to answer the three questions
   in Testing file section 11, in writing. Paste the verdict and the
   reviewer's model name into the note. Fix every must-fix.
9. Run checks/check.sh. Everything must pass; a skipped UI run is reported
   as skipped, not as passing.
10. One commit, plain message. Then set C0 to `done` in TASKS-coaching.md
    with the date and the Checker's lines, rewrite PROGRESS.md "Next",
    and add a DECISIONS.md change-log line saying content.json gained the
    coach keys.

Rules throughout: edit only files named in C0's Build line plus the note,
the tests, TASKS-coaching.md, PROGRESS.md and DECISIONS.md; no view
changes; no print, try!, or force-unwraps on stored or model data; no
third-party code; prompt and fallback text comes from content.json, never
from Swift. If the same fix fails twice, stop and ask (gate 3). If you
would need a decision DECISIONS.md does not record, ask one clear question
and stop.

Finish with the report in AGENTS.md section 12. State plainly whether the
gate-2 reviewer was a different model from you.
```

---

## Prompt 2: any later task (Sonnet-class Builder)

```
Open the folder ios/ as the project. Read AGENTS.md (including section
14), DECISIONS.md, PROGRESS.md and TASKS-coaching.md. You are the Builder.

Pre-flight; stop and report if any fails: (1) git status shows nothing
uncommitted under ios/; (2) the first task marked `ready` in
TASKS-coaching.md has every task in its Depends-on column marked `done`;
(3) checks/check.sh passes.

Ask before you guess (gate 5). Whenever you are about to pick an Apple API
you have not found in the kit, choose between two files or documents that
seem to disagree, decide what a test should assert, or settle a reply
shape, ceiling or fallback without being sure, stop and brief the
independent reviewer with "GATE: 5 doubt" using the shape in AGENTS.md
section 5. Do the same for anything about what leaves the phone, the
Keychain or the safety word. The trigger list is in TASKS-coaching.md under
"When to ask a stronger model". Record each question and answer in the
slice note under Gates.

Take that one task and do only it, following AGENTS.md section 3. Read
every file on its Read line, then the matching section of
design/slices/COACH-plan.md or MEMORY-plan.md, then the sections of
design/slices/COACH-MEMORY-testing.md it names. For any move, copy the
structure of C1 (LadderModel.askQuestion and its tests) rather than
designing anew, and use the prompt wording from COACH-plan.md exactly.
Write the design note, get gate 1 from the independent reviewer, write the
tests from the Testing file without weakening them, build, self-review,
get gate 2 from the same reviewer with written answers to the three
questions in Testing section 11, run checks/check.sh, commit once, update
TASKS-coaching.md, PROGRESS.md and DECISIONS.md. Edit only files the
task's Build line names plus those five. Stop and ask on the second failed
fix or any missing decision. Report per AGENTS.md section 12 and say
whether the reviewer was a different model.
```

---

## Prompt 3: any later task (Haiku-class Builder)

```
Read AGENTS.md section 14, then PROGRESS.md "Next", then TASKS-coaching.md.
You are the Builder.

Do these checks first and stop if any fails: (1) git status shows nothing
uncommitted under ios/; (2) the first task marked `ready` has every task
in its Depends-on column marked `done`; (3) that task is one Haiku may
take (see the table at the top of PROMPTS.md); (4) checks/check.sh passes.

Then do only that one task. Read every file on its Read line. Write the
design note from the template in AGENTS.md section 6 and STOP: ask for a
gate-1 review from a stronger model before writing any code. Paste the
verdict into the note.

Copy the tests named in design/slices/COACH-MEMORY-testing.md for this task
without changing them. Use prompt wording from design/slices/COACH-plan.md
exactly. For a move, copy the structure of LadderModel.askQuestion and its
tests from C1. Edit only files named in the task's Build line, plus the
note, TASKS-coaching.md, PROGRESS.md and DECISIONS.md.

Whenever you are not sure which file to change, which API to use, what a
test should assert, or what a line should say, STOP and ask the stronger
model with "GATE: 5 doubt" (brief shape in AGENTS.md section 5). Do not
guess. Record the question and answer in the note.

When done, ask for a gate-2 review from the stronger model, paste the
verdict into the note, run checks/check.sh, and report in the form in
AGENTS.md section 12. Never mark a task done yourself; the Checker does
that.
```

---

## Prompt 4: review only (a stronger model, read-only)

Use this to get a gate-1, gate-2 or gate-5 verdict when the Builder cannot call a reviewer itself. Fill the bracketed parts.

```
You are the Advisor for the iPhone app in ios/. Read-only: do not edit any
file. Read AGENTS.md sections 0 and 4, DECISIONS.md, and
design/slices/COACH-MEMORY-testing.md section 11.

ROLE: Advisor
GATE: [1 design | 2 diff | 5 doubt]
TASK: [task id and name from TASKS-coaching.md]
READ: design/slices/[note].md
      [for gate 2: the output of `git diff <last commit>`]
      [the plan section: design/slices/COACH-plan.md or MEMORY-plan.md]
QUESTION: [one sentence]
I AM UNSURE ABOUT: [one or two things]

For gate 2, answer these three in writing before the verdict: (a) Can any
AI text reach the screen, the speaker or storage before CoachMove.check has
passed it? (b) Is every ceiling computed from state the app trusts, never
from the student's words? (c) Does every move have a non-AI fallback that
is shown on every failure?

Return exactly one verdict in the form in AGENTS.md section 4: GO; FIX
FIRST with a numbered must-fix list (at most seven, each with file and
line and what the student would see go wrong) and a separate suggestions
list; or STOP: ASK A PERSON with who and the one question. Name your model.
```

---

## Prompt 5: a task in TASKS-steps-me.md (Haiku-class or stronger)

```
Open the folder ios/ as the project. Read AGENTS.md sections 3 to 8 and
14, then PROGRESS.md, then TASKS-steps-me.md from the top through the
task you take. You are the Builder.

Pre-flight; stop and report if any fails:
1. git status shows nothing uncommitted under ios/ (untracked files
   outside ios/ are fine).
2. Pick the first task in the Status table of TASKS-steps-me.md whose
   status is `ready`, or `waiting` with every Depends-on task `done`.
   Take only that task.
3. Run checks/check.sh detached, as TASKS-steps-me.md "Rules for every
   task here" shows, and wait for its `exit` line. If it fails, report the
   failing test names and stop.

Then:
4. Set the task to `in progress` in TASKS-steps-me.md.
5. Write design/slices/<task-id>-<name>.md (the name is in the task's
   Done-when line) with the template in AGENTS.md section 6. Copy the
   task's "What the student sees", files, words and tests into it. Do not
   invent anything the task does not say.
6. Gate 1: ask the independent reviewer (semantic_reviewer in Kiro) to
   review the note against the task text. Paste its verdict and model
   into the note. Fix every must-fix. If a must-fix changes what the task
   says, stop and ask a person. Ben's go-ahead is waived for these tasks
   by the parent (TASKS-steps-me.md, rules); do not stop to ask him.
7. Write the tests the task lists first, then the code, exactly as the
   task's code shape says. Format and lint.
8. Run the unit tests (cd FocusKit && swift test, detached). Fix until
   they pass. Never weaken or delete an existing test.
9. Gate 2: ask the same reviewer to review the diff and answer any
   questions the task lists for gate 2. Paste the verdict. Fix every
   must-fix.
10. Run checks/check.sh detached until it passes in one full run. Do not
    run two simulator jobs at once.
11. Gate 3: start a fresh read-only Checker with no summary of your work
    (ios-checker in Claude Code; in Kiro a fresh general-task-execution
    agent told it is read-only and given the body of
    .claude/agents/ios-checker.md and the task id). It runs check.sh and
    checks each Done-when line. If it reports a FAIL, fix and repeat.
12. One commit with a plain message. Set the task to `done` in
    TASKS-steps-me.md with the date and the Checker's lines, unchanged. Add
    the device check steps to checks/device-checks.md. Rewrite the "Next"
    part of PROGRESS.md. Add the DECISIONS.md lines the task names.

Stop and ask, never guess (gate 5), when: a file, function or identifier
the task names does not exist or looks different; a test the task gives
fails and the reason is not your own mistake; the eval in a task misses
its pass conditions; anything would change what leaves the phone or the
safety line. Brief the reviewer with "GATE: 5 doubt" in the shape in
AGENTS.md section 5 and record the answer in the note. If the same fix
fails twice, stop (gate 3).

Do not push, do not build for or install on a phone, do not archive.
Finish with the report in AGENTS.md section 12, and say whether the
reviewer was a different model from you.
```

---

## After each session

Check the report for these before starting the next session:

- The gate-2 reviewer was a different model from the Builder.
- `checks/check.sh` passed, or the skipped part is named.
- One commit; `TASKS-coaching.md` shows the task `done` with the Checker's lines.
- The slice note has verdict lines for gates 1 and 2, and any gate-5 questions.
- No file outside the task's Build line changed without a reason in the note.

If any is missing, do not start the next task; ask the Builder to finish this one.
