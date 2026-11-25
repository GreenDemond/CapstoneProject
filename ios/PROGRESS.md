# PROGRESS.md (iPhone app)

Read this first in any session. It is the memory between sessions. Rewrite it each session; do not let it grow into a diary. Task history is in `TASKS.md`, decisions in `DECISIONS.md`.

**As of 2026-11-23, build 13 (`CURRENT_PROJECT_VERSION = 13`).** Build 13 is archived as `Bens Steps 0.1 (13).xcarchive` (not uploaded) and a signed phone build is ready at `~/Desktop/BensSteps-build13/` (run `install.sh` with the phone unlocked and connected). The phone was unavailable, so build 13 is not installed. Build 13 adds the thinking level per own AI service and the Talk reply counts under About. The parent uploads from Xcode's Organizer (Window → Organizer → Bens Steps 0.1 (13) → Distribute App → App Store Connect → Upload). Nothing has been pushed to a remote.

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

- `FocusKit` unit tests: **412 passed**, 0 failed (`swift test` in `ios/FocusKit`).
- UI tests (`ios/App/FocusAppUITests`, 38 tests): **all passed in one full run** of `checks/check.sh` (2026-11-22, run alone). Do not run two simulator jobs at once: overlapping runs made three tests fail for no real reason.
- Format lint: `xcrun swift-format lint --strict --configuration .swift-format` over `FocusKit/Sources`, `FocusKit/Tests` and `App` is clean.
- `checks/check.sh` runs lint, `swift build`, `swift test`, an app compile check and the UI tests when a simulator is available. It exits 3 when the UI part is skipped.

## Not built, or not checked

- **Touch size and haptics (build 10):** every text field is 56 points tall and tappable across its width (`RoomyTextFieldStyle` in `Theme.swift`, applied once in `RootView`). Main, outlined and link buttons give a light tap on press (`Haptics.press()`). Not covered: switches, menus and the AI picker's own controls. The owner reported that small text fields were hard to touch; re-check on the phone before calling it fixed.
- **Me is one long page.** Task ME1 in `TASKS-steps-me.md` splits it into short screens (parent asked, 2026-11-23).
- **"How I want help"**: a visible default guide, presets, Reset. Not built.
- **Native dialogs** for deleting chats, AI services, saved keys and Delete everything. They still use "tap again". They work and are tested.
- **AI-service form**: no Next/Done field order and no focus-to-error.
- **Tailscale exception** covers all 100.64.0.0/10 addresses, which internet providers also use. Decide before classmates whether to keep only `*.ts.net` names (`DECISIONS.md`).
- **Never checked by an agent:** the real on-device model, the microphone and voice on a phone, real OpenRouter or other keys, VoiceOver reading order, the smallest iPhone and dark mode. These need a person and a real phone.
- **T14 answer-giving checks** (`design/03` 3.4) must be run for **each** AI in use before anyone except Ben uses the app. The AI is "built, not cleared".

## Broken or worrying

- **Backup read-back is briefly stale.** After the backup switch is cleared, the folder can still read as excluded for under a second (about 1 read in 30). The app does not depend on the instant read. The test now waits briefly. Measured 2026-11-23; see `design/slices/M0-learner-record.md`.

