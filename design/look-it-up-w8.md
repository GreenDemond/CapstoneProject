# W8: Look it up (Wikipedia)

Status: built, **switched off** (`LOOKUP_ENABLED = false` in `js/lookup-config.js`) until the parent confirms the T8 row in `DECISIONS.md`. Browser tests were written but **not run** (Chrome aborts on launch in the build sandbox). Nothing was checked against the real Wikipedia (no network there); tests use a stub.

The parent pre-approved the whole web-parity plan ("go do it all"). The student-visible wording below still awaits the parent's okay (W-D5).

iPhone idea (read only): `ios/design/slices/T08-look-it-up.md`.

## What the student sees and does

1. On home, a **Look it up** button (hidden while the switch is off). On the work screen, the Stuck sheet also has **Look it up**.
2. The screen says "Your words go to Wikipedia." before any search, and "This shows what Wikipedia says. It does not write your answer for you."
3. The student types a few words (up to 100 characters) and taps **Search Wikipedia** (or presses Enter).
4. Up to three results appear: the page title, a short plain-text intro, and **Read it on Wikipedia** (opens the page in a new tab). A line says the text is from Wikipedia under CC BY-SA.
5. **Back to home** (or **Back to the step** from the Stuck sheet) leaves. A search in progress is cancelled.

## Research support

Design judgment, to be tested. A reference lookup keeps the student's own thinking in charge; it is not an AI and does not write answers (AGENTS.md rule 1 is about AI that gives answers; this shows a public encyclopedia's own words, and the screen says so). No ADHD claim is made (rule 8).

## What leaves the device (T8)

Only the typed search words, to `https://en.wikipedia.org/w/api.php` (GET, `origin=*`, no cookies, no referrer, 8 second limit). No assignment text, steps, profile, or identifier. Wikipedia sees the student's IP address and browser, as any website does. Nothing from the search is saved on the device. Draft T8 row is in `DECISIONS.md`.

CORS: the MediaWiki Action API accepts anonymous browser requests from any origin when `origin=*` is in the address ([API:Cross-site requests](https://www.mediawiki.org/wiki/API:Cross-site_requests)). Checked in the documentation only, not live. The page rule in `index.html` already allows `connect-src https:`, so no change was needed there.

## Safety of what comes back

- The reply is parsed by `js/logic/lookup.js`. Only `title`, `extract` and `index` are read, with `Object.hasOwn`, from an array of pages. Anything else is ignored.
- The link is built by the app as `https://en.wikipedia.org/wiki/` plus the encoded title. No address from the reply is ever used.
- Text goes on screen with `textContent`; tags are also stripped from the intro; lengths are limited (title 200, intro 400, reply 200,000 characters).

## Awkward cases

Empty box: asks for words, sends nothing. Very long text: cut to 100. No matches, offline, timeout, HTTP error, invalid JSON, odd shape: a calm message and nothing else. Double tap: the second tap is ignored while a search runs. Leaving mid-search: cancelled, nothing shows later. Refresh: back to home; nothing saved. Switch off: no button and no code wired up.

## Student-visible wording (awaiting the parent's okay)

Look it up; Your words go to Wikipedia.; This shows what Wikipedia says. It does not write your answer for you.; What do you want to look up?; Search Wikipedia; Looking...; Here is what Wikipedia says.; Read it on Wikipedia; Text from Wikipedia, shared under CC BY-SA.; Type a few words to look up.; Wikipedia has nothing for those words. Try different words.; That didn't work. Check your internet and try again.; Back to home; Back to the step.

No line shames, counts, or claims a benefit.

## Review checklist (AGENTS.md Stage 1)

- Breaks a rule 1 to 11? No. Rule 4 and T8 are touched on purpose: this is the T8 change, gated by the switch.
- Conflicts with `DECISIONS.md`? Only T8, which is why it ships off with a draft row.
- A trap in `05-adhd-ideation.md`? Not listed.
- Does the student do the thinking? Yes, they choose the words and read the source.
- Seconds to use, one thing on screen? Yes.
- Small enough for one session? Yes.

## How to turn it on (parent)

After confirming the T8 row: in `js/lookup-config.js` change `false` to `true`, run `npm run check`, then put the app online again. `tests/logic/lookup.test.js` has a test that fails if the switch is `true`; change that test at the same time and record the date in the `DECISIONS.md` log.

## Tests

`tests/logic/lookup.test.js` (parsing, hostile shapes, fetch failures, timeout, cancel) and `tests/browser/lookup.spec.js` (switch off; switch on through a stubbed config file; stubbed Wikipedia). **The browser spec has not been run.**
