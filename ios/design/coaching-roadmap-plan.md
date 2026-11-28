# Coaching roadmap: design and implementation plan

Status: panel-approved plan, 2026-11-26; implementation awaits the explicit approvals in section 7

## 1. Purpose

This plan covers the next coaching work after build 24:

1. Clear the current AI features for beta use.
2. Add one student-chosen reset plan.
3. Test the timer and block-length experiment already in the app; do not prescribe Pomodoro.
4. Add minimal non-AI comeback support only if students need it.
5. Add delayed recall later, without notifications in the first slice.

It intentionally does **not** propose a free-ranging AI coach, fixed 25/5 Pomodoro, mid-step nudges, an AI-generated coping plan, or an AI-generated comeback slice.

## 2. Evidence and confidence

Evidence for a method is not evidence that this app’s implementation works. Every proposed feature remains a design to test.

| Opportunity | Evidence in this project | Decision in this plan |
|---|---|---|
| Self-monitoring | Strong; putting digital check-ins only at natural pauses is design judgment | Already built. Do not add mid-step check-ins |
| Organizational-skills training | Strong; translating it into this app’s editor is untested | Already built. Keep the student deciding |
| Assignment-scoped reset plan | Direct support is Weak and lab-based. A later study gives Moderate support to **goal-plus-if-then** work, but R1 does not implement that combined intervention | Build one small optional, student-chosen experiment; do not describe it as the researched combined intervention |
| Fixed Pomodoro / fixed breaks | Weak and conflicting; neither break study involved ADHD | Do not recommend 25/5 or fixed breaks |
| Student-chosen block lengths | A cautious, non-prescriptive design implication from conflicting break research | Existing timer, R5 and C4 are enough for beta; test usability before adding anything |
| Comeback support | No direct study; high-scoring design judgment in `research/05-adhd-ideation.md` | Keep a minimal non-AI design ready; build only after beta evidence or explicit approval |
| Retrieval practice | Moderate ADHD-specific evidence in college students; strong general technique | Immediate recall is built. Add delayed recall only after the first beta and ask for retrieval before showing the old answer |
| Guarded AI hints | Moderate evidence that hints avoid the harm seen with answer-giving. General AI coaching, especially for ADHD, is weak or untested | Finish T14 and D8 before wider use; no new AI moves in this roadmap |

No screen, presentation, beta report, or App Store text may claim the app treats ADHD, improves attention, improves recall, improves completion, raises grades, puts students in flow, finds the best block length, or caused a change. Use the supported wording in `research/00-knowledge-summary.md` section 6.

## 3. Product principles

1. The student makes every choice. Fixed reset options are app-written and student-chosen; do not call them student-authored.
2. Coaching appears at a natural boundary, never during an active step.
3. Every coaching action is optional and easy to skip.
4. No compliance score: the app does not track whether the student followed a reset plan, used a timer, returned quickly, or remembered more.
5. No missed-day count, streak loss, red warning, praise, or judgement.
6. These features make no AI or service requests. Saved data stays on this device except that, when Include in my backup is on, it is included in the student’s iCloud or computer backup as disclosed in D8.
7. A new persistent student line or metadata must have a plain visibility and deletion path.
8. Each slice must work with largest accessibility text, VoiceOver, hardware keyboard, full- and half-width iPad layouts, and an iPhone.
9. An implementation may not silently replace or reinterpret a student’s words.
10. No new free-text field ships until the parent decides how the app handles student-written danger or distress locally. The first reset-plan slice therefore uses fixed choices only.

## 4. Roadmap and dependencies

```text
R0 Beta readiness
  ├─ R1 If-then plan (non-AI)
  ├─ R2 Timer beta study (no product change first)
  └─ beta findings
       ├─ R3 Minimal comeback offer, only if needed
       └─ R4 Delayed recall, after immediate recall is understood
```

AI C3 remains held. Fixed Pomodoro remains a non-goal. Notifications are a separate future permission task and are not required by any slice below.

---

# Formative beta method

The beta is formative research with a convenience sample of 5–10 students. It may guide wording, usability, safety, and prioritization. It cannot establish efficacy, identify an optimal block length, or show that the app caused an outcome.

