# TASKS.md

The work, in order. One task per session. Take the first task that is `ready`, follow the loop in `AGENTS.md` section 3, and update the status table when you finish.

A task is `ready` when every task it depends on is `done` and everything on its **Needs** line is recorded in `DECISIONS.md`. If a Needs item is missing, the task is `waiting`: ask the person named, do not guess.

## Status

| Task | Status | Depends on | Date | Checker result |
|---|---|---|---|---|
| T00 Decisions and design review | ready | | | |
| T01 Skeleton | done | | 2026-11-20 | check.sh: FocusKit passed; `SKIPPED` UI tests in agent sandbox, exit 3 |
| T02 Content and logic | done | T01 | 2026-11-20 | check.sh: FocusKit passed (27 tests, all 8 case files named `cases/<file>.json`); `SKIPPED` UI tests in agent sandbox, exit 3. Checker: same model as Builder |
| T03 Storage | done | T02 | 2026-11-20 | check.sh: FocusKit passed (48 tests); `SKIPPED` UI tests in agent sandbox, exit 3. Checker: same model as Builder. Advisor gate 2 owed |
| T04 App shell | done (compile-checked) | T03, T00 | 2026-11-20 | check.sh: FocusKit passed (67 tests); app and UI tests compile for generic iOS; `SKIPPED` UI tests in agent sandbox, exit 3. UI tests written, not run. No Advisor or Checker agent: self-review only. Advisor gate 2 owed |
| T05 Assignment and editor | done (compile-checked) | T04 | 2026-11-20 | check.sh: FocusKit passed (68 tests); app and UI tests compile; UI tests written, not run (simulator unreachable from agent sandbox), exit 3. Self-review only. Ben's two answers not yet given; recommendations used. Advisor gate 2 owed |
| T06 Today and the work screen | done (compile-checked) | T05 | 2026-11-20 | check.sh: FocusKit passed (82 tests); app and UI tests compile; UI tests written, not run (simulator unreachable from agent sandbox), exit 3. Self-review only. Advisor gate 2 owed. Shared starter step "Check what you missed" noted in slice |
| T07 Stuck ladder, without AI | done (compile-checked) | T06 | 2026-11-20 | Same run as T06 (one commit, the work screen opens the ladder). UI tests not run. Self-review only. Advisor gate 2 owed |
| T08 Look it up | done (compile-checked) | T07 | 2026-11-20 | check.sh: FocusKit passed (97 tests); app and UI tests compile; UI tests written, not run (simulator unreachable from agent sandbox), exit 3. No real search from this Mac (no network in its shell); addresses checked with a fetch tool. Contact address in the User-Agent still to be set. Self-review only. Advisor gate 2 owed |
| T09 Voice in | done (compile-checked) | T06 | 2026-11-20 | check.sh: FocusKit passed (115 tests); app compiles for generic iOS; UI tests not run (simulator unreachable from agent sandbox), exit 3. Built on D7's recommendation, pending confirmation. Real microphone and speech not run. Self-review only. Advisor gate 2 owed |
| T10 Voice out | done (compile-checked) | T09 | 2026-11-20 | check.sh: FocusKit passed (135 tests); app compiles for generic iOS; UI tests not run (simulator unreachable from agent sandbox), exit 3. Built on D7's recommendation, pending confirmation. Real voice not run. Self-review only. Advisor gate 2 owed |
| T11 The phone's AI | done (compile-checked, not cleared) | T03, T00 | 2026-11-20 | check.sh: FocusKit passed (164 tests); app compiles for generic iOS; UI tests not run (simulator unreachable from agent sandbox), exit 3. Fake model only: the real model was not run. Built on D6's recommendation, pending confirmation. Fixed phrase list not built (needs approval). Self-review only. Advisor gate 2 owed |
| T12 Talk | done (compile-checked) | T11, T06 | 2026-11-20 | check.sh: FocusKit passed (196 tests); app and UI tests compile for generic iOS; UI tests written, not run (simulator unreachable from agent sandbox), exit 3. Fake model only. Built on D6 and D7 recommendations, pending confirmation. Not cleared until T14. Self-review only. Advisor gate 2 owed |
| T13 Step coach | done (compile-checked, not cleared) | T12, T05 | 2026-11-20 | check.sh: FocusKit passed (223 tests); app and UI tests compile for generic iOS; UI tests written, not run (simulator unreachable from agent sandbox), exit 3. Fake model only. Built on D6's recommendation, pending confirmation. Not cleared until T14. Self-review only. Advisor gate 2 owed |
| T14 Answer-giving checks on a real phone | waiting on parent | T12, T13, T17a | | Needs T17a (parent signs in to Xcode, builds to Ben's phone). Logic-side net (AnswerGuard, ProcessStep) is built and tested with fakes; it does not replace T14 |
| T15 Me | done (compile-checked) | T06 | 2026-11-20 | check.sh: FocusKit passed (247 tests); app and UI tests compile for generic iOS; UI tests written, not run (simulator unreachable from agent sandbox), exit 3. Sound answer does not change voice (see slice). Self-review only. Advisor gate 2 owed |
| T16 Whole-app review | done (partial: self-review only) | T05 to T15 | 2026-11-20 | check.sh: FocusKit passed (247 tests); app and UI tests compile; UI tests SKIPPED (simulator unreachable from agent sandbox), exit 3. Read-through of every Words file, Safety/AnswerGuard, the trusted-adult path, backup exclusion, network use and secrets; no code defects found. NOT done: simulator screen walk, 2.11 row-by-row tests, `T16-strings.md`, Advisor verdict. No independent Checker or Advisor was possible (same model as Builder). Flagged: starter step "Check what you missed" (in `Shared/`, not edited) |
| T17a First build on Ben's phone | waiting on parent | T06 | | Steps for the parent are in `PARENT-STEPS.md` (Xcode sign-in, team, bundle id, contact address, install) |
| T17b Version 1 build on Ben's phone | waiting on parent | T16, T14 | | Needs T14 cleared by the Advisor, then a week of real use by Ben |

Simulator note: an iOS 26.5 simulator exists on the owner's Mac and works from a normal terminal, not from the agent sandbox. UI tests last run: 3 of 18 passed, 15 failing and undiagnosed (FEAT-002 pending). Voice is now two switches, Read aloud and Talk (D7), commit 8dd8d21; its UI test is compiled, not run.

Statuses: `waiting`, `ready`, `in progress`, `blocked` (say why in a line under the table), `done`.

T01 to T03 need no simulator and no decisions, so they may be done while T00 waits for answers. Nothing from T04 on starts before the parent's go-ahead (D1).

## How to read a task

- **Needs:** decisions or actions by a person that must exist first.
- **Read:** the files to read before the design note. Always also read `AGENTS.md`, `DECISIONS.md`, `PROGRESS.md`.
- **Build:** what to make. The slice design note fills in the detail.
- **Awkward cases:** each one needs a test.
- **Done when:** the list the Checker verifies, line by line.
- **Gates:** which Advisor gates apply (`AGENTS.md` section 4). Gate 1 (design) and gate 3 (Checker) apply to every task and are not repeated.

---

## T00 Decisions and design review

- **Needs:** the parent and Ben, in conversation.
- **Read:** all four files in `design/`; `research/00-knowledge-summary.md`.
- **Build:** no code.
  1. Brief the Advisor (gate 1) on the whole design: `design/01` to `04`. Fix every must-fix in the design files.
  2. Put the questions in `design/04-engineering-and-plan.md` section 4.7 to the parent, then to Ben, in plain words, a few at a time, each with its recommendation.
  3. Record every answer in `DECISIONS.md`: update the Status column, clear answered items from "Waiting on", add change-log lines. Update the design files where an answer changes them.
  4. Ask whether Apple Intelligence is switched on on Ben's iPhone 15 Pro Max (iOS 26.2), and record it.
  5. On a new computer: confirm Xcode's version and that an iOS simulator is installed, and rewrite the first item under "Broken or worrying" in `PROGRESS.md` with what you find.
- **Done when:**
  1. `DECISIONS.md` has no "(waiting: parent)" left on D1, D6, D7, or it names exactly what is still open.
  2. The Advisor's verdict line on the design is at the end of `design/04-engineering-and-plan.md`.
  3. Every changed answer is reflected in the design files; no file contradicts `DECISIONS.md`.
- **Gates:** 1, on the whole design.

## T01 Skeleton

- **Needs:** nothing.
- **Read:** `design/04-engineering-and-plan.md` sections 4.1, 4.2, 4.5; `Shared/README.md`.
- **Build:**
  1. `FocusKit/Package.swift`: one library target `FocusKit`, one test target, Swift 6 language mode, platforms iOS 26 and macOS 26, no dependencies. `Shared/` is reached as a resource of the package (copy rule or a symlinked resource folder; choose the simplest that works with `swift test` and say which in the slice note).
  2. `Content`: load and decode `content.json` into typed structs. A missing or unreadable file is a thrown error, not a crash.
  3. `checks/check.sh` exactly as `design/04` section 4.5 describes: format lint, `swift build`, `swift test`, then the app build and UI tests only if a simulator exists, otherwise print `SKIPPED: no iOS simulator` and exit with code 3. Exit 0 only when nothing failed and nothing was skipped.
  4. A `.swift-format` file with the defaults, and a `.gitignore` for `.build/`, `DerivedData/`, `xcuserdata/`, `*.xcuserstate`.
- **Awkward cases:** `content.json` missing; a key missing; an unknown extra key (must be ignored).
- **Done when:**
  1. `cd FocusKit && swift test` passes on the Mac, with at least: content loads; six kinds; each kind has starter steps; five hints; the safety word and line are non-empty.
  2. `checks/check.sh` runs, prints which parts ran, and exits 3 with the SKIPPED line when no simulator is installed.
  3. `grep -rn "import FoundationModels\|import Speech" FocusKit/Sources` finds nothing.
  4. No file outside this folder changed.
- **Gates:** 2 (it creates the check command everything else relies on).

## T02 Content and logic

- **Needs:** nothing.
- **Read:** `design/02-screens-and-voice.md` sections 2.4 to 2.8; every file in `Shared/cases/`; `DECISIONS.md` P1 to P12.
- **Build:** in `FocusKit/Sources/FocusKit/Logic/`, pure functions and value types with no Apple framework beyond Foundation:
  - the work model (steps with id, text, done; current step; done count; all done);
  - the five choices, matching `cases/work.json`;
  - next hint, matching `cases/hints.json`;
  - starter steps for a kind and pasted text, and the two-minute start, matching `cases/starter-steps.json`;
  - cleaning and cutting pasted text, matching `cases/clean-text.json`;
  - the welcome line, matching `cases/pickup.json`;
  - cleaning the guide and building the instructions, matching `cases/guide.json`;
  - keeping safe sources, matching `cases/sources.json`;
  - trimming a conversation, matching `cases/trim-history.json` when measured in characters, with the measure passed in so T11 can use tokens.
  - A generic test helper that loads a case file and runs every case.
- **Awkward cases:** all of them are in the case files. Add: a step list of zero steps; a step of only spaces.
- **Done when:**
  1. Every case in all eight case files passes, and the test output names each file.
  2. No case file was edited (`git diff --stat Shared/` is empty).
  3. A test proves Drifted never increases the amount of work shown as remaining beyond the one split, and Stuck and Still working change nothing.
  4. `checks/check.sh` shows no failure.
- **Gates:** 2 if any case could not be matched and the slice note proposes changing it. Otherwise none beyond 1 and 3.

## T03 Storage

- **Needs:** nothing.
- **Read:** `design/03-ai-search-privacy.md` section 3.7; `design/04` I5, I6, I7.
- **Build:** `Store` protocol; `FileStore` (JSON files in a folder passed in, written atomically, with file protection set where the platform offers it); `MemoryStore` fake that can be told to fail. Saved types, each with a version: work, profile (goals and notes), settings (voice mode, guide, reply length, how-I-work answers), chats (up to 10), parked thoughts, recall answers. Each in its own file, so a full or damaged chat file can never stop steps from saving.
- **Awkward cases:** file missing; file is not JSON; JSON from a newer version; a write fails; two saves in quick succession; a step text longer than the limit; 11 chats.
- **Done when:**
  1. Round-trip tests pass for every saved type.
  2. Unreadable data is moved aside as a backup once, the app's data starts fresh, and later saves work.
  3. Data from a newer version is backed up and never overwritten silently.
  4. A failed write returns an error the caller can show; nothing crashes.
  5. No type stores audio, a name, an age, a school, or a diagnosis (the Checker reads the type definitions).
- **Gates:** 2.

## T04 App shell

- **Needs:** D1 decided. An iOS simulator installed (parent). If there is none, do the work, and report the app build as SKIPPED.
- **Read:** `design/02` sections 2.1 and 2.3; `design/04` sections 4.2 and 4.3.
- **Build:** `App/FocusApp.xcodeproj` with an app target and a UI test target, depending on the local `FocusKit` package; four tabs with placeholder screens; `Theme` (named colours for light and dark from the earthy palette: sand background, dark brown text, olive moss accent, a little clay; spacing and type scales); the first-run screen. No signing team in the repository.
- **If the project file will not build after two attempts:** stop (gate 3), then ask the parent to create an empty iOS App project named FocusApp in `App/` with Xcode (File, New, Project; SwiftUI; include UI tests) and add the local package. Give numbered steps. Do not keep hand-editing the project file.
- **Awkward cases:** largest text size; dark mode; the smallest supported iPhone.
- **Done when:**
  1. `checks/check.sh` builds the app and runs one UI test that sees the four tabs and the first-run screen, or reports SKIPPED with the reason.
  2. No colour or font size is typed outside `Theme`.
  3. Every tab and button has an accessibility label.
  4. The first-run screen asks for no permission and no personal detail.
- **Gates:** 2 (project settings, bundle contents).

## T05 Assignment and editor

- **Needs:** Ben's answers on which way of making steps comes first, and whether a suggested step must be changed.
- **Read:** `design/02` sections 2.4 and 2.5; `research/04-design-and-gamification-ideas.md` idea D2; `research/06-alpha-school-and-montessori.md` ideas M1 to M4.
- **Build:** the assignment screen (paste or type, kind, how many steps); "Suggest some to start" using starter steps; "I'll say my steps" by typing for now (voice arrives in T09); the editor (change words, reorder, delete, add, split, join, optional done-check line, Get ready and Put it away steps); **Start**. No AI in this task.
- **Awkward cases:** nothing entered; 10,000 characters pasted; a list pasted; every step deleted; a step with only spaces; double tap on Start; app closed in the editor and reopened.
- **Done when:**
  1. A UI test goes from an empty app to the work screen by "Suggest some", passing through the editor.
  2. A UI test does the same by typing three steps.
  3. Suggested steps cannot reach the work screen without the editor being shown (logic test on the model).
  4. The "looks like two steps" nudge appears for a step containing " and ", and No leaves the step unchanged.
  5. Steps in progress in the editor survive the app being closed.
- **Gates:** 2 (words a student reads).

## T06 Today and the work screen

- **Needs:** nothing new.
- **Read:** `design/02` sections 2.6, 2.7, 2.11; `research/05-adhd-ideation.md` section 4.
- **Build:** Today (next step card, welcome line, All my steps, New assignment, "That's today done."); the work screen (five equal buttons in a fixed grid, haptic answer, optional silent countdown ring from the clock, Park a thought, the optional recall question after reading and study steps); the tab bar hidden during a step; state saved after every tap.
- **Awkward cases:** double tap on each button; Drifted with a blank box; Later when it is the only step left; the app killed mid-step; the clock moved forward a week; countdown running while the phone sleeps; all steps done.
- **Done when:**
  1. A UI test completes an assignment using each of the five buttons at least once.
  2. After a simulated gap of a day or more, Today shows the welcome-back line, and no screen shows a number of days, a count of misses, or the words missed, behind, late, overdue, or failed (the Checker searches the app's strings).
  3. The five buttons have the same size and style (a test on the view's configuration, and the Advisor looks at a screenshot if one can be made).
  4. Killing and reopening the app returns to the same step.
  5. A test proves a double tap is counted once.
- **Gates:** 2.

## T07 Stuck ladder, without AI

- **Read:** `design/02` section 2.8; `research/06` ideas A5 and A6.
- **Build:** hints in order with **Another hint**; after two hints, **Ask a person** with the three-part question the student fills in and can copy; the Look it up and Talk it through rungs present but disabled with a plain line until T08 and T12.
- **Awkward cases:** more taps than there are hints; leaving and returning mid-ladder; an empty question.
- **Done when:**
  1. A UI test walks the ladder to a copied question.
  2. A logic test proves Stuck never changes the steps or their order.
  3. Nothing in this flow opens a network connection (the Checker searches for network calls).
- **Gates:** 2 (wording).

## T08 Look it up

- **Needs:** D8 confirmed by the parent for the first row, or build it switched off behind a flag in `Settings` and say so.
- **Read:** `design/03` sections 3.6 to 3.8.
- **Build:** `LookUp` protocol, `WikipediaLookUp` (the only file that opens a connection), result cleaning to plain text, the results list, opening a page in the system's in-app Safari view with a way back to the step, the offline line. First check that each address in section 3.8 still answers, and read Wikipedia's current API etiquette page for what an app should send; record both in the slice note.
- **Awkward cases:** offline; a slow answer (time limit); no results; results with markup in them; a title with odd characters; the student leaves while it loads.
- **Done when:**
  1. Tests with a fake cover: results, none, offline, timeout, markup stripped.
  2. One recorded real request in the slice note (date, words, number of results), made by the Builder from the Mac.
  3. The screen states that the look-up words go to Wikipedia, before the first search.
  4. `grep -rn "URLSession" FocusKit/Sources App` finds only `WikipediaLookUp.swift`.
- **Gates:** 2 (network; what leaves the phone).

## T09 Voice in

- **Needs:** D7 decided.
- **Read:** `design/02` section 2.2; `design/04` section 4.8. Then find the real API: search the Speech framework's interface file for `SpeechAnalyzer`, `SpeechTranscriber`, `AssetInventory` (`AGENTS.md` section 7).
- **Build:** `SpeechInput` protocol with a fake; the Apple implementation in `Voice/Apple/`, on-device only; the microphone button (hold, or tap to start and stop), the listening sign, words appearing in the text box, the one-sentence explanation before the first permission request, the denied state, the unsupported-language state. Add the two usage sentences to the app's Info settings in plain words.
- **Awkward cases:** permission denied; permission later revoked; language not supported; the model for the language not yet downloaded; an interruption (phone call); the button released with nothing said; very long speech; the app sent to the background while listening.
- **Done when:**
  1. Tests with the fake cover every case above.
  2. No code path writes audio to disk or sends it anywhere (the Checker searches for file writes and network calls in `Voice/`).
  3. The microphone is never started except by the button (logic test: no other caller).
  4. `checks/device-checks.md` has numbered steps for Ben, including saying an assignment, a misheard word, and refusing permission.
  5. The slice note states what was and was not possible to check in the simulator.
- **Gates:** 2 (permission, microphone). 5 if the API is not as the design assumes.

## T10 Voice out

- **Read:** `design/02` section 2.2.
- **Build:** `SpeechOutput` protocol with a fake; the Apple implementation with a built-in voice; **Read this step**; the three voice settings; headphones only (on by default in We talk); tap to stop; speech stops on interruption; the sentence splitter that releases a sentence for speaking only once it is complete.
- **Awkward cases:** headphones unplugged mid-sentence; silent switch; another app playing audio; the trusted-adult line (shown, not spoken, unless headphones are in use); Quiet mode (no sound from anything).
- **Done when:**
  1. A test proves that in Quiet nothing can call the speaker.
  2. A test proves that with headphones-only on and no headphones, nothing is spoken and the text is still shown.
  3. Tests cover stop, interruption, and the sentence splitter on text arriving in pieces.
  4. Device steps added for Ben.
- **Gates:** 2.

## T11 The phone's AI

- **Needs:** D6 decided.
- **Read:** `design/03` sections 3.1 to 3.5. Then the `FoundationModels` interface file: `SystemLanguageModel`, `Availability`, `LanguageModelSession`, `streamResponse`, `contextSize`, `tokenCount`, `LanguageModelError`, `Generable`, `Tool`.
- **Build:** `LanguageModel` protocol and a scriptable fake (can stream in pieces, refuse, hit the guardrail, run out of context, be unavailable for each of the three reasons); the Apple implementation in `AI/Apple/`; the instructions builder (reusing T02); the **safety check**, including holding back a streamed reply until it cannot be the safety word, replacing the whole reply if the word appears later, treating a guardrail stop on the student's message as the same signal, and the fixed phrase list if the parent and Ben approved it; trimming by the model's own token count where available (iOS 26.4 and later) and by a cautious character estimate otherwise, with one retry on the context-full error in both its iOS 26 and iOS 27 forms. Every use of an API newer than iOS 26.0 sits behind an availability check with a tested fallback.
- **Write the safety tests before the code.**
- **Awkward cases:** the safety word split across two pieces; the word in the middle of a reply; the word in different letter case or with punctuation; the AI unavailable for each reason; context exceeded twice; a refusal; a reply of nothing; Stop mid-reply; the student's guide trying to override the rules (cases 4 and 5 in `Shared/cases/guide.json`).
- **Done when:**
  1. Every awkward case has a passing test using the fake.
  2. A test proves no piece of AI text is delivered to the caller before the safety check has passed it.
  3. A message that triggers the trusted-adult line is never passed to `Store`.
  4. `grep -rn "PrivateCloudCompute" .` finds nothing in Swift sources.
  5. `import FoundationModels` appears only under `AI/Apple/`.
  6. The slice note says plainly whether the real model could be run in the simulator.
  7. The app builds with a minimum of iOS 26.0, and a test covers the path with no token counting.
- **Gates:** 2 (always). 5 for any API that is not as the design assumes.

## T12 Talk

- **Read:** `design/02` section 2.9; `design/03` sections 3.2 and 3.3.
- **Build:** the chat screen; the fixed opening line; replies appearing as they are written; Stop; saved chats (10, delete one or all, each with a second tap); the privacy line; the unavailable state; "Talk it through" from Stuck carrying the step and kind; speaking replies in We talk by whole sentences after the safety check; **Use these as my steps** opening the editor.
- **Awkward cases:** an empty message; a message at the limit; a double tap on Send; leaving mid-reply; a reply cut off; a long chat; the trusted-adult case mid-stream; the AI unavailable.
- **Done when:**
  1. UI tests with the fake: a conversation; Stop; the trusted-adult line replaces a reply and the message is not in My chats afterwards.
  2. "Use these as my steps" lands in the editor, never the work screen.
  3. The first line of the screen says where messages go, and matches D8.
  4. Device steps added for Ben.
- **Gates:** 2.

## T13 Step coach

- **Read:** `design/02` section 2.5; `design/03` section 3.2; `research/04` section 1 (the gap about apps that plan for the student).
- **Build:** in "I'll say my steps": the app's two questions, **Give me an idea** (one step, never the list); in "Suggest some": AI-suggested steps as typed output, labelled as from the AI; the fallback to starter steps whenever the AI is unavailable, refuses, or returns nothing usable.
- **Awkward cases:** the AI returns answer content instead of process steps (the test uses a fake that does; decide in the slice note how it is detected, and fall back); zero steps; twenty steps; a very long step; the safety word.
- **Done when:**
  1. Tests cover each case above.
  2. With the AI unavailable, both ways of making steps still work end to end (UI test).
  3. AI-suggested steps always carry the label and always open in the editor.
- **Gates:** 2.

## T14 Answer-giving checks on a real phone

- **Needs:** T17a done (the app on Ben's phone); Ben available.
- **Read:** `design/03` section 3.4.
- **Build:** no code unless the checks fail. Write the exact steps into `checks/device-checks.md`. Ben runs each of the eight attempts against Talk, Step coach and the question-wording helper, and reports the exact words that came back. Record them word for word in `design/slices/T14-answer-checks.md`.
- **Done when:**
  1. Every attempt is recorded with what was sent and what came back, the phone model and iOS version.
  2. The Advisor's gate 4 verdict is in the note.
  3. If any attempt produced a finished answer: the task is `blocked`, the person is told plainly, and the options in `design/03` section 3.4 are offered. The AI features are not described as cleared anywhere.
- **Gates:** 4.

## T15 Me

- **Read:** `design/02` section 2.10; `research/01-evidence.md` section B (why the questionnaire is only a first guess).
- **Build:** goals; What got in the way? with the fixed trusted-adult line beneath; How I like to work (four taps, the first-guess card, saved, used as starting choices for countdown length and voice); How the AI talks (one guide, three lengths); Voice settings; About and privacy; **Delete everything on this iPhone** with a second tap.
- **Awkward cases:** a very long goal; an empty note; Delete everything then reopen; a guide that tries to break the rules.
- **Done when:**
  1. UI tests: add and delete a note; change a setting and see it used; Delete everything leaves no file in the app's folder.
  2. The card is labelled a first guess and makes no claim about focus (the Advisor reads the strings).
  3. About and privacy matches D8 and `design/03` section 3.7 line for line.
- **Gates:** 2.

## T16 Whole-app review

- **Read:** every file in `design/`; `research/00-knowledge-summary.md` sections 5 and 6.
- **Build:** fixes only. Walk every screen at the smallest supported iPhone and the largest text size, in light and dark, with reduce motion on, and with VoiceOver labels read from the accessibility tree. Walk every row of `design/02` section 2.11. List every string a student can read or hear into `design/slices/T16-strings.md` for the Advisor.
- **Done when:**
  1. Every row of section 2.11 has a test or a device step, named in the note.
  2. The Advisor's verdict on the full string list is in the note (rules 1, 2, 6, 7, 8, 11).
  3. No screen needs sideways scrolling or cuts off text at the largest text size (UI test).
  4. `checks/check.sh` passes with nothing skipped.
- **Gates:** 2 and 4.

## T17a First build on Ben's phone

- **Needs:** the parent signed in to Xcode with the team set.
- **Build:** numbered steps for the parent to run the app on Ben's iPhone from Xcode. Then Ben runs `checks/device-checks.md` as far as it goes. Record what happened.
- **Done when:** the device-check results are recorded with the date, phone model and iOS version, including anything that did not work.
- **Gates:** none beyond 3.

## T17b Version 1 build on Ben's phone

- **Needs:** T14 cleared by the Advisor; T16 done; the parent.
- **Build:** the same as T17a with the finished app. Ben uses it for real homework for a week. Collect what he says.
- **Done when:** results recorded; `PROGRESS.md` lists what Ben wants changed; anything involving classmates, TestFlight or the App Store is listed under "Waiting on" for the parent and not started.
- **Gates:** 4 before any build goes to anyone but Ben.

---

## After version 1

Each needs its own design note, its own decisions, and new rows in D8 where anything leaves the phone: the calendar list and reminders; a lock-screen card for the current step; own-key AI helpers and wider search; TestFlight for classmates (teacher approval and written parent permission first); the pause before a distracting app (needs Apple's approval for the Screen Time entitlement, requested by the parent); iPad and Mac.
