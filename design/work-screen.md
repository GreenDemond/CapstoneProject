# Design: work screen

Status: **proposed, waiting for Ben's go-ahead.** Not built yet.

## What this is

After the student has their steps (from **Start** on the paste screen), this screen takes them through the steps one at a time. It shows one step, four buttons for how it went, and a count such as "Step 3 of 7."

This is the third item on the build list, and the first of the "bones": the core loop that the rest of the app builds on.

## What the student sees and does

1. **The step.** Heading "Step 3 of 7," then the step's text in large type. Nothing else on the screen except the four buttons.
2. **Four buttons,** with the words from the defaults in DECISIONS P4:
   - **Done.** The step counts as finished. The next step appears.
   - **Still working.** The same step stays on screen. A gentle line appears: "Keep going. Tap any button when you're ready."
   - **Stuck.** Opens a short hint card (see below). The step stays on screen.
   - **Drifted.** Splits the step (see below). The first part counts as finished, the same credit as Done (DECISIONS P5).
3. **Stuck hint card.** Shows one hint at a time from a fixed list, in plain words. Each hint is a way to start, never the answer. Buttons: **Another hint** and **Back to the step**. The list:
   - "Re-read the instructions and underline the verb."
   - "Write down what you already know about this step, in one line."
   - "Do only the first two minutes of it, then stop."
   - "Ask a teacher or classmate what part is unclear."
   - "Look at the example in your notes or book, then close it and try."
   The list is the same for every kind of work. The AI path (later, if approved) is the only place that would fit hints to the text.
4. **Drifted.** The step is split into two parts on screen:
   - Step 3 is marked done, and the count goes up as with Done.
   - A new step appears with the same text in a box, labelled "Start with the smallest part of this." The student edits it to a smaller part, then taps **Start this part.**
   If the student leaves the box as it is, the step is kept whole, as it was.
5. **All done.** When every step is done (or drifted), the screen says "All your steps are done." with one button, **Close**. No score, no count of misses, no streak.

Wording rules: no red, no "missed," no timer, no sound, no ranking. The count says "Step 3 of 7," not "3 of 7 done." Drifted and Done look the same in the count.

## Research behind it

- **Splitting work into pieces:** the student makes the split, not the app (Bikic et al. 2017, Strong; `00-knowledge-summary.md` section 2). The Drifted split is the student's own edit.
- **One step at a time:** design judgment, to be tested. P3 in DECISIONS.
- **Honest reporting:** Drifted earns the same credit as Done (P5), so students are not pushed to tap Done when they didn't finish (`00-knowledge-summary.md` section 3, point 6).
- **Stuck gives hints, not answers:** P6 and rule 1. The hint list is process help only.
- **Immediate feedback:** the buttons respond at once; no waiting (`00-knowledge-summary.md` section 4, point 2).
- **No streak or time pressure:** P7, and "Things to avoid" in `00-knowledge-summary.md` section 5.

## What data it stores

- In this slice, nothing is saved. The steps and the count live on the page only. A refresh starts the steps again from the paste screen.
- Saving progress through the steps is the next part of item 5 (T3, in `focusapp.v1`, in its own section that the profile save keeps intact). "Pick up here" after time away is also later.

## Distracted, stuck, or back after a week

- **Leaves in the middle (Back, or refresh):** the steps are lost in this slice. The page says so at the start of the screen: "Your steps are kept only while this page stays open."
- **Taps Drifted with an empty box:** the step is kept whole and the count is not changed. Nothing is lost.
- **Taps buttons quickly:** each tap acts once. A second tap while the next step is loading does nothing.
- **Stuck many times on one step:** the hint card keeps offering hints, and after the last one it says "That's all the hints for now. Try the first small part, or Still working." No judgment.
- **Back after a week:** not in this slice. Steps are not kept, so there is nothing to show.
- **Reduced motion:** the step changes without animation when the device asks for it (T12).

## Checklist (AGENTS.md stage 1)

- [x] Breaks no rule. Hints are process help only (rule 1). No shame, no streak (rule 2). No data leaves the device (T8).
- [x] Fits DECISIONS.md: P3 (one step, "Step 3 of 7"), P4 (four buttons), P5 (Drifted splits and earns Done's credit), P6 (Stuck gives hints, not answers), T11 (text as text), T12 (phone width).
- [x] Not on the trap list. No speed bonus, no streak, no reset.
- [x] The student does the thinking: they edit the split, and they choose which hint to read.
- [x] One thing on screen at a time: the step and four buttons.
- [x] Small enough for one session: one screen, a fixed hint list, and tests. No saving in this slice.
- [ ] Advisor review pending.

## Decisions for Ben

1. **Button words.** The defaults are Done, Still working, Stuck, Drifted (DECISIONS P4). You still have to choose "the words for drifting, getting stuck, and coming back" (`PROGRESS.md` waiting list). Keep the defaults for now, or give me your words?
2. **Hint list.** Is the list of five hints right, or do you want different ones?
3. **Saving the steps.** This slice keeps the steps on the page only, so a refresh starts over. OK to add saving in the next slice, with "Pick up here" after time away?

## Added from the ADHD Buddy upload (2026-11-17)

Ideas taken from the MIT-licensed "ADHD Buddy" app. Code is not copied; the ideas are rebuilt in plain JavaScript.

1. **Gentle card with one optional button.** Used for the "Pick up here" message and for "Start with the smallest part." Calm colors, no red, one button at most. Judgment: not tested.
2. **"Later" as a button.** A step can be moved to the end of the list with no penalty and no count. It is different from Drifted, which splits the step. Judgment: not tested. Adds a fifth button, so it needs Ben's decision (see below).
3. **Countdown ring for the current step.** An optional ring that counts down a time the student chooses (for example, 12 or 25 minutes, the two block lengths from the intake). It can be turned off. **Research:** thin. One study reported secondhand found no gain in test scores from a visible timer, and some reduction in math anxiety, but the original papers could not be checked (`https://www.timetimer.com/blogs/news/a-guide-to-time-blindness-what-it-is-and-how-to-manage-it-with-visual-tools` quotes it). The app will not claim the ring helps. It is labelled "design judgment, to be tested." Ring shows time left, never a red warning at the end: when time runs out, the card says "Time's up. Keep going, or tap Still working."
4. **Mood check-in.** See `design/mood-check-in.md`. Not in this build.

Decisions for Ben, in addition to the three above:
- **Fifth button:** add "Later" beside Done, Still working, Stuck, and Drifted, or leave it out?
- **Countdown ring:** on by default, or off until the student turns it on?