Before collecting anything, the parent approves a beta-data protocol covering **every retained record**:

- Consent/assent and teacher/parent authorization. Identity-bearing permission records are stored separately from coded beta responses, with separate access, retention, deletion, and legal/administrative handling rules. They are never linked in the analysis file.
- Anonymous participant code, never a name, school, diagnosis, or account identity.
- Exact questions and fields retained.
- Storage location, encryption available there, who can access it, retention date, deletion process, and aggregate reporting rules.
- Default: anonymous aggregate counts only, no verbatim student text and no screenshots, homework, recall answers, reset plans, AI chats, learner-record lines, photographs, audio, or device identifiers.

For each feature question, record:

- How many students encountered the feature.
- How many used it voluntarily.
- How many answered the question.
- Preserve “not used” and “not asked”; do not treat them as negative ratings.

Core interview questions:

1. Did you change steps the app suggested? Why or why not?
2. Did you ever tap Done when you were not done?
3. After time away, did you return? What helped or got in the way?
4. Was any app feature more distracting than the schoolwork?
5. Did an AI ever give you text you could hand in?
6. Did an AI ever make you feel graded or judged?
7. For each feature encountered: what did you think it would do before tapping, and what should change?

If efficacy is studied later, write a separate protocol. The existing one-person ABAB proposal in `research/03-recommendations-and-plan.md` is a possible starting point, with its unblinded and self-report limits stated clearly.

# R0. Beta readiness before new coaching

## Goal

Clear enabled AI behavior and privacy disclosures before distributing the build beyond Ben’s phone, then run the formative beta with explicit authorization.

## Order of work

1. Inventory every enabled AI path **before testing**. Build the T14 matrix with one row per move/path and one column per exact configuration. Record Apple OS/model version and, for an external service, endpoint label, host, model id, and thinking level. Use test content only, never real student data, to inspect and compare actual request payloads with D8.
2. On Ben’s phone, execute and record each applicable cell: eight answer-seeking attempts from `design/03-ai-search-privacy.md` section 3.4, `NOTHING`, and voice, lookup, or malicious-guide cases where supported.
3. Gate 4 reviews transcripts and payload fixtures generated from synthetic test values; no real student data is captured. Any failed or untested cell is not eligible for beta.
4. **Enforcement for classmate beta:** use Apple’s on-device model only. Add a beta-build configuration that hides/disables My AI services and refuses an external model in code. Parent devices may test an exact external configuration only after its matrix column passes; participants cannot add or change one.
5. Parent confirms the complete D8 table and who may receive the build.
6. Replace the Wikipedia user-agent placeholder, resolve the Tailscale warning rule, run device checks 91–104, and complete the accessibility matrix.
7. Obtain teacher approval, written parent permission where applicable, provider age-term confirmation, and the approved beta-data protocol.
8. Verify every pre-upload exit criterion and produce the archive.
9. The parent performs TestFlight/account setup and uploads the approved archive.
10. Verify TestFlight installation on the parent’s authorized test devices.
11. **Only then**, after that installation check passes, may the parent distribute the beta to an authorized participant.

## Accessibility matrix

Automated/simulator configurations:

- iPhone 13 mini, 375 × 812 pt, portrait, iOS 26 simulator, Dynamic Type `UICTContentSizeCategoryAccessibilityXXXL` (smallest supported target for layout checks).
- iPhone 15 Pro Max simulator, portrait and landscape where the target permits landscape, default and Accessibility XXXL.
- iPad Air 11-inch (M4) simulator (`CF3E2364-10CE-42CF-B887-84D437CD08ED`), 834 × 1210 pt portrait and 1210 × 834 pt landscape, default and Accessibility XXXL.

Physical configurations:

- Ben’s iPhone 15 Pro Max: portrait, largest Settings → Accessibility → Display & Text Size setting, VoiceOver, hardware keyboard when available, dark mode, reduced motion.
- Parent’s iPad Pro 11-inch (M4): full-width portrait and landscape, plus 50/50 Split View (compact horizontal size class, approximately 417 pt content width), largest accessibility text, VoiceOver, hardware keyboard, dark mode, reduced motion.

