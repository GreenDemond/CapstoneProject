# FEATURES.md (iPhone app): running log of new feature ideas

Every new idea goes here first, with its date, who asked, what the rules and research say, and a recommended next step. This file is a log, not a set of decisions. Nothing here is decided until the parent or Ben says so and `DECISIONS.md` records it. Built work moves to `PROGRESS.md`; designed work lives in `design/` and `TASKS-coaching.md`.

Statuses: `idea` (just logged), `assessed` (checked against the rules), `designed`, `approved`, `built`, `declined`.

How to add one: date, who asked, one-line request in their words, then rule conflicts, research link, data and permissions, recommended next step.

---

## Logged 2026-11-26

### F1. Reminders and calendar entries for each task
- **Asked by:** parent. "notifications/calendar integration for each task"
- **Status:** designed in part. Calendar entry is `design/slices/CAL1-calendar-and-reminders.md` (draft, gate 1 review requested 2026-11-26). The reminder is CAL2, queued behind it. Parent approved the shape 2026-11-26: "this all looks good"
- **Rules to check:** rule 2 (never shame), rule 4 and D8 (what leaves the phone), rule 5 (no reports to others), `ROADMAP.md` section 5 (no mid-step nudges).
- **Notes:** `ROADMAP.md` Phase 3 already lists reminders, deferred because it needs a new permission and an Apple API check (`AGENTS.md` sections 7 and 9).
- **Next:** gate 1 verdict on CAL1, then parent sees the exact wording, then build.

### F2. Phone notifications for tasks started but not finished
- **Asked by:** parent. "notifications pushed to general iphone notifications for tasks started and not completed"
- **Status:** assessed
- **What it would be:** local notifications the app schedules itself on the phone (no server, nothing sent anywhere). Needs the notification permission, asked only after the student turns reminders on.
- **Rule 2 risk (the main one):** a "you didn't finish" message is the shaming pattern the app avoids. Wording must name the step and offer to pick it up ("Pick up where you left off: <step>"), never "unfinished", "overdue", "missed", a count, or a streak. The research does not support this reminder as an intervention; it is design judgment (`ROADMAP.md` item 3: tomorrow's first step is the weak-evidence version).
- **Other limits to decide before building:**
  - Student-chosen and off by default; student picks the time or turns it off per assignment.
  - At most one reminder at a time per assignment; none while a step is open; none after the assignment is finished or deleted.
  - Lock-screen text can show step words to anyone nearby, so the default text must not include the student's words. Showing the step is a switch.
  - No sound by default (P10).
  - Cancel everything on Delete everything.
- **Data and permissions:** one new permission (notifications). Local only, so no D8 row for sending; a D8 sentence stating nothing leaves the phone. Scheduling must sit behind a protocol in an `Apple/` folder with a fake for tests.
- **Unverified:** the `UserNotifications` API details. Check the SDK declarations before writing code.
- **Status update 2026-11-26:** this is now CAL2, queued behind CAL1 (`design/slices/CAL1-calendar-and-reminders.md`). It needs its own design note and gates before any code. CAL2 stores a switch, a chosen time and an id to cancel by, so it is not covered by CAL1's "stores nothing". Delete everything must clear pending notifications.
- **Next:** design note after CAL1 ships and the parent approves wording and the "off by default" rule.

### F3. Link to the student's own Google Calendar
- **Asked by:** parent. "can we link google calendar to it? student needs to sign in to THEIR google calendar"
- **Status:** approach decided 2026-11-26: option A, Apple's calendar (EventKit). Parent: "eventkit should be fine". Not designed or built. Option B (Google's own sign-in) is declined for now.
- **Two ways, with different consequences:**

