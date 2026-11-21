# T05 Assignment and editor
Status: built 2026-11-20 (compile-checked; UI tests not run)

## What the student sees and does
1. Today with no steps asks "What's the assignment?": a text box (paste or type), six kinds, 3, 5 or 8 steps.
2. **I'll say my steps** (the filled button; it fits the research best) or **Suggest some to start** (outlined). Both need some words in the box; otherwise one calm line appears and nothing changes.
3. I'll say my steps: "What's the first small thing you could do? It can be tiny." One step at a time by typing (voice arrives in T09), then **That's all**.
4. Suggest: starter steps (pasted list items first, then the kind's starters, cut to the chosen number) open in the editor.
5. Editor: change words, drag to reorder ("Move steps"), swipe to delete, Add a step, Split, Join with next, an optional "How will I know it's done?" line, Add a Get ready step, Add a Put it away step. A step with " and " (or very long) gets "This looks like two steps. Split it?" Yes splits; No leaves it and the question does not return.
6. **Start** saves the steps and opens the work screen.

## Research link
`DECISIONS.md` P1, P2, P12; `research/04` D2; design judgment where marked (which way is first, the nudge). Ben has not yet chosen which way comes first or whether a suggested step must be changed; this slice follows the recommendations (say-first; must see the editor, not must change).

## What it stores
`draft.json` (assignment words, kind, step count, steps in the editor, answered nudges), saved after every change, removed on Start. `work.json` gains an optional `doneLines` map. Nothing personal.

## What leaves the phone
Nothing.

## Distracted, stuck, back after a week
Closing the app in the editor and reopening brings back the same screen and steps (tested at model level). Pasted text of 10,000 characters is cut at 6,000 with a line saying so.

## Differs from the web app
The student makes or edits the steps first (P1). Starter steps never go straight to the work screen: `PlannerModel.start()` only works from the editor stage (tested).

## Tests
Logic (`PlannerTests`, 20): nothing entered; suggested opens the editor; Start only from the editor; Start twice starts once; pasted list; 10,000 characters; saying by typing; nudge and No; split and join; one word cannot split; reorder, delete, add; every step deleted; spaces-only step; Get ready and Put it away once; done line; draft survives reopening; failed save keeps the steps; damaged draft file.
UI (`PlanningUITests`): suggest-through-editor to the work screen; typing three steps to the work screen; nothing entered. Written and compiled, **not run**.

## Unverified
How the list, the keyboard and the drag handle behave on a real screen. Whether "Move steps" is clear enough for Ben.

## Gates
No Advisor available; self-review only. Gate 2 owed (words a student reads).