On each applicable configuration, check every action is reachable by scrolling; no card or fixed inset hides Start; sheet open/close restores VoiceOver focus; labels do not duplicate prompt text; keyboard traversal, activation, cancellation and text entry work. Simulator passes do not substitute for the named physical checks.

## Exit criteria

- Every enabled move/model cell has a Gate 4 PASS; all others are disabled.
- D8 and authorized recipients are confirmed.
- Teacher/parent approvals and provider age terms are settled for each beta participant.
- No privacy placeholder remains.
- Before upload: the archive and every non-TestFlight criterion pass.
- After the parent’s upload: TestFlight installation works on the parent’s authorized test devices.
- No participant distribution occurs before both stages pass.
- Accessibility failures are fixed or named as beta blockers.

# R1. Student-chosen reset plan

Working name: **My reset plan**. Research documents may call related interventions “implementation intentions”; the student never sees that term.

## Goal and evidence boundary

Before starting work, let the student choose one small action they can take if they drift. The app later shows that same choice when the student reports drifting. It never decides whether they followed it.

Direct support for this assignment-scoped reset plan is weak and lab-based. Moderate evidence in the later coaching note applies to goal-plus-if-then work, which this slice does not implement. R1 is a usability and acceptability experiment, not a treatment or efficacy claim.

The plan is assignment-scoped. Today/week/month/year goals remain separate. It is also different from ROADMAP’s “tomorrow’s first step.”

## UX

### Editor row

Near the end of the scrollable editor list, not in the fixed bottom area, show one compact optional row:

> **Add a reset plan (optional)**

After selection:

> **If I drift:** Read the step again
> Change · Clear

Start remains available without a plan.

### Choice sheet

Title:

> **If I drift, I will…**

Line:

> Pick something small you can do to get moving again.

Four fixed, equal choices; selecting one saves immediately and closes the sheet:

- Read the step again
- Try the first small part
- Ask for a hint
- Take a pause

A quiet **Not now** closes without changing the plan. There is no custom-text choice in the first slice. It may be designed only after the parent approves a local danger/distress policy for new student text.

### Drifted

Do not add compliance buttons. After Drifted, show one quiet line immediately above the existing smaller-piece question and field:

> **Your reset plan:** Read the step again

The existing student-written smaller-piece flow stays unchanged. The app records neither whether the student followed the plan nor whether it “worked.” Plan changes happen outside active work.

### Plan ownership after Start

Plan contains a compact reset-plan row while the assignment exists:

> **If I drift:** Read the step again
> Change · Clear

The plan, Change, and Clear are separate VoiceOver elements. Change uses the same choice sheet. Clear requires no destructive warning because it deletes only this optional setting, but it must be transactional.

## Data and backup

Add `resetPlanId: String?` to both `Draft` and `SavedWork`. Use stable identifiers (`readAgain`, `firstPart`, `askHint`, `takePause`), never rendered English. `Words` maps an id to display text; wording or localization changes do not invalidate saved choices.

- Only the four stable ids are valid in R1. Unknown or damaged ids load nil.
- Cap and clean in custom lossy decoders, initializers, and `limited(by:)`; a number, array, object, null, blank, or unknown string must not damage the rest of `draft.json` or `work.json`.
- `PlannerModel` exposes `draft.resetPlanId`; `AppModel` exposes computed `saved?.resetPlanId`; views render through `ResetPlan.label`. Do not create duplicate stored properties.
- Starting a new-assignment draft does not alter the active assignment. Cancelling returns to the active plan. Only successfully starting replacement work replaces `work.json` and removes the old active plan locally.
- Editor Change/Clear copies the current `Draft`, validates the id, saves, and publishes only after success. On failure the sheet stays open, the old row remains, and a calm save-failure line appears in the sheet and editor. Relaunch shows the old value.
- Active Change/Clear applies the same copy-save-publish rule to `SavedWork`; failure keeps the old Plan row and shows a calm failure line in Plan.
- Starting work uses a recovery marker: add stable `draftId` to `Draft` and `sourceDraftId` to `SavedWork`. Save the new work first, then clear the matching draft. If draft clearing fails, the new work remains authoritative; on launch, a draft whose id matches active `sourceDraftId` is treated as consumed and clearing is retried. This fixes the existing two-file partial-write case without losing new work or reopening stale planning.
- Delete everything removes it from this device. An older backup may retain it until a newer device backup replaces it.
- When Include in my backup is on, it is included in the student’s iCloud or computer backup under D8.
- No network or AI request.

