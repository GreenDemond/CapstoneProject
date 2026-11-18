# Design: the iPhone app (a thin native shell around the web app)

Status: **draft for review, 2026-11-17. Not built.** Ben asked for the design to be laid out, documented and reviewed first; building is decided after. Would change DECISIONS T1 (not recorded until Ben says go).

## Why

The web app hits browser walls that an iPhone app does not have:

| Problem in the browser | In the iPhone app |
|---|---|
| Every AI or search server must allow the app's page (CORS: `cors_origins` on PolyStrata; SearXNG may need a proxy) | The app talks to any server directly. No CORS settings. |
| The AI can see search snippets only; reading a whole web page is blocked | The app can fetch a page and give the AI its plain text, as pi does. |
| AI keys are encrypted in browser storage | Keys live in the iPhone Keychain. |
| No reminders when the app is closed without a push server | Local notifications on the phone, no server (later slice). |
| About 5 MB of storage | Plenty (the web app's storage still works the same). |

What it does **not** solve: sharing with classmates still needs TestFlight or the App Store, which needs a paid Apple developer account (about $99 a year, a money decision for Ben and a parent). With a free Apple ID the app runs on Ben's own iPhone (re-installed every 7 days) and in the simulator. SearXNG still runs on another machine (next to PolyStrata). The web version keeps working for everyone else.

## Shape: a shell, not a rewrite

- The screens are the existing web app, unchanged, bundled inside the app and shown in a full-screen web view (WKWebView).
- The files are served to the web view through a private address (`focusapp://app/`) by the app itself, so modules, storage, and the page's security rules work as they do on the web.
- A small **bridge** lets the web app ask the native side for four things, and only these:
  1. `request`: send an HTTP request (method, URL, headers, body, timeout) and return status and text. Used for AI helpers and search. No cookies. Redirects are refused (same rule as the web app). Only `https:` and `http:`.
  2. `readPage`: fetch a web page and return its title and plain text (scripts and styles removed, cut to 20,000 characters). Used only by the AI's `read_page` tool.
  3. `keychain`: get, set, delete a secret by name. Used for AI keys instead of the browser's encrypted store.
  4. (later slice) `notify`: schedule or cancel a local reminder.
- The web app checks once whether the bridge exists (`js/native.js`). In a browser it is absent and everything works exactly as today.
- Native code is Swift and SwiftUI, small, in `ios/`. It contains no app logic: no screens, no prompts, no rules. Rules stay in the shared JavaScript, so the web and iPhone versions can never disagree.

## Web search (both versions; detail in `design/web-search.md`)

- The chat offers the model a `web_search(query)` tool; in the iPhone app also `read_page(url)`. The model decides when; at most 2 searches and 2 page reads per message. Each one is shown on screen ("Searching the web for: …", "Reading: <site>").
- Who searches is a setting: **SearXNG** (address of your own SearXNG, SafeSearch strict) or **OpenRouter search** (uses the OpenRouter helper's key; about $0.007 per search).
- Off by default ("Let the AI search the web", per helper). Sources are shown as links taken from the real search results.

## What data it stores

- Same as the web app (localStorage inside the app). AI keys in the Keychain (in the app; the browser keeps its encrypted store). Nothing else.

## Rules

- Rule 1: search makes finished answers easier to find; the rules are repeated after every tool result, and the answer-giving checks are re-run with search on. Rule 4: nothing new is stored off the device; searches go to the chosen search service (T8 row, parent to confirm before classmates). Rule 9: no secrets in code; keys only in the Keychain.

## Build and test

- `ios/` holds the Xcode project. A build step copies `index.html`, `js/`, `css/` into the app (the web app itself still has no build step).
- Checks: `xcodebuild` builds for the simulator; Swift unit tests for the bridge (request, refusal of redirects and other schemes, page-text extraction, keychain round trip); a run in the simulator with a screenshot. The web side keeps `npm run check`, plus browser tests with a fake bridge.

## Slices

1. Web side: `js/native.js` + one request function used by every AI call; keys through the bridge when present. Tests with a fake bridge.
2. iPhone shell: project, web view, private address, bridge (request, keychain). Builds and runs in the simulator.
3. Web search in the chat (SearXNG and OpenRouter search), `read_page` when the bridge is present; native `readPage`. Tests.
4. Later: local reminders; app icon and name (Ben).

## Checklist (AGENTS.md stage 1)

- [x] Breaks no rule; rule 1 risk named, checks required before classmates.
- [ ] DECISIONS: T1 would change (a native shell; the web app itself stays plain, with no build step). To record when Ben says go. T8 row for search.
- [x] Not a trap.
- [x] The student does the thinking (search gives sources, hints only).
- [x] One thing on screen (same screens).
- [x] Split into slices.
