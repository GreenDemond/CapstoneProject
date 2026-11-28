# Slice W13: Plan tab steps and thoughts, tabs that leave a sub-view, Load a copy and the welcome note (web)

Status: built. Logic tests pass (`tests/logic/plan.test.js`). **The browser spec `tests/browser/plan-tab.spec.js` was written but NOT run**: Chrome aborts on launch (SIGABRT) in the build sandbox, tried once with a temporary config. Please run the whole suite first. Wording below awaits the parent's okay.

## Part (a): Plan tab parity
The iPhone Plan tab (`PlanListView`, `ios/App/FocusApp/NextStepView.swift`) lists every step of the current assignment with done marks, then "Saved thoughts" (parked thoughts and recall answers, newest first, each with a date and a Delete that asks first), or "No steps yet." with a "Make some steps" button. The web Plan tab is the calendar, so the same things now sit **under the calendar** on that screen. This was small: the data already exists (`loadWork`, `loadParked`, `loadRecall`), so no new storage. Not copied: the weekly look-back card (home already has it, W11).

What the student sees on Plan, below the calendar:
1. "All my steps": the steps in order; a finished step ends with "(done)".
2. If nothing is saved: "No steps yet." and **Make some steps** (goes to home). The button shows only when there are no saved thoughts either, as on iPhone.
3. "Saved thoughts": saved thoughts and recall answers, newest first, each with a short date (for example "Nov 18") and **Take this out**. Pressing it turns that row into "Take this one out?" with **Yes, take it out** and **No, leave it**. Nothing is deleted on the first tap.
4. Taking one out updates the home screen's "Thoughts you set aside" list.

## Part (b): a tab press inside a sub-view
Before, a tab press looked for a "Back to home" button on the current screen. Sub-views without one (What the app remembers, Look it up opened from another screen, a Settings step) left the press doing nothing. Now `backToHome` in `js/screens/tabs.js` uses `chooseBack` (`js/logic/tabs.js`): it presses "Back to home" if there is one, otherwise the first visible button that starts with "Back", and repeats (up to 8 presses) until home. If "Back to home" is pressed and the screen stays (the profile's unsaved-changes warning), it stops and the student stays, as before. Only visible buttons are considered.

## Part (c): Load a copy and the welcome note
Loading a copy replaced the whole saved data, which dropped the "welcome note hidden" flag, so the note came back. `importSections` (`js/storage.js`) now always writes `welcome: { seen: true }`: someone loading a copy has used the app before. The flag is still not part of Save a copy. Delete everything still removes it (the note comes back after a full delete, which is a fresh start).

## Research link
None needed; navigation and listing the student's own saved words. Design judgment, to be tested. Parity with the iPhone Plan tab.

## Data stored
Nothing new. Reads `work`, `parked`, `recall`. Writes `parked` or `recall` only when a thought is taken out. `welcome` is written on Load a copy.

## Away and distracted cases
Nothing time-based and no counts. Back after a week: the same lists, no day counts. Damaged or missing data: empty lists and "No steps yet." (tested). Double tap: the first tap only asks. Refresh: the question is not kept, nothing is deleted.

## Design review (AGENTS.md Stage 1)
- Breaks a rule? No: no shame, no counts, no diagnosis, data stays on the device, student text with `textContent`, no AI.
- Conflicts with `DECISIONS.md`? No: storage only through `js/storage.js`, no packages.
- A trap in `05-adhd-ideation.md`? No.
- Student does the thinking? Yes, it only shows their own words.
- One thing at a time? The Plan screen gets longer; the sections sit under the calendar and are plain lists. Judgment, to be tested at phone width.
- Small? Yes.

## Not done / not checked
Browser spec unrun. The step list is read-only (changing steps stays in Change my steps). The tab fallback stops after 8 presses if a screen's Back buttons loop.

## Student-visible wording (awaits the parent's okay)
All my steps; (done); No steps yet.; Make some steps; Saved thoughts; Take this out (screen reader: same); Take this one out?; Yes, take it out; No, leave it. Part (b) and (c) add no new words. Wording copied from the iPhone app except the three button words, changed so none is a part of an existing button name.