## Reusable sheet contract

One reusable reset-plan sheet takes:

```swift
initialId: String?
onSave: (String?) -> Bool
```

Cancellation invokes no callback. `false` keeps the sheet open and shows the caller’s calm save-failure line; `true` closes it.

- Editor wires save to transactional `PlannerModel.setResetPlanId`.
- Plan wires save/clear to transactional `AppModel.setResetPlanId`.
- Work only reads and renders `AppModel.resetPlanId`; it does not edit it.

## Implementation slices

The feature is one product but four independently reviewed commits. Do not distribute an intermediate slice. Parent approval of R1’s fixed choices, storage fields, and draft recovery precedes R1a0.

### R1a0 — General draft-consumption recovery

This is an internal reliability prerequisite, separate from reset-plan storage.

- Add optional `draftId` to `Draft` and optional `sourceDraftId` to `SavedWork`, with lossy decoding.
- `.empty` has no id. On the first successful mutation that creates a genuinely new draft, assign a UUID in the same persisted copy; if saving fails, do not publish the mutation or id.
- Edits preserve the id. A legacy non-empty draft with no id is assigned a UUID and successfully persisted before Start is enabled; failure disables Start and shows the calm save-failure line.
- `PlannerModel.start()` requires a persisted id, saves `SavedWork.sourceDraftId`, then clears the draft. If clearing fails, work remains authoritative.
- On launch, a loaded draft id matching active `sourceDraftId` is a consumed stale draft: ignore it in memory, show the active work, and retry clearing. A new draft can never reuse the consumed id.
- Tests inject failure at identity save, work save, draft clear and launch repair boundaries.

### R1a1 — Reset-plan logic and persistence

- New `Logic/ResetPlan.swift`: four stable ids, validation, rendering through `Words`.
- Lossy `resetPlanId` fields in `Draft` and `SavedWork`.
- Cleaning in decoders, constructors and limiting.
- Explicit copy from Draft to SavedWork.
- Unit, migration, unknown-id, wording-change and replacement-assignment tests.

### R1b — Editor UX

- Reusable sheet.
- Optional editor row, Change and Clear.
- `PlannerModel.setResetPlanId` uses copy-save-publish. False keeps sheet open, old row visible and failure line shown.
- Large-text, VoiceOver, keyboard and iPad tests.

### R1c — Active assignment UX

- `AppModel.setResetPlanId` transactional save.
- Plan row with Change and Clear; Plan owns and clears its failure line.
- Quiet Drifted reminder only.
- No learner-record line or adherence event.

Likely files across slices: `Logic/ResetPlan.swift`, `Models/Draft.swift`, `Storage/SavedTypes.swift`, `Models/PlannerModel.swift`, `Models/AppModel.swift`, `Words.swift`, `EditorView.swift`, `NextStepView.swift`, `WorkView.swift`, focused tests and fixtures.

## Tests

Logic/storage:

- Every stable id is valid; every other id is nil; a wording change does not alter the saved choice.
- Missing, null, number, array, object, blank, unknown, and oversized values do not damage the rest of the file.
- Draft-to-work copy is exact; failure at work save and at draft-clear save has deterministic recovery on relaunch.
- Opening/cancelling a replacement draft preserves the active plan; successfully starting replacement work removes it.
- Failed editor or active Change/Clear keeps the old value on screen and after relaunch; sheet remains open with a calm failure line.
- Delete everything removes the local value.
- No learner-record, adherence, rating, score, or AI call is made.

UI:

