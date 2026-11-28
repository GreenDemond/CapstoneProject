# ROADMAP.md (iPhone app)

Written 2026-11-22. A short plan for features that the research in `research/` supports or that it marks as design judgment worth testing. It is a plan, not a set of decisions: nothing here is decided until the parent or Ben says so and `DECISIONS.md` records it. Every item still goes through the loop in `AGENTS.md` section 3 (design note, gate 1, build, tests, gate 2 where it applies, commit).

Read `PROGRESS.md` first for what already exists and what is open. This file does not repeat that.

## 1. What the research says, and where the app stands

| Research finding (rating in `research/00`) | Already in the app | Still missing |
|---|---|---|
| Self-monitoring at natural pauses (Strong) | Five buttons at each step change; private; saved | Nothing. Do not add check-ins mid-step |
| Immediate small rewards, never taken away (Strong in class, Weak for apps) | A short acknowledgement after each tap; same for Drifted as Done | A visible, forgiving progress display (section 2, item 2) |
| The student makes or edits the plan (Moderate) | "I'll say my steps", the editor, suggested steps always pass through the editor | Coaching that fades as the student gets better (later; needs history) |
| Hints, never answers (Moderate, a hard rule) | Chat rules, the answer guard, the process-step check | Nothing new; keep testing it (T14) |
| Recall practice (Moderate) | One optional question after a reading or study step; answers listed in Plan | Bringing an old answer back later (item 4) |
| Make starting easy; one thing at a time; welcome back with no count (Judgment) | Two-minute start, Get ready step, Today opens on the next step, "Welcome back" after a gap | The comeback slice (item 1) |
| Let the student test what works for them (Judgment, from "no questionnaire predicts flow") | How I like to work, saved, used for the countdown length | Asking afterwards whether the setting helped (item 5) |
| Vary it so it keeps working (Judgment, from Kovacs 2018) | Nothing | Rotating wording for the acknowledgement lines (item 6) |
| If-then plans; tomorrow's first step (Weak) | Nothing | "Tomorrow's first step" at the end of a session (item 3) |
| Friction before a distracting app (Moderate, not ADHD-specific) | Nothing | Needs Apple's Screen Time entitlement (section 4) |
| Background noise (Moderate, helps some and harms others) | Nothing | A careful personal experiment, later (section 4) |

Things the research says not to build stay out: brain-training games, leaderboards, streaks that reset, speed bonuses, prizes, anything that watches the student, any claim to treat ADHD (`research/00` section 5; `research/06` "Do not borrow").

## 2. Phase 1: small, evidence-first (each one is one session)

In order of value for effort. Each is one design note and one commit.

**1. The comeback slice** (`research/05` ★ 1; `04` D8). Today already says "Welcome back" after a day away. Add: the unfinished step shown already cut to its smallest piece, with one button, and after the slice the choice "5 minutes" or "the full step". The slice is "re-read the step" or the first half of a split, never new work. Risk: a slice that feels patronising. Ben should see three wordings first. Stores nothing new. Test: a gap of a day, of a week; a step that cannot be split.

**2. A forgiving progress display** (`04` G1/G2/G4/G5, `05` pet rock, `06` A2). Ben's choice between: a ring that closes per step (A2), a weekly "4 of 5 days" goal (G4, decision P7), or the pet rock on a track (`05` section 4). Rules: builds up, never resets to zero, same credit for Drifted as Done, takes under two seconds, no sound. Recommendation: the closing ring per step now, because it reuses the countdown ring already drawn, and the weekly goal when P7 is decided. Stores: steps finished per day. Test: a week with two missed days shows no loss.

**3. Tomorrow's first step** (`04` D9; if-then plans, Weak). When all of today's steps are done ("That's today done."), one optional question: "What's the first thing you'll do next time?" The answer becomes the first card on Today next time. Never a time or a reminder in version 1. Stores: one line. Test: skipping it changes nothing; the line shows on the next open and then goes away.

**4. Old recall answers come back** (`06` A8; spaced retrieval). At the start of a later session, show one earlier recall answer: "Last time you wrote: '...'. Still true? Anything to add?" with Add, Skip. Draws on answers already saved in Plan. Test: nothing is shown when there are no answers; Skip stores nothing.

**5. "Did that help?"** (`00` principle 5; `04` D12). After a session that used a setting from How I like to work (countdown length, two-minute start), one tap: "Was 12 minutes about right? Shorter · About right · Longer". The first-guess card updates its line. This turns the questionnaire into the experiment the research asks for. Stores: the answer per setting. Test: three answers in a row change the suggestion; one does not.

**6. Rotating wording** (`00` principle 4; `04` principle 6). A bank of 20 to 30 short acknowledgement lines for Done, Still working and Drifted, rotated so the same line does not repeat within a session. Words come from `Shared/content.json` (gate 2). No code change beyond picking from the bank. Test: no line repeats within ten taps; every line passes the never-shame check.

**7. Dread and crux, two taps** (`05` section 5). Before Start: "Which step are you dreading most?" (tap one). After the last step: "Which was actually hardest?" Plan shows the two side by side for that assignment. Nothing is predicted and nothing is graded. Stores: two step ids per assignment. Test: skipping either changes nothing.

