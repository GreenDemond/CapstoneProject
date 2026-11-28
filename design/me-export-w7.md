# Slice W7: Me screen, Save a copy, Load a copy, Delete everything (web)

Status: built. Logic tests pass (`tests/logic/backup.test.js`) and lint is clean. **The browser tests (`tests/browser/me-export.spec.js`) are written but were NOT run**: Google Chrome aborts on launch in the build sandbox. Please run them, and the whole suite, before classmates see this. Plan pre-approved by the parent ("go do it all", 2026-11-27, `design/web-parity-plan.md`). Student-visible wording is listed at the end and awaits the parent's okay (W-D5).

## What the student sees and does

1. A new home button **Me and my data** opens one screen (W3 can later move it into a tab). Top to bottom:
   - **My things**: buttons for My profile, How I like to work, My calendar, What I did, What the app remembers, Settings. Each opens the screen that already exists.
   - **Save a copy of my data**: says it makes a file the student keeps, that nothing is sent anywhere, and that AI keys and AI helper settings are never in it. A tick box "Also put my saved chats in the copy" is off at the start (T4). The button downloads `focus-app-copy-YYYY-MM-DD.json`. The app cannot see where the browser puts it, so it says to look in Downloads.
   - **Load a copy**: a file chooser. The file is checked first. A bad file changes nothing and the screen says why in plain words, then "Nothing was changed." A good file shows what it holds as counts ("1 parked thought", "3 calendar items", never the student's text), says "Loading it replaces what is saved on this device. Your AI helpers and keys stay as they are.", and asks with a second tap: **Yes, replace what is saved** / **No, keep what I have**. After Yes the page reloads (screens read saved data only when the page opens, so a fresh page cannot save stale data over the loaded data) and the Me screen shows "Your copy is loaded."
   - **Delete everything**: says what it removes (steps, profile, calendar, notes, chats, AI helpers and their keys; a copy file already saved is not touched). Second tap: **Yes, delete everything** / **No, keep it**. It removes every `focusapp*` key in local storage, backups included, and the encrypted AI key store. Then reloads and says "Everything is deleted from this device."
2. What a copy holds: profile, calendar items and day counts, steps, parked thoughts, recall answers, finished-step counts, did-that-help marks, chat guides and lengths, the "hide good-step card" setting, and (only if ticked) chats. Never `ai` settings (they include the last 4 characters of each key and server addresses) and never keys (they are in IndexedDB and never read).

## Checks on a file being loaded (`js/logic/backup.js`)
- Size: refused over 2,000,000 bytes (by the file's reported size before reading, and by text length after).
- JSON parse inside try/catch; must be a plain object with `app` = "focus-app-copy", whole-number `fileVersion` of at least 1; newer than 1 is refused with "made by a newer version"; `data` must be a plain object; at least one known section must be present.
- A known section of the wrong type (a string where a list belongs, and so on) refuses the whole file ("Part of that file is damaged"). Inside a good section, bad entries are dropped one by one using the same normalizers the app uses when reading its own saved data. Unknown keys are dropped because everything is rebuilt from named fields. Only the file's own properties are read (`Object.hasOwn`), so `__proto__` and `constructor` keys do nothing.
- Length caps: the app's own (profile 500, parked 300, recall 500, steps 500, chat guide, chat item 20,000) plus calendar title 200, notes 2,000, 10 links of up to 500 characters, 500 items, ids up to 100 characters, 4,000 count days, chat title 100.
- Writing: the main saved object is written in one step; if the chats then fail to save, the old main object is put back. The student's AI helper list is kept. Sections missing from the copy become empty (replace, as the screen says). Chats are replaced only if the copy holds chats; otherwise saved chats stay, and the screen says so.
- Student text from a file is only ever shown with `textContent`. The load screen shows counts only.

## Research link
None needed; this is data ownership: AGENTS rule 5 and DECISIONS T4 (export and import instead of login). Idea only from `ios/design/slices/ME1-me-screens.md`; nothing imported from `ios/`.

## What is stored
Nothing new except a one-word notice ("loaded" or "deleted") in session storage so the page can say what happened after it reloads; it is removed as soon as it is shown. Delete everything does not touch session storage.

## Design review (AGENTS.md Stage 1)
- Breaks a rule? No. Rule 4: nothing leaves the device except the file the student chooses to save. Rule 5: this is the student's own copy and delete. Rules 2, 6, 7, 8: no shame, no score, no comparison, no claims. Rule 9: keys and AI settings are never exported; a loaded file cannot add helpers. No diagnosis is asked or stored (3).
- Conflicts with `DECISIONS.md`? No (T3 storage only through `js/storage.js`, T4, T8, T11, T13). No third-party code.
- A listed trap? No.
- Does the student do the thinking? Yes, they choose what to save, load and delete, each with a second tap where it replaces or removes.
- Small enough? Yes.

## Self-review of the code (Stage 2)
- Does what the note says. Calendar normalizing was moved from `js/storage.js` into `js/logic/calendar.js` unchanged, so the loader and the file check share one rule.
- Empty, huge, double click: `busy` guards the two async actions; a refresh mid-question leaves nothing pending (nothing was written); damaged saved text is backed up before a load writes.
- Phone width and keyboard: plain buttons, a labelled file input and tick box, focus moves to the result after choosing a file.

## Testing
- Logic: 18 tests in `tests/logic/backup.test.js` (round trip, no keys or AI settings, missing sections, wrong types, huge strings, `__proto__` keys, html text, newer version, size cap, failed save restores, damaged saved text, delete everything).
- Browser: 11 tests in `tests/browser/me-export.spec.js` (main path, tick box, round trip, second tap, broken, wrong, newer, empty, hostile and too-big files, delete, refresh mid-question). **Not run** (Chrome aborts in the sandbox). Read through carefully against the code.
- Not tested: a real download in Safari, files on a phone, deleting the AI key store with a real saved key.

## Student-visible wording (awaiting the parent's okay)
- Home button: "Me and my data". Headings: "My things", "Save a copy of my data", "Load a copy", "Delete everything".
- "This makes a file you keep yourself, so you can put your data on another device or back it up. Nothing is sent anywhere."
- "AI keys are never in the copy, and neither are your AI helper settings."
- "Also put my saved chats in the copy". "Your copy was made: <file name>. Look in your Downloads folder, and keep it somewhere safe."
- "Choose a copy you saved before. It is checked first, and nothing changes until you agree." "Choose a copy to load".
- "This copy has:" and count lines. "Loading it replaces what is saved on this device. Your AI helpers and keys stay as they are." "This copy has no chats, so the chats you have saved here stay as they are."
- "Yes, replace what is saved" / "No, keep what I have" / "Nothing was changed." / "Your copy is loaded. What was saved here has been replaced."
- Problems: "That file is not a copy made by this app." "That file is too big to be one of this app's copies." "That copy was made by a newer version of the app, so this version can't read it." "Part of that file is damaged, so none of it can be used." "That file has nothing from this app in it." "That file could not be read." Each followed by "Nothing was changed."
- "That didn't save, so nothing was changed. Try again." "That didn't work. Your data is unchanged. Try again."
- Delete: "This removes everything the app saved on this device: your steps, profile, calendar, notes, chats, and your AI helpers and their keys. A copy file you already saved is not touched." "Delete all of it? It can't be undone." "Yes, delete everything" / "No, keep it". "Everything is deleted from this device." "Some of it didn't delete. Try again."