- Add a fixed plan, Start, Drifted, and see the same quiet reminder above the existing smaller-piece field.
- Not now leaves Start available.
- Plan Change and Clear work; failed-save fixture leaves the old line visible.
- Closing the sheet changes nothing.
- Relaunch draft and active assignment persistence.
- Accessibility matrix from R0.

## Formative beta questions

Record fixed-choice use separately from future custom plans. Ask only students who encountered it:

- “What did you expect the reset plan to do?”
- “Did seeing it help you decide what to try?” Helped / Meh / Not this.
- “Was any choice missing?”

These are acceptability questions, not an efficacy measure. Do not infer whether the student followed the plan.

# R2. Timer and break strategy

## Product decision

Do **not** add a Pomodoro mode or label any duration “best.” Keep 5, 12, and 25 minutes as ordinary student choices. Do not add fixed 5-minute breaks.

## Why

The two break studies in the project conflict, and neither studied ADHD. Pomodoro fatigue rose faster in the later study. The app already has the safer experiment:

- Optional timer.
- Student chooses a duration.
- Shorter / About right / Longer / Skip.
- Suggestions change only after repeated answers.

## UX changes before beta

None required. The timer stays optional and silent.

Possible wording audit only:

- Confirm timer menu does not call one length recommended or productive.
- Confirm the learned marker says “your pick,” not “best.”
- Keep Skip easy to reach.

## Formative beta protocol

For students who voluntarily use the timer:

1. Invite exposure to more than one block length only to test whether both interfaces are understandable; do not compare outcomes or call assignments comparable.
2. Record whether the student noticed and understood the ending question.
3. Ask whether the ring helped, distracted, or went unnoticed.
4. Ask whether they wanted a break choice.
5. Retain no private homework text or local setting line outside the device.

Report concrete encounter/use/response counts under the cross-cutting beta method. Do not infer that one duration works better.

## Decision after beta

- Keep unchanged if students understand it and use it voluntarily.
- Simplify or remove C4’s AI follow-up if it adds no value beyond the fixed question.
- Add a break choice only if several students request it. A future break choice appears after a timer ends and never interrupts a live step:
  - Keep working
  - Take a short pause
  - Done with the timer

A break timer, notification, or automatic restart is a separate design.

## Tests

Existing `BlockLengthTests` and `BlockLengthUITests` remain the source of truth. No implementation task is created until beta findings identify a problem.

---

# R3. Minimal non-AI comeback offer

Status: planned, held until formative beta findings or explicit approval.

## Goal and evidence boundary

After a gap, reduce the decision cost of restarting without mentioning the gap and without changing the student’s step. No direct study supports this screen; it is design judgment.

## Preconditions

Build only if beta participants report that returning to unfinished work is difficult, or Ben explicitly asks for it after seeing mock screens.

Before implementation, the parent must approve one new metadata field: `lastInteractionOn`. It is a last-interaction date, not evidence of activity, attention, speed, or adherence.

## R3a0 — SavedWork interaction schema and migration

Before implementation, the parent approves these new `SavedWork` fields:

```swift
lastInteractionOn: Date?
resumeInStep: Bool?
```

They are used only for same-local-calendar-day versus later-day routing and whether active work resumes in Work or Today. They are not evidence of attention, duration, speed, or adherence; no interval/history is retained.

- Custom lossy decoding: malformed new fields become nil without damaging `work.json`.
- Legacy `resumeInStep == nil` reads the old `Flags.inStep` once; the first successful active-work save writes an authoritative Bool.
- `lastInteractionOn ?? savedOn` is the routing date.
- They may enter device backup. Replacing/deleting the assignment and Delete everything remove them locally.

### R3a1 — Transactional interaction writes

`SavedWork` becomes authoritative for active-assignment navigation, eliminating cross-file reconstruction:

