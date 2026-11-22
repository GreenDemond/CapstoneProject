# PROGRESS.md

The memory between sessions. Rewrite it each session; do not let it grow into a diary. Task-by-task status is in `TASKS.md`.

## Working

- T01 to T03: `FocusKit` (content, logic matching all eight shared case files, versioned storage).
- T04 to T08: app shell, assignment and editor, Today and the work screen, stuck ladder, Look it up (Wikipedia).
- T09 voice in and T10 voice out: two switches under Me, Read aloud and Talk (D7), both off at first.
- T11 to T13: the AI behind a `LanguageModel` protocol; safety word, trusted-adult line and `AnswerGuard` run on every reply before it is shown, spoken or saved; Talk; step coach; works with no AI.
- T15 Me: goals, notes, How I like to work, AI guide and length, voice, backup switch (D13), About and privacy, Delete everything.
- My AI services (D6): up to five, each with its own Keychain key; forgiving addresses with OpenRouter defaults (`openrouter/free`); optional Look up models; http with a tick box and warning, no Talk warning for Tailscale (see D8 note).
- **2026-11-21 release-readiness pass (build 8):**
  - Independent review (read-only reviewer plus Opus as Builder/Advisor). Must-fix found and fixed: earlier on-phone chat messages were sent to an external AI after a switch. A chat now stays with the AI it was written to; switching and sending starts a new chat and says so.
  - Also fixed from the review: steps offered from a chat reply pass the process-step check; two more quote marks cleaned from the guide; "Check what you missed" became "Check your answers against your notes".
  - UX fixes: the work screen scrolls; its header is one line at every text size; saved thoughts and recall answers are listed in Plan with a confirmed delete; notes need a confirmed delete; Talk shows "Talking about: <step> · Clear"; VoiceOver says who wrote each message and has a Stop reading action; Search is disabled while searching; startup failure has Try again; a keyboard Done button on every screen with a text box.
  - New large-text UI tests (`LargeTextUITests`) at the largest accessibility size.
- Tests: see the Report in `design/slices/UX-whole-app-review.md` for the exact final counts.

## In progress

Nothing.

## Broken or worrying

- **Me is one long page.** At the largest text size it is many screens tall. The split into short destinations is designed (`design/slices/UX-whole-app-review.md`) but not built: it changes the app's structure and should be seen by the parent or Ben first.
- **Chats, AI services, saved keys and Delete everything still use the "tap again" confirmation** instead of the native dialog. They work and are tested.
- **The AI-service form** has no Next field order or focus-to-error.
- **Tailscale exception uses 100.64.0.0/10,** which internet providers also use. Decide before classmates whether to keep only `*.ts.net` names.
- **The trusted-adult line depends on the AI obeying TRUSTED_ADULT**; the app does not check the student's own words. The parent's "two extra safety signals" question is still open.
- **Nothing about the real AI, microphone, voice, VoiceOver reading order, or a real OpenRouter key has been checked by an agent.** T14 (answer-giving checks) must be run for each AI used. The AI is "built, not cleared".
- **Look it up needs a real contact** in `WikipediaLookUp.userAgent` before anyone but Ben uses the app.
- D8 is still a draft until the parent confirms it.
- The bash tool in agent sessions times out at about 2 minutes; run `xcodebuild test` with `nohup … & disown` and poll.

## Waiting on

The parent: confirm D8 (with the Tailscale note); the trusted-adult proposals; T14 for each AI; uploading build 8 to TestFlight; whether to split Me and to build "How I want help".

## Next

1. The parent installs build 8 and tries `checks/device-checks.md`, including real OpenRouter and Talk switching between AIs.
2. Decide and build the Me split and "How I want help" (presets, visible default guide, Reset).
3. Convert the remaining "tap again" deletes to native dialogs; Next/focus order in the AI-service form.
4. T14 for Apple's model and each AI service.
