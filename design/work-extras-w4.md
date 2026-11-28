# Slice W4: work screen extras (web)

Status: built. Logic tests pass and lint is clean. **The browser tests (`tests/browser/work-extras.spec.js`) are written but were NOT run**: Google Chrome aborts on launch in the build sandbox. Please run them, and the whole suite, before classmates see this. Plan pre-approved by the parent ("go do it all", 2026-11-27, `design/web-parity-plan.md`). Student-visible wording below awaits the parent's okay (W-D5).

## What the student sees and does

**1. The Stuck sheet** (extends the five hints that already exist; nothing is removed).
1. Stuck shows "Stuck is okay." and the first hint, as before, with **Another hint** and **Back to the step**.
2. After two hints (or after the last hint if there are fewer left) a block **Ask a person** appears under the hint: a line "A person can help most. Fill this in, then copy it or show it." and three boxes, **I'm on:** (starts with the step's words, the student may change it), **I tried:**, **I don't get:**, then **Copy my question**.
3. Copy puts the three lines on the clipboard, using only what the student typed, and says "Copied." If the student wrote nothing in I tried and I don't get, nothing is copied and a calm line says "Write a little in I tried or I don't get first." If the browser refuses the clipboard, the question appears in a box to select and copy.
4. What the student typed is kept while they ask for more hints and when they go Back to the step and Stuck again. It starts empty on a new step. It is kept in memory only.
5. The iPhone app's two quiet lines "Look it up" and "Talk it through" are left out: Look it up is W8, Talk it through is the existing Talk screen.

**2. Park a thought.** On the step screen a button **Park a thought** opens a small box "A thought for later" and **Save thought** (Enter also saves). "Saved for later." appears and the box empties so the student goes back to the step. Up to five parked thoughts show underneath, each with **Remove**. Blank is refused ("Write a few words first."). The step, the count and the timer are not touched.

**3. Recall question.** After **Done** on a step, when the student picked **Reading** or **Studying for a test**, the screen shows "One thing you just learned?" with a box, **Save answer** and **Skip**, and "In your own words. Nothing is graded, and you can skip." The answer is the student's own words. The app never shows a right answer, never marks it and never uses it. Skip, or a blank Save (which asks once for a few words and keeps the card), goes on. After the last step it goes on to "All your steps are done." It is not asked after other kinds of work, or after Drifted.

## Research link
- Hints only, never answers: AGENTS.md rule 1, `DECISIONS.md` P6. Ask a person has the student word the question; the app writes nothing for them.
- Recall: `01-evidence.md` line 62 (Knouse et al. 2016, self-testing helps with and without ADHD, moderate, college students) and `04-design-and-gamification-ideas.md` D10 ("One-line recall"). Free recall counts. Not asked after every kind of work: only reading and studying (same as the iPhone app). The effect is shown for college students and is not shown to help a student with ADHD more; no claim is made in the app.
- Park a thought: `04-design-and-gamification-ideas.md` D7 (parking lot), marked [Judgment]. Design judgment, to be tested.
- Reading Alpha School and Montessori notes was not needed.

## Ideas read, not imported (W-D4)
`ios/design/slices/T07-stuck-ladder.md` (Ask a person, three boxes, copy), `ios/App/FocusApp/WorkView.swift` and `AppModel.swift` (park box, recall card, recall only for reading and test-prep). Nothing from `ios/` is imported or changed.

## What it stores
Two new sections in `js/storage.js` (`parked`, `recall`), each a list, each loaded through `normalizeParked` / `normalizeRecall` in `js/logic/work-extras.js` so a damaged section loads as an empty list and bad items drop one by one. Parked: up to 50 items of up to 300 characters, `{id, text, date}`. Recall: up to 200 of up to 500 characters, `{id, answer, date, stepId?}`. Ask a person boxes: not stored. Everything stays on the device (rule 4).

**Not yet built, owed to W6/W7:** a screen to read all parked thoughts and recall answers back and delete them ("What the app remembers"), and removal from Export / Delete everything. Until then the student can remove a parked thought from the work screen (up to the latest five show), but cannot yet see or delete saved recall answers. Rule 5 (student owns their data) is only partly met until W6/W7; please do not give this to classmates before then, or tell them it is a first version.

## Safety (rule 11)
The web app has no check of the student's own typed text for danger or distress, and none of these three boxes sends text anywhere or to any AI. Nothing is analysed. The same open question exists in the iPhone app (`ios/design/coaching-roadmap-plan.md`, waiting on the parent): how student-written danger or distress is handled locally. Flagged for the parent.

## Distracted, stuck, away
- Distracted: every extra is optional and folded or skippable; Park a thought gets the thought out of the head in one line and leaves the step as it was.
- Stuck: Ask a person is for exactly this; it only shows after two hints so the first help stays small.
- Back after a week: the work screen opens as before. Nothing is waiting for the student; a recall question that was open when the page was refreshed is simply not asked again.
- Refresh mid-way: parked thoughts and saved answers are kept; the Ask a person boxes and an unsaved recall answer are lost.

## Wording awaiting the parent's okay
Stuck is okay. · Ask a person · A person can help most. Fill this in, then copy it or show it. · I'm on: · I tried: · I don't get: · Copy my question · Copied. · Write a little in I tried or I don't get first. · Copying did not work here. Select the text above and copy it. · Park a thought · A thought for later · Save thought · Saved for later. · Write a few words first. · That could not be saved here, so it will be lost if you close this page. · Remove · One thing you just learned? · In your own words. Nothing is graded, and you can skip. · Save answer · Skip · Write a few words, or tap Skip. · That could not be saved here. Tap Skip to go on.

## Design review (AGENTS.md)
- Breaks any rule 1 to 11? No. Hints only (rule 1); no shame, nothing red or counted (2); no diagnosis (3); data stays on the device (4); no reports out (5); Skip and Save both carry on without a different reward (6, no reward at all for recall); no comparison (7); no claim about attention or recall improving (8); no secrets (9); not a brain-training game (10). Rule 11 is the open point above.
- Conflicts with `DECISIONS.md`? No new service, package or AI call (T1, T5).
- A listed trap in `05-adhd-ideation.md`? No timed recall races, no streaks. Recall is never timed.
- Student does the thinking? Yes: all three extras are the student's own words.
- Seconds, one thing on screen? Park and Ask are folded or shown only after two hints; recall is one box and two buttons on its own card.
- Small enough for one session? Yes.

## Testing
- Logic (`tests/logic/work-extras.test.js`, passing): recall only for reading and test-prep; add, trim, cap and remove for parked thoughts; recall answers with and without a step id; damaged saved lists drop bad items; Ask a person timing; the question uses only the student's words and is empty when blank; save, reload and damaged-storage round trips.
- Browser (`tests/browser/work-extras.spec.js`, 10 tests, phone and desktop projects): **written and read against the code, NOT run.** Main path and awkward path for each extra (empty, blank, failed copy, tags in text, damaged storage, half-typed thought kept across a redraw, refresh while the recall card is open, last step).
- Existing work-screen tests were reasoned through, not run: new buttons are Park a thought, Save thought, Remove, Copy my question, Save answer, Skip, none of which contains "Done", "Stuck", "Later" or "Still working", so substring locators still match one button; the Essay-only existing tests never reach the recall card; `.current-step` is used for the recall question, which only exists in recall mode.
- Not tested: a real phone, a real clipboard, a screen reader.

## Differences from the iPhone app
No Look it up or Talk it through lines in the sheet. Ask a person needs words in I tried or I don't get (the iPhone app counts the prefilled step). Parked thoughts can be removed on the work screen at once, with no confirm.