- Start Work: copy active work, set `resumeInStep = true` and interaction date, save, then publish/open.
- Back to Today: set `resumeInStep = false` and date, save, then publish/close.
- Still working: keep `resumeInStep = true`, update date, save, then publish acknowledgement.
- Stuck: in the existing work copy, increment Stuck, keep `resumeInStep = true`, set both `savedOn` and interaction date, save, then publish/open sheet.
- Done, effective Drifted and Later: include interaction date and final `resumeInStep` in the same existing `SavedWork` save. Later and all-done use false; a remaining next step uses true.
- Duplicate taps, blank/rejected Drifted, timer start/end/answer, reset-plan Change/Clear, parking a thought, and failed saves do **not** count as assignment interaction for comeback eligibility.
- Every operation publishes navigation, counters and messages only after the one `SavedWork` save succeeds. Failure leaves prior screen/work and shows a calm line. `Flags.inStep` becomes compatibility-only and is repaired best-effort after authoritative work save; its failure cannot change routing.

### R3a2 — Cold-launch routing

Eligibility applies to any unfinished active assignment, whether the student last left on Today or Work:

- Same local calendar day: use authoritative `resumeInStep` (or legacy fallback).
- Later local calendar day: Today comeback mode, regardless of prior screen.
- Missing/damaged date: ordinary Today, fail closed.
- Foregrounding an app left alive overnight is out of scope and named in device results.

R3a0–R3a2 are reviewed separately but never distributed without R3b.

## R3b — One-card comeback UX

Comeback mode replaces ordinary Today content with one scrollable card. Do not show the ordinary step card or Start button at the same time.

Card:

> **Welcome back**
> [unchanged full step]
>
> **An easier place to start:** [complete deterministic action]

Actions:

- **Start with this**
- **Use the whole step**

The offered action follows one deterministic, testable contract:

- Split only at the first case-insensitive ` and `.
- Trim both halves.
- Offer the first half only when both halves contain at least two words and each independently passes `ProcessStep.isProcess(_:limit:)` with `content.limits.stepLength` (currently 200 characters).
- Never use the existing midpoint word split.
- Otherwise show ordinary Today with no choice.

Golden examples: `Read chapter 3 and write three notes` offers `Read chapter 3`; `Research climate change and its effects`, `Open and read`, and a one-clause step offer nothing.

Both actions open normal Work:

- Start with this sets transient accepted state `(assignmentId, stepId, text)` and shows **Start with: [text]** above the unchanged step.
- Use the whole step clears accepted state and shows no extra line.

The accepted state is exposed only while assignment and step ids match. Clear it when the current step changes, the student chooses whole step, replacement work starts, assignment is erased, or Delete everything runs. Back to Today does not clear the accepted choice for the same step; leaving the assignment does. It is never stored as a step and may be offered again after app termination.

## No AI

AI C3 stays deferred. The deterministic version tests the underlying UX without a D8 row, model latency, or another T14 matrix row. R3a must not ship without R3b.

## Implementation and tests

Likely files: new `Logic/Comeback.swift`, `SavedTypes.swift`, `AppModel.swift`, `NextStepView.swift`, `WorkView.swift`, `Words.swift`, AppBoot test fixtures, and focused tests.

Tests:

- Same calendar day: no offer; later local day: calm offer; no count.
- Travel/clock change: compare calendar days, never display elapsed time.
- Cold launch routing; same-day direct restoration; later-day Today.
- Unsplittable step: ordinary Today.
- Accepted state cannot leak across assignment or step ids.
- Original step count and text never change.
- Every accepted check-in clears or preserves state as specified.
- Damaged/missing dates fail to ordinary Today.
- Scrollable largest-text card, VoiceOver order, keyboard activation, full- and half-width iPad.

Formative question, only after exposure:

> “After time away, did this help you decide what to do?”

This measures perceived decisional ease, not attention, completion, or causal effect.

# R4. Delayed recall on Plan

Status: future design. Hold until students understand and voluntarily use immediate recall, and until the parent decides how new student-written danger or distress is handled locally.

## Goal and evidence boundary

At a natural boundary on Plan, invite retrieval before showing an earlier answer. The first slice is non-AI and makes no claim that one-day or seven-day timing is optimal. It never appears beside unfinished work on Today and uses no notification.

## R4a — Loss-tolerant metadata migration (parent approval required first)

Extend `RecallAnswer` with optional metadata and a defaulted flag:

```swift
assignmentId: String?
course: String?
kindId: String?
lastOfferedOn: Date?
stopOffering: Bool  // missing or malformed -> false
```

