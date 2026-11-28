# Slice W6: Looking back (web)

Status: built. Logic tests pass and lint is clean. **The browser tests (`tests/browser/looking-back.spec.js`) are written but were NOT run**: Google Chrome aborts on launch in the build sandbox. Please run them, and the whole suite, before classmates see this. Plan pre-approved by the parent ("go do it all", 2026-11-27, `design/web-parity-plan.md`). Student-visible wording is listed at the end and awaits the parent's okay (W-D5).

## What the student sees and does

**1. Did that help?** (idea from iPhone R5, changed to fit the web app). After a step is finished with Done or Drifted, a quiet card sits on the next step (or under Close after the last step): "Did that way of working help?" with **It helped**, **A bit**, **Not really** and **Not now**. One tap saves a mark and shows "Noted." Not now, or ignoring the card, costs nothing and nothing waits on it. The mark remembers only the answer and whether a 12 or 25 minute countdown was on (or none). The iPhone card asks about the countdown length only; the web has no 5-minute length, so it asks about the way of working as a whole.

**2. What I did.** A new button **What I did** in the top row on the home screen opens a screen with:
- **The last 30 days**: plain counts, zero lines left out: "N steps finished", "N steps made smaller, then finished", "N thoughts parked for later", "N things you wrote down after reading or studying". With nothing: "Nothing yet. After you work on a step, you'll see it here."
- Done and Drifted both count as a step finished, the same (rule 6). The "made smaller" line is information, not a second score.
- No streak, no percentage, no target, no "days missed", no comparison (rules 2, 7). A gap of weeks changes nothing but the 30-day counts.

**3. Your week.** Under the counts, fixed lines chosen from the student's own last seven days (no AI): "You finished N steps.", "N steps started big and got smaller. That counts too.", "Working with a 12-minute countdown helped N times." (the way that helped most often, ties to the shorter), "Some ways of working did not help. That is useful to know." (only when every mark was Not really), "You set N thoughts aside to come back to.", "You wrote down N things you learned, in your own words." A quiet week reads "A quiet week. One small step is a fine place to start, whenever you like." Then "This is only what you did. It is not a grade, and days away are not counted." The iPhone weekly reflection (two questions, saved answers) is not built: its value there is the AI reply; the fixed look-back above takes its place.

**4. What the app remembers.** A button on that screen opens the list of everything the app has saved about the student, on this device only: **Thoughts I parked**, **What I wrote after reading or studying** (recall answers), **Did that help?** marks (as "Working with a 12-minute countdown: helped"), **Notes from My profile**, and **Steps I finished** (one line, the count behind What I did). Each line has its own **Delete** (accessible name "Delete: <the line>"), "Deleted." confirms, and if the browser did not confirm the save the line stays with "That didn't delete. Try again." **Delete all of this** asks once more ("Delete all of this? It can't be undone.", **Yes, delete it all** / **No, keep it**) and clears all of the above. Goals stay: "My goals are kept in My profile, where you can change or clear them." This fills the gap W4 flagged (saved parked thoughts and recall answers had no screen), so rule 5 is met for everything the app saves apart from goals, chats and calendar items, which already have their own screens and deletes (W7 will add Export and Delete everything).

## Research link
- Self-monitoring with feedback on one's own behaviour is a supported shape; the app only shows counts of what happened, never says the student is improving: `ios/design/slices/PROG1-how-its-going.md` (read only), `00-knowledge-summary.md` section 6. Wording is design judgment, to be tested with students.
- Trying and asking afterwards rather than relying on a questionnaire: idea from `ios/design/slices/R5-did-that-help.md`, which cites `ROADMAP.md` item 5. No claim is made in the app that it helps.
- Open learner model so no hidden profile exists: `ios/design/slices/M4-what-the-app-learned.md` (idea only). Nothing is imported from `ios/`.

