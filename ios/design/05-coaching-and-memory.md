# 5. Coaching and memory: the design

Written 2026-11-22. This is the fifth design file, alongside `01` to `04`. It describes the AI coaching layer and the learner record as one system, so a Builder can see how the pieces fit before taking a slice. The slice-by-slice detail is in `slices/COACH-plan.md` and `slices/MEMORY-plan.md`; the ordered task list is `TASKS-coaching.md`; the test strategy is `slices/COACH-MEMORY-testing.md`. Research: `research/07-ai-coaching.md`.

## 5.1 What it is for

The app is a partner to one person. It does not know or care about a diagnosis. Its job is to notice, with the student, what conditions help that person get schoolwork done, and to run a few small AI "moves" that ask rather than tell. Over time it remembers what the student tried and what they said about it, and it uses only the few lines that fit the moment.

Three promises, each a rule from `AGENTS.md` section 0 made concrete:

1. The AI never does the student's thinking. Every AI line is one question or one small piece of the student's own plan, checked in code before it is shown. (Rule 1.)
2. The record describes conditions and work, never the person. No attention, focus, mood-as-measure, effort, diagnosis, name or school. The student sees every line and can delete any. (Rules 2, 3, 5.)
3. Nothing leaves the phone that `DECISIONS.md` D8 does not list. The record lines a move is shown count as the student's own words and go only where their chosen AI goes. (Rule 4.)

## 5.2 The shape

```
                 ┌──────────────────────────────────────────────┐
                 │  Shared/content.json                          │
                 │  coach.common + coach.moves.<key>.rules/sees  │
                 └──────────────┬───────────────────────────────┘
                                │ fixed instructions
 learner record ──► selector ──► CoachMove.run ──► check in code ──► one line, or nothing
 (learner.json)    (≤5 lines)    (one call)        (shape, safety,       │
      ▲                                             answer guard)        ▼
      │                                                            screen / speech
      └──────────── feedback 👍 😐 👎  ◄───────────────────────────────┘
```

- **Moves** are the only places the AI speaks. Six at first, one or two more later. Each has one fixed prompt, one output shape, one check, a `NOTHING` option and a non-AI fallback. The app decides when a move runs, from state it trusts (hint count, step, course), never from the student's words.
- **The learner record** is written by the app from what the student does, and by the student directly. The AI never writes to it. One move, "check a hunch", turns a pattern the app noticed into a yes/no question; only a Yes becomes a record line.
- **The selector** gives each move at most five lines it is allowed to see. Rules first (same course, same tag). Then on-phone semantic search over the record, so a step worded differently from a past bad one is still found. No server, no third-party code.
- **Feedback** is three equal buttons under every AI line. It feeds the record and tunes how eagerly each move's AI output is shown. It never changes a prompt.

## 5.3 The moves

| Key | Where | One line of | Ceiling set by code | Fallback |
|---|---|---|---|---|
| `stuckQuestion` | Stuck ladder, after the first hint | a question about the next small thing to try | at most 2 per step | fixed question |
| `splitNudge` | Editor, when a step holds two jobs | a question about whether to split | once per step | "This looks like two steps. Split it?" |
| `comebackSlice` | Today, after a day or more away | the smallest first piece of the unfinished step | only after a gap; must pass the process-step check and add no new nouns | first half of the step |
| `settingFollowUp` | After "did that help?" | a question suggesting one small change | only on Shorter/Longer | fixed question |
| `tidyQuestion` | Ask a person | the student's three lines as one question | must keep the student's words | the three lines joined |
| `weeklyReflection` | Plan, weekly | restate one thing the student said, then one question | first sentence may contain no new nouns | "Noted. Same two questions next week." |
| `checkHunch` | Me, at most once a week | a yes/no question about a pattern seen 3 times | only when a pattern exists | none (no hunch, no question) |

Step suggestions ("Suggest some to start", "Give me an idea") stay as they are, but gain facts from the selector: the kept steps from the last assignment in the same course.

## 5.4 The learner record

Six kinds of entry, each with a date, plain text, a source (`app`, `student`, `confirmed`) and fixed tags. Details, caps and examples: `slices/MEMORY-plan.md` section 2.

| Kind | Written by | What for |
|---|---|---|
| setting | app, summarised | which settings held up ("25 min: too long, 3 of 4") |
| pattern | student confirms a hunch | what helps, in plain words |
| obstacle | student | what got in the way |
| reflection | student | the weekly two answers |
| course | app + student | per class: kept steps, where stuck, dread vs crux |
| feedback | student | thumbs on AI lines |

**Courses.** The student may type a class label once per assignment ("History"). Assignments in a class build on each other, so the record keeps, per course, the steps the student kept last time and where they got stuck. The next assignment in that course starts from them.

## 5.5 What the student sees

- **Under every AI line:** 👍 Helped · 😐 Meh · 👎 Not this, equal size, one tap. After 👎 or 😐, an optional "Why?" box.
- **A collapsed row "What the AI knew"** under each AI line, listing the exact record lines it was shown. Never a hidden prompt.
- **Me → How I work:** the whole record in the student's words, newest first, delete per line. One sentence at the top says what it is and that the AI sees only a few lines at a time.
- **Nothing else changes.** No new tab, no chart, no score, no streak.

## 5.6 What leaves the phone

Nothing new when the on-phone AI is in use. When the student has chosen their own AI service, the move's prompt and its selected record lines (≤5, ≤600 characters) go to that service, like any chat message. This needs one new D8 row (recorded in `DECISIONS.md`, 2026-11-22). Vectors, distances, counts and feedback never leave.

## 5.7 How it stays small

Caps per kind; summaries instead of raw taps; a per-move allow-list; a hard 5-line, 600-character budget in the runner, oldest dropped first. Semantic search is a linear scan over a few hundred vectors on the phone. No vector database, graph or cloud retrieval, for at least a year.

## 5.8 What it will not do

- Give answers, finished text, or the content of the work.
- Praise, grade, or comment on effort, attention or focus.
- Judge whether a step is done or right.
- Speak while a step is in progress.
- Infer anything about the person. Every record line comes from a tap or words the student can see.
- Rank or compare. The record is one person's, shown to that person.

## 5.9 Research behind it, and its limits

`research/07-ai-coaching.md`. In short: guarded AI kept the learning gain in the one classroom trial (Moderate); checks must live in code, not prompts; help should be a ladder with a code-set ceiling; support should rise when the student stalls and fade when they act; models over-intervene so silence must be an output; the on-phone model wants one simple task per prompt. The ADHD coaching methods with evidence (self-monitoring, goal plus if-then plan, breaking work into pieces) are already in the app; the AI's job is to run them well. **None of this is tested with students with ADHD**, and much of the AI-tutoring work is simulation. Every move is "built, not cleared" until the answer-giving checks (T14) have been run for it on a real phone.

## 5.10 Decisions recorded for this design

See `DECISIONS.md` change log, 2026-11-22: D8 row for record lines sent to a chosen AI service; course labels may be stored; feedback buttons appear under chat replies too; the "partner, not diagnosis" stance.