Requirements:

- Decode the collection through a `LossyRecallAnswer` wrapper. A malformed required legacy field (`id`, `answer`, or `date`) drops only that item. A malformed optional legacy field (`stepId`) becomes nil. Missing or malformed new metadata becomes nil/false. One bad item never discards valid siblings.
- Missing/malformed new fields use safe defaults.
- `RecallAnswers.limited` preserves every field.
- Immediate `saveRecall` transactionally stamps context from active work. Publish only after save success.
- Legacy items without assignment identity remain visible/deletable but are not eligible.
- Add an AppBoot fixture that seeds recall/work and a fixed clock before `AppModel` initialization.

## R4b — Pure selector and model transactions

Selector:

- At least one local calendar day old.
- `stopOffering == false`.
- `lastOfferedOn` nil or at least seven local calendar days ago.
- Oldest eligible date wins; one card maximum.
- Plan only; weekly reflection and recall modal states are mutually exclusive in the model.

Every completed Try path—Save new thought, Done without saving, or dismiss after submission—transactionally stamps the **source** item’s `lastOfferedOn`. Cancelling or swipe-dismissing before submission changes nothing. Not now stamps the source date. Keep but stop offering sets `stopOffering = true`. A failed metadata save leaves the prior state/card visible and shows a calm failure line.

Appending a follow-up answer uses copy-save-publish, copies source context, and does not overwrite the old answer. If `RecallAnswers.count` (200) is already reached, do not append or evict anything; keep the comparison open and calmly ask the student to delete an older saved answer first. A failed or capacity-blocked append keeps both typed text and the source answer intact. Generic limiting must never be used to silently evict the selected source during this action.

One- and seven-day values are design defaults, not evidence-based optima. Add DST, time-zone, and clock-change fixtures.

## R4c — Plan list ownership

Before the retrieval sheet:

- Visually and accessibly distinguish recall answers from parked thoughts.
- Show relevant class/kind context when present.
- Provide confirmed Delete answer, removing text and all attached metadata transactionally.
- Provide Keep but stop offering separately; it retains the visible/deletable answer.
- Failed stop/delete leaves the item visible and shows a calm failure line.

## R4d — Retrieval-before-reveal sheet

Collapsed Plan card:

> **Look back at something you studied?**

Actions: **Try it**, **Not now**, **Keep it, but stop offering**.

Try it opens a sheet without the old answer:

> **What comes to mind now?**

Exits:

- Cancel or swipe-dismiss before submission: no metadata change.
- Submit: stamp the source offer date, then reveal old and new answers.
- Save this new thought: append transactionally; on success close; on failure stay open with text intact.
- Done without saving: source stamp remains, no new answer, close.
- Swipe-dismiss after submission: source stamp remains, no new answer.

Comparison:

> **Earlier, you wrote:** “[old answer]”
> **Now, you wrote:** “[new answer]”

No custom text or R4 implementation starts until the parent approves the local distress policy.

## Privacy, backup, and tests

No network or AI request. Saved answers and metadata remain on device except that device backup may include them when enabled. Delete removes them locally; an older backup may retain them until replaced.

Tests span the slices:

- Migration/defaults/malformed-item isolation and `limited` preservation.
- Context stamping and transactional failure.
- Deterministic age/order, DST/time zone, and legacy exclusion.
- Every sheet exit and source stamp rule.
- Append failure keeps text; old answer never changes.
- Stop offering and Delete remain distinct.
- Plan labels recall versus parked thought.
- Old answer never appears before submission.
- No interruption of Work or Today.
- R0 accessibility matrix.

Do not distribute R4 until R4a–R4d are complete.

# 5. Cross-cutting implementation process

Each implementation slice follows `AGENTS.md`:

1. Orient and run `checks/check.sh` before changes.
2. Claim one task only.
3. Write a one-page slice note.
4. Gate 1 design review.
5. Describe student-visible UX to Ben and wait for approval unless the parent explicitly waives that gate for this named task.
6. Tests first for logic and storage migrations.
7. Build only the approved slice.
8. Self-review the full diff.
9. Gate 2 for student words, storage, AI, network, permissions, or >200 lines.
10. Fresh Checker runs the full check.
11. One commit, update task/status/device-check files.
12. Build number, phone/iPad install and archive only after all checks pass.