## Design review (AGENTS.md Stage 1)
- Breaks a rule? No. No streak or reset (2), no diagnosis (3), nothing leaves the device (4), no report to anyone (5), Drifted counts as Done (6), no comparison (7), no ADHD claim (8).
- Conflicts with `DECISIONS.md`? No new service, no AI call (T5), storage only through `js/storage.js` (T3), text only as text (T11).
- A listed trap? Not a streak, reward shower or leaderboard (`05-adhd-ideation.md`). The counts could turn into a scorecard (the PROG1 gate 1 concern), so there is one 30 day window, no target and no arrows.
- Does the student do the thinking? Yes: the app counts what they did and shows their own words; it writes nothing for them.
- Seconds, one thing on screen? The help card is four buttons on a step; the screens are short lists.
- Small enough? Yes.

## What it stores
Two new sections in `js/storage.js`, each loaded through a checking function in `js/logic/looking-back.js` so a damaged section loads as an empty list and bad items drop one by one:
- `moments`: `{id, kind: "done" | "drifted", date}`, up to 400, newest first. One per finished step.
- `helps`: `{id, answer: "yes" | "bit" | "no", timer: 0 | 12 | 25, date}`, up to 100.
Existing sections read: `parked`, `recall` (W4) and profile notes. `deleteRemembered()` clears the four lists and keeps the profile; the profile notes are deleted through two new exports of `js/screens/profile.js` (`profileNotes`, `deleteProfileNote`) so the profile screen's copy in memory does not bring them back. Deleting a note from here also saves any goals already typed into the profile's in-memory copy; that is harmless.
A student who finished steps before this slice has no counts for them.

## Distracted, stuck, back after a week
- Distracted: the card never blocks; Not now or just carrying on removes it.
- Stuck or drifting: the card is not shown while those screens are open; it comes back on the step view.
- Back after a week: the 30 day counts and the week lines simply show what happened; a quiet week gets a kind line, with no missed days.
- Refresh: marks and counts are saved when tapped or finished; the card itself is not shown again after a refresh.

## Safety (rule 11)
Nothing here takes new free text. The notes and thoughts listed are the student's earlier words, shown as text. The open question about checking typed text for distress (W4 note) is unchanged.

## Tests
- `tests/logic/looking-back.test.js` (14 tests) and four new tests in `tests/logic/storage.test.js`: adding and capping, damaged data, counts across 30/7/1 days with old, future and undated entries, Done and Drifted counted the same, weekly lines (full week, only "no" marks, tie, quiet week, gap of 60 days), no judging words, saving beside other sections, delete-all keeping the profile, a refused save returning false. `npm run test:logic`: 376 passed. `npm run lint`: clean.
- `tests/browser/looking-back.spec.js` (11 tests, phone and desktop): help card save, Not now and ignore, Drifted, countdown length stored, empty screen, counts after Done and Drifted and refresh, damaged storage, lists as plain text, one delete, delete all with Keep it and Yes, thought deleted shows empty on the work screen. **Not run.** I read each against the code but could not execute them. Existing tests were checked for name clashes: new button names (It helped, A bit, Not really, Not now, What I did, What the app remembers, Delete: ..., Delete all of this, Yes, delete it all, No, keep it, Back to What I did) contain none of the words the existing non-exact locators use (Done, Stuck, Drifted, Start, Save, Back to home, Cancel, Essay, Settings). "Back to What I did" contains "Back" but only exists on a screen no other test opens.

## Not tested
Everything in a browser, including focus after a delete, phone width and keyboard use. Those need a real browser; see `tests/manual-checks.md`.

## Wording awaiting the parent's okay
"Did that way of working help?", "It helped", "A bit", "Not really", "Not now", "Noted.", "That could not be saved here. You can tap Not now.", "What I did", "The last 30 days", "Your week", the count lines above, the week lines above, "This is only what you did. It is not a grade, and days away are not counted.", "What the app remembers", "This is everything the app has saved about you, on this device only. Delete anything you like.", the group names, "Deleted.", "That didn't delete. Try again.", "Delete all of this", "Delete all of this? It can't be undone.", "Yes, delete it all", "No, keep it", "Everything is deleted.", "Some of it didn't delete. Try again.", "My goals are kept in My profile, where you can change or clear them.", "Nothing yet. After you work on a step, you'll see it here.", "Nothing yet. As you use the app, the things you save will show up here."
