# PROGRESS.md (iPhone app)

Read this first in any session. It is the memory between sessions. Rewrite it each session; do not let it grow into a diary. Task history is in `TASKS.md`, decisions in `DECISIONS.md`.

**As of 2026-11-21, build 10 (`CURRENT_PROJECT_VERSION = 10`, commit `bf9ae67`).** Build 9 (commit `4a8a275`) is the one in the TestFlight archive; build 10 adds the taller text fields and press haptics and needs its own archive before upload. The app is built, runs on the owner's iPhone, and has an archive for TestFlight (`Bens Steps 0.1 (9)`). Nothing has been uploaded to App Store Connect yet, and nothing has been pushed to a remote.

## What the app is

"Ben's Steps", a native SwiftUI app for students with ADHD. It turns an assignment into small steps, shows one step at a time, takes honest check-ins (Done, Still working, Stuck, Drifted, Later), gives hints instead of answers, and can be talked to. Rules and research are in `AGENTS.md` section 0 and `research/`.

## Working (built and tested)

- **Logic** (`FocusKit`, Swift package): content from `Shared/content.json`, work model, starter steps, process-step check, answer guard, safety word, storage with backups, saved chats (10, each remembers its AI), the planner, settings and migrations from older formats.
- **Today and planning:** assignment (six kinds, 3/5/8 steps), "Suggest some to start" (AI or starter steps), "I'll say my steps", the editor (change, reorder, split, join, Get ready and Put it away steps), Start.
- **Work screen:** one step, five equal buttons, Back to Today (keeps the step), Stuck sheet, Drifted with a smaller piece, optional countdown ring, park a thought, recall question after study steps. Scrolls at large text sizes.
- **Plan tab:** the steps, plus saved thoughts and recall answers (confirmed delete).
- **Talk:** hints-only chat. The AI choice is one setting, shown on Talk and on the assignment screen ("Steps will be made by"). Each chat remembers its AI; switching sends a new chat and the old one stays unsent. Look it up (Wikipedia). Talk it through shows "Talking about: <step> · Clear".
- **AI:** Apple's on-device model by default. Up to five of the student's own OpenAI-compatible services (up to five ready at once), each with its own Keychain key. Forgiving address entry (bare host, OpenRouter defaults, `openrouter/free`). Look up models, Check connection, Edit, Remove. http is accepted with a tick box and a warning; Tailscale addresses skip the chat warning.
- **Me:** goals, notes (confirmed delete), How I like to work, How the AI talks, My AI services, voice (Read aloud and Talk, two switches, both off at first), backup switch (on by default), About and privacy, Delete everything (removes every key first).
- **Safety:** the trusted-adult line, the safety word on every reply, the answer guard, the process-step check on steps from the AI, and a check that stops AI text from reaching the screen or speech before it has passed.

## Tests (state at build 10)

- `FocusKit` unit tests: **367 passed**, 0 failed (build 10 changes are view-only; the screen tests have not been re-run since) (`swift test` in `ios/FocusKit`).
- UI tests (`ios/App/FocusAppUITests`, 32+ tests incl. `LargeTextUITests`, `DemoWalkthroughUITests`): every class passed after the build 8 fixes, but **not in one full run since the last changes**. Run the full suite before relying on it.
- Format lint: `xcrun swift-format lint --strict --configuration .swift-format` over `FocusKit/Sources`, `FocusKit/Tests` and `App` is clean.
- `checks/check.sh` runs lint, `swift build`, `swift test`, an app compile check and the UI tests when a simulator is available. It exits 3 when the UI part is skipped.

## Not built, or not checked

- **Touch size and haptics (build 10):** every text field is 56 points tall and tappable across its width (`RoomyTextFieldStyle` in `Theme.swift`, applied once in `RootView`). Main, outlined and link buttons give a light tap on press (`Haptics.press()`). Not covered: switches, menus and the AI picker's own controls. The owner reported that small text fields were hard to touch; re-check on the phone before calling it fixed.
- **Me is one long page.** Designed as short destinations (`design/slices/UX-whole-app-review.md`), not built. It changes the structure, so the parent or Ben should see it first.
- **"How I want help"**: a visible default guide, presets, Reset. Not built.
- **Native dialogs** for deleting chats, AI services, saved keys and Delete everything. They still use "tap again". They work and are tested.
- **AI-service form**: no Next/Done field order and no focus-to-error.
- **Tailscale exception** covers all 100.64.0.0/10 addresses, which internet providers also use. Decide before classmates whether to keep only `*.ts.net` names (`DECISIONS.md`).
- **Never checked by an agent:** the real on-device model, the microphone and voice on a phone, real OpenRouter or other keys, VoiceOver reading order, the smallest iPhone and dark mode. These need a person and a real phone.
- **T14 answer-giving checks** (`design/03` 3.4) must be run for **each** AI in use before anyone except Ben uses the app. The AI is "built, not cleared".

## Broken or worrying

