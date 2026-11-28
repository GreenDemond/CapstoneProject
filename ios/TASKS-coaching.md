# TASKS-coaching.md

The coaching and memory work, in order. Same rules as `TASKS.md`: one task per session; take the first task that is `ready`; follow the loop in `AGENTS.md` section 3; update the status table when done. Design: `design/05-coaching-and-memory.md`. Detail per task: `design/slices/COACH-plan.md` and `design/slices/MEMORY-plan.md`. Tests every task must carry: `design/slices/COACH-MEMORY-testing.md` (the "Testing" file below).

A task is `ready` when every task it depends on is `done`. Every task here needs gate 1 (design note) and gate 2 (diff review, because each touches `AI/` or `Shared/content.json`) and gate 3 (Checker). Gate 2 must answer the three questions in the Testing file section 11.

## Status

| Task | Status | Depends on | Date | Checker result |
|---|---|---|---|---|
| C0 Move runner, shape check, content keys | done | | 2026-11-22 | Gates 1 and 2: `semantic_reviewer` (Claude, same family) and a second Gate 2 by GPT-5.6-terra: GO. First fresh Checker found 3 UI failures, which were not C0: two were load from overlapping runs, one was a fragile `MeUITests` check, now fixed. After the fix a fresh Checker ran `checks/check.sh` alone: first run failed once on an unrelated flaky test (`BackupTests.theRealFolderResourceValueIsSetAndCleared`), second run ALL CHECKS PASSED (415 unit tests, 38 UI tests); all C0 done-when items PASS |
| C1 Stuck question | done | C0 | 2026-11-22 | Gates 1 and 2 by `semantic_reviewer` (Claude, same family): must-fix applied. fresh Checker: every done-when item PASS; `check.sh` ALL CHECKS PASSED on its second run (415 unit, 38 UI). Device steps 82 to 85 are for the parent |
| C2 Split nudge | done | C0 | 2026-11-22 | As C1. D8 row awaits the parent |
| M0 Learner record and courses | done (M0a and M0b). The Plan viewer and per-line delete are waiting on the parent (DECISIONS 2026-11-23) | C0 | 2026-11-23 | M0b: gates 1 and 2 by `semantic_reviewer` (model not stated), must-fix applied. `checks/check.sh` ALL CHECKS PASSED (446 unit, 39 UI) |
| M3 Feedback under AI lines | done (scope cut) | C1, M0 | 2026-11-24 | `checks/check.sh` ALL CHECKS PASSED (539 unit, UI incl. 3 feedback tests, 0 SKIPPED). Gate 1 FIX FIRST (6) and gate 2 FIX FIRST (3) applied. No fresh-context Checker. Scope cut: no "why" box until M4 gives a viewer (rule 5); the bias applies to the Stuck question only; totals belong to M4 |
| M1 Rule selector | done | M0 | 2026-11-24 | `checks/check.sh` ALL CHECKS PASSED (518 unit, UI, 0 SKIPPED) on the iPhone 15 Pro Max. Built before its note; gates 1 and 2 combined on the diff (FIX FIRST, five must-fix, applied). No fresh-context Checker. Classmate builds need M4 first so each line can be seen and deleted |
| C3 Comeback slice | not started; parent ruled 2026-11-26 the app never shortens a step on its own, the student approves. Waiting on one more question (see sketch) | M1, R1 | 2026-11-25 | R1, the comeback screen, does not exist in the code. Sketch and two questions for the parent and Ben in `design/slices/C3-comeback-slice.md` |
| C6 Tidy my question | done | M1 | 2026-11-25 | Full `checks/check.sh`: 600 unit tests passed and 54 of 55 UI tests passed; the one failure was the new BlockLength UI test still tapping Shorter at 5 minutes (not offered after gate 2), fixed and that suite rerun 4 of 4. Not a clean single full-check pass. Gate 1 FIX FIRST and gate 2 FIX FIRST applied; C6, C9 and R5 share one gate-2 review and one commit (a departure). No fresh-context Checker. |
| M4 How I work screen (built as "What the app remembers about me") | done | M0 | 2026-11-24 | `checks/check.sh` ALL CHECKS PASSED (558 unit, UI incl. 3 remembered tests, 0 SKIPPED). Gate 1 FIX FIRST (7) and gate 2 FIX FIRST (6) applied. No fresh-context Checker. Fixed three bugs in existing code (note sync scope, deleted class line rewritten, failed note delete shown as gone). Meets the viewer and per-line delete the parent had pending for course lines |
| M2 Semantic search on the phone | skipped (parent decided 2026-11-26) | M1 | 2026-11-25 | Nothing writes the lines it would search; adds student-derived vectors to the pinned record file; Apple API not yet checked. See `design/slices/M2-semantic-search.md` |
| R5 Did that help? (non-AI) | done | M0 | 2026-11-25 | Full `checks/check.sh`: 600 unit tests passed and 54 of 55 UI tests passed; the one failure was the new BlockLength UI test still tapping Shorter at 5 minutes (not offered after gate 2), fixed and that suite rerun 4 of 4. Not a clean single full-check pass. Gate 1 FIX FIRST and gate 2 FIX FIRST applied; C6, C9 and R5 share one gate-2 review and one commit (a departure). No fresh-context Checker. |
| C4 Setting follow-up | done | R5, M1 | 2026-11-25 | `checks/check.sh` ALL CHECKS PASSED (633 unit, UI, 0 SKIPPED). Gate 1 FIX FIRST and gate 2 FIX FIRST applied; C4 and C5 share one gate-2 review and one commit (a departure). No fresh-context Checker. Open for the parent: a question built in code adds little the AI does here; is the AI call worth it? |
| C8 Check a hunch | deferred (parent decided 2026-11-25) | M0, M3 | 2026-11-25 | No source of tags exists. Revisit after C5 has run for a few weeks; derive candidates from class lines at read time, no "time" tag on block answers. See `design/slices/C8-check-a-hunch.md` |
| R6 Good-step card (a rubric for making their own steps) | done | S2, S3 | 2026-11-26 | Fixed card on the editor with Got it and a Me switch; no AI by design. See `design/slices/R6-good-step-card.md`. Gate 1 FIX FIRST (7) and gate 2 FIX FIRST (3, UI tests) applied |
| C7 Fading coach | done, no change (parent agreed 2026-11-26) | M0 | 2026-11-24 | Gate 1 FIX FIRST: the assignment screen already shows "I'll say my steps" first and "Suggest some" quiet, so the task as written changes nothing; a hidden count would strain rule 5. See `design/slices/C7-fading-coach.md`. Recommendation: leave as is and mark done |
| C5 Weekly reflection | done | M1, M3 | 2026-11-25 | `checks/check.sh` ALL CHECKS PASSED (633 unit, UI, 0 SKIPPED). Gate 1 FIX FIRST and gate 2 FIX FIRST applied; C4 and C5 share one gate-2 review and one commit (a departure). No fresh-context Checker. Accepted gap: with no AI a distressed answer gets the fixed line, not the trusted-adult line |
| C9 Course facts for step suggestions | done | M1 | 2026-11-25 | Full `checks/check.sh`: 600 unit tests passed and 54 of 55 UI tests passed; the one failure was the new BlockLength UI test still tapping Shorter at 5 minutes (not offered after gate 2), fixed and that suite rerun 4 of 4. Not a clean single full-check pass. Gate 1 FIX FIRST and gate 2 FIX FIRST applied; C6, C9 and R5 share one gate-2 review and one commit (a departure). No fresh-context Checker. |
| CRP Coaching roadmap plan | designed; final expert-panel verdict APPROVE; implementation waits for section 7 approvals | R0–R4 | 2026-11-26 | Evidence, UX/accessibility, youth safety/privacy and iOS architecture panel; three revision rounds plus final chair approval. See `design/coaching-roadmap-plan.md` |
| CAL1 Put it on my calendar (Apple's event sheet) | designed; gate 1 GO; waits for wording approval, then build | | 2026-11-26 | Not coaching: a scheduling aid. See `design/slices/CAL1-calendar-and-reminders.md`. Needs a D8 row, a D3 clarification, and a first device check that no permission prompt appears. CAL2 (pick-up reminder) is queued in `FEATURES.md` F2 |
| SMALL1 Compact step tips, small-screen editor | done | R6 | 2026-11-26 | `checks/check.sh` ALL CHECKS PASSED (iPhone 15 Pro Max). The new geometry test failed before the change on the iPhone 11 and SE and passes after on both; focused Nudge, StepTips and StepReview tests pass on both. Gate 1 FIX FIRST (6) and gate 2 GO. No fresh-context Checker. Not yet done: a full UI suite on the iPhone 11; the 16 pt "Ask me a question" link height; device check at the largest text size |
| OLD1 Minimum iOS 18.0 | done | | 2026-11-27 | `checks/check.sh` ALL CHECKS PASSED (iOS 26); full UI suite on iOS 18.2 iPhone 11: 70 passed, 1 skipped, 0 failed; iPad Me, navigation and iPad tests 18 of 18. Gate 1 GO, gate 2 GO. No fresh-context Checker. Not checked on a real iOS 18 phone. See `design/slices/OLD1-ios18-floor.md` |
| OLD2 Clearer words when talking is not on this phone | ready, needs wording approval | OLD1 | 2026-11-27 | On iOS 18 to 25 (and on an iOS 26 phone without dictation) the Me Talk switch can be on while the microphone only says "Talking isn't available right now". Needs new student words such as "Talking isn't on this iPhone. You can use the keyboard's microphone.", and perhaps hiding the switch. Student-visible, so Ben's say |
| REL0 App Store release documents | drafted, waiting for the parent to read | | 2026-11-27 | `release/` has the checklist, a privacy policy draft and the store text. REL1 to REL6 (privacy manifest, a consent step for own AI services, in-app policy link, Wikipedia contact, screenshots, wording review) are listed in the checklist and need their own design notes |
| GOOGLE1 Accept Google's and similar provider addresses | done, waiting for the parent's device check with his own key | | 2026-11-27 | `checks/check.sh` ALL CHECKS PASSED; `swift test` 696 of 696 (13 new, from Google's own examples; the last two edits were test-only and rerun with `swift test`). Gate 1 FIX FIRST (7) applied; gate 2 GO. No fresh-context Checker. Not tried against Google with a real key. See `design/slices/GOOGLE1-more-provider-addresses.md` |
| GOOGLE2 Default Gemini model name for Google's address | done, waiting for the parent's device check with his own key | | 2026-11-28 | Earlier full `checks/check.sh` ALL CHECKS PASSED; later edit was test-only (edit test types model first, as the UI helper cannot clear the 30-char default). Both new UI tests pass on iOS 26 and iOS 18.2; `swift test` 699 of 699; lint clean. Reviewer GO. `models/` form unconfirmed with Google; fallback is the short name via `Words.ownAIGoogleModel`. See `design/slices/GOOGLE2-gemini-default-model.md` |
| T14-C Answer-giving checks for every move, on a phone | waiting on parent | C1 to C9 | | |

`R1` and `R5` are `ROADMAP.md` Phase 1 items 1 (comeback screen, non-AI) and 5 (did that help, non-AI). They are listed here because C3 and C4 need them.

Statuses: `waiting`, `ready`, `in progress`, `blocked` (say why under the table), `done`.

## When to ask a stronger model (gate 5, `AGENTS.md` section 4)

Ask before guessing, not after. Use the independent reviewer (the same one that does gates 1 and 2) with the brief shape in `AGENTS.md` section 5, `GATE: 5 doubt`. Ask when any of these is true:

- You are about to use an Apple API you have not found in the kit's `.swiftinterface` or headers.
- Two files or two documents seem to disagree (for example the plan and the code, or a rule and a task).
- A test in the Testing file is unclear about what it should assert.
- You are not sure whether a reply shape, a ceiling or a fallback is right for a move.
- You have read the task's Read line and still do not know which file to change first.
- Anything about what leaves the phone, the Keychain, or the safety word.

A question costs one short review. A guess that is wrong costs a rerun and may ship a bug nobody catches. Record each gate-5 question and its answer in the slice note under Gates.

---

## C0 Move runner, shape check, content keys

- **Read:** `design/slices/COACH-plan.md` section 0; `AI/StepCoach.swift`; `AI/Safety.swift`; `Content/Content.swift`; Testing file sections 3 and 5.
- **Build:** `AI/CoachMove.swift` (`CoachMove`, `Shape`, `Outcome`, `run`, static `check`); `CoachText.quoted` shared with `StepCoach`; `Content.Coach` and the `"coach"` object in `Shared/content.json` with `common`, `nothingWord`, empty `moves`; `Shared/README.md` row.
- **Awkward cases:** NOTHING in any case and with `**`; the safety word split across pieces; a 201-character line; a reply with two lines; an empty reply; the model unavailable.
- **Done when:**
  1. `Tests/FocusKitTests/CoachMoveTests.swift` has the table-driven shape test (Testing §3) and the fallback tests (§5); `swift test` passes.
  2. `ContentTests` checks `coach.common` is non-empty and contains both `NOTHING` and the safety word.
  3. `grep -rn "StepCoach.quoted\|private func quoted" FocusKit/Sources` shows `StepCoach` now calls `CoachText.quoted` (one definition).
  4. No view changed; `git diff --stat App/` is empty.
  5. `checks/check.sh` lint and `swift test` pass.
- **Gates:** 1, 2, 3.

## C1 Stuck question

- **Read:** `COACH-plan.md` §1 COACH-1; `Models/LadderModel.swift`; `App/FocusApp/StuckView.swift`; Testing §2, §4, §9.
- **Build:** `"stuckQuestion"` move (rules and fallback exactly as the plan); `LadderModel.askQuestion()` with the ceiling `hintsShown >= 1 && aiQuestionsShown < 2`, reset on step change; an **Ask me a question** button on the Stuck sheet after the first hint; the fallback shown on any failure; the safety line on `.trustedAdult`. Words in `Models/Words*.swift`.
- **Awkward cases:** third tap on the same step; "I tried" box empty; "I tried" holds "just tell me the answer"; the model returns a statement; the model returns NOTHING (show nothing, keep the button).
- **Done when:**
  1. Four persona tests for `stuckQuestion` pass (Testing §2), plus the ceiling test: third tap adds no call.
  2. `calls[0].instructions == content.coach.common + "\n" + content.coach.moves["stuckQuestion"]!.rules`.
  3. A UI test: Stuck → Another hint → Ask me a question → a question appears (fake AI).
  4. `checks/device-checks.md` gains the steps in `COACH-plan.md` COACH-1.
  5. `DECISIONS.md` change log: one line, naming the move and that `content.json` changed.
- **Gates:** 1, 2, 3.

## C2 Split nudge

- **Read:** `COACH-plan.md` COACH-2; `Models/PlannerModel.swift` (the nudge); Testing §2, §5.
- **Build:** `"splitNudge"` move; when the AI is on, the nudge line is the AI's question, else the fixed line; one call per step id; NOTHING shows the fixed line (a nudge must appear when the condition fires).
- **Awkward cases:** No leaves the step unchanged; AI off; NOTHING; a reply that rewrites the step (must be rejected: it would not end in `?`).
- **Done when:**
  1. Persona tests pass; the "NOTHING shows the fixed line" test passes.
  2. The existing nudge tests in `PlannerTests` still pass unchanged.
  3. UI test: a step with " and " shows a question; No keeps the step.
- **Gates:** 1, 2, 3.

## M0 Learner record and courses

- **Read:** `MEMORY-plan.md` §2; `Storage/SavedTypes.swift` (`Profile`, `Storable`); `Storage/FileStore.swift`; `Models/AppModel.swift` (`eraseEverything`, `began`, finishing an assignment); Testing §6.
- **Build:** `LearnerRecord: Storable` (`learner.json`, version, six kinds, caps, tags); `AppModel.learner`; the course label on the assignment screen (picker of recent courses + type a new one, optional, cut to 40 characters) stored on the draft and the saved work; the `course` entry written when an assignment finishes; `obstacle` entries written from the notes under Me (notes stay where they are; the record mirrors them); Delete everything removes the file.
- **Awkward cases:** an old `learner.json`; a missing kind; 41st setting; no course label; a course label of only spaces; Delete everything mid-write.
- **Done when:**
  1. `Tests/FocusKitTests/LearnerRecordTests.swift` covers Testing §6 and passes.
  2. The never-stores grep test exists and passes over the record types and words.
  3. Finishing an assignment with a course writes one `course` entry with ≤8 kept steps; without a course writes none.
  4. UI test: pick a course on the assignment screen, finish, and the course appears under Me → How I work only after M4 (until then, assert via the model in a unit test).
  5. `DECISIONS.md` change log records the course label decision (parent, 2026-11-22).
- **Gates:** 1, 2 (Storage), 3.

## M3 Feedback under AI lines

- **Read:** `MEMORY-plan.md` §4; `App/FocusApp/TalkView.swift` (bubbles), `StuckView.swift`; Testing §8, §9.
- **Build:** a `FeedbackRow` view (three equal buttons, haptic, optional Why box with Skip) under every AI line: stuck question, split nudge, and chat replies (parent decision 2026-11-22); `LearnerRecord.feedback` entries; per-move fallback bias in the owning models (majority 👎/😐 over last 5 → fallback first, AI behind "See the AI's question"; three 👍 → AI first); the collapsed "What the AI knew" row listing the facts passed (empty until M1, then real).
- **Awkward cases:** double tap; rating then leaving the screen; Why over 200 characters; rating a chat reply that was the safety line (no feedback row on the safety line).
- **Done when:**
  1. Testing §8 tests pass, including "the instructions sent on the next call are unchanged".
  2. A configuration test: the three buttons share frame and style.
  3. UI test: rate 👎 → Why appears → Skip; rate 👍 → nothing more.
  4. No feedback row under the trusted-adult line (test).
- **Gates:** 1, 2 (words a student reads), 3.

## M1 Rule selector

- **Read:** `MEMORY-plan.md` §3.1; `COACH-plan.md` §0.1 (`facts`); Testing §7.
- **Build:** `Logic/LearnerSelector.swift` (pure); `SelectorContext`; the allow-list as `coach.moves.<key>.sees` in `content.json` (kinds and tags per move, mirrored in the table in `MEMORY-plan.md`); rendering `"<kind>: <text>"` through `CoachText.quoted`; the 5-line / 600-character budget, oldest dropped; `CoachMove.run` callers in C1, C2 now pass `facts` from the selector; "What the AI knew" shows them.
- **Awkward cases:** 20 candidates; a course with no entries; a move with `sees: []`; a line exactly at 600 characters.
- **Done when:**
  1. Table-driven allow-list test over every move passes; budget test passes.
  2. `stuckQuestion` for a course sees that course's pattern and not another's (test).
  3. `calls[0].messages[0].text` for a stuck question contains the quoted fact lines before the ask.
  4. `ContentTests`: every move in `moves` has a `sees` array (may be empty).
- **Gates:** 1, 2, 3.

## C3 Comeback slice

- **Read:** `COACH-plan.md` COACH-3; `ROADMAP.md` item 1 (R1 must be done: the non-AI comeback screen with "Just this / The whole step"); `Logic/Work.swift` (split); `Logic/Pickup.swift`; Testing §3 (noNewNouns), §9.
- **Build:** `"comebackSlice"` move; `.shortLine` plus `ProcessStep.isProcess` plus no-new-nouns in the owning model; fallback = first half of the split, or the step; facts from the selector; the slice shown on R1's screen in place of the fixed first half when the AI is on.
- **Awkward cases:** a step that cannot be split; a slice with a new noun; same-day return (no call); NOTHING (show the fallback half).
- **Done when:**
  1. Persona and shape tests pass; the new-noun test passes.
  2. UI test with `-focus-clock-gap-days 1`: the slice appears; "The whole step" opens the step unchanged.
  3. The slice is never saved as a step (test: step count unchanged).
- **Gates:** 1, 2, 3.

## C6 Tidy my question

- **Read:** `COACH-plan.md` COACH-6; `Models/LadderModel.swift` (the three-part question); Testing §3 noNewNouns.
- **Build:** `"tidyQuestion"` move; a **Tidy it** button; the result replaces the copyable text only on **Use this**; the original stays; no-new-nouns check.
- **Done when:**
  1. Persona tests pass; a tidy with a new noun is rejected (test); the student's words survive (test).
  2. The Checker greps `LadderModel.swift` for `URLSession` and finds nothing.
  3. UI test: fill the three boxes → Tidy it → Use this → Copy.
- **Gates:** 1, 2, 3.

## M4 How I work screen

- **Read:** `MEMORY-plan.md` §5; `App/FocusApp/MeView.swift`; Testing §9.
- **Build:** Me → **How I work**: the record by kind, newest first, delete per line (native confirmation dialog on the whole list, as for notes); the one-sentence explanation at the top; per-move feedback counts (shown N, helped, meh, not this) as plain text.
- **Done when:**
  1. UI test: add a note → it appears under How I work as an obstacle → delete it → gone.
  2. Large-text test reaches every row.
  3. No word on the screen is on the never-shame or praise list (grep).
- **Gates:** 1, 2 (words), 3.

## M2 Semantic search on the phone

- **Read:** `MEMORY-plan.md` §3.2; `AGENTS.md` §7 (verify the API first: `NLEmbedding.sentenceEmbedding(for:)`, `vector(for:)`, `distance(between:and:distanceType:)` in `NaturalLanguage.framework/Headers/NLEmbedding.h`); Testing §7.
- **Build:** `Logic/Embedding.swift` protocol; `Storage/Apple/AppleSentenceEmbedding.swift`; `Fakes/FakeSentenceEmbedding.swift` (deterministic bag-of-letters); vectors computed on write and stored in `learner.json`; nearest-2 under a threshold appended by the selector within the budget; nil embedding → rules only.
- **Awkward cases:** language not supported (nil); an entry written before M2 (no vector: skip it, or backfill on next launch, once); 500 entries (time the scan in a test, under 50 ms with the fake).
- **Done when:**
  1. Nearest-neighbour tests with the fake pass; the threshold test passes; nil → rules-only test passes.
  2. `grep -rn "import NaturalLanguage" FocusKit/Sources` finds only `Storage/Apple/AppleSentenceEmbedding.swift`.
  3. The record round-trip test still passes with vectors present and absent.
- **Gates:** 1, 2, 3. Gate 5 if the API is not as the header says.

## R5 Did that help? (non-AI)

- **Read:** `ROADMAP.md` Phase 1 item 5; `Models/MeModel.swift` (`firstGuess`, `startingCountdownMinutes`); `Logic/FirstGuess.swift`.
- **Build:** after a session that used a suggested block length: one tap, "Was 12 minutes about right? Shorter · About right · Longer"; writes a `setting` summary line to the record; the first-guess card's line updates after three answers.
- **Done when:** three answers change the suggestion, one does not (test); the setting line reads like "25-minute block: too long, 3 of 4 times" (test); UI test taps Shorter and sees nothing shaming.
- **Gates:** 1, 3.

## C4 Setting follow-up

- **Read:** `COACH-plan.md` COACH-4; R5.
- **Build:** `"settingFollowUp"` move after Shorter/Longer; no call on About right; facts: that setting's last 3 lines.
- **Done when:** About right makes no call (test); Shorter gets a question (test); persona tests pass; the question is shown once and not saved.
- **Gates:** 1, 2, 3.

## C8 Check a hunch

- **Read:** `MEMORY-plan.md` §2 (`pattern`), `COACH-plan.md` (the NOTHING rule); Testing §4.
- **Build:** `"checkHunch"` move; the app finds a candidate when the same tag (`starting`, `stuck`, `drifting`, `time`) appears in 3 record lines within 30 days with no `pattern` yet; at most one hunch per 7 days (fake clock); shown under Me as one yes/no question with Not sure; only Yes writes a `pattern` with source `confirmed`.
- **Done when:** no call without a candidate (test); one per week (test); Yes writes one pattern, No and Not sure write nothing (tests); persona tests pass.
- **Gates:** 1, 2, 3.

## C7 Fading coach

- **Read:** `COACH-plan.md` §2; `Models/PlannerModel.swift`; `App/FocusApp/AssignmentView.swift`.
- **Build:** `ownStepsCount` and `editedSuggestedCount` in the record; at `ownStepsCount >= 15` the assignment screen shows **I'll say my steps** first and **Suggest some** as a quiet link; the count only grows; nothing shown about it.
- **Done when:** the order flips at 15 (test); an old record loads as 0 (test); UI test at 15 shows the new order; no number appears on screen (grep the view for the count).
- **Gates:** 1, 3.

## C5 Weekly reflection

- **Read:** `COACH-plan.md` COACH-5; `MEMORY-plan.md` (`reflection`); Testing §3 twoSentences, noNewNouns.
- **Build:** a small screen from Plan when 7 days have passed since the last reflection: the two questions, the `"weeklyReflection"` move with `Shape.twoSentences`, the feedback row, the fallback line.
- **Done when:** two-sentence shape tests pass; first sentence has no new nouns (test); one sentence → fallback (test); 7-day rule (fake clock) test; UI test answers both questions and sees the reply or the fallback.
- **Gates:** 1, 2, 3.

## C9 Course facts for step suggestions

- **Read:** `MEMORY-plan.md` §2.2, §3.1 (stepCoach row); `AI/StepCoach.swift`.
- **Build:** `StepCoach.suggest` and `idea` accept `facts: [String]` and put them in the user message before the ask; `PlannerModel` passes the selector's course facts; the editor labels the result "Suggested by the AI, starting from your History steps" when a course fact was used.
- **Done when:** the fact appears in `calls[0].messages[0].text` (test); without a course, nothing extra is sent (test); the label appears only when a course fact was used (UI test).
- **Gates:** 1, 2, 3.

## T14-C Answer-giving checks for every move, on a phone

- **Needs:** the parent, a phone with Apple Intelligence on, and any own AI service in use.
- **Build:** no code. For each move, the eight attempts from `design/03-ai-search-privacy.md` §3.4, plus "does the model reply NOTHING when asked", recorded word for word in `design/slices/T14-answer-checks.md`.
- **Done when:** every move has its recorded attempts for every AI in use; the Advisor's gate 4 verdict is in the note; any finished answer makes the move `blocked` and the parent is told.
- **Gates:** 4.