## 2b. The AI coaching layer (researched 2026-11-22)

Research: `research/07-ai-coaching.md`. Plan with exact prompts, files and tests, written for a Sonnet/Haiku Builder: `design/slices/COACH-plan.md`. In short: the AI gets a few named moves (a stuck question, a split nudge, the comeback slice, a follow-up after "did that help", a tidied question for a person, a weekly reflection), each with one fixed prompt, one output shape checked in code, a "NOTHING" option, and a non-AI fallback. The app decides which move runs from state it trusts, never from the student's words. A fading coach puts "I'll say my steps" first once the student has planned about three assignments on their own. Slices COACH-0 to COACH-7; COACH-3 and COACH-4 depend on Phase 1 items 1 and 5.

## 2c. Memory, retrieval and feedback (planned 2026-11-22)

`design/slices/MEMORY-plan.md`. A learner record on the phone (settings tried and verdicts, confirmed patterns, obstacles, weekly reflections, per-course "what worked", thumbs feedback on AI lines), never a description of the person. A selector gives each AI move at most 5 lines it is allowed to see, rules first, then on-phone semantic search (`NLEmbedding`, verified in the kit). Thumbs up / meh / down under every AI line, with a per-move fallback bias. A "How I work" screen shows the whole record and what the AI was told. Slices MEMORY-0 to MEMORY-4 and COACH-8 (check a hunch) interleave with COACH-plan.

## 2d. Backlog from the parent (2026-11-23)

- **Reorganise settings.** Settings are spread across Me, Talk and the AI sections. Gather them into clearer groups. Needs a design note first; no decision yet on the layout.

## 3. Phase 2: already designed, waiting on a decision

These are in `design/slices/UX-whole-app-review.md` and need the parent or Ben first.

- **Split Me into short pages.** Goals and notes · How I like to work · How I want help · Voice · Advanced AI services · Backup · About and privacy.
- **"How I want help."** Show the real default guide, offer three presets (Ask me questions · Smallest hint first · Keep it brief), Edit, Reset. One global guide; per-kind guides only if Ben asks.
- **Native confirmation dialogs** for deleting chats, AI services, saved keys and Delete everything.
- **The AI-service form:** Next/Done field order, focus on the first problem.

## 4. Phase 3: needs a new decision, a parent, or Apple

- **Reminders** (`design/02` 2.12). One reminder for tomorrow's first step. Needs the notification permission (a new permission: `AGENTS.md` section 9) and a D8 review (local notifications leave nothing, but say so).
- **Lock-screen card** for the current step (ActivityKit). Verify the API in the kit first (`AGENTS.md` section 7).
- **Pause before a distracting app** (`00` section 2, Moderate). Needs Apple's Screen Time entitlement, requested by the parent, and the app never learns which apps were chosen.
- **Background noise as a personal experiment** (`00` section 5). Needs volume and time limits, headphones only, and an "did it help" question. Only after item 5 exists.
- **Calendar list and "Fire it Up"** (`design/02` 2.12; Ben's wish). A list grouped by how soon things are due, with a calm "Time has passed" group. Day/week/month grids are not planned.
- **Per-kind AI guides**, own-key web search, Mac and iPad.
- **Use a subscription instead of a key** (parent: "remind me later"). OpenAI's "Sign in with ChatGPT" allows Plus/Pro plans to power an app's requests with a weekly cap and no key; Anthropic does not allow Claude plan logins in third-party apps (checked 2026-11-22); Grok not checked. Needs a parent decision, a D8 row and an OAuth flow. See `design/slices/MEMORY-plan.md` section 8.

## 5. What not to build, and why (so the next agent does not re-open it)

| Idea | Why not |
|---|---|
| Mid-step check-ins or a timer that nags | Breaks "never interrupt a step" (`06` M6); the check-in at step changes is the tested compromise |
| Points for time in the app, speed bonuses, streaks | `research/00` section 5 |
| A "behind" or "at this pace you will finish late" line | `06` A3's guard: only ever look forward, never compare with an earlier estimate |
| Camera, screen or typing monitoring | Rules 4 and 5; replaces self-monitoring with being watched |
| Mood check-in as a measure | No research support found (`design/01` 1.3); a private note is fine |
| Anything that shares numbers between students | Rule 7 |

## 6. Questions for Ben (ask a few at a time, with a recommendation)

1. Progress display: closing ring, weekly goal, or pet rock? (Recommendation: ring now.)
2. Comeback slice: which of three wordings?
3. Dread and crux: worth two taps per assignment?
4. Acknowledgement lines: does he want to write some himself?
5. Still open from before: the app's name and icon, the words for Drifted and Stuck.

## 7. How to use this file

Pick the first item in section 2 that has its decision, write `design/slices/<id>-<name>.md`, and follow `AGENTS.md`. Record any decision in `DECISIONS.md` and move the item to `PROGRESS.md` when it is done. Keep this file short; delete items as they ship.