- **Trusted-adult line** depends on the AI sending `TRUSTED_ADULT`. The app checks AI text only, not the student's own words. The parent's question about two extra safety signals is open.
- **Look it up** still needs a real contact in `WikipediaLookUp.userAgent` (placeholder `set-by-owner@example.invalid`) before anyone except Ben uses the app.
- **Starter step wording** was changed to "Check your answers against your notes" in `Shared/content.json` and its case file together. Check other starter steps against the never-shame list.
- **D8 is a draft** until the parent confirms it (`DECISIONS.md`).
- **The simulator and the phone** are not always reachable from the agent shell. See "Running things" below.

## Waiting on

- **Parent:** check the taller fields and haptics on the phone (device steps 79 to 81); confirm D8 and the Tailscale note; decide on the trusted-adult proposals; archive build 10, then upload it from Xcode's Organizer (Window → Organizer → Bens Steps 0.1 (9) → Distribute App → App Store Connect → Upload); decide whether to split Me and whether to build "How I want help"; run or arrange T14 for each AI.
- **Ben:** the final name and icon (placeholder staircase), the words for Drifted and Stuck, whether voice starts off (it does now).

## Next (in order)

The coaching and memory layer is designed and ready to build: `design/05-coaching-and-memory.md`, then `TASKS-coaching.md` (start at C0). Each task names its reading, its tests (`design/slices/COACH-MEMORY-testing.md`) and its "done when" lines. Every task needs gate 2.

Feature ideas beyond these fixes are in `ROADMAP.md`, ranked by evidence and effort. The AI coaching layer has its own research note (`research/07-ai-coaching.md`) and a slice-by-slice plan for a Sonnet/Haiku Builder (`design/slices/COACH-plan.md`); start it at COACH-0. The learner record, retrieval and feedback that the moves draw on are in `design/slices/MEMORY-plan.md`; `ROADMAP.md` section 6 of that file has the open parent decisions and the "subscription instead of a key" backlog item the parent asked to be reminded of.

1. Parent: check build 10 on the phone (`checks/device-checks.md` steps 79 to 81), then archive and upload it to TestFlight. Archive with the command in "Running things" (bump the build number first if it is needed again).
2. Run the full UI suite once, in one run, on the iPhone 15 Pro Max simulator (see "Running things"). Fix anything that fails.
3. Decide with the parent: Me split; "How I want help"; native dialogs for remaining deletes; the Tailscale range.
4. T14 for Apple's model and each AI service, recorded word for word; then an independent review at the strongest available model before wider use.

## Running things (learned the hard way)

- **Phone:** `xcrun devicectl list devices` shows the phone as `connected` or `available (paired)` when it can be used. `unavailable` means it is not reachable from the Mac right now. Install with `xcrun devicectl device install app --device <UDID> <path>.app`, launch with `xcrun devicectl device process launch --device <UDID> com.craighagan.benssteps`. Launch fails with "Locked" if the phone is locked; that is fine, unlock and open the app. Phone UDID: `00008130-001804EA2803401C`.
- **Simulator for tests:** `FDB37B2F-1E82-46E8-AA49-005A4A99BD93` (iPhone 15 Pro Max, iOS 26.5). iOS 18.2 simulators are too old.
- **Long commands time out after about 2 minutes** in agent shells. Start `xcodebuild` and `swift test` detached: `nohup bash -c '… > /tmp/x.log 2>&1; echo "exit $?" >> /tmp/x.log' >/dev/null 2>&1 < /dev/null & disown`, then poll the log with short `sleep` calls (under about 60 seconds each).
- **Run the UI tests in pieces** if one hangs: `-only-testing:FocusAppUITests/<Class>` plus `-test-timeouts-enabled YES -default-test-execution-time-allowance 180`. A test that waits on a control hidden by the keyboard is the usual cause of a hang. The test helper `putKeyboardAway()` exists for this.
- **Archive:** `xcodebuild -project ios/App/FocusApp.xcodeproj -scheme FocusApp -configuration Release -destination "generic/platform=iOS" -archivePath /tmp/FocusApp.xcarchive -allowProvisioningUpdates archive`. Copy into `~/Library/Developer/Xcode/Archives/<YYYY-MM-DD>/"Bens Steps 0.1 (N).xcarchive"`. Do not upload from the command line (it fails); the parent uploads from the Organizer.
- **Build number:** bump `CURRENT_PROJECT_VERSION` in all four places in `App/FocusApp.xcodeproj/project.pbxproj` (verify the count is 4) before each archive.
- **Signing:** team `ANA76MNRSN`, automatic signing, bundle `com.craighagan.benssteps` (tests `com.craighagan.benssteps.UITests`). The parent owns the Apple account; agents never handle credentials (`AGENTS.md` section 9).
- **Swift name clash:** FocusKit has its own `Content` type. In SwiftUI code, use `Self.Content` when the name matters.
- **Reviewers:** the only independent reviewer available in these sessions was a read-only reviewer agent (`semantic_reviewer`). The builder agent (`general-task-execution`) sometimes fails with network errors; re-invoke it with a smaller task. A stronger model was not reachable from the builder's sessions. Note in every report whether the reviewer was the same model as the builder.
