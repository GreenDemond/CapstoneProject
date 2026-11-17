# Design: home screen (the front door) and saved steps

Status: **being built 2026-11-17** after Ben's go-ahead ("review the converged thing and do it"). Combines three ideas from `design/desktop-examples.html`: open on the next step (idea 2), the step screen with the honest buttons (idea 1), and the calendar kept as a link (idea 3). Reviewed by the Opus advisor on the sketches; its must-fix points are applied below.

## What the student sees and does

1. **Opening the app, with steps saved.** The page shows one thing: a line, the next step in large type, and **Start this step**. Above it is a row of real buttons: Settings, How I like to work, My profile, My calendar. Below are two quiet buttons: **Show all my steps** and **New assignment**.
   - Same day as the last visit: "Pick up where you left off."
   - A day or more later: "Welcome back. Pick up where you left off." It never says how long they were away.
2. **Opening the app with nothing saved** (first visit, or every step finished): the paste screen, as before, with the same row of buttons above it.
3. **Show all my steps** opens a read-only list: finished steps start with a tick, the next one says "(next)". It is hidden until asked for, so the work stays one step at a time (DECISIONS P3).
4. **New assignment** shows the paste form under the card, with a line: "Starting new steps replaces the ones you have saved."
5. **Start this step** opens the work screen at the next step. Done, Still working, Stuck, Drifted, and Later are all the same plain buttons, with the same size and look. Done is not coloured.
6. **The work screen** also has **Show all my steps** (the same read-only list). "Leave my steps" becomes **Back to home** and keeps the steps. The line at the top says "Your steps are saved on this device." only when the browser confirmed the save; otherwise "Your steps could not be saved here, so they will be lost if you close this page."
7. **All steps done.** The steps are cleared when the student taps Close, and the app goes back to the paste screen.

## Research behind it

- Open on the next step, easy return: design judgment, to be tested (`00-knowledge-summary.md` section 4; `05-adhd-ideation.md` "comeback screen" has no direct evidence).
- Check-in buttons that earn the same credit: self-monitoring, Strong (`00` section 2); equal credit, section 3 point 6.
- Steps hidden by default: P3 in DECISIONS, and the warning in `00` section 4 that a long list can make the work look bigger.
- Nothing here claims to treat ADHD or improve attention.

## What data it stores

- A new section `work` in `focusapp.v1` (T3): `{ steps: [{ id, text, done }], nextId, savedOn }`. `savedOn` is a time stamp used only to choose the greeting. Saved on this device only. Saving keeps every other section. The calendar, profile, and AI settings are untouched.
- Damaged or odd data in `work` is ignored one field at a time: the app opens on the paste screen, nothing crashes.

## Distracted, stuck, or back after a week

- **Back after a week:** the same screen as any day, with the "Welcome back" line. No count of days, no "you missed".
- **Refresh or closing the tab in the middle:** the steps and progress are saved after every tap, so the student returns to the same step.
- **Nothing to pick up:** the paste screen, calm, as before.
- **Storage not available** (private browsing, full): the work screen says so plainly. The app still works for this visit.
- **Tapping fast:** the existing 400 ms guard on the work buttons stays.
- **Starting a new assignment by mistake:** the pick-up card stays on screen above the form, so the old steps are one tap away until the new ones are started.

## Not in this slice

- **The margin note** ("From last time: ..."). The advisor pointed out it needs its own design: where it is written, whether it is optional, how long, how it is deleted, and what happens if the text suggests distress (rule 11). It comes next, as its own note.
- **A smaller next step after a long gap.** Design judgment only; not built.
- **The Day/Week calendar redesign** (idea 3 as a full-width week). The calendar stays a link and keeps its existing views.
- **Wide two-column layout.** The page stays one column at every width, with a larger step on wide screens.

## Checklist (AGENTS.md stage 1)

- [x] Breaks no rule. No shame, streak, or day count (rule 2). Nothing leaves the device (rule 4). No claim about ADHD (rule 8).
- [x] Fits DECISIONS.md: P3 (one step at a time), P8 (pick up here), T3 (one key, own section, backup kept), T11 (text as text).
- [x] Not a trap in `05-adhd-ideation.md`.
- [x] The student does the thinking: they choose when to start and when to start something new.
- [x] One thing on screen: the next step and one main button.
- [x] Small enough for one session: no new screen, no new buttons on the work screen except two.
- [x] Advisor review of the sketches done. Advisor review of the built screen still to do.
