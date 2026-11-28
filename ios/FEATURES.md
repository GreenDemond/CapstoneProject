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

---

## Earlier ideas now tracked elsewhere

- If-then reset plan, comeback offer, delayed recall, timer study: `design/coaching-roadmap-plan.md` (panel-approved plan, nothing built).
- "Tomorrow's first step", dread and crux, progress display, rotating wording: `ROADMAP.md` Phase 1.
- Subscription instead of an AI key: `ROADMAP.md` section 4.
