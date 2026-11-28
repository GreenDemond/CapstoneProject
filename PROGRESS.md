# PROGRESS.md

The only memory between sessions. Keep it current; rewrite it, do not let it grow into a diary.

## Working

- **Suggestions from the pasted text, no AI (H1)** (`design/heuristics-h1.md`, `js/logic/heuristics.js`). A "Looks like: <kind>" line with a Use this button (never picks for the student), a "What your assignment says" box of requirement lines copied word for word on the steps screen, and a range such as "problems 1-10" becomes chunk steps. Fails closed to the old behavior. Tested with `tests/fixtures/assignments.json` (22 written assignments) plus properties, and 7 browser tests. **Student-visible wording is waiting for the parent's okay** (list in the design note).

- **Project setup.** `npm start` serves the app at http://localhost:3000 (only `index.html`, `js/` and `css/`). `npm run check` runs lint, the logic tests, and the browser tests at phone (360 px) and desktop widths. Code layout: `js/app.js` is a short entry point; one file per screen in `js/screens/`; shared helpers in `js/ui/`; pure logic in `js/logic/`; `js/storage.js` is the only file that touches saved data (DECISIONS T13).
- **Home screen and saved steps** (`design/home-screen.md`). Opens on the next step with **Start this step** under a row of buttons (Talk it through, My calendar, My profile, How I like to work, Settings). Steps, progress and the kind of work are saved after every tap. A day or more later: "Welcome back. Pick up where you left off." (never a count of days). **Show all my steps**, **New assignment** (replaces the saved steps, said on screen).
- **Paste screen** (`design/paste-and-split.md`). Paste, pick one of six kinds, see five starter steps ("Showing 5 of 12" when there are more; Show more steps adds the rest). **Start runs exactly the steps on screen.** Two-minute start. Pasted text is cut at 6,000 characters with a message. The steps preview stays when the student visits another screen and comes back.
- **Work screen** (`design/work-screen.md`). One step at a time with Done, Still working, Stuck (five hints), Drifted (splits the step, same credit as Done), Later. The reward line shows only when something really changed. Optional countdown (12 or 25 minutes) runs from the clock, so a sleeping laptop does not stretch it; "Time's up" goes when the student taps Still working. Keyboard focus is kept on redraws.
- **How I like to work** (`design/focus-intake.md`). Four one-tap questions and a first-guess card. Not saved and not used anywhere yet (see Waiting on).
- **My profile** (`design/profile.md`). Goals and "What got in the way?" notes, saved on the device. Typed text survives Back, Clear and Cancel; Save says when a note is typed but not added; notes get the local date.
- **My calendar** (`design/calendar.md`). List first; the add form behind **Add something** keeps your typing across every redraw. Groups by how soon things are due, plus a calm grey **Time has passed** group (never orange "Urgent" for past items). Notes, links, categories, Start/Complete/Reopen, a weekly log hidden while it is all zeros, "Fire it Up" only after a confirmed Complete, Delete with a second tap, double-clicks never act on the item that slides up. Day/Week/Month views (hour labels fixed), trips spanning days, print a day.
- **AI helpers** (`design/settings-ux.md`, `design/ai-direct.md`). Students add their own AI service and key (kept encrypted in the browser, created safely even with two tabs). Show my steps can ask the chosen helper (tick box). The request is cancelled if the student leaves the home screen, and a timeout or Stop covers the whole reply.
- **Talk it through** (`design/ai-chat.md`, `design/chat-history.md`). A chat with the chosen helper: pick the kind, hints and questions only, replies shown whole. **Chats are saved on the device** in their own storage key: today's chat reopens; a "Carry on" line for an older one; **New chat**; **My chats** (10 most recent, plain dates, Delete and Delete all with a second tap). A message is saved only with its reply, so a message that triggers the "talk to an adult you trust" line is never stored. **How the AI talks** (Settings): a guide and reply length for All kinds and per kind, **Help me write it**; the guide is one quoted line that cannot imitate the app's rule markers.
- **Several helpers and AI options** (`design/settings-ux.md`). Several helpers can share an address (e.g. OpenRouter with different AIs), each with its own name (automatic if blank); **Use the same key as <name>** on the key step; a **Which AI helper?** menu in the chat. **How hard should the AI think?** per helper (None, Low, Medium, High; Low by default; sent with every request, and for services that refuse it the request is retried without it and a quiet line says so).
- **Search the web in the chat** (`design/web-search.md`, slice 1). OpenRouter helpers only: a tick box, off by default; sources shown as links from OpenRouter's real results; a plain message when there is no credit. Not yet checked against the real OpenRouter.
- **Storage safety** (`js/storage.js`). Unreadable saved data is backed up once and the app starts fresh, so saving never gets stuck; data from another version is backed up before anything is written; saving one section never drops another.
- **Navigation.** One `showScreen` decides which screen shows, so two screens never show together. Every screen leaves with **Back to home**, at the top (and at the bottom on long screens).

## In progress

