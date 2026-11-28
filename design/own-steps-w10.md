# W10: Write my own steps as the main path

Status: built; browser tests written but **not run** (Chrome aborts in the author's sandbox). Logic tests pass.

## What the student sees and does

1. On the paste screen the big button is **I'll write my steps**. **Suggest some to start** (the old Show my steps) is the quiet second button. Same order as the iPhone app (AssignmentView, iPhone T05, DECISIONS T5).
2. Pasting is optional and picking a kind is not needed. The step count (3, 5, 8) is ignored on this path.
3. Pressing **I'll write my steps** opens the steps editor (W1) with one empty box, focused. Above the boxes: "What your assignment says" (the H1 lines, if the text has any) and "What you pasted" (the student's own text, scrollable). The live "does each line have a step" box (W5) works as steps are typed.
4. **Done writing** with no step typed: "Add one step first. It can be tiny." and the cursor goes back to the first box. With at least one step, the steps screen (heading "Your steps") shows them, and Start runs them. Two-minute start and Change my steps still work.
5. **Back to the paste box** leaves with nothing saved; the pasted text stays in its box.
6. **Suggest some to start** works as before (kind required, starter steps or the student's own AI helper).

## Research basis

Design judgment, to be tested. It follows the project's rule that the student does the thinking (`AGENTS.md`, Stage 1 review) and DECISIONS T5 (no AI needed). No research claim is made.

## Data stored

Nothing new. Nothing is saved until Start, as with every steps preview. The editor draft lives in memory only.

## Distracted, stuck, away

- Nothing pasted, nothing typed: the editor opens anyway; the only block is the friendly line above.
- Refresh or leaving mid-way: back to the paste screen, nothing lost that was saved, nothing half-saved.
- Pressing the main button twice keeps what was typed.
- Very long pasted text is cut at 6,000 characters with the existing line. A step is cut at 200 characters (W1). Student text is shown with textContent.
- Stuck on what to write: the W1 good-step card and the Suggest button are both one tap away.

## Student-visible wording (for the parent's okay, W-D5)

New:
- "I'll write my steps" (button)
- "Write my steps" (editor heading)
- "What is the first small thing you could do? Type it in the box. It can be tiny. Add more if you like. Nothing is saved until you press Start." (hint)
- "What you pasted" (heading)
- "Done writing" (button)
- "Back to the paste box" (button)
- "Add one step first. It can be tiny." (empty-state line; same words as the iPhone app)
- "Your steps" (heading after writing)

Changed:
- "Show my steps" is now "Suggest some to start" (button), and the AI privacy line says "pressing Suggest some to start sends this text to ...".

## Design review

- [x] Breaks no rule: no shame, no diagnosis, nothing leaves the device, no AI.
- [x] No conflict with DECISIONS (T5 supported). Not a listed trap.
- [x] The student does the thinking.
- [x] One thing at a time: one box, one button to add more.
- [x] Small: reuses the W1 editor.

## Tests

`tests/logic/own-steps.test.js` (8 tests); `tests/browser/own-steps.spec.js` (7 tests, phone and desktop); about 60 older browser tests were moved from the name "Show my steps" to "Suggest some to start".
