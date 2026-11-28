# T06 Today and the work screen
Status: built 2026-11-20 (compile-checked; UI tests not run)

## What the student sees and does
1. Today with steps: a welcome line ("Pick up where you left off." or, on a later day, "Welcome back. Pick up where you left off."), the next step in large type, **Start this step**, and two quiet links: All my steps, New assignment. When everything is done: "That's today done." and "A good time to close the app."
2. **Start this step** opens a full-screen work screen (the tab bar is hidden). "Step 2 of 5" small, the step large, the optional "Done when:" line, then five buttons of the same size and style in a fixed two-column grid: Done, Still working, Stuck, Drifted, Later. None is filled.
3. Done: "Nice. On to the next one." and the next step. After a reading or test-practice step, one optional question: "One thing you just learned?" (Save or Skip).
4. Still working: "Okay. Keep going." Nothing changes.
5. Stuck: opens the ladder (T07). Nothing changes.
6. Drifted: asks "What smaller piece can you start with?"; the student writes it; the step is split, the first part is shown, "Good catch." A blank box changes nothing and says so calmly.
7. Later: the step goes to the end and the app returns to Today. If it is the only step left it stays, with a line saying so.
8. Park a thought (folded away), a silent optional timer (12 or 25 minutes, a shrinking ring read from the clock), and a close button back to Today. No sound, pop-up or prompt during a step.

## Research link
`DECISIONS.md` P3, P4, P5, P8, P9, P11; `design/02` 2.6, 2.7, 2.11; `research/05` section 4. The five buttons are equal so no answer is "right" (rule 6).

## What it stores
`work.json` after every tap (steps, kind, last-used date, done-when lines); `flags.json` (on the work screen or not); `parked.json`; `recall.json`. No audio, name, age, school or diagnosis.

## What leaves the phone
Nothing.

## Distracted, stuck, back after a week
After a day or more, Today shows the welcome-back line and nothing about how long. The app reopens on the same step (`flags.inStep`). The timer reads the clock, so it is right after the phone slept.

## Differs from the web app
Drifted asks for the smaller piece in a box instead of splitting automatically (the web logic needs the words, `cases/work.json`). Full-screen cover instead of a page.

## Tests
Logic (`AppModelTests`): each of the five buttons; double tap counted once (same step, and straight after on the next step); Drifted blank; Later with one step left; all done; recall offered after reading and kept for the last step; kill and reopen returns to the same step; a week away gives the welcome-back line with no number; parked thought; the screens' text and the shared words contain none of missed, behind, late, overdue, failed, day(s) (one seeded starter step, "Check what you missed", is exempted and listed below).
UI (`WorkUITests`): all five buttons through to "That's today done."; no shame words on Today and work. **Written and compiled, not run.**
The five buttons use one `ChoiceGrid` and one button style, so they cannot differ; no screenshot could be made here.

## Unverified
Layout at the largest text size and on the smallest iPhone; the haptic; the timer ring; that the recall sheet and the work cover present cleanly together. Device checks added.

## Open item
The shared starter step "Check what you missed" (test practice) uses a word on the banned list. It is about the material, not the student's days, but it is shared content (`Shared/content.json`, `cases/starter-steps.json`). Left unchanged; the parent or Ben can pick other words.

## Gates
No Advisor available; self-review only. Gate 2 owed (words a student reads).
