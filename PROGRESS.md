# PROGRESS.md

The only memory between sessions. Keep it current; rewrite it, do not let it grow into a diary.

## Working

- **Project setup** (next item 1 done, 2026-11-16). `npm start` serves an empty "Focus app" page at http://localhost:3000. `npm run check` passes: lint, 2 logic tests, and 4 browser tests (phone and desktop widths).
- `js/logic/clean-text.js`: tidies pasted text (trims lines, collapses blank lines). Tested.

## In progress

Nothing.

## Broken or worrying

- **`web-app/` is a leftover from an earlier attempt.** It's React and TypeScript, which DECISIONS.md T1 does not allow. It's excluded from git and from lint. Ben needs to say whether to delete it. `SETUP.md` step 6 still describes building it and should be ignored.
- None of the instructions in `AGENTS.md` have been tried in a full loop yet. The setup session was the first. If a rule turns out to be unclear or unworkable, fix the rule and note it in `DECISIONS.md`.
- Most research was read at abstract level. Items marked *(not read)* or **(confirm)** in `01-evidence.md` and `02-platform-and-privacy.md` are unchecked.

## Waiting on

**Ben**

- Whether to delete the `web-app/` folder (see above).
- The app's name. The page is titled "Focus app" for now.
- How progress is shown: pet rock, quest map, or build-a-picture.
- The words for drifting, getting stuck, and coming back.
- Colors and overall look. Placeholder colors are in `css/styles.css`.

**Parent**

- Hosting. Arranged privately; not needed until the app is ready for testers.
- Whether to add the AI path, and the OpenRouter key if so. Not needed for version 1.
- Teacher approval and written parent permission before classmates use the app.

## Next

In order. Each is one session or less. Each feature starts with a design note in `design/`.

1. ~~Set up the project.~~ Done.
2. **Paste and split.** Needs a design note first. The student picks the kind of assignment, pastes the text, and gets a starter list of steps to edit, merge, reorder, and add to. No AI.
3. **Work screen.** One step at a time, "step 3 of 7", and the four buttons: Done, Still working, Stuck, Drifted.
4. **Saving and coming back.** Progress survives a refresh. After a day or more away, the app opens to one "pick up here" button.
5. **Weekly goal and progress display.**
6. **Save to file and load from file.**

After that, with Ben: the recall question, polish, and a phone-width pass. The AI path comes last, and only if the parent sets up a key.
