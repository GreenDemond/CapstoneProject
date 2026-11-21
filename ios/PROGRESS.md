# PROGRESS.md

The memory between sessions. Rewrite it each session; do not let it grow into a diary. Task-by-task status is in `TASKS.md`.

## Working

- T01 to T03: `FocusKit` (content, logic matching all eight shared case files, versioned storage).
- T04 to T08: app shell, assignment and editor, Today and the work screen, stuck ladder, Look it up (Wikipedia). See `TASKS.md`.
- T09 voice in: microphone button (hold, or tap to start and stop), one-sentence explanation before the first permission request, denied, unsupported-language and download states; on-device `SpeechAnalyzer`. Off until the student picks I talk or We talk.
- T10 voice out: Read this step, voice policy (Quiet never speaks; headphones only by default), sentence splitter, headphones removed or a call stops the voice.
- T11 the phone's AI: `LanguageModel` protocol, scriptable fake, `AppleLanguageModel` (on-device model only, no cloud model, no keys), safety word and guardrail handling, whole-sentence release, finished-answer guard, trimming with one context retry, availability-guarded token counting (iOS 26.4+).
- T12 Talk: chat with Stop, ten saved chats with two-tap delete, Talk it through from Stuck, Use these as my steps (into the editor), calm no-AI state with hints and Look it up. A message that triggers the trusted-adult line is never saved.
- T13 step coach: AI steps open in the editor with a label and fall back to starter steps; Give me an idea (one step); works with no AI.
- T15 Me: goals, private notes, How I like to work with a first-guess card, AI guide and length, voice settings, About and privacy, Delete everything (second tap, leaves no file).
- 264 FocusKit tests pass. `checks/check.sh` compile-checks the app and its UI tests for a generic iOS device (exit 3 from the agent sandbox: no reachable simulator).
- Info.plist usage strings for the microphone and speech recognition are set in the project's build settings.

## In progress

Nothing.

## Broken or worrying

- **UI tests: 3 of 18 passed, 15 fail and are undiagnosed (FEAT-002 pending).** An iOS 26.5 simulator exists on the owner's Mac and works from a normal terminal, but not from the agent sandbox (CoreSimulatorService refuses the connection), so agents there can only compile the app and UI tests (`checks/check.sh` step 3). Run `checks/check.sh` in a normal terminal, diagnose the 15 failures, then work through `checks/device-checks.md`. The Voice UI test (`MeUITests.testChangingVoiceIsUsed`) was updated for the two switches and compiled, but not run.
- **Voice is now two switches (D7, 2026-11-20): Read aloud and Talk,** both off at first. Old saved settings load: quiet = both off, iTalk = Talk only, weTalk = both on, unknown or missing = both off (tests in `StorageTests`). Talk it through sends on letting go only when both are on.
- **The AI is "built, not cleared".** Only a fake model ran. The real on-device model, the real microphone and speech, the real voice, headphones and silent switch were never run. The answer-giving checks (T14, `design/03` 3.4) need Ben's phone and are still owed. `AnswerGuard` and `ProcessStep` are heuristics, not the check.
- **D6 is not answered.** T09 to T13 and T15 were built on the recommendation (on-device AI only, no keys, no cloud model). If the answer differs, `Services.none` switches the parts off.
- **Two things were added that the parent must look at:** (1) a guardrail stop on the student's own chat message shows the trusted-adult line (a proposal in `design/03` 3.5, not yet approved); the fixed phrase list is NOT built. (2) The microphone's language files are fetched from Apple when the student taps Download. Nothing of the student's is sent; it is not a D8 row. Confirm that reading.
- No Advisor or Checker agent ran for T04 to T15 (same model as Builder, self-review only). Advisor gate 2 is owed for T02 to T15. The highest-value reads are `AI/`, `Voice/`, `Models/ChatModel.swift`, the words in `Models/Words*.swift`, and the About text vs D8.
- **Answer check now runs before anything is shown or spoken** (review of 2026-11-20, issue 1). `ChatEngine` no longer sends partial text; the screen shows the thinking state and then the whole checked reply, which is also the only text spoken. Cost: the student waits for the whole reply. Tests added; real-phone feel of the wait is not checked (device-checks step 35). `AnswerGuard` is still a heuristic; T14 is the real check.
- **Guardrail stop shown as the trusted-adult line** is still an unapproved proposal (`PARENT-STEPS.md` question table). Nothing in code changes until the parent decides; a neutral line is the alternative.
- **Look it up needs a real contact** in `WikipediaLookUp.userAgent` (currently `set-by-owner@example.invalid`) before anyone else uses the app.
- T16 was a self-review read-through only (no simulator, no Advisor or Checker, same model as Builder). It found no code defects. Still owed: simulator screen walk, `design/02` 2.11 row tests, `T16-strings.md`.
- Shared starter step "Check what you missed" uses a word on the "never shame" list. Left as is; see `design/slices/T06`.
- Ben's phone is on iOS 26.2; whether Apple Intelligence is on is not yet known. The iOS 26 deprecation-style warnings for `GenerationError` in the iOS 27 SDK are expected (the minimum is iOS 26.0).
- The bundle identifier (`example.focusapp`) and signing team are the parent's to set in Xcode. The app's data folder is excluded from phone backup (the recommendation; the parent has not confirmed).
- Inside a sandboxed agent shell, Swift cannot start its macro plug-ins and SwiftPM cannot write its caches. `check.sh` detects this and adds the needed flags. Normal Macs need none.
- Not done from the screens note: voice in on the editor rows, the Stuck boxes and the recall question (only the assignment, "say my steps", Talk and notes have the microphone); the AI looking things up (D8 row 2); the "test the guess" experiments.

