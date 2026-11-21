# T08 Look it up
Status: built 2026-11-20 (compile-checked; UI test not run; no search was run from this Mac)

## What the student sees and does
1. Look it up is reached from the Talk tab, and from Stuck (the box already holds the step's key words; the student can change them).
2. Before the first search the screen says: "The words you search for are sent to Wikipedia. Nothing else is sent."
3. Tapping **Search** (or the keyboard's search key) shows up to five pages: a title and one plain line each. Nothing is sent until then.
4. Tapping a result opens the page in the system's in-app Safari view, with a bar above it: **Back to my step** (from Stuck, which also closes the Stuck sheet) or **Back to results**.
5. Calm lines for: no words typed, no results, offline ("You're offline. Try again later."), a slow answer, and any other trouble. None is an error screen.

## Research link
`design/03` 3.6 to 3.8; `DECISIONS.md` D8 row 1 (draft); `research/06` A5.

## What it stores
Nothing.

## What leaves the phone
The look-up words (cleaned, at most 200 characters) go to `en.wikipedia.org` over https when Search is tapped, with a descriptive `User-Agent` and no cookies or account. Opening a result is an ordinary visit to that page. D8 rows 1 and 3. A test proves that only `WikipediaLookUp.swift` mentions `URLSession` or builds a request (searches `FocusKit/Sources` and `App`).

## Switched on
`LookUpModel.isOn` is true. D8 is still a draft until the parent confirms the first row; set it to false to switch the feature off everywhere (the screen then says so).

## Wikipedia check (2026-11-20)
- This Mac's shell has no network (DNS fails), so no search was made from it. The two addresses were checked with a web fetch tool instead:
  - `https://en.wikipedia.org/w/rest.php/v1/search/page?q=courage&limit=5`: answered, 5 results (Courage; Courage (disambiguation); Courage the Cowardly Dog; List of Courage the Cowardly Dog episodes; Courage Quashigah). Each has `key`, `title`, `excerpt` (with `<span class="searchmatch">` markup, which is stripped), `description`.
  - `https://en.wikipedia.org/api/rest_v1/page/summary/Courage`: answered. Not used (the search already gives one line).
  - The older `api.php` form was not tried.
- Etiquette: read the Wikimedia User-Agent Policy. It asks for a descriptive `User-Agent` of the form `<client name>/<version> (<contact information>)`; generic agents may be blocked. The app sends `FocusApp/0.1 (iOS homework helper for students; contact: set-by-owner@example.invalid)`. **The owner must put a real contact address or page in `WikipediaLookUp.userAgent` before anyone else uses the app.** Not read: the separate API Usage Guidelines page.
- **Still owed:** a real request from the app itself on a device (device checks step added).

## Distracted, stuck, back after a week
Leaving the screen cancels a search that has not answered; an answer that arrives late is ignored.

## Differs from the web app
Wikipedia search is new in the app.

## Tests
Logic (`LookUpTests`, 15) with a fake: results, none, offline, timeout (from the network and from a slow answer), trouble, empty words send nothing, markup and entities stripped, odd title characters, answer cut to five, leaving while loading, a newer search replaces an older one, the request's address, parameters and agent, key words from a step, and the one-file-opens-a-connection rule.
UI (`LookUpUITests`): the privacy line is shown before any search; empty words give a calm line. Written and compiled, not run.

## Unverified
The Safari view and its back bar on a device; the real network path (timeouts, offline); that Wikipedia accepts the placeholder contact in the User-Agent.

## Gates
No Advisor available; self-review only. Gate 2 owed (network; what leaves the phone).
