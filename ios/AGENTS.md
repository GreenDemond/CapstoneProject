# AGENTS.md

Instructions for any AI agent working in this folder. **This folder is complete on its own.** Everything an agent needs is here: the rules, the decisions, the research, the design, the task list, and the starting content. Treat this folder as the project root; every path below is relative to it. Nothing outside it is required, and nothing outside it may be changed.

## 0. What this is, and the rules that always apply

Ben, a student, is building a tool that helps students with ADHD get schoolwork done. It began as a school capstone project and a web app. This folder is the iPhone app. **Ben does not know how to code, and no one technical will check your work.** Ben decides what the app does and how it feels. The parent (Ben's dad) makes the decisions listed as his in `DECISIONS.md` and does every Apple account step. You decide how it is built, within `DECISIONS.md`.

Two things matter as much as working code:

- **The app has to match the research.** Its value is that each feature is backed by a study, or is honestly labelled as design judgment. The research is in `research/`; start with `research/00-knowledge-summary.md`. Do not state a research finding from memory. If a claim is not in those files, say it is unverified.
- **Ben has to be able to explain it.** He will present what the app does and why, in his own words.

Each rule below comes from the research or protects the students who will use the app. If a request conflicts with one, do not build it. Say so in plain words and offer the closest thing that fits.

1. **Hints, never answers.** Any AI feature may give hints, questions, and pointers to resources. It must not produce finished homework answers. Answer-giving AI lowered later test scores in a high school trial.
2. **Never shame.** No red warnings, no "you missed 3 days", nothing that dies or resets to zero. Lapses are expected, and coming back is the behaviour to reward.
3. **Never ask about or store a diagnosis.** The app works the same for everyone.
4. **Data stays on the student's device.** The only exceptions are the rows in `DECISIONS.md` D8.
5. **The student owns their data.** No automatic reports to parents or teachers.
6. **Reward honesty equally.** "I drifted" earns the same as "done", or students will just tap "done".
7. **No comparison between students.** No leaderboards or rankings.
8. **No claims that the app treats ADHD or improves attention.** Use the supported wording in section 6 of `research/00-knowledge-summary.md`, in the app, on the App Store, and in any write-up.
9. **No secrets in code or in the repository.**
10. **No brain-training games.** They showed no benefit in blinded trials.
11. **The app is not a counselor.** If a student's words suggest they are in danger or distress, the app shows a short message encouraging them to talk to a trusted adult, and does not try to advise.

## 1. The situation

- The parent is handing this work off. No person will read the code. Ben can use the app and say what he sees; the parent can make decisions and do account steps.
- The work is done by agents of different strengths working together. A capable, cheaper model does the building. The strongest available model advises at fixed points. A third, fresh agent re-runs the checks. This file says who does what, so no agent has to work it out.
- Every session starts with no memory. `TASKS.md` and `PROGRESS.md` are the memory.

## 2. Roles

| Role | Model to use | May edit files | Job |
|---|---|---|---|
| **Builder** | A mid-tier model (for example Sonnet) | Yes | Owns one task from `TASKS.md` from start to finish: design note, code, tests, commit, status |
| **Advisor** | The strongest model available (for example Opus) | **No.** Read-only | Reviews at the gates in section 4. Returns a verdict. Never writes the fix |
| **Checker** | A small, fast model (for example Haiku), in a fresh context | **No** | Runs the checks itself and reports exactly what happened. Trusts nothing the Builder said |

Why split it this way:

- The Builder does most of the work, so it should be the cheaper model.
- The Advisor's value is judgment on the few things that are expensive to get wrong: the rules, what leaves the phone, the AI's behaviour, and designs. Keeping it read-only keeps its review independent of the code it is judging.
- The Checker exists because the commonest failure in agent work is a confident "it passes" that nobody ran. A fresh agent with no stake in the answer runs it.

How to start each role:

- **Claude Code:** the Builder is the main session. The Advisor is the `ios-advisor` agent and the Checker is the `ios-checker` agent, both defined in `.claude/agents/`.
- **Any other tool:** start a child agent with the chosen model and give it the body of the matching file in `.claude/agents/` as its instructions, plus the brief from section 5.
- **If only one model is available:** still do the Advisor and Checker steps as separate passes in a fresh context, and write "same model as Builder" in the report. Never skip a gate because the helper is unavailable.

One Builder at a time in this folder. Advisors and Checkers may run alongside because they do not write.

## 3. The loop for one task

Do these in order. Do not start the next task in the same session unless the first is fully finished.

1. **Orient.** Read `DECISIONS.md`, `PROGRESS.md`, `TASKS.md`, and the files the task lists. Run `checks/check.sh` (from T01 on) and note the result before changing anything. If it already fails, fixing that is the task.
2. **Claim.** Set the task to `in progress` in `TASKS.md`.
3. **Design note.** Write `design/slices/<task-id>-<name>.md` using the template in section 6. Keep it under one page.
4. **Gate 1: Advisor reviews the design.** Fix every must-fix. Then describe the design to Ben in three or four plain sentences if the task changes what a student sees, and wait for his go-ahead.
5. **Tests first for logic.** Write the failing tests for the new logic, including the awkward cases the task lists, then the code.
6. **Build** only what the design note says.
7. **Self-review** against section 7. Fix what you find.
8. **Gate 2: Advisor reviews the diff**, when section 4 requires it.
9. **Gate 3: Checker runs the checks.** A task is not done on the Builder's word.
10. **Commit** one task as one commit, with a plain-language message.
11. **Record.** Set the task to `done` in `TASKS.md` with the date and the Checker's result line. Rewrite `PROGRESS.md`. Add steps for Ben to `checks/device-checks.md` if he can try something.
12. **Report** to the person, in the form in section 12.

If a check fails and cannot be fixed in the session: put the code back to the last passing commit, set the task to `blocked` with what happened, and stop.

## 4. The gates: when the Advisor must be asked

| Gate | When | The Advisor decides |
|---|---|---|
| **1. Design** | Before any code, for every task | Does the note break a rule, conflict with a decision, repeat a known trap, or let the tool do the student's thinking? Is it small enough? |
| **2. Diff** | Before the commit, when the change touches any of: `AI/`, `Voice/`, `Storage/`, `LookUp/`, any network call, any permission, any words a student will read or hear, `Shared/`, or more than about 200 changed lines | Does the code do what the note says and nothing more? Can anything leave the phone that should not? Can the AI's output reach the student unchecked? |
| **3. Stuck** | The same fix has failed twice | What is the simpler approach? This comes **before** asking the person. A third attempt at the same idea is not allowed |
| **4. Evidence** | After the answer-giving checks (T14), and before any build goes to a phone other than Ben's | Do the recorded transcripts show a finished answer? Is every "what leaves the phone" row true? |
| **5. Doubt** | The Builder is about to guess: an API it has not verified, a rule that seems to conflict, a research claim not in the files | The answer, or "unverified: check it this way" |

No gate is needed for: fixing a typo, a test-only change that weakens nothing, renaming inside one file, updating `TASKS.md`.

**Verdicts.** The Advisor returns exactly one:

- `GO`
- `FIX FIRST`, with a numbered must-fix list (at most seven), each naming the file and line and what a student would see go wrong, and a separate list of suggestions.
- `STOP: ASK A PERSON`, naming who (Ben or the parent) and the one question to ask.

**After a verdict.**

- The Builder fixes every must-fix, or writes one sentence beside it saying why not. Suggestions are optional.
- A second review covers only the must-fix items. **Two rounds at most.** If the Advisor and Builder still disagree, stop and put the question to the person in plain words.
- The Advisor's verdict line and the date are copied into the slice's design note. That is the record that the gate happened.
- The Advisor is not always right. It may not overrule the rules in section 0, `DECISIONS.md`, or a choice that belongs to Ben or the parent. If its advice would, say so and ask the person.

## 5. How to brief a helper

A helper starts with nothing. A good brief is short and complete. Use this shape every time.

```
ROLE: Advisor | Checker
GATE: 1 design | 2 diff | 3 stuck | 4 evidence | 5 doubt
TASK: T07 Stuck ladder, without AI
READ: design/slices/T07-stuck-ladder.md
      design/02-screens-and-voice.md  (section 2.8)
      [for a diff] the output of: git diff <last-commit>
QUESTION: one sentence. What must be decided?
ALREADY TRIED: [gate 3 only] the two attempts and what each did
I AM UNSURE ABOUT: the one or two things the Builder is least sure of
RETURN: a verdict in the form in AGENTS.md section 4
```

Rules for briefs:

- Give file paths, not pasted files. The helper reads them.
- Say what you are unsure about. An Advisor asked "is this fine?" will say yes.
- Never tell the helper what answer you want.
- Never pass a key, an account detail, or a student's real words to a helper.

## 6. Design note template

`design/slices/<task-id>-<name>.md`, one page:

```
# <task-id> <name>
Status: draft | approved <date> | built <date>

## What the student sees and does       (numbered steps)
## Research link                        (file and section, or "design judgment, to be tested")
## What it stores                       (and what it never stores)
## What leaves the phone                (or "nothing")
## Distracted, stuck, back after a week (one line each)
## Differs from the web app             (or "no")
## Tests                                (logic cases; UI main path; UI awkward path; device-only)
## Unverified                           (and how it will be checked)
## Gates                                (verdict lines copied in as they happen)
```

## 7. How to write the code

- Follow `design/04-engineering-and-plan.md` sections 4.1 to 4.3. Do not re-decide them.
- **Verify an Apple API before using it.** Do not write `FoundationModels`, `Speech`, `AVFAudio`, `ActivityKit` or `FamilyControls` calls from memory. Find the declaration in the kit first:
  `find "$(xcrun --sdk iphoneos --show-sdk-path)/System/Library/Frameworks/<Name>.framework" -name "arm64e-apple-ios.swiftinterface"` and search that file. If the declaration is not there, it does not exist.
- Apple frameworks are imported only in the `Apple/` folders. Everything else talks to the protocols.
- Rules text, the safety word, hints and starter steps come from `Shared/content.json`. Never type them into Swift. Changing that file changes what the AI is told, so it always needs gate 2.
- No rule lives in a view. If a view needs an `if` about behaviour, the decision belongs in the model.
- Prefer boring, obvious code. No clever generics, no new abstraction until the third use.
- Do not tidy working code. Do not add options nobody asked for.
- No `print`, no test data, no unused code left behind. No `try!`, no force-unwrap on anything that came from storage, the network, the microphone or the AI.

**Self-review before any gate. Re-read the whole diff as if someone else wrote it.**

- [ ] Does it do what the design note says, and nothing more?
- [ ] Is every on-screen and spoken word short, friendly, free of shame and of medical claims?
- [ ] Can anything leave the phone that `design/03-ai-search-privacy.md` section 3.7 does not list?
- [ ] Can any AI text reach the screen or the speaker before the safety check has seen it?
- [ ] Empty input, very long input, a double tap, the app closed mid-step, the phone locked mid-sentence: handled?
- [ ] Missing or damaged saved data: handled without a crash?
- [ ] Works with VoiceOver labels, the largest text size, dark mode, and reduce motion?
- [ ] Any package, secret, analytics call, or leftover debugging?

## 8. How to test

Test by running it, not by reading it.

| Layer | Tool | What belongs here |
|---|---|---|
| Logic | `swift test` in `FocusKit` | Every rule and every awkward case. Most tests live here |
| Shared cases | The same test run | Outputs must equal `Shared/cases/*.json` |
| Flows with fakes | The same test run | A model driven through a whole flow with fake AI, speech, look-up, clock and store: main path and awkward path |
| Screens | XCUITest in the simulator | One main path and one awkward path per feature, at the smallest supported iPhone and the largest text size |
| Real phone | `checks/device-checks.md`, done by Ben | Anything about the real AI, the real microphone, real speech, headphones, interruptions |

Rules:

- **Do not weaken or delete a failing test to get a pass.** Fix the code, or tell the person the behaviour is changing and why.
- **A skipped check is not a pass.** `check.sh` prints `SKIPPED` when there is no simulator. Report it as skipped, by name.
- **Never claim real-phone behaviour from a simulator or a fake.** Say "checked with a fake; not checked on a phone".
- Fakes must be able to fail: the AI refuses, the AI returns the safety word mid-stream, speech permission is denied, look-up is offline, the store cannot write. Each failure has a test.
- Tests do not sleep. Use the fake clock.
- For any AI feature: the checks in `design/03-ai-search-privacy.md` section 3.4, on a real phone, recorded word for word. Until then the feature is "built, not cleared".

**The Checker's job (gate 3).** In a fresh context, with no summary from the Builder:

1. Run `git status` and confirm what changed.
2. Run `checks/check.sh` and copy the last lines of output exactly.
3. Open the task's "done when" list in `TASKS.md` and check each line against the repository, not against the Builder's report.
4. Return one line per item: `PASS`, `FAIL` with the output, `SKIPPED` with the reason, or `CANNOT CHECK HERE` with what would be needed.

The Builder copies the Checker's lines into `TASKS.md` unchanged.

## 9. When to stop and ask a person


- Anything involving the Apple developer account, signing, certificates, TestFlight or the App Store. The parent does these. Never ask for, type, or store account details.
- Installing anything outside this folder, including the iOS simulator.
- A new permission, a new thing leaving the phone, or a new kind of stored data that is not already in the design.
- The answer-giving checks produced a finished answer.
- The Advisor returned `STOP: ASK A PERSON`, or two review rounds did not settle it.
- A task's "needs" line in `TASKS.md` names a decision that `DECISIONS.md` does not yet record.
- The request conflicts with a rule in section 0 or with `DECISIONS.md`.
- Creating any account, anything that costs money, or any AI key. Never create, ask for, or paste a key.
- Other students using the app, or publishing it to anyone but Ben.
- You would need to delete Ben's files, erase stored data, or change something outside this folder.
- You do not understand what Ben wants. Ask one clear question about what the student should see.

Ask one clear question, in plain words, with a recommendation.

## 10. Done means

- `checks/check.sh` passes, or each skipped part is named.
- The Checker ran it, and its lines are in `TASKS.md`.
- Every required gate has a verdict line in the slice's design note.
- One commit, plain message.
- `TASKS.md` and `PROGRESS.md` are current.
- The person has numbered steps to try it, or a plain statement that there is nothing to try yet.

## 11. Talking with Ben and the parent

- Use plain words. Say what the app will do, not how the code does it. Mention a file name only when the person needs to open it.
- Ask Ben about what the student sees, says, hears and feels. Do not ask him technical questions; decide those yourself and record the choice in `DECISIONS.md`.
- When a choice is his or the parent's (`DECISIONS.md`, "Waiting on"), give two or three options with a recommendation.
- Ben never runs a command or edits a file. When he needs to try something, give him numbered steps: what to open, what to tap or say, what he should see or hear. His report is your user test.
- If he reports something that looks wrong, believe him and reproduce it before explaining it.
- If a request is larger than one task, say so, split it, add the pieces to `TASKS.md`, and do the first.

## 12. Reporting

End every session with a short report in plain words:

- What the app can do now that it could not before.
- How to try it, in numbered steps, or that there is nothing to try yet.
- What was checked, by whom (Builder, Advisor, Checker), and what happened.
- What was skipped or could not be checked, by name.
- Anything that failed, was put back, or still worries you.
- What you suggest doing next.

Report failures and gaps as plainly as successes. A wrong "it works" is the most expensive mistake available here, because nobody can catch it.

## 13. Keeping the folder's memory current

- `TASKS.md`: the status of every task, with the Checker's lines.
- `PROGRESS.md`: rewrite it each session; do not let it grow into a diary. Working; In progress; Broken or worrying; Waiting on; Next.
- `DECISIONS.md`: any new or changed decision goes in its change log with the date, the reason, and who decided.
- `research/`: a new finding is added to `research/01-evidence.md` with its source and how much of the source was read.

## 14. Practical notes for the next agent (added 2026-11-21)

- **Two task lists.** `TASKS.md` is the original build (done). `TASKS-coaching.md` is the coaching and memory layer (not started). Take the first `ready` task from `TASKS-coaching.md` unless `PROGRESS.md` says otherwise.
- **The app is built.** Do not start from T01. `PROGRESS.md` says what exists, which build is current, what is open, and what is next. `TASKS.md` has the task history; new work since T16 is recorded as named rows (NAV, AI-multiple-services, UX).
- **How to run builds, tests, the phone install and the archive** in an agent shell that times out after about two minutes: see "Running things" in `PROGRESS.md`. Do not run a long `xcodebuild` in the foreground; it is killed and reports BUILD INTERRUPTED.
- **Roles in practice.** In past sessions the Advisor and Checker were often the same model as the Builder. The read-only `semantic_reviewer` agent was the one independent reviewer that worked, and it found a real privacy bug the Builder's own tests missed. For any change to `AI/`, `Network/`, `Storage/`, the Keychain, or what leaves the phone, get an independent read-only review and record its verdict in the slice note. Say plainly in the report when the reviewer was the same model.
- **One AI setting.** Talk and the assignment screen show the same "which AI" choice (`App/FocusApp/AIChoicePicker.swift`, backed by `OwnAIModel.use`). A chat remembers the AI it was written to (`Chat.aiId`); never send earlier messages to a different AI.
- **Words live in two places.** Student-facing words for the app's own screens are in `FocusKit/Sources/FocusKit/Models/Words*.swift`; rules, the safety word, hints and starter steps are in `Shared/content.json` (a change there needs gate 2 and the matching `Shared/cases/` file changed with it). Check both against the never-shame list.
- **UI tests:** put the keyboard away before tapping the next control (`putKeyboardAway()` in `App/FocusAppUITests/UITestHelpers.swift`), wait for animated rows to leave, and run with per-test time limits. A test that hangs is almost always a control hidden behind the keyboard.
- **Confirmation dialogs:** attach `confirmationDialog` to a whole list or screen, not to a row or section (a row's dialog can disappear when the row is deleted, and a section's does not always appear). Keep the chosen item in its own state, because the dialog clears its binding before the button's action runs.
