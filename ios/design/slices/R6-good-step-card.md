# R6 Good-step card
Status: approved-by-gate-1 2026-11-26 (after fixes). The parent asked for a rubric to help students make their own steps, and said to look at the research first.

## What the student sees and does
1. On the step editor (every visit, after "I'll say my steps" or "Suggest some", including re-edits), above the list of steps, a quiet card with this fixed text:
   - Title: "What makes a step easy to start"
   - "It starts with something you do, like read, write, list or find."
   - "It's small enough to begin in about two minutes."
   - "For example: Write down what the question asks for."
   - One button: "Got it".
2. "Got it" hides the card for good. There is no automatic fade and no counting.
3. No ticks, no scores, no marks on the student's steps. The card does not look at what the student typed.
4. In Me, in the How I like to work section, a switch "Show step tips" (on at first, id `me-step-tips`). It is the other way to hide or bring back the card. Words in `Words.swift`.
5. This is general advice shown before the student types. The step questions that already exist (S2: "Which part will you do first?" and the too-long question) react to one specific step and stay as they are. The card does not repeat them.

## Research link
- `research/00-knowledge-summary.md` section 4 ("From judgment"), point 6: "Make starting nearly effortless. The first step should take under two minutes." This is design judgment, not research-backed. The card line "about two minutes" is labelled the same.
- Same file, section 4, the caution below point 9: splitting work has good support, but a long list of tiny steps can look worse than the original assignment. So the card never asks for more steps; it says "small enough to begin".
- "Starts with something you do" is design judgment, to be tested. No claim is made that the card helps students write better steps.

## What it stores
One new setting, `stepTipsHidden` (Bool, false at first). An older file with no value, or a damaged one (a string, a number), loads as false. It is in the settings file, so it is in the student's backup when the backup switch is on; it is a screen preference, nothing personal.

## What leaves the phone
Nothing. No AI. The card is fixed words.

## Why no AI part (yet)
An AI that reads the student's steps and says which are good or bad would judge their thinking and brush against rule 2 and the student-does-the-thinking principle, and S2 found the AI's judgement of steps unreliable. The AI helpers that exist already ask one question about one step (the split question) and compare steps to the assignment (Check my steps). Revisit after classmates have used the card.

## Distracted, stuck, back after a week
- Distracted: one button, no required action; the student can scroll past it.
- Stuck: the card is the help; Give me an idea is still there.
- Back after a week: it shows until the student taps Got it or turns the switch off.

## Differs from the web app
Not checked; iOS only.

## Tests
- Logic: `stepTipsHidden` defaults false; Got it sets it; the Me switch sets it both ways; it survives save and reload; an older file and a damaged value load false.
- The card words pass the existing never-shaming words test (they live in `Words.swift`).
- UI main path: plan with "I'll say my steps", the card shows above the steps, tap Got it, it goes, and Start still works. Second path: after Suggest some the card also shows. Awkward path: turn on Show step tips in Me and the card returns on the next editor.
- Device only: how it reads at the largest text size, and that it does not push the steps off the screen.

## Unverified
Whether the card helps a student write better steps. "Design judgment, to be tested" with classmates.

## Gates
- Gate 1, 2026-11-26, independent read-only reviewer (same model family as the Builder): FIX FIRST (7). Applied: research cited by section 4 and labelled design judgment; the three-own-plans fade dropped for Got it plus a Me switch; shorter card text and a note on S2; Me switch named; shows on every editor visit with a UI test for Suggest some; a damaged-setting test; gate 2 required (Storage and student words).
- Gate 2, 2026-11-26, same reviewer: FIX FIRST (3, all in UI tests): open the Me switch through the How I like to work row; check the editor is still open after the Me trip; scroll to controls the card pushed down (two StepReview tests). Applied. The full check had the same three failures before the fixes.
