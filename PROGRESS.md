# PROGRESS.md

The only memory between sessions. Keep it current; rewrite it, do not let it grow into a diary.

## Working
- AI settings screen (built, switched off): Settings button on the paste screen; add an OpenRouter or other address (http or https; http shows a warning); remove; choose one. The paste screen warns "No AI is set up yet" until a service has a key. Tests: `tests/logic/ai-services.test.js`, `tests/browser/settings.spec.js`.

- **Project setup.** `npm start` serves the app at http://localhost:3000. `npm run check` runs lint, the logic tests, and the browser tests at phone and desktop widths.
- **Paste screen** (`design/paste-and-split.md`). The student pastes an assignment, picks one of six kinds of work, and sees five starter steps, with "Show more steps" for the full list. Numbered and bulleted items in the paste come first. Pasted text is cut at 6,000 characters with a message. Nothing is saved, and Start only confirms the steps are ready.
- **How I like to work** (`design/focus-intake.md`). Four one-tap questions, then a "My first guess" card with a Change button on each line. Nothing is saved; closing clears it. Built 2026-11-16, tested.
- **My profile, first slice** (`design/profile.md`). Goals for today, week, month, and year, plus a list of "What got in the way?" notes. Saved on this device with `js/storage.js` (the first part of build item 5). Damaged saved data is kept as a backup and the page starts fresh. Delete one note, or clear everything after a confirm.
- **Work screen** (`design/work-screen.md`). One step at a time, "Step 2 of 10", with Done, Still working, Stuck (five process hints, one at a time), Drifted (splits the step, same credit as Done), and Later (moves the step to the end). Optional countdown ring at 12 or 25 minutes, with a plain "Time's up" line. Steps are kept on the page only. Ideas from the ADHD Buddy upload, rebuilt in plain JavaScript.
- **AI path, switched off** (`design/ai-path.md`). `server/suggest.js` keeps the key and the hints-only rules on the server, refuses other websites, text over 6,000 characters, and more than 10 requests an hour per visitor, and never logs the text. `js/ai.js` is the only caller. The paste screen shows a "Suggest steps with AI" button and a privacy notice only when the server says it is available. A failure falls back to the starter steps. Tested with a stand-in, not the real service.
- **My calendar, first part** (`design/calendar.md`). Add an item with a due date and time, and see it sorted into Urgent, Significant, Not urgent, Can wait, and Later. Saved on the device in its own section, beside the profile. Delete any item. Not yet: Day, Week, and Month views, and reminders.
- **Calendar notes and links** (`design/calendar.md`). A large notes box (up to 2,000 characters) and up to 10 web links per item. Only https:// links are accepted, and they open in a new tab.
- **Calendar status, weekly log, and parts of life** (`design/calendar.md`). Start, Complete, and Reopen. A neutral weekly count of finished items, with no streaks. Each item tagged School work, Personal, Family, Friends, or Other.
- Logic in `js/logic/`: `clean-text.js` (tidies and limits pasted text), `starter-steps.js` (builds the steps), `focus-intake.js` (questions and card text). All tested.

## In progress
- AI call, step 3 (built, tested with stand-ins; the parent must confirm the wider page rule before classmates use it): Test it, and Suggest steps calls the chosen service from the browser. Design: design/ai-direct.md.
- AI keys, step 2 (built): keys are saved encrypted in this browser (IndexedDB, non-extractable key) and shown only as "••••1234". Settings has a key box, Save key, and Forget key. Next: the Test button and the request to the chosen service (step 3), which needs the page's security rules changed.

Nothing.

## Known gaps

- The intake answers and card are still lost on refresh. Saving them is the next small step.
- The profile does not yet use its goals or notes for suggestions. That is a later slice.
- "Pick up here" after time away (item 5) is not built yet.
- The intake does not yet use its answers anywhere. The trial that tests them is version 2.
- The dedicated `advisor` agent (`.claude/agents/advisor.md`) was not loaded in the last session. A general Opus agent was used for the review instead. Restart the session to load it.

## Broken or worrying

- **`web-app/` is a leftover from an earlier attempt.** It's React and TypeScript, which DECISIONS.md T1 does not allow. It's excluded from git and from lint. Ben needs to say whether to delete it. `SETUP.md` step 6 still describes building it and should be ignored.
- **Editing the steps is not built yet.** The design note splits it into a second session: add, delete, reorder, and merge. The screen says "Changing these steps is coming next."
- **Starter steps are not yet tested with students.** They were written from the research (process steps only, no answers). Ask testers whether they fit each kind of work.
- None of the instructions in `AGENTS.md` have been tried in a full loop yet. This session was the second. If a rule turns out to be unclear or unworkable, fix the rule and note it in `DECISIONS.md`.
- Most research was read at abstract level. Items marked *(not read)* or **(confirm)** in `01-evidence.md` and `02-platform-and-privacy.md` are unchecked.

## Waiting on

**Ben**

- **OpenRouter account (Ben, as an adult; free, no card).** Sign up, block training for free and paid models, create a key, and keep it private. Then an agent picks a free model on a zero-retention or safety-retention provider (DECISIONS change log, 2026-11-17).
- Whether to delete the `web-app/` folder (see above).
- The app's name. The page is titled "Focus app" for now.
- How progress is shown: pet rock, quest map, or build-a-picture.
- The words for drifting, getting stuck, and coming back.
- Colors and overall look. Placeholder colors are in `css/styles.css`.
- Work screen: how Drifted should behave when the rest of the step is left out (see `design/work-screen.md`), button words, the five hints, and saving the steps.
- Photo of handwritten notes organized into priority: needs an outside reader (T8 or T2), so a parent decision.
- Learning the student's habits to set priority: needs a design and a parent decision (it means watching how students work).
- Conversation mode (the app asks about the plan for the day): waits on the AI path.
- PDFs on calendar items: keep only the file name (no change to storage), or store the files on the device (a storage redesign, T3).
- Push notifications that arrive with the app closed: need a push service run by a large company and a server, so a parent decision (T2, T7). Until then, reminders show only while the app is open.
- Whether the paste screen's six kinds and their starter steps read well (see the manual checks).
- The words for coming back (the Q4 answers and the card line "When I come back"). Placeholder wording is in place.

**Parent**

- Hosting. GitHub Pages could serve the app for free, since version 1 is only static files. Hosting is the parent's decision (DECISIONS T7). Not needed until the app is ready for testers.
- Whether to publish beyond the beta group, and whether to add the AI path (needs an OpenRouter key). Not needed for version 1.
- Teacher approval and written parent permission before classmates use the app.

## Next

In order. Each is one session or less. Each feature starts with a design note in `design/`.

1. ~~Set up the project.~~ Done.
2. ~~Paste and split, first part: paste, kind, starter steps.~~ Done.
3. **Paste and split, second part: editing.** Edit a step's words, delete, reorder, add, and merge. Needs a short design note and Ben's go-ahead. Then the Start button leads to step 4.
4. **Work screen.** One step at a time, "step 3 of 7", and the four buttons: Done, Still working, Stuck, Drifted.
5. **Saving and coming back.** Profile saving is done. Still to do: the intake card saved, progress through the steps saved, and the "pick up here" button after a day or more away.
6. **Weekly goal and progress display.**
7. **Save to file and load from file.**

After that, with Ben: the recall question, polish, and a phone-width pass. The AI path comes last, and only if the parent sets up a key.
