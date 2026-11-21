# T03 Storage
Status: built 2026-11-20

## What the student sees and does
Nothing yet. This task adds how the app saves and reads its data (`FocusKit/Sources/FocusKit/Storage/`).

## Research link
Design judgment (`design/04` I5, I6, I7; `design/03` section 3.7). Rule 4: data stays on the device.

## What it stores
Six kinds, each its own JSON file with a version: `work.json` (steps, kind, last used), `profile.json` (four goals, notes), `settings.json` (voice mode, headphones only, voice, speed, guides, reply lengths, How I like to work answers), `chats.json` (up to 10), `parked.json`, `recall.json`. Never: audio, a name, an age, a school, a diagnosis, contacts, location. A test reads the field names of every type for those words.
Limits applied on every save and load: steps (100, 500 characters each; blank, negative or repeated numbers dropped; next number repaired), chats (10, newest messages kept up to the per-chat character limit), guides, speech speed. Limits not in `content.json` (goal 500, note 1000, 200 notes, parked thought 500, recall answer 1000) are set in `SavedTypes.swift`; the parent or Ben can change them.

## What leaves the phone
Nothing. No backup or sync is added by the app. Excluding the folder from the phone's own backup is still open (`design/04` section 4.7) and is not done here.

## Distracted, stuck, back after a week
Not applicable. A damaged or newer file never stops the app: it is moved to a backup (`work.damaged.json`, `work.newer-version.json`, a number added if the name is taken) once, and the app starts fresh for that file only.

## Differs from the web app
Saved by file, not by browser storage. A zero-step list is not saved as "all done".

## Tests
`StorageTests` (21): round trip for every type on `FileStore` and `MemoryStore`; missing; not JSON; wrong shape; second damage keeps the first backup; newer version backed up and not overwritten; a damaged chat file does not touch steps; failed write throws and keeps old data; a folder that cannot be written; 40 concurrent saves leave one whole file; long step; too many steps; 11 chats; very long chat; blank notes; delete everything; no forbidden field names.
`FileStore` writes atomically with complete file protection. File protection is only effective on a real phone; checked here only that writing works on the Mac.

## Unverified
That `completeFileProtection` takes effect on the phone (device check later). Whether the app's folder is excluded from backup.

## Gates
Gate 1 and 2: no Advisor agent was available in this session. Self-review only (same model as Builder). Advisor gate 2 is required for `Storage/` and is still owed.
