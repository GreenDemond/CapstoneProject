# The iPhone app

**Status, 2026-11-21: built, build 10 on the owner's iPhone (build 9 archived for TestFlight, not yet uploaded).** The app is called **Ben's Steps** (bundle `com.craighagan.benssteps`). The AI features are "built, not cleared": the answer-giving checks (T14) have not been run on a real phone. Current state, open problems and how to run things are in `PROGRESS.md`. Read it first.

A native iPhone app, written in Swift, that helps students with ADHD get schoolwork done: it shows one small step at a time, lets the student say honestly how each step went, gives hints instead of answers, and can be talked to.

**This folder is complete on its own.** It can be copied or moved anywhere and worked on with nothing else. It began inside a web project; that project is not needed and must not be changed from here.

One thing to know if you move it: today it sits inside the web project's git repository, so its history is recorded there. Moved elsewhere, it needs its own repository (`git init`) before the first task, because every task ends in a commit.

## The design in six lines

1. Pure Swift and SwiftUI, no web view, no third-party code.
2. It opens on one thing: the next small step.
3. The student can **talk** to it. Tapping and typing always work too, and the app is silent unless the student turns its voice on.
4. The AI runs **on the phone** by default: no key, no account, no cost, and the student's words stay on the device. The student may add up to five of their own AI services (D6); then only what `DECISIONS.md` D8 lists leaves the phone. Without any AI, the app still works.
5. The AI gives hints and questions, never finished answers. The student makes the plan.
6. Every feature is tied to a research finding, or labelled as design judgment to be tested.

## What is here

| Path | What it is |
|---|---|
| `AGENTS.md` | The rules for any AI agent: the eleven rules that always apply, the Builder, Advisor and Checker roles, the gates, how to write, test and report |
| `TASKS.md` | The work, in order, each task with what to read, what to build, and how "done" is checked |
| `DECISIONS.md` | What is decided, what is waiting on the parent or Ben, and the change log |
| `PROGRESS.md` | What works, what is broken or worrying, what is next. The memory between sessions |
| `design/01-what-it-is.md` | What the app is for, what Ben asked for, the research behind each part, what it will not do |
| `design/02-screens-and-voice.md` | Every screen, step by step, and how talking works |
| `design/03-ai-search-privacy.md` | The AI on the phone, looking things up, safety, what is stored and what leaves |
| `design/04-engineering-and-plan.md` | How it is built and tested, the build order, open decisions, what is unverified |
| `design/slices/` | One short design note per task or change. `UX-whole-app-review.md` holds the latest review, the large-text results, and what is still to build |
| `App/` | The Xcode project (`FocusApp.xcodeproj`, scheme FocusApp), the SwiftUI screens (`App/FocusApp/`) and the UI tests (`App/FocusAppUITests/`) |
| `FocusKit/` | The Swift package with all the logic, the AI and network code, storage, and the unit tests (`swift test`) |
| `PARENT-STEPS.md` | Numbered steps for the parent: Xcode, the phone, TestFlight, and the open questions |
| `research/` | The research the app must match |
| `Shared/` | The app's words and rules, and the cases its logic must pass |
| `checks/` | The check command (made in T01) and the steps Ben runs on a real iPhone |
| `.claude/agents/` | The Advisor and Checker, ready for Claude Code; usable as instructions in any other tool |

## For the parent: how to hand this off

1. Open this folder as the project in your coding agent, with a mid-tier model as the main session. The agent reads `AGENTS.md` by itself (`CLAUDE.md` points to it).
2. Give it the message below.
3. Answer its questions. The first session asks you and Ben the questions in `design/04-engineering-and-plan.md` section 4.7.
4. When a task needs you (signing in to Xcode, putting a build on Ben's phone), the agent gives numbered steps and waits.

Message to start any session:

```
Read AGENTS.md, DECISIONS.md, PROGRESS.md and TASKS.md in this folder.
You are the Builder. Start with the first item under "Next" in
PROGRESS.md (or the first task in TASKS.md that is ready) and do exactly
that one piece of work, following the loop in AGENTS.md section 3.
Use the ios-advisor agent at each gate the task requires and the
ios-checker agent before marking it done. If the task needs a decision
that DECISIONS.md does not record, ask me one clear question and stop.
Finish with the report in AGENTS.md section 12.
```

One task per session keeps each piece small enough to check. Repeat the same message for the next.

## What only a person can do

- **The parent:** decide the items listed as his in `DECISIONS.md`; sign in to Xcode; put builds on a phone; anything involving TestFlight, the App Store, classmates, teachers, or money.
- **Ben:** decide how the app looks, sounds and words things; try each build on his iPhone and say what he saw and heard. His report is the real test: nothing about the phone's AI or its voice can be checked without a real iPhone.