- **Getting the web app as close to the iPhone app as a browser can, for classmates who cannot use TestFlight** (`design/web-parity-plan.md`; slices H1, W1 to W9, D1). Plain web, not required to be a PWA, no offline needed (parent, 2026-11-27). **H1 is built** (see Working). **D1 is built** (`design/deploy.md`): `npm run build:site` makes a clean `site/`, `scripts/deploy-site.sh` copies it; not yet run by the parent. Next: W1, the steps editor.

Nothing. The whole-app review plan (`design/review-plan-2026-11-17.md`) is finished; see its Progress list.

## Known gaps

- **Five answer-giving checks with a real AI** (chat, guides, and Show my steps) have not been run. Ben runs them with his own key (`tests/manual-checks.md`). Classmates must not use the AI features until they pass and the parent confirms the draft T8/T6 rows in DECISIONS.
- The distress check depends on the AI sending its safety word (Ben's decision: one layer). Free or small models may answer with their own text instead.
- `server/suggest.js` is parked: the app does not use it. Fix its rate limiter (trusts x-forwarded-for) and add a timeout before ever deploying it.
- "Use these as my steps" (chat to steps) is not built.
- The Suggest steps prompt and reply reading still trim replies (5 steps, 200 characters each); Ben asked to look at this.
- Not built from the home screen note: the margin note, a smaller next step after a long gap.
- Some browser tests still sleep (`waitForTimeout`) in the chat, navigation and calendar specs; they pass but are slower than they need to be.
- Not tested with a real screen reader or a real phone.

## Broken or worrying

- **One browser test is flaky** (found 2026-11-20): `tests/browser/ai-choice.spec.js:44` failed 2 of 6 repeats; after a reload the status line read "Using: a.example.test", not "isn't ready yet". Cause not yet known (`ROADMAP.md` item G1).
- **Browser tests cannot run as configured on this Mac**: Playwright's own browser is not installed. On 2026-11-20 they were run through installed Chrome (364 passed, 1 skipped, the 1 flaky failure above). `npm ci` needs `--registry=https://registry.npmjs.org/` here.
- **OpenRouter search uses a deprecated feature** (`plugins: web`); the replacement is in `ROADMAP.md` item S1.
- **`web-app/` is a leftover** (React and TypeScript, not allowed by T1). Excluded from git and lint. Ben decides whether to delete it. Ignore `SETUP.md` step 6.
- **Editing the steps before starting is not built** (P1). With the AI turned on, this is the biggest gap against the research: the student should make the plan. Next #1.
- Starter steps are not yet tested with students.
- Most research was read at abstract level; items marked *(not read)* or **(confirm)** in `01-evidence.md` and `02-platform-and-privacy.md` are unchecked.

## Waiting on

**Ben**

- "How I like to work": save the answers and use them as starting choices (countdown length, two-minute start, Help me write it), or hide the button until it does something.
- The AI tick box on the paste screen is on by default; it could start off.
- Whether to delete `web-app/`.
- The app's name (keep rule 8 in mind: "focus" can read as a claim about attention).
- How progress is shown; the words for drifting, getting stuck and coming back; colours and overall look.
- Work screen: how Drifted treats the rest of the step (`design/work-screen.md`).
- PDFs on calendar items; push notifications; photo of notes; learning habits (the last three need a parent).

**Parent**

- Confirm the draft T8/T6 rows (chat sends the conversation and the guide; resumed chats send older messages again) before classmates use the chat.
- The native iPhone app: approved and built (see `ios/PROGRESS.md`). Its open parent items (D8, the trusted-adult proposals, TestFlight upload, the answer-giving checks) are listed in `ios/PROGRESS.md` "Waiting on".
- Hosting (T7). Teacher approval and written parent permission before classmates use the app.

## Next

**The iPhone app lives in its own self-contained folder, `ios/`, and is built** (2026-11-21): "Ben's Steps", build 10, installed on the parent's iPhone (build 9 is the one archived for TestFlight). The parent approved it (`ios/DECISIONS.md` D1, 2026-11-20). Its state, open problems and next steps are in `ios/PROGRESS.md`; work on it follows `ios/AGENTS.md`, not this file. It replaces the thin-shell draft in `design/iphone-app.md` and phase N of `ROADMAP.md`. It does not change this web app, and T1 here is unchanged.

**`ROADMAP.md` (2026-11-20) lays out the next stage**: interface clean-up, a more interactive chat, search, and an Apple shell with on-device AI. It needs answers from the parent and Ben first (its section 8). Until they answer, the list below stands.

1. **Editing the steps before Start** (P1): edit words, delete, reorder, add. Design note first.
2. **Recall question** on the "All your steps are done" screen (P9, Moderate evidence).
3. **Save to file and load from file** (T4); chats left out by default.
4. **Weekly goal and progress display** (P7).
5. "Use these as my steps", and the Suggest steps prompt and reply reading.
6. Decide how PolyStrata and SearXNG reach the app (server CORS settings, a desktop extension, or Capacitor later; drafts in `design/web-search.md`, `design/iphone-app.md`). Possibly streamed replies in the chat.