| | A. Apple's calendar on the phone (EventKit) | B. Google's own sign-in and Calendar API |
|---|---|---|
| How it works | The app writes events to the phone's Calendar. If the student has added their Google account under iPhone Settings, Calendar, Accounts, those events appear in their Google Calendar | The app signs the student in to Google and calls Google's servers |
| Student signs in | In iPhone Settings (Apple's screen), not in this app | Inside this app |
| Account or money needed | None for the app | A Google Cloud project and an OAuth client the parent creates and owns; Google may require app verification for calendar access |
| What leaves the phone | Nothing from the app. The phone's own account sync sends the event to Google | Student's task text and times, sent to Google by this app |
| Third-party code (D2) | None | Google's sign-in kit is third-party code, which D2 forbids. A hand-built OAuth sign-in with Apple's `ASWebAuthenticationSession` is possible but more work and a security risk to get wrong |
| Keys and tokens (rule 9) | None | Refresh tokens must live in the Keychain; the client id is configuration |
| Minors | The event stays in an account the student already has | New sharing of a minor's data with Google, which needs parent permission and a D8 row |
| Permission prompt | Calendar permission (write-only access exists on recent iOS; verify the API) | Google consent screen |

- **Recommendation:** option A. It meets the request ("their Google Calendar", their sign-in) without this app holding any Google credentials, adding third-party code, or sending a minor's words to Google. The student must have added Google to their iPhone first.
- **What to put in an event:** keep titles plain and short. Default to the assignment's kind and not the step words, with a switch to include the step text, for the same reason as F2.
- **Option B** should wait unless A proves insufficient. It would need a parent decision, a D8 row, a security review of the sign-in, and the Google account step (rule: a parent handles accounts).
- **Next:** design note covering which events (one per assignment, or one per step), who creates and deletes them, and what happens when the student edits or deletes the assignment. Verify the EventKit declarations in the SDK first (`AGENTS.md` section 7), ask for the narrowest calendar permission that allows adding events, and add a one-line D8 note that the app itself sends nothing (the phone's own account sync may).

### F4. Make the app work well on older phones (iPhone 11 and similar)
- **Asked by:** parent. "make the ui sane for someone with an older phone", test on an iPhone 11 simulator, then "can we build for an older iOS and just reduce features?"
- **Status:** measured 2026-11-26; nothing changed in the app yet.
- **iPhone 11 simulator, iOS 26.5, full UI suite:** 70 tests, 68 passed, 1 skipped (iPad-only test, expected), 1 failed: `NudgeUITests testAskMeAQuestionReplacesTheFixedLineAndNoKeepsTheStep`. It fails again alone on the iPhone 11 and passes on the iPhone 15 Pro Max, so it is specific to the smaller screen. The recorded video ends on the work screen, so the test's tap on "Ask me a question" most likely landed on Start steps in the fixed bottom bar. Cause is probably the good-step card (R6) pushing the control below the fold on a shorter phone. From one video frame, not confirmed. The same pattern was already fixed in two StepReview tests with a scroll or "Got it".
- **Older iOS compile test (throwaway copy, iOS 17 target, 26 SDK):** only two files fail: `AI/Apple/AppleLanguageModel.swift` (Apple's on-device model) and `Voice/Apple/AppleSpeechInput.swift` (on-device dictation). Everything else in FocusKit compiled. The build stopped at that package, so errors in the app target itself are not yet known.
- **What lowering the target would cost:** the on-device AI and microphone dictation switch off on older iOS. The app already runs without AI (D5). Read-aloud uses older speech and should be unaffected (unverified). A new iOS floor is a D12 change, doubles the test matrix, and needs a pass on an iOS 17 or 18 simulator (an iOS 18.2 simulator runtime is installed).
- **Facts:** the iPhone 11 can run iOS 26, so a lower target helps only students whose phones are not updated. The app's `@Observable` state needs iOS 17 at minimum.
- **Next:** ask which phones and iOS versions the classmates have before deciding. Separately, fix the Nudge test and check small-screen layouts (the card should not hide the step controls at default text size).

### F5. Apple's cloud AI as an option
- **Asked by:** parent. "will apple's cloud ai work?"
- **Status:** assessed. Not built. Already recorded in `DECISIONS.md` (2026-11-23, P0-3).
- **Facts:** `PrivateCloudComputeLanguageModel` exists from iOS 27 and has an eligibility check; it sends words to Apple's servers and has a usage quota. Whether an iPhone 11 qualifies is not known.
- **Needs before building:** D6 change, a D8 row, the same safety and answer checks, T14 for it, and off by default.
- **Next:** none for the beta, which uses the on-device model only.

### F6. Better no-AI heuristics (the app must be fully usable without AI)
- **Asked by:** parent. "lets keep the app usable without ai, may want to look into making the non ai have better heuristics." Agreed 2026-11-26 after the free-tier and minors discussion: classmates under 18 should not use external AI, and iPhone 11 and older phones have no Apple Intelligence.
- **Status:** assessed. Not designed or built.
- **What the no-AI path does today (read from the code):**
  - Starter steps: 7 fixed steps per kind of work (`Shared/content.json` `kinds`), plus numbered or bulleted lines found in the pasted text, copied word for word (`StarterSteps.listItems`). The number picked (3, 5 or 8) cuts the list.
  - A two-minute first step and Get ready / Put it away steps.
  - Step notes (S2): "too long" over 20 words, and "vague" only for an exact match on a short list of phrases like "study" or "finish" (`StepReview`).
  - Splitting a step: at " and " when present, otherwise at the space nearest the middle (`PlannerModel.splitParts`). The midpoint split can make awkward halves.
  - Nothing reads the assignment beyond bullet lines. Check my steps (S3) needs an AI.
- **Candidate improvements, all plain code on the student's own text:**
  1. **Pick the kind from keywords.** Suggest a kind chip from words like "essay", "chapter", "problems", "quiz", "test", "project". The student confirms or changes it. Never silent.
  2. **Find the requirements without an AI.** Pull lines that contain cues such as "include", "must", "at least", a number plus "paragraphs/pages/words/sources/problems", "cite", "due", "show your work". Show them word for word (the same safe rule as S3). Use them for a no-AI Check my steps.
  3. **Turn numbered questions into chunks.** "Answer questions 1 to 10" becomes steps for questions 1 to 3, 4 to 6 and so on, sized by the step count the student picked. Each step must still start with something the student does.
  4. **Better splitting.** Split at commas, "then", "after", semicolons and lists before falling back to the midpoint; refuse a split that leaves a fragment under two words. This also improves Drifted and the editor's split.
  5. **Smarter vague-step notes.** Match "study for the test" and "do chapter 4" patterns (verb + very general object), not only exact phrases. Still a question, never a rewrite.
  6. **Reuse the student's own earlier steps for the same class.** The record already keeps course lines (C9 sends them to an AI). A no-AI version would offer "Use your History steps from last time" as a suggestion the student edits. It is the student's own words and is deletable.
  7. **Kind-specific step count.** Fewer fixed steps for short work, with the "what to do first" step taken from the assignment's first sentence verb when it is one of the app's allowed process verbs.
- **Rules to hold:**
  - Rule 1: no heuristic writes subject content or answers. They sort, copy and split the student's text, and the fixed steps are process steps.
  - The student does the thinking: every result opens in the editor and nothing skips it (P12).
  - Label what the app suggested ("Suggested from your assignment text") and never say it understood the assignment.
  - Never shame: no "your steps are vague" wording, only questions.
  - Fail closed: if a heuristic is unsure, use today's starter steps.
- **How to know it is better:** build a fixture set of 30 to 50 realistic assignment texts (essay, reading, problem set, project, test prep, messy copy-pasted text, empty and very long text) with the steps and requirement lines a person expects, and score each heuristic against them. Do not tune on a few examples. No claim that it improves outcomes.
- **Next:** pick which of 1 to 7 matter most to Ben. My recommendation is 2 (requirements) and 4 (splitting), because they feed Check my steps and Drifted and keep to copying the student's own words. Then a design note and a fixture set before any code.

### F7. A very small language model inside the app
- **Asked by:** parent. "is there a small llm that we could embed?" then "very very small"
- **Status:** assessed. Not designed or built. Sizes and model names below are from general knowledge and a web search on 2026-11-26, not measured here.
- **Is it possible:** yes. Models of about 0.1 to 1 billion parameters, squeezed to 4 bits, are roughly 100 to 600 MB. Small families that come up are Gemma 3 (270M and 1B), SmolLM2 (135M and 360M), Qwen (0.5B to 1.7B) and Llama 3.2 1B. A 1B model runs on recent iPhones; an iPhone 11 has 4 GB of memory and an older Neural Engine, so only the smallest sizes are realistic there. Speed on an iPhone 11 is unmeasured.
- **What a very small model is good for, and not:**
  - Poor at following the app's rules (hints not answers, no shame, stay on topic). Apple's own 3B model already needs T14 and `research/08-phone-ai.md` shows it drifts. A model under 1B would be worse.
  - Plausible for narrow jobs whose result the code checks: choosing a kind of work, copying requirement lines out of the assignment, and spotting vague steps. The safe rule from S3 applies: show only lines found word for word in the student's text.
  - Not suitable for generating steps, the Stuck question, Talk, or anything that writes new text for the student.
- **Rule and decision checks:**
  - **D2 (no third-party code):** running a model needs a runtime. Core ML is Apple's own and fits. MLX Swift and llama.cpp are third-party packages and do not. Converting a model to Core ML uses Python tools (coremltools), which are third-party tooling that D2 also bars. This needs a parent decision before any work.
  - **Rule 4 / D8:** an embedded model sends nothing anywhere, so no D8 row is needed. A model downloaded after install needs hosting and a network request (parent, T7).
  - **Size:** a model in the app adds its full size. Apple warns before downloading apps over 200 MB on cellular. Apple's On-Demand Resources allow downloading assets later, but that is a hosting and App Store step for the parent.
  - **Licence:** each model has its own terms (for example Gemma and Llama use their own licences with use restrictions). The parent must read and accept them, and the licence text may need to ship with the app. Not checked here.
  - **T14:** any model that can write words to a student must pass the answer-giving checks as its own configuration. A model used only to pick a label or copy lines needs a smaller check: the output is validated by code.
  - **Code:** it would sit behind the existing `LanguageModel` protocol, so the safety word, answer guard and process-step check already apply.
- **Recommendation:** do F6 (better plain-code heuristics) first. It likely covers the same narrow jobs with no model, no licence, no size and no D2 conflict. If the fixture scores from F6 show a clear gap, run a small bake-off of one or two tiny models on the same fixtures before deciding. Do not embed a model for text generation.
- **Next:** parent decides whether D2 can bend for Core ML conversion tooling. No other work until F6 has fixture scores.

### F8. Try Apple's language tools and a tiny model on the no-AI jobs (queued, not started)
- **Asked by:** parent. "ok lets do some trying with apple's tools. if i have an ai configured, can i set things to have similar experience? how to test with qwen2.5 as well?" Then: "put that on the queue, don't do it just yet."
- **Status:** queued. Nothing built or run. Do not start until the parent says so. It builds on F6 (heuristics) and F7 (tiny models).
- **Plan, when it starts:**
  1. **Fixture set first:** 30 to 50 realistic assignment texts with the expected kind of work, requirement lines and vague steps (shared with F6). Nothing below is judged without it.
  2. **Apple's tools:** a throwaway spike outside the shipped app, using `NaturalLanguage` (`NLTagger` for verbs, nouns and numbers; `NLEmbedding` for sentence closeness) on the fixtures. Check what each handles well or badly, including imperative sentences and messy pasted text. Scored against the plain-code heuristics.
  3. **A configured AI as a stand-in:** the app cannot narrow a big model by itself. The test would run the same three narrow jobs (kind, requirement lines, vague step) through the existing OpenAI-compatible code against any configured service, with the app's checks on the result (lines must appear word for word in the assignment). The results show how a small model would behave without changing the app. The existing harness `checks/phone-ai-eval.sh` and `StepsEval` run the app's own code on the Mac, and could be extended to read an address and key from the environment (never stored in the repository).
  4. **Qwen 2.5 0.5B:** needs no code. The parent's server is an Ollama fork, so pull the model there (for example `ollama pull qwen2.5:0.5b`), then add it as a service in My AI services with the server's address and the model name `qwen2.5:0.5b`. Whether Polystrata serves it is unverified. Run the same fixtures through it and compare. This is for the parent's devices only; classmates stay on the on-device model or no AI.
  5. **Report:** one table of fixture scores per method (plain code, Apple tools, Apple's on-device model, Qwen 2.5 0.5B, one larger configured AI), with counts of wrong lines shown to a student. A method counts only if its output is checked by code and never writes new text for the student.
- **Needs from the parent when it starts:** the server address and whether the model can be pulled there; permission to use a key from the environment for the larger AI test; the D2 answer in F7 if an embedded model is ever considered.
- **Rules to hold:** no student data in fixtures (write them), no secrets in the repository, no new permission, and no change to what the shipped app sends.

---

## Earlier ideas now tracked elsewhere

- If-then reset plan, comeback offer, delayed recall, timer study: `design/coaching-roadmap-plan.md` (panel-approved plan, nothing built).
- "Tomorrow's first step", dread and crux, progress display, rotating wording: `ROADMAP.md` Phase 1.
- Subscription instead of an AI key: `ROADMAP.md` section 4.