- **Flaky unit test:** `BackupTests.theRealFolderResourceValueIsSetAndCleared` (real data folder's backup flag) failed once in the Checker's first `swift test` and once more by hand, then passed. Not caused by the coaching work. Find the cause before relying on it.

- **Trusted-adult line** depends on the AI sending `TRUSTED_ADULT`. The app checks AI text only, not the student's own words. The parent's question about two extra safety signals is open.
- **Fixed 2026-11-24:** a guardrail stop on a step request, a Talk message or the assignment check now shows the trusted-adult line (DECISIONS 2026-11-24). Trade-off: a guardrail on ordinary schoolwork also shows it. Check on the phone (device step 92).
- **Look it up** still needs a real contact in `WikipediaLookUp.userAgent` (placeholder `set-by-owner@example.invalid`) before anyone except Ben uses the app.
- **Starter step wording** was changed to "Check your answers against your notes" in `Shared/content.json` and its case file together. Check other starter steps against the never-shame list.
- **D8 is a draft** until the parent confirms it (`DECISIONS.md`).
- **The simulator and the phone** are not always reachable from the agent shell. See "Running things" below.

## Waiting on

- **Parent:** confirm the new D8 row for "Check my steps against the assignment" before classmates use it; try device checks 91 and 92; upload build 16 (archived) or a new build 17 from Organizer.
- **Parent:** check the taller fields and haptics on the phone (device steps 79 to 81); confirm D8 and the Tailscale note; decide on the trusted-adult proposals; archive build 10, then upload it from Xcode's Organizer (Window → Organizer → Bens Steps 0.1 (9) → Distribute App → App Store Connect → Upload); decide whether to build "How I want help" (the Me split is task ME1); run or arrange T14 for each AI.
- **Ben:** the final name and icon (placeholder staircase), the words for Drifted and Stuck, whether voice starts off (it does now).

## Next (in order)

- **Coaching queue 2026-11-25:** done: M1, M3, M4, C6, C9, R5, C4, C5. Deferred by the parent: C8 (no source of tags). Not built, decision needed: C7 (already true on screen). Not started: C3 (R1, the comeback screen, must be built first; sketch and two questions in `design/slices/C3-comeback-slice.md`) and M2 (recommend waiting; see its note). T14-C needs a person and a phone. Build 20 is on the parent's iPhone and iPad and archived.
- **Done 2026-11-24:** ME1, S1, S2, S3 and IPAD1 (the app now runs on iPad; content column up to 820 points; "iPhone" wording is now "this device"). Build 18 is on the parent's iPhone and iPad. The iPad UI run is manual: `xcodebuild test ... -destination id=CF3E2364-10CE-42CF-B887-84D437CD08ED` (iPad Air 11-inch M4 simulator), it takes about 13 minutes. Device checks 91 (S2) and 92 (S3) wait for the parent.

0. M0a and M0b are built. Parent to decide the course-line viewer (DECISIONS 2026-11-23): either keep course lines hidden until M4, or build a small list with delete before classmates use the app.
0. Phone AI: research in `research/08-phone-ai.md`, plan in `design/slices/PHONE-AI-plan.md`. **P0 done 2026-11-23:** `checks/phone-ai-eval.sh` runs `checks/phone-ai-cases.json` through the app's chat code on this Mac; baseline scored in `research/phone-ai-eval/scores.md`; the Talk tally (five counts, no text) shows under About. Next: P1 (rewrite the chat rules), measured against the baseline.
0a. Thinking level per own AI service (none, low, medium, high; default low) is committed (`f074bb1`), not yet on the phone. Next: the on-phone AI's repetition (see the notes from 2026-11-23: default guide asks for a closing question, long repeated rules, silently dropped history, and the phone model has no thinking control before iOS 27).
0b. Steering from the parent (2026-11-23): a version line is on About and privacy (Version and build from the app's Info.plist). Check it on the phone (device step 86).

The coaching and memory layer is being built from `TASKS-coaching.md`. Done: C0 (runner and checks), C1 (Stuck question), C2 (split nudge). Next ready: M0 (learner record and courses), then M3, M1, C3 onward (the table shows what each waits on). Each task names its reading, its tests (`design/slices/COACH-MEMORY-testing.md`) and its "done when" lines. Every task needs gate 2. The fresh Checker passed C0 to C2 on 2026-11-22. T14-C (answer-giving checks on the phone, device steps 82 to 85) is waiting on the parent.

Feature ideas beyond these fixes are in `ROADMAP.md`, ranked by evidence and effort. The AI coaching layer has its own research note (`research/07-ai-coaching.md`) and a slice-by-slice plan for a Sonnet/Haiku Builder (`design/slices/COACH-plan.md`); start it at COACH-0. The learner record, retrieval and feedback that the moves draw on are in `design/slices/MEMORY-plan.md`; `ROADMAP.md` section 6 of that file has the open parent decisions and the "subscription instead of a key" backlog item the parent asked to be reminded of.

1. Parent: check build 10 on the phone (`checks/device-checks.md` steps 79 to 81), then archive and upload it to TestFlight. Archive with the command in "Running things" (bump the build number first if it is needed again).
2. Run the full UI suite once, in one run, on the iPhone 15 Pro Max simulator (see "Running things"). Fix anything that fails.
3. Decide with the parent: "How I want help"; native dialogs for remaining deletes; the Tailscale range.
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
