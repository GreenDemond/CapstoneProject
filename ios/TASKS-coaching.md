# TASKS-coaching.md

The coaching and memory work, in order. Same rules as `TASKS.md`: one task per session; take the first task that is `ready`; follow the loop in `AGENTS.md` section 3; update the status table when done. Design: `design/05-coaching-and-memory.md`. Detail per task: `design/slices/COACH-plan.md` and `design/slices/MEMORY-plan.md`. Tests every task must carry: `design/slices/COACH-MEMORY-testing.md` (the "Testing" file below).

A task is `ready` when every task it depends on is `done`. Every task here needs gate 1 (design note) and gate 2 (diff review, because each touches `AI/` or `Shared/content.json`) and gate 3 (Checker). Gate 2 must answer the three questions in the Testing file section 11.

## Status

| Task | Status | Depends on | Date | Checker result |
|---|---|---|---|---|
| C0 Move runner, shape check, content keys | done | | 2026-11-22 | Gates 1 and 2: `semantic_reviewer` (Claude, same family) and a second Gate 2 by GPT-5.6-terra: GO. First fresh Checker found 3 UI failures, which were not C0: two were load from overlapping runs, one was a fragile `MeUITests` check, now fixed. After the fix a fresh Checker ran `checks/check.sh` alone: first run failed once on an unrelated flaky test (`BackupTests.theRealFolderResourceValueIsSetAndCleared`), second run ALL CHECKS PASSED (415 unit tests, 38 UI tests); all C0 done-when items PASS |
| C1 Stuck question | done | C0 | 2026-11-22 | Gates 1 and 2 by `semantic_reviewer` (Claude, same family): must-fix applied. fresh Checker: every done-when item PASS; `check.sh` ALL CHECKS PASSED on its second run (415 unit, 38 UI). Device steps 82 to 85 are for the parent |
| C2 Split nudge | done | C0 | 2026-11-22 | As C1. D8 row awaits the parent |
| M0 Learner record and courses | waiting | C0 | | |
| M3 Feedback under AI lines | waiting | C1, M0 | | |
| M1 Rule selector | waiting | M0 | | |
| C3 Comeback slice | waiting | M1, R1 | | |
| C6 Tidy my question | waiting | M1 | | |
| M4 How I work screen | waiting | M0 | | |
| M2 Semantic search on the phone | waiting | M1 | | |
| R5 Did that help? (non-AI) | waiting | M0 | | |
| C4 Setting follow-up | waiting | R5, M1 | | |
| C8 Check a hunch | waiting | M0, M3 | | |
| C7 Fading coach | waiting | M0 | | |
| C5 Weekly reflection | waiting | M1, M3 | | |
| C9 Course facts for step suggestions | waiting | M1 | | |
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
