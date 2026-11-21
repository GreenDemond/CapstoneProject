# PROGRESS.md

The memory between sessions. Rewrite it each session; do not let it grow into a diary. Task-by-task status is in `TASKS.md`.

## Working

- T01 to T03: `FocusKit` (content, logic matching all eight shared case files, versioned storage).
- T04 to T08: app shell, assignment and editor, Today and the work screen, stuck ladder, Look it up (Wikipedia). See `TASKS.md`.
- T09 voice in and T10 voice out: two switches under Me, Read aloud and Talk (D7), both off at first.
- T11 to T13: the AI behind a `LanguageModel` protocol; safety word, trusted-adult line and `AnswerGuard` run on every reply before it is shown or spoken; Talk; step coach; works with no AI.
- T15 Me: goals, notes, How I like to work, AI guide and length, voice, About and privacy, Delete everything.
- Navigation review (2026-11-21): a way back and to Today from every screen.
- **New 2026-11-21 (build 6): My AI services (D6), up to five.** Apple's on-device model stays the default. Each service has a label, an address (https, or http with a "not encrypted" line), a model name, and its own key in the Keychain under `service-<id>`. Optional **Look up models** (typing always works). Per service: Edit, Check connection, Remove (asks once, deletes its key). Talk shows **On this iPhone** then each ready service (segmented up to two, a menu for more); the choice is kept by id and falls back to the phone with one calm line. The step coach follows it. Build 5's single service becomes "My service" and keeps its key. Delete everything removes every key first. Design: `design/slices/AI-multiple-services.md`.
- Include in my iPhone backup (D13): unchanged.
- Tests: 336 FocusKit tests pass. UI tests: @@UI@@ on the iOS 26.5 iPhone 15 Pro Max simulator (2026-11-21).

## In progress

Nothing.

## Broken or worrying

- **http is allowed for every address** (the parent chose "http for any address"). That needed `NSAllowsArbitraryLoads` in `App/Info-Extra.plist`, which turns off iOS's https rule for the whole app. A key sent to an http address is not encrypted. App Store review may ask why. Not tried against a real http server.
- **No own service was ever called for real, and the Keychain was never run from an agent.** Compiled and unit-tested with fakes only. The parent should try `checks/device-checks.md` steps 62 to 78 with keys they own. The migration from build 5 was tested with fakes only; step 74 checks it on the phone.
- **T14 must be run separately for each AI service used** (Apple's model and each own service). None has been run. The AI is "built, not cleared". Do not give a build with an own service to anyone but Ben before T14 for it.
- **When an own service is chosen, messages leave the phone.** D8 is still a draft until the parent confirms it, including the rows rewritten on 2026-11-21 and the new Look up models row.
- Delete everything clears this iPhone; an older iPhone backup keeps its copy until a new backup is made. The About text says so.
- **The simulator is reachable from the agent shell only some of the time.** When it is not, `checks/check.sh` can only compile (exit 3).
- Guardrail stop on the student's own message shows the trusted-adult line: an unapproved proposal (`PARENT-STEPS.md`). The fixed phrase list is NOT built.
- The microphone's language files are fetched from Apple when the student taps Download. Not a D8 row; the parent should confirm that reading.
- No Advisor or Checker agent has run for T04 onward, nor for the own-service changes (same model as Builder, self-review only). Gate 2 is owed for T02 to T15 and both own-service slices; gate 4 before anyone but Ben.
- **Look it up needs a real contact** in `WikipediaLookUp.userAgent` (currently `set-by-owner@example.invalid`) before anyone else uses the app.
- Shared starter step "Check what you missed" uses a word on the "never shame" list. Left as is (it is in `Shared/`).
- Not done from the screens note: voice in on the editor rows, the Stuck boxes and the recall question; the AI looking things up (D8 row 2); the "test the guess" experiments.
- Ben's phone is on iOS 26.2; whether Apple Intelligence is on is not known.
- The app is **Ben's Steps**, bundle id `com.craighagan.benssteps`, team ANA76MNRSN. Build 0.1 (5) and 0.1 (6) are archived locally and not uploaded.
- Inside a sandboxed agent shell, Swift cannot start its macro plug-ins; `check.sh` adds the needed flags.

## Waiting on

The parent's numbered steps and open questions are in `PARENT-STEPS.md`. Open: D8 confirmation (with the new rows), the trusted-adult proposals, T14 for each service, and the parent's Apple steps (uploading build 6).

## Next

1. The parent opens build 6 on the phone, tries steps 62 to 78 of `checks/device-checks.md` with keys they own, and reports what the screen said (especially step 74, the move from build 5).
2. T14 for Apple's model and for each own service, recorded word for word; Advisor gate 4.
3. Give `WikipediaLookUp.userAgent` a real contact before anyone but Ben uses the app.
4. Advisor gate 2 on T02 to T15 and on `design/slices/AI-multiple-services.md`.