No two roadmap features share one commit or one gate review.

# 6. Panel review record

Four independent read-only reviews were run on 2026-11-26:

1. Evidence/research method: **REVISE** (7 must-fix).
2. Student UX/accessibility: **REVISE** (6 must-fix).
3. Youth safety/privacy: **REVISE** (7 must-fix).
4. iOS architecture/testing: **REVISE** (7 must-fix).

This revision applies all must-fix items:

- Separates method evidence from app evidence; corrects the reset-plan rating.
- Calls R1 student-chosen, removes custom text, and makes the Drifted reminder quiet.
- Defines a formative beta method and complete claims boundary.
- Puts T14, Gate 4, D8, authorization, permission, and provider age terms before distribution.
- Corrects backup and local-deletion claims.
- Splits R1, R3, and R4 into implementable slices.
- Makes reset-plan source of truth, lossy migration, active editing, transaction failure, and replacement semantics explicit.
- Makes comeback timestamp, cold-launch routing, keyed transient state, and one-card UX explicit.
- Changes delayed recall to retrieval-before-reveal on Plan, with deterministic migration and separate stop-offering/delete controls.
- Adds a concrete accessibility matrix.

A final integration review follows this revision; its verdict is recorded below.

First integration review (two independent reviewers): **REVISE**. Applied: distribution moved last; T14 inventory precedes testing and classmate beta is on-device-only; stable reset ids and transaction recovery; complete R3 eligibility/persistence/split contract; R4 split further with all exits and transactions; smallest-iPhone matrix; all beta records covered by a parent-approved protocol.

Second integration review (two independent reviewers): **REVISE**. Applied: authorization identities separated from coded responses; exact accessibility devices/sizes/categories; legacy draft-id lifecycle and recovery split into R1a0; reset persistence split into R1a1; R3 uses authoritative SavedWork navigation and three separate persistence/routing commits; exact process-step limit and event list; lossy recall collection behavior and parent approval; all four R4 slices named in release order.

Third approval pass (two independent reviewers): **REVISE** (3 narrow blockers). Applied: TestFlight upload/install is now a two-stage release gate; release order names all four R1 slices; R4 refuses a follow-up at the 200-answer cap rather than silently evicting the source.

Final panel-chair sign-off after those fixes: **FINAL PANEL VERDICT: APPROVE**.

# 7. Decisions and hold points

## Recommended defaults ready for parent/Ben review

1. R1 appears as an optional editor row, not a blocking screen.
2. R1 has four fixed choices and no custom text in the first slice.
3. Drifted shows the plan as one quiet reminder; no compliance buttons.
4. Plan provides Change and Clear for the active plan.
5. No Pomodoro mode; 25 minutes remains an ordinary choice.
6. R3 uses “Start with this / Use the whole step” and stays non-AI.
7. R4 lives on Plan and asks for retrieval before showing the old answer.

## Explicit approvals required

- Parent/Ben approve R1’s exact wording and placement before R1b.
- Parent decides how new student-written danger or distress is handled before any later custom reset plan or R4 free-text response.
- Parent explicitly approves `lastInteractionOn` before R3a.
- Parent authorizes every beta recipient; teacher and parent permissions are obtained where applicable.
- D8 and every enabled AI move/model matrix cell pass before distribution.

# 8. Recommended order

1. R0 beta readiness and authorization.
2. Parent/Ben approve R1 wording and storage; implement R1a0, R1a1, R1b and R1c as four separate reviewed commits; distribute only when all four are complete.
3. Formative beta of current timer, R6 card, immediate recall, weekly reflection, and R1.
4. R3a/R3b only if return is a reported problem and the parent approves `lastInteractionOn`.
5. Parent approves R4 metadata and local distress policy; implement R4a, R4b, R4c and R4d as separate reviewed commits. Do not distribute until all four are complete.
6. Revisit AI C3 only if deterministic comeback is useful but its offered action is often poor.
