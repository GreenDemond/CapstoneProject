# C7 Fading coach
Status: NOT BUILT 2026-11-24 (gate 1 FIX FIRST found the premise is already true; needs a decision)

## What the student sees and does
1. Nothing is announced. After the student has started with 15 steps they wrote or changed themselves, the assignment screen shows **I'll say my steps** as the main button and **Suggest some to start** as a quiet link, instead of the other way round.
2. Before that, the screen is as it is now. The count only grows. Nothing on screen shows it.

## Research link
`design/slices/COACH-plan.md` section 2 (the coach fades as the student needs it less). Design judgment, to be tested on a phone.

## What it stores
A number in settings: how many steps the student wrote or edited themselves in assignments they started. It is not a line in the record, and no student words are stored. Delete everything clears it. It is not shown and not used for anything except the button order. A step the AI or the starter list made and the student left alone does not count; a step they typed, said, or changed does.

## What leaves the phone
Nothing.

## Distracted, stuck, back after a week
The order is a preference of the screen, not a rule: both buttons are always there.

## Differs from the web app
No.

## Tests
The order flips at 15 and not at 14; an old settings file loads as 0; a suggested step left alone does not count and a changed one does; the count never goes down; no number appears in the assignment screen's source (grep).

## Unverified
Whether 15 is right. Phone check.

## Gates
Gate 1 (semantic_reviewer, 2026-11-24): FIX FIRST. Not built.

## Why this was not built (gate 1)
- The assignment screen already shows **I'll say my steps** as the main button, first, and **Suggest some to start** as the quiet one (T05 chose this on purpose, and `AssignmentView.swift` has it so). C7 as written would flip nothing on the screen.
- A student-visible count that changes the screen, held outside the record, would also strain rule 5 and M4's promise that nothing is hidden. It would need a plain line in "What the app remembers about me" and a way to delete it.
- Decision needed from the parent and Ben: what should "fading" mean? Options: (a) leave it as it is (the quiet Suggest is already the fade); (b) show Suggest as the main button for a new student and quiet it after 15 steps of their own, with a visible, deletable line in M4; (c) drop C7. Recommendation: (a), and mark C7 done as "already true".
