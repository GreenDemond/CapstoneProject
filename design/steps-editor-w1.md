# Slice W1: change my steps (web)

Status: built, logic tests pass, **browser tests written but could not be run** (see Testing). Plan pre-approved by the parent ("go do it all", 2026-11-27, `design/web-parity-plan.md`). Student-visible wording below awaits the parent's okay (W-D5).

## What the student sees and does

1. On the steps preview ("Here's a start") there is a new button, **Change my steps**, next to Start.
2. It opens an editor over the steps now on screen. Each step is a text box with buttons: Move up, Move down, Split, Join with the next, Remove.
3. Under a step, a question may appear: "This looks like more than one step. Split it?" (with **Keep step N as one**) or "What is the first small thing you would do for this step?". Questions only; nothing changes by itself.
4. Below the steps: **Add a step**, **Add a Get ready step** (goes first, once), **Add a Put it away step** (goes last, once).
5. **Done changing** returns to the preview with the edited steps; blank steps are dropped. With no steps left it says "Add at least one step to go on." **Leave my steps as they were** drops the edits. Start then runs exactly the steps on screen. Steps not shown yet stay behind them for Show more steps.

## Better splitting (F6 item 4)
Cut at a semicolon, "and then", ", then", "then", "and", or a comma, choosing the cut nearest the middle. A cut that leaves a part under two words is skipped. With no natural break, cut at the middle; a step under four words is not split. Only the student's own words are used; the second part gets a capital first letter.

## Smarter vague-step questions (F6 item 5)
Exact phrases ("study", "finish it") plus a pattern: a general verb with a general object ("study for the test", "do chapter 4", "work on the project"). Specific steps such as "Read chapter 4 and list three terms" are not matched.

## Research
Design judgment, to be tested. The student makes the plan (`DECISIONS.md` P1, "Editing the steps before starting" in PROGRESS "Broken or worrying"). Questions not rewrites follow the iPhone app's S2 rule.

## Data stored
Nothing until Start; Start saves steps as before (`js/storage.js`). Edits live in memory only. A refresh mid-edit goes back to the paste screen.

## Distracted, stuck or away
Nothing times out. Leaving to another screen and back keeps the editor as it was; Show my steps again closes it. Refresh loses unsaved edits (same as the preview today).

## Wording awaiting the parent's okay
Change my steps; Done changing; Leave my steps as they were; Move step N up / down; Split step N; Join step N with the next; Remove step N; Keep step N as one; Add a step; Add a Get ready step; Add a Put it away step; the intro line "Change the words, move a step, split it in two, or add your own. Nothing is saved until you press Start."; the two questions above; "Add at least one step to go on."; the Get ready step "Get ready: gather what you need and clear a space to work"; the Put it away step "Put it away: save your work and put your things away".

## Design review
- Breaks no rule: no shame, no AI, no data leaves the device, student text via textContent/value only. [x]
- Not in the traps list; the student does the thinking; one editor on screen at a time. [x]
- Small enough for one session. [x]

## Testing
`tests/logic/step-editor.test.js` (14 tests, all pass). `tests/browser/steps-editor.spec.js` (5 tests: main path, Keep and Join, remove all / blank / leave, too-short split and refresh, Show my steps closes the editor). **The author's sandbox could not start Chrome (it aborts on launch), so the browser spec has not been run.** It was checked by reading it against the code. Run it first on a normal machine.

Not done here: using the better splitting in the work screen's Drifted step (`js/logic/work.js`), kept for a later change so working code is not touched.
