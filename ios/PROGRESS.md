# PROGRESS.md

The memory between sessions. Rewrite it each session; do not let it grow into a diary. Task-by-task status is in `TASKS.md`.

## Working

- T01 to T03: `FocusKit` (content, logic matching all eight shared case files, versioned storage).
- T04 to T08: app shell, assignment and editor, Today and the work screen, stuck ladder, Look it up (Wikipedia). See `TASKS.md`.
- T09 voice in and T10 voice out: two switches under Me, Read aloud and Talk (D7), both off at first.
- T11 to T13: the AI behind a `LanguageModel` protocol; safety word, trusted-adult line and `AnswerGuard` run on every reply before it is shown or spoken; Talk; step coach; works with no AI.
- T15 Me: goals, notes, How I like to work, AI guide and length, voice, About and privacy, Delete everything.
- Navigation review (2026-11-21): a way back and to Today from every screen.
- **New 2026-11-21 (build 5): Use my own AI service (D6).** Off by default; Apple's on-device model stays the default. Address (https only), Key (Keychain only, this iPhone only, never in a backup), Model name, Check connection, and a line about what is sent that must be shown before the switch works. While it is on and ready, Talk shows a visible **On this iPhone | My service** switch. `OpenAICompatibleModel` is a second `LanguageModel`; the same safety and answer checks apply. Delete everything removes the key.
- **New 2026-11-21: Include in my iPhone backup (D13).** Switch under Me, on by default; the data folder's backup flag follows it at launch and when changed. Privacy wording updated everywhere.
- Tests: 317 FocusKit tests pass. UI tests: **29 of 29 pass** on the iOS 26.5 iPhone 15 Pro Max simulator (2026-11-21): the earlier 27 plus the backup-switch test and the own-AI disclosure and http-rejection test.

## In progress

Nothing.

## Broken or worrying

- **The own AI service was never called for real, and the Keychain was never run from an agent.** Both are compiled and unit-tested with fakes only. The parent should try `checks/device-checks.md` steps 62 to 73 with a key they own.
- **T14 must be run separately for each AI service used** (Apple's model and the own service). Neither has been run. The AI is "built, not cleared". A larger web model may behave differently from Apple's on-device one. Do not give a build with the own service to anyone but Ben before T14 for it.
- **When the own service is on, messages leave the phone.** D8 is still a draft until the parent confirms it, including the three rows added on 2026-11-21.
- Delete everything clears this iPhone; an older iPhone backup keeps its copy until a new backup is made. The About text says so.
- **The simulator is reachable from the agent shell only some of the time.** When it is not, `checks/check.sh` can only compile (exit 3).
- Guardrail stop on the student's own message shows the trusted-adult line: an unapproved proposal (`PARENT-STEPS.md`). The fixed phrase list is NOT built.
- The microphone's language files are fetched from Apple when the student taps Download. Not a D8 row; the parent should confirm that reading.
- No Advisor or Checker agent has run for T04 onward, nor for this change (same model as Builder, self-review only). Gate 2 is owed for T02 to T15 and this slice; gate 4 before anyone but Ben.
- **Look it up needs a real contact** in `WikipediaLookUp.userAgent` (currently `set-by-owner@example.invalid`) before anyone else uses the app.
- Shared starter step "Check what you missed" uses a word on the "never shame" list. Left as is (it is in `Shared/`).
- Not done from the screens note: voice in on the editor rows, the Stuck boxes and the recall question; the AI looking things up (D8 row 2); the "test the guess" experiments.
- Ben's phone is on iOS 26.2; whether Apple Intelligence is on is not known.
- The app is **Ben's Steps**, bundle id `com.craighagan.benssteps`, team ANA76MNRSN. Build 0.1 (4) was archived earlier and may already be uploaded; build 0.1 (5) is archived locally and not uploaded.
- Inside a sandboxed agent shell, Swift cannot start its macro plug-ins; `check.sh` adds the needed flags.

## Waiting on

The parent's numbered steps and open questions are in `PARENT-STEPS.md`. Open: D8 confirmation (with the new rows), the trusted-adult proposals, T14, and the parent's Apple steps (uploading build 5).

## Next

1. The parent installs build 5, tries steps 62 to 73 of `checks/device-checks.md` with a key they own, and reports what the screen said.
2. T14 for Apple's model and for the own service, recorded word for word; Advisor gate 4.
3. Give `WikipediaLookUp.userAgent` a real contact before anyone but Ben uses the app.
4. Advisor gate 2 on T02 to T15 and on `design/slices/AI-own-service-and-backup.md`.
