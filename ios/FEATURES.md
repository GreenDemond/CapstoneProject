# FEATURES.md (iPhone app): running log of new feature ideas

Every new idea goes here first, with its date, who asked, what the rules and research say, and a recommended next step. This file is a log, not a set of decisions. Nothing here is decided until the parent or Ben says so and `DECISIONS.md` records it. Built work moves to `PROGRESS.md`; designed work lives in `design/` and `TASKS-coaching.md`.

Statuses: `idea` (just logged), `assessed` (checked against the rules), `designed`, `approved`, `built`, `declined`.

How to add one: date, who asked, one-line request in their words, then rule conflicts, research link, data and permissions, recommended next step.

---

## Logged 2026-11-26

### F1. Reminders and calendar entries for each task
- **Asked by:** parent. "notifications/calendar integration for each task"
- **Status:** idea
- **Rules to check:** rule 2 (never shame), rule 4 and D8 (what leaves the phone), rule 5 (no reports to others), `ROADMAP.md` section 5 (no mid-step nudges).
- **Notes:** `ROADMAP.md` Phase 3 already lists reminders, deferred because it needs a new permission and an Apple API check (`AGENTS.md` sections 7 and 9).
- **Next:** parent decides the shape (see F2 and F3), then a design note.

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
- **Next:** design note after the parent approves wording and the "off by default" rule.

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
- **Asked by:** parent. "make the ui sane for someone with an older phone", test on an iPhone 11 simulator
- **Status:** in progress. An iPhone 11 simulator on iOS 26.5 exists ("iPhone 11 (beta check)"), and the full UI suite was started on it. Results to be recorded in `PROGRESS.md`.
- **Facts so far:** the app's minimum is iOS 26.0 (`DECISIONS.md` D12). iOS 26 runs on the iPhone 11 and newer. Apple Intelligence does not, so those phones run without on-device AI and the app falls back to fixed lines and starter steps (D5).
- **Note:** an older iOS than 26 is not possible without losing the on-device AI and on-device voice typing; see the assessment on 2026-11-26 in the conversation notes.
- **Next:** read the UI test results on the iPhone 11 simulator; fix layout or no-AI wording problems found; decide whether to lower the iOS target.

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

---

## Earlier ideas now tracked elsewhere

- If-then reset plan, comeback offer, delayed recall, timer study: `design/coaching-roadmap-plan.md` (panel-approved plan, nothing built).
- "Tomorrow's first step", dread and crux, progress display, rotating wording: `ROADMAP.md` Phase 1.
- Subscription instead of an AI key: `ROADMAP.md` section 4.