## Waiting on

The parent's numbered steps and the plain-words list of open questions (each with a recommendation) are in `PARENT-STEPS.md`.

See `DECISIONS.md`, "Waiting on". Open: D6, D8 confirmation, the trusted-adult proposals, and the parent's Apple steps for T17a (sign in to Xcode, set the team and bundle identifier, run on Ben's phone, then `design/04` section 4.7 questions).

## Next

1. In a normal terminal on the owner's Mac: `checks/check.sh`; fix the 15 failing UI tests (FEAT-002); look at every screen at the largest text size, in dark mode, on the smallest iPhone.
2. T17a: the parent builds to Ben's phone (numbered steps are to be written for the parent; no account details are ever handled by an agent). Ben works through `checks/device-checks.md`.
3. T14: the eight answer-giving attempts against Talk and the step coach on the phone, recorded word for word; Advisor gate 4.
4. Advisor gate 2 on T02 to T15, and a real T16 pass (simulator walk, `T16-strings.md`, Advisor verdict on the strings).

## Report (session of 2026-11-20, T16 and parent steps)

- **New:** nothing the student sees. `PARENT-STEPS.md` now gives you numbered Xcode, install, device-check and TestFlight steps, and the open questions with recommendations.
- **Try it:** nothing in the app changed. Read `PARENT-STEPS.md` and follow part A and B on your Mac.
- **Checked:** Builder ran `checks/check.sh`: about 250 tests pass, app and UI tests compile for a generic iPhone. Builder re-read the student-facing words, safety and answer guard, trusted-adult path, backup exclusion, network use and secrets against the rules. No defects found. No Advisor or Checker ran (same model as Builder).
- **Skipped:** UI tests (simulator unreachable from the agent sandbox, exit 3); nothing run on a phone; T14 answer-giving checks; Advisor gates 2 and 4.
- **Worries:** the app has never been run. The AI is built, not cleared. The starter step "Check what you missed" sits in `Shared/` and was not edited. The Wikipedia contact placeholder and bundle id are unset.
- **Next:** you do `PARENT-STEPS.md` A to C; Ben does the device checks; then T14, then a stronger-model review.
