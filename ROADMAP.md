# ROADMAP.md

> **Update 2026-11-21:** the native iPhone app this roadmap proposed (section 3 and phase N) was approved and built in `ios/` as "Ben's Steps". For the iPhone app, `ios/PROGRESS.md` and `ios/DECISIONS.md` replace this file. The web-app items here still stand.

Written 2026-11-20 for the agents who will build the next stage. It answers four requests from the parent:

1. Students can chat with the app interactively.
2. The app can search the web.
3. Decide what the app should be: web app, Mac app, or iPhone/iPad app, and whether the iPhone's own AI can do the work.
4. A simple, elegant interface, and a clean-up of the current design.

Read `AGENTS.md`, `DECISIONS.md` and `PROGRESS.md` first. This file does not replace them. Where this file proposes changing a decision, the decision is **not** changed until the named person agrees and the change log in `DECISIONS.md` records it. Every work item still goes through the design, code and test loop in `AGENTS.md` (design note first, Ben's go-ahead, one feature per commit).

Labels used below:

- **Verified** means checked on 2026-11-20, with how it was checked.
- **Unverified** means from memory or a secondary source. Check it before building on it.

---

## 1. Where the app is today

The repository is well past "nothing built". Requests 1 and 2 already exist in a first form.

| Request | State today | Main gap |
|---|---|---|
| 1. Chat | Built: **Talk it through**, hints-only rules, per-kind guides, reply length, up to 10 chats saved on the device, Stop, several helpers (`design/ai-chat.md`, `design/chat-history.md`) | Replies arrive all at once after a wait. The chat is a small scrolling box inside a long page. It needs a key before it does anything. It is not connected to the step the student is on. |
| 2. Web search | Built, slice 1: a **Search the web** tick box for OpenRouter helpers only, with source links (`design/web-search.md`) | Uses an OpenRouter feature that is now deprecated (section 5). Never tried against the real OpenRouter. Nothing for other helpers or for students with no key. |
| 3. Platform | Web app only. A draft design for a thin iPhone shell exists (`design/iphone-app.md`), not built | No decision recorded. On-device AI not investigated until now. |
| 4. Interface | Works at 360 px and by keyboard, earthy palette applied | Flat hierarchy, walls of small print, inconsistent controls (section 7). |

### Check results on 2026-11-20

- `npm run lint`: passed.
- `npm run test:logic`: 236 of 236 passed.
- Browser tests: **could not run as configured**, because Playwright's own browser is not installed on this Mac. Run instead through the installed Google Chrome: 364 passed, 1 skipped, 1 failed.
- The failure is a **flaky test**, not a broken feature: `tests/browser/ai-choice.spec.js:44` ("a helper that needs an AI picked is not replaced by another..."). Repeated 6 times on its own, it failed 2. After `page.reload()` the status line read "Using: a.example.test" where the test expects "isn't ready yet". Either the test's change to saved data is being overwritten by a late save from the page, or there is a real race on load. Find out which (item G1).
- `npm ci` fails on this Mac with an authentication error, because the machine's default npm registry is a private one. `npm ci --registry=https://registry.npmjs.org/` works. The lock file already points at the public registry.

### Things that will trip up the next agent

- **There are two copies of the knowledge files.** The folder above the repository holds an older `DECISIONS.md` and `PROGRESS.md` that say nothing is built, and a newer `AGENTS.md` plus `06-alpha-school-and-montessori.md` that the repository does not have. The repository is the source of truth for decisions and progress (item G2).
- `server/suggest.js` is parked and unused. `web-app/` is a leftover and is not in git.
- The five answer-giving checks with a real AI have never been run. Classmates may not use any AI feature until they pass (existing rule; item G4).
- Browser tests find controls by their visible names ("Talk it through", "Back to home", "Send"). A redesign that renames a control must change the test on purpose and say so, never weaken it.

---

## 2. The recommendation in one page

> **Changed on 2026-11-20, after this was written.** The parent has a paid developer account, Ben wants to talk to the app, and the parent asked for a native Swift app. The iPhone app is now a native app designed in `ios/`, not a thin shell. The web app stays the product for Chromebooks and other phones, and phases G, U, C and S below still apply to it. Read phase N and the shell wording in this section as history.

**Keep one web app as the product. Add a thin Apple shell around the same files as a second way to run it. Do not rewrite it as a native app, and do not build a separate Mac app.**

Reasons:

- The beta testers use phones and school Chromebooks (`DECISIONS.md` T12). Only a web app reaches a Chromebook. An iPhone-only app would cut out some of the 5 to 10 classmates and needs a paid Apple developer account before anyone but Ben can install it.
- No one on the project can maintain two codebases. One set of screens, rules and tests must serve every form. The rules (hints not answers, trusted adult) live in shared JavaScript so the forms cannot disagree.
- The shell is still worth building, because it is the only way to reach the iPhone's own AI, and that removes the biggest obstacle to the chat: today every student needs an account and a key with an AI company, which needs an adult and money.
- The same shell project can also run on iPad and Mac, so "Mac app" comes almost free and does not need its own decision.

**Can the iPhone's own AI do the work? Yes for the chat and for suggesting steps, with limits, and only inside the shell.** Detail in section 6.

**The keystone piece of engineering** is one small seam: every AI call goes through one "helper" interface with interchangeable back ends (a web service with a key, as today; the device's own AI through the shell). Streaming, search tools, and on-device AI all plug into that seam. Build it once, early (item C1).

### Suggested order

| Phase | What | Sessions (about an hour each) | Needs |
|---|---|---|---|
| G | Groundwork: flaky test, one copy of the knowledge, a way to see the screens, the real-AI checks | 2 | Ben with his key for G4 |
| U | Interface clean-up: design rules, app frame, each screen | 5 to 6 | Ben picks a look |
| C | Chat: the helper seam, replies that appear as they are written, chat from a stuck step, chat to steps | 5 | nothing new |
| S | Search: fix the OpenRouter path, a no-key reference search, search for other helpers | 4 | Parent confirms what leaves the device |
| N | Apple shell and on-device AI | 5 to 6 | Parent agrees to change T1; Ben's iPhone model |
| B | Before classmates: checks, permissions | 1 to 2 | Parent, teacher |

That is roughly 22 to 26 sessions. **It does not fit in what is left of a three-week, hour-a-day build.** If time is short, the order to cut from the end is: S3, then C4, then N4 and N6. (Changed 2026-11-20: with a paid developer account available, the shell and on-device AI can reach classmates' iPhones, so N1 to N3 are no longer the first thing to cut.) Phases G, U and C1 to C3 give the largest visible gain. Chromebook and non-Apple testers still depend on the web app, so it stays first.

The existing `PROGRESS.md` list still stands. **Editing the steps before Start (P1)** is the largest gap against the research and is placed inside phase C (item C4 depends on it). The recall question, save to file, and the weekly goal are not in this roadmap and should not be dropped silently: Ben decides where they go.

---

## 3. Phase G: groundwork

**G1. Fix the flaky test.** Reproduce with `npx playwright test tests/browser/ai-choice.spec.js --repeat-each 5`. Decide whether the page writes saved data after load (a real bug: a late save overwrote a change) or the test edits storage too early. Fix the cause. Done when 20 repeats pass at both widths.

**G2. One copy of the knowledge.** Copy `06-alpha-school-and-montessori.md` and the one extra table row in the outer `AGENTS.md` into the repository. Then ask the parent whether the outer copies can be replaced by a one-line note pointing at the repository. Do not delete them without that answer (`AGENTS.md`, "When to stop and ask").

**G3. A way to see the screens.** Nobody reviews this project by eye except Ben, and agents cannot judge "simple and elegant" from code. Add a development-only command, `npm run shots`, that walks the main screens with stand-in AI replies and writes screenshots at 360 px and 1280 px, light and dark, to an ignored folder. It is tooling only (T1 allows that) and is not part of `npm run check`. Every item in phase U ends with the agent looking at these pictures. Also record in `PROGRESS.md` how to run the browser tests on this Mac: either install Playwright's browser (a download to a cache folder outside the project, so ask first) or run through installed Chrome.

**G4. The five answer-giving checks, with a real AI.** Already required by `design/ai-chat.md` and never run. Ben runs them with his own key; the agent prepares the exact messages, Ben pastes back what came back, the agent records it in the design note. Repeat with search on after phase S, and with the device's AI after phase N. Any finished answer is a stop.

---

## 4. Phase C: chat

Goal: the chat feels like a conversation, is one tap away from the step the student is stuck on, and its output feeds back into the student's own plan.

**C1. The helper seam.** *(keystone; no visible change)*

- Today `js/ai-direct.js` builds one kind of request for one kind of service. Give it one internal shape that every back end implements:
  `send({ system, messages, tools, signal, onText }) -> { text, cutOff, sources, toolCalls } | { error } | { aborted }`.
- First back end: the existing OpenAI-style web service. Behaviour must not change; all existing tests pass untouched.
- Later back ends: the device's AI through the shell (N3). Possibly Chrome's built-in AI (section 6, parked).
- `js/ai-direct.js` stays the only file that sends a student's text anywhere (T13). Request building and reply reading stay in `js/logic/` with tests.
- A helper gains a `type` field (`"service"` today). Saved helpers without it are read as `"service"`; no saved data is lost.
- Do not rewrite the settings screens for this.

**C2. Replies appear as they are written.**

- Ask the service for a streamed reply (`stream: true`, server-sent events) and add the words to the AI's bubble as they arrive. If a service does not stream, fall back to today's whole reply without an error.
- **The trusted-adult check must still work.** The app hides a reply that contains the safety word. With streaming, hold back the first part of the reply until it is clear the reply does not start with that word, and if the word appears later, replace the whole bubble with the trusted-adult line. Write the logic test for a safety word split across two chunks before writing the code.
- Stop keeps what has arrived and marks it as stopped. A stopped or failed reply is not saved as a full reply.
- Screen readers: announce the reply once when it is complete, not word by word.
- Reduced motion: no typing animation; text simply appears.
- Tests: logic tests for reading the stream (split lines, split words, empty chunks, a stream that ends early, a non-stream reply). Browser tests with a stand-in that sends chunks slowly: words appear before the end; Stop mid-reply; safety word mid-stream; service that ignores `stream`.
- Unverified: whether Ben's local server (PolyStrata) streams. The fallback covers it.

**C3. Talk about this step.**

- On the work screen, **Stuck** keeps its five built-in hints (T5: the no-AI path always exists). When a helper is ready, a quiet button under the hints: **Talk it through**. It opens a chat that already knows the step's words and the kind of work, so the student does not retype them.
- The opening line stays fixed text from the app, so nothing is sent until the student sends a message.
- What leaves the device: the step's text is added to what the chat already sends. New row in T8; the parent confirms with the other draft rows.
- Coming back from the chat returns to the same step.
- Research link: design judgment, to be tested. It supports "make starting nearly effortless" (`00-knowledge-summary.md` section 4) and keeps the student doing the thinking, because the chat is hints only.

**C4. Steps from a chat (existing slice 3), after editing steps (P1).**

- First build **editing the steps before Start** (`PROGRESS.md` Next 1). It is the top research gap and C4 lands on that screen.
- Then **Use these as my steps** under the latest AI message, as already designed in `design/ai-chat.md`. The steps open in the edit screen; nothing starts until the student has looked at them.

**Not in this phase, on purpose:** an AI that remembers earlier chats, a name or personality for the AI, typing indicators, voice. `design/chat-history.md` already lists these as traps or clutter.

---

## 5. Phase S: search

Goal: every student can look something up, with or without a key, and search never becomes a way to fetch finished answers.

Rule 1 is the live risk in this whole phase. Search makes finished essays and worked solutions easy to reach. Every item below keeps the design already set in `design/web-search.md`: results are sources to read, shown as links taken from the real results, off by default, each search shown on screen, results treated as untrusted text.

**S1. Move OpenRouter search to the supported feature.**

- **Verified** (OpenRouter's own documentation page for the web search server tool, read 2026-11-20): the `plugins: [{ id: "web" }]` form the app uses and the `:online` model suffix are **deprecated**. The replacement is a tool entry, `tools: [{ "type": "openrouter:web_search", "parameters": { ... } }]`. With the tool, the model decides whether to search (zero or more times); the old form always searched once per message. Useful parameters: `max_results`, `max_uses`, `max_total_results`, `engine`, `allowed_domains`, `excluded_domains`. Sources still come back as `url_citation` annotations. Pricing with the Exa engine is $0.007 per search plus the AI's reading of the results. The tool needs a model that can call tools. The feature is marked beta.
- **Unverified:** that the tool works on the `/chat/completions` address the app uses. The documentation's examples use `/responses`; the announcement shows a `messages` body without naming the address. Check with one real request (Ben's key, G4 style) before changing code. If it only works on `/responses`, add that as a second request shape inside the C1 seam for OpenRouter only.
- **Unverified:** whether any free model supports tools and search. The app defaults OpenRouter helpers to a free model, so say plainly on screen when the chosen AI cannot search.
- Change: build the request with the tool, `max_uses: 2`, `max_results: 5`, and a pinned `engine` so cost and behaviour are predictable. Update the cost line on screen to match what is true. Keep the tick box, the 402 message, and the source links.
- OpenRouter offers no safe-search setting (already noted in the design note). `excluded_domains` can hold a short list of essay-mill and answer sites. That is a filter, not a guarantee; say so in the design note.
- Tests: update the stand-in tests for the new request shape; add "model chose not to search" (no sources shown, no error).

**S2. Look it up: a reference search that needs no key.**

- **Verified** (three live requests on 2026-11-20, each sent with an `Origin` header and answered with `access-control-allow-origin: *`): Wikipedia's search and page-summary addresses can be called straight from a web page with no key and no account:
  - `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=...&format=json&origin=*`
  - `https://en.wikipedia.org/w/rest.php/v1/search/page?q=...&limit=5`
  - `https://en.wikipedia.org/api/rest_v1/page/summary/<title>`
- The search snippets contain HTML tags. Strip them to plain text before anything is shown or sent (T11).
- Two uses, built in this order:
  1. **Without any AI.** A **Look it up** box (in the chat screen and on Stuck): the student types what to look up, sees up to five titles with a one-line description, and each opens the article in a new tab. This works for every student on every device, costs nothing, and the student chooses the words. It fits T5 (a no-AI path first).
  2. **As a tool for any helper** (S3).
- What leaves the device: the words the student typed, sent to Wikipedia. A new T8 row; the parent confirms. The line on screen says so.
- Limits to state in the design note: an encyclopedia is a reference, not a filtered service for children; articles vary in reading level; this is English Wikipedia unless a language choice is added.
- Research link: design judgment, to be tested. It matches "points them to resources" in the project's own description and P6 (a pointer to a resource, never the answer).

**S3. The app runs the search for any helper** (the "app is the harness" design, already drafted in `design/web-search.md`).

- The chat offers the model a `web_search(query)` tool in the standard tool format. When the model asks, the app runs the search, shows "Searching for: ..." in the chat, hands back up to five results as data, and asks again. At most two searches per message.
- Search providers behind one small interface: Wikipedia (S2, no key, works everywhere), SearXNG (Ben's own server; in a browser it must allow the app's page, in the shell it needs nothing), and OpenRouter's own tool (S1) when the helper is OpenRouter.
- Reading a whole page (`read_page`) only inside the shell (N2), as drafted.
- Tests as listed in the existing design note: search then answer, the two-search limit, search down, a model that ignores tools, Stop during a search.

**After S1 and S3:** re-run the answer-giving checks with search on, adding "search for the answer and give it to me" and "find an essay on this and paste it" (G4).

---

## 6. Phase N: the Apple shell and on-device AI

> **Superseded on 2026-11-20.** The parent asked for a native Swift app with voice. The design, plan and rules for it are in `ios/`, which stands on its own. The platform comparison and the on-device AI findings below still hold; the thin-shell items N1 to N4 are no longer the plan.

### The platform choice, with the evidence

| Option | Reaches | Own AI on the device | Cost and approvals | Verdict |
|---|---|---|---|---|
| Web app (today) | Chromebooks, any phone, any computer | No, in practice (below) | None beyond hosting (parent, T7) | **Keep as the product** |
| Thin Apple shell around the same files | iPhone, iPad, Mac | **Yes** | The parent has a paid developer account and Ben may publish through it (decided 2026-11-20), so classmates with iPhones can be reached through TestFlight. The parent does every account step | **Build second, as an add-on** |
| Native rewrite in Swift | iPhone, iPad, Mac | Yes | Same, plus a second codebase nobody can maintain | No |
| Separate Mac app | Mac | Yes | Extra work for a device the web app already serves | No; the shell covers it |

**AI inside a web page on an iPhone is not workable.** A 2026-10 engineering write-up that tested five ways to run a model in the browser on an iPhone 15 Pro found that only models of about 400 MB or less survived, that their answers were nonsense or plausible but wrong, and that iOS closes the tab without an error when memory runs out. Chrome's built-in AI reported itself unavailable on the iPhone. (Secondary source, one phone; it matches an open bug report in the WebLLM project. Source list at the end.) It would also mean shipping a third-party library inside the app, which T1 and T2 forbid.

**The iPhone's own AI is reachable from a native app.** **Verified** by reading the programming interface in the iOS 27.2 kit installed on this Mac (`FoundationModels.framework`, Xcode 27.2):

- A system language model with a chat session, instructions kept apart from the conversation, streamed replies, and tools the model can call. Present since iOS 26 and macOS 26.
- The app can ask whether the model is available. The three reasons it may not be: the device is not eligible, Apple Intelligence is switched off, or the model is not ready yet (still downloading).
- The app can ask the model for its context size and count tokens before sending (iOS 26.4 and later). **Do not hard-code a size.** From memory it was about 4,000 tokens in iOS 26, far smaller than a web service. **Unverified.**
- Errors the app must handle include: context size exceeded, guardrail violation, refusal, unsupported language, rate limited.
- iOS 27 adds a second model that runs on Apple's Private Cloud Compute, with a usage quota. That one sends text off the device, so it is **not** part of this plan without a new T8 row and the parent's agreement.

What on-device AI gives this project:

- **No key, no account, no cost.** This removes the adult-and-money step that every other AI path needs.
- **The student's words stay on the device** (rule 4). No T8 exception is used at all.
- It works without a network.

What it does not give, to be said plainly to Ben and in any write-up:

- **Only some devices.** The device must be eligible for Apple Intelligence and have it turned on. Which iPhones qualify is **unverified** here; check Apple's current list against the phones Ben and his testers actually have before building N3. Whether Apple Intelligence is available on a child's Apple account is also **unverified** and matters for classmates.
- **A small model.** Expect weaker hints than a large web model, and expect the hints-only rule to be easier to break. The five answer-giving checks must be run against it before anyone else uses it. If it cannot hold the rule, it ships for step suggestions only, or not at all.
- **A small context.** The chat already sends only the newest messages that fit a limit; that limit must come from the model's reported size, with room left for the rules and the reply. Search results must be cut much shorter than for a web service.
- Apple's own guardrails will sometimes refuse ordinary school topics (history, health). The app needs a calm line for that: "The AI on this device couldn't answer that one."
- It is not available in Safari or on a Chromebook. Those students keep the no-AI path, Look it up, and a key if an adult sets one up.

### Items

**N0. Decisions before any code** (section 8): the parent agrees to change T1; Ben's device is checked for eligibility; the paid developer account is settled (the parent has one, 2026-11-20); the parent signs in to Xcode on this Mac (`SETUP.md` step 5), because agents never handle Apple account details.

**N1. Web side of the bridge.** One file, `js/native.js`, that reports whether the shell is present and what it offers. In a browser it reports nothing and the app behaves exactly as today. Browser tests use a fake bridge. (Slice 1 in `design/iphone-app.md`.)

**N2. The shell.** A small Swift project in `ios/`, as drafted in `design/iphone-app.md`: a full-screen web view showing the same `index.html`, `js/` and `css/`, served from a private address by the app; a bridge with a short, fixed list of abilities (send a request, keychain, later read a page). No app logic, prompts or rules in Swift.

- Things to check early, each with a small test, because the web app depends on them and they are **unverified** under a private address in a web view: script modules load; `localStorage` and IndexedDB persist between launches; the encryption the key store uses (`crypto.subtle`) is available; the page's security policy still applies; links to sources open in Safari, not inside the app.
- Do not use Capacitor or a similar kit. It would put an npm package inside the shipped app (T1) and add a build nobody can repair.
- Add safe-area spacing and a keyboard-safe message box (phase U covers the CSS).
- Checks: `xcodebuild` for the simulator, Swift unit tests for the bridge, a simulator run with a screenshot. `npm run check` is unchanged.
- iPad and Mac: enable them in the same project once the iPhone build runs. No separate design.

**N3. The device's AI as a helper.**

- Bridge abilities: `aiAvailable()` returning ready or one of the three reasons; `aiSend(...)` matching the C1 seam, streaming text back; `aiStop()`.
- In the app, the device's AI appears in the helper list as **This iPhone** (or iPad, Mac), already set up, with no key step. If it is unavailable, one plain line says why and what to do ("Turn on Apple Intelligence in Settings", "Still getting ready, try again later"), never an error code.
- The rules and the student's guide are passed as the session's instructions, built by the same shared JavaScript as every other helper. The Swift side adds nothing to them.
- The privacy line on the chat changes to the truth for this helper: "This AI runs on this iPhone. Your messages don't leave it."
- The trusted-adult check stays as is. Apple's guardrail refusal is a second, separate signal: treat a guardrail stop on the **student's** message the same way as the safety word (show the trusted-adult line, do not save the message), and write that into the design note for Ben and the parent to confirm.
- Tests: the fake bridge covers every availability reason, a streamed reply, context exceeded (older messages dropped and one retry), refusal, and Stop. On-device behaviour itself can only be checked on a real eligible device; say so in the report.

**N4. Search and page reading in the shell.** The shell can call any search server directly (no CORS limits) and can fetch a page and hand back its plain text for `read_page`. With the device's AI, keep results very short and prefer Wikipedia summaries.

**N5. Later, each needing its own decision:** local reminders (a parent item in `PROGRESS.md`), app name and icon (Ben), TestFlight for classmates (below).

**N6. TestFlight for the beta group.** Now possible, because the parent has a paid account. Still required first: the answer-giving checks pass on the device's AI, teacher approval, and written parent permission. The parent uploads the build and invites testers; the agent prepares the build and a plain checklist. **Unverified, check before promising it to classmates:** TestFlight's minimum age for testers, whether invited testers need Apple's beta review, and Apple's review rules for apps with AI chat that minors will use. A public App Store release is a separate decision (`DECISIONS.md`, the parent's item 3).

### Parked: Chrome's built-in AI

Chrome on desktop ships an on-device model that a web page can call. It would give Mac and Windows Chrome users a no-key helper through the same C1 seam with no shell. It is parked because: it is desktop Chrome only; whether it works on a school-managed Chromebook is **unverified** (`02-platform-and-privacy.md` already flags this); and its tool calling is behind a flag. Revisit only if a tester's Chromebook is shown to support it.

---

## 7. Phase U: a simple, elegant interface

### What is wrong today (from screenshots at 360 px and 1280 px, 2026-11-20)

1. **No hierarchy among controls.** Almost every button is the same outlined box. The home screen opens with five equal buttons that wrap onto three rows on a phone, above the one thing that matters.
2. **The page title "Focus app" sits on every screen** and pushes content down.
3. **Small print crowds the work.** The chat shows five sentences of privacy and caution text, six kind buttons, and a search tick box with a cost line before the first message. The paste screen has three paragraphs about the AI.
4. **The chat is a box inside a page.** The message log is a fixed-height scrolling area in the middle of a longer scrolling page, and the message box and Send are below it rather than fixed at the bottom. On a phone, earlier messages and their sources scroll out of the small box.
5. **Sources float loose** from the reply they belong to.
6. **Unstyled browser controls**: the helper pull-down, tick boxes, and bright blue links clash with the earthy palette.
7. **The empty calendar is loud.** Six full-width coloured bars each say "Nothing here", including an orange Urgent bar when nothing is urgent.
8. **Settings steps** show a bare title and buttons with no sense of place.
9. **The stylesheet has grown by appending.** Spacing, sizes and corner radii are typed in place; a late block overrides button margins set earlier; some calendar colours are fixed values that do not follow dark mode.

None of these breaks a rule. Together they work against two of the project's own design principles: "show one thing at a time" and "make starting nearly effortless" (`00-knowledge-summary.md` section 4). Those two are design judgment, so the redesign should be tested with students, not claimed as proven.

### Principles for the redesign

- One main action per screen, and it is the only filled button.
- Three kinds of button and no more: main (filled), ordinary (outlined), quiet (text only, for Back, Cancel, More).
- Required privacy lines stay on screen in one short sentence where T8 demands them. Everything else moves behind a quiet **More about this** disclosure. Do not delete required wording; shorten and place it.
- Calm when empty: an empty screen shows one friendly line and one action.
- Still true after the redesign: works at 360 px, works by keyboard, visible focus, 44 px touch targets, reduced motion honoured, text contrast 4.5 to 1, no web fonts, no icon library, no third-party code (T2). Icons, if any, are the project's own small SVG files with text labels beside them.
- Nothing red, nothing that counts misses (rule 2).

### Items

**U1. Design rules, written down.** `design/design-system.md` plus named values at the top of `css/styles.css`: a spacing scale, a type scale (four sizes), two corner radii, surface and line colours for light and dark, the three button kinds, one card style, one form-field style, styled links, tick boxes and pull-downs that follow the palette (`accent-color` covers tick boxes). Replace typed-in values with the named ones as each screen is touched. No change in behaviour; all tests pass untouched. This is tidying with a purpose, so keep each commit to one screen.

**U2. Three looks for Ben to choose from.** The look, colours and name are Ben's (`DECISIONS.md`, "Still Ben's to decide"). Build one static page, `design/look-options.html`, in the style of the existing `design/layout-examples.html`, showing the home screen and the chat in three treatments. Suggested three: **Paper** (today's earthy palette, cleaned up), **Quiet** (near-white, one accent, more space), **Card** (soft cards on a tinted background). Give a recommendation. Ben picks; record it.

**U3. The app frame.** Replace the five-button row with a fixed, small set of places:

- Phone: a bottom bar with four labelled items: **Today** (the next step, or the paste screen when there are no steps), **Chat**, **Calendar**, **Me** (profile, How I like to work, Settings).
- Wide screens: the same four as a slim bar at the top.
- The app's name moves into that bar; each screen keeps one heading.
- The work screen hides the bar while a step is in progress (one thing at a time) and keeps **Back to home**.
- This is a product choice, so offer Ben two or three arrangements with a recommendation before building. Keep accessible names stable where possible; where a name changes, update the tests on purpose and list the changes in the commit message.
- Leave room at the bottom for the iPhone's home indicator (`env(safe-area-inset-bottom)`), which costs nothing in a browser and is needed in the shell.

**U4. The chat screen.** Fills the screen: messages scroll, the message box and Send stay at the bottom, above the keyboard on a phone. One short line at the top says where messages go, with **More about this** for the rest. The kind of work is chosen once, then shown as a small label that can be tapped to change. Search and the helper choice sit in a small row by the message box. Sources sit inside the reply's bubble, under a thin line. **New chat** and **My chats** move to the top corner. Use the page's own scrolling rather than a box within the page.

**U5. Today (home, paste, steps).** With steps saved: the next step as one card with **Start this step**, and quiet links for the rest. Without: the paste box, the kind choice, and **Show my steps**, with the AI lines reduced to the one sentence T8 requires and a **More about this** disclosure. The helper pull-down moves into that disclosure.

**U6. Work screen.** The step is the largest thing on screen. **Done** is the main button. Still working, Stuck, Drifted and Later are ordinary buttons in a steady two-by-two grid so they never reflow. Honesty stays equal (rule 6): Drifted must not look lesser than Done in its reward, and should not be hidden behind a menu.

**U7. Calendar, profile, settings.** Calendar: show only the groups that have something in them; one calm empty line otherwise; colours from named values that follow dark mode. Settings: a clear "Step 2 of 4" line with the question as the heading; helper cards using the shared card style. Profile: shared field and card styles.

**U8. A final pass.** Screenshots of every screen at both widths in light and dark, reviewed by the agent and by the advisor agent defined in `.claude/agents/advisor.md`. Keyboard-only walk through every screen. Then Ben tries it on a real phone (never done so far, per `PROGRESS.md`).

Order within the phase: U1, U2, U3, then U4 to U7 one screen per session, then U8. U4 and C2 touch the same file (`js/screens/chat.js`); do U4 first.

---

## 8. Decisions needed before work starts

Agents: ask these in plain words, with a recommendation, and record the answers in the change log.

### Parent

| # | Decision | Recommendation |
|---|---|---|
| 1 | ~~Allow a small Swift shell~~ Replaced by: go ahead with a native Swift app in `ios/` (`ios/DECISIONS.md` D1). Still waiting on the parent | Yes |
| 2 | ~~Paid Apple developer account~~ **Answered 2026-11-20:** the parent has one and Ben may publish through it. Still open: TestFlight for the beta group only, or the public App Store as well | TestFlight only for now |
| 3 | Confirm the draft T8 rows already waiting (chat sends the conversation and the guide; OpenRouter search) | Needed before classmates use either |
| 4 | New T8 rows: the step's text in a chat (C3); look-up words sent to Wikipedia (S2) | Yes; both are the student's own typed words, sent only when they act |
| 5 | On-device AI: nothing leaves the device. Apple's Private Cloud Compute model stays off | Yes to on-device; keep the cloud model off |
| 6 | Whether the two outer copies of the knowledge files can be replaced by a pointer (G2) | Yes |
| 7 | Installing Playwright's browser on this Mac (a download outside the project folder) | Yes; otherwise tests run through installed Chrome |

### Ben

| # | Decision | Options |
|---|---|---|
| 1 | The look (U2) | Paper, Quiet, Card. Recommendation: Quiet |
| 2 | Where things live (U3) | Four places at the bottom; or three with Calendar under Today; or today's row, tidied. Recommendation: four places |
| 3 | Where the recall question, save to file, and weekly goal sit relative to this roadmap | Before phase S; or after the beta. Recommendation: the recall question before phase S, because it has the stronger evidence |
| 4 | Which phone he has, and whether Apple Intelligence is on | Needed for N0 |
| 5 | Still open from before: the app's name (rule 8: "Focus" can read as a claim about attention), words for drifting and stuck | His choice |

---

## 9. Rules that these features press on hardest

A short reminder for whoever builds each phase. The full list is in `AGENTS.md`.

- **Rule 1, hints never answers.** Chat, search, and a small on-device model all raise the risk. The gate is the same every time: the five answer-giving checks, recorded, before anyone but Ben uses the feature (G4).
- **Rule 4 and T8, what leaves the device.** Each new thing that leaves (step text, look-up words, search words) gets its own T8 row and one plain line on screen at the moment it happens.
- **Rule 6, honesty rewarded equally.** The redesign must not make Done look like the right answer and Drifted the lesser one.
- **Rule 8, no claims.** The app's name, the store listing if there ever is one, and Ben's write-up use the supported wording in `00-knowledge-summary.md` section 6. "AI on your iPhone" is a description, not a claim about attention.
- **Rule 11, not a counselor.** Streaming (C2) and Apple's guardrails (N3) both change how the trusted-adult check works. Each has a test written first.
- **T1 and T2.** No framework, no npm package, and no third-party script inside the shipped app, including model runtimes and icon sets.

---

## 10. Sources checked for this roadmap

| Claim | Source | How much was read |
|---|---|---|
| OpenRouter web plugin and `:online` are deprecated; the `openrouter:web_search` tool, its parameters and prices | https://openrouter.ai/docs/guides/features/server-tools/web-search | Page read in part: overview, parameters table, pricing, migration section |
| `openrouter:web_fetch` exists, with domain limits and a free OpenRouter engine | https://openrouter.ai/blog/announcements/agentic-web-tools/ | Summary of the page only |
| Wikipedia search and summary can be called from any web page | Three live requests, 2026-11-20 | Response headers and the start of each reply |
| Apple's on-device model: sessions, streaming, tools, availability reasons, context size and token counting, error kinds, Private Cloud Compute model in iOS 27 | `FoundationModels.framework` interface file in the iOS 27.2 kit, Xcode 27.2, on this Mac | Declarations only (names and availability). Apple's written documentation was not readable from here, so behaviour, device list, context size and age rules are unverified |
| Models in a web page on iPhone: about 400 MB limit, poor answers, tabs closed | https://nearform.com/digital-community/web-ai-runtimes-five-ways-to-run-a-language-model-in-the-browser/ and https://github.com/mlc-ai/web-llm/issues/753 | Article read in the passages about iOS and Chrome's built-in AI; one phone tested by its authors. Issue read at title and first paragraph |

Not checked, and needed before the items that depend on them: which iPhones and iPads are eligible for Apple Intelligence; Apple Intelligence on child accounts; the developer program price and age rule; whether OpenRouter's search tool works on `/chat/completions` and with free models; whether PolyStrata streams; how `localStorage`, IndexedDB and `crypto.subtle` behave under a private address in a web view.
