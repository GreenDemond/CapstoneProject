# AI endpoints: choose from a list, add more

Status: **design, waiting for Ben's go-ahead and a decision on who adds endpoints (see Questions).** Nothing is built. This extends `design/ai-path.md` (built and switched off).

## What Ben asked for

Use a standard, OpenAI-compatible chat API. The student can have more than one AI endpoint saved, pick one, and add more later.

## The conflict to settle first

T6 says the key never reaches the browser, and the AI key is a parent action. "Users provide their own endpoint and key" would put keys in the browser and hand key handling to students. That breaks T6 and rule 9, so it is not built.

The version that fits the rules: **keys stay on the server; the list of endpoints is set by the parent (or Ben, as the builder), and students choose from it.**

## What the student sees

1. On the paste screen, under the AI button, a small "Which AI?" choice with the endpoint names, for example "Quick (small model)" and "Careful (larger model)". The first one is selected by default.
2. The choice is remembered on that device (a single name, nothing private).
3. If no endpoints are set up, or the server is off, the choice is hidden and the app uses the no-AI steps (as now).
4. The privacy line stays and names the chosen service: "This text is sent to [name] to suggest steps. Don't paste your name or anything private."

## What the server holds

One file, `server/endpoints.js`, with a list. Each entry:

- `id`: short name used in requests, for example `quick`
- `label`: what the student sees
- `url`: the chat completions address, for example OpenRouter's
- `model`: pinned by name (checked against the provider's current list when added)
- `keyEnv`: the **name** of the environment variable holding the key, for example `OPENROUTER_API_KEY`. The key itself is never in this file.

Rules for the list:

- Only https addresses. The student never types an address, so the server can only call addresses in this list (no open proxy).
- Each entry must have its key set, or it is left out of what students see.
- Each entry must meet T6: zero-retention or safety-retention provider only. Checked by the parent when the entry is added, recorded in the change log.
- The same server rules as now apply to every endpoint: hints-only instructions, child-safety line, 6,000 character limit, requests per hour per visitor, same-origin check, no logging.

## "Add more"

- **Students** can choose among endpoints. They cannot add one (no URLs, no keys in the app).
- **The parent or Ben** adds an entry to `server/endpoints.js` and sets its key as a host secret. This is the same kind of step as today's key setup, so it stays with an adult (T6, T7).

## How it works

- `GET /api/suggest` returns `{ available, endpoints: [{ id, label }] }`. No URLs, no keys, no model names are sent to the browser.
- `POST /api/suggest` takes `{ text, kind, endpointId }`. An unknown or missing `endpointId` uses the first endpoint in the list; the request is not rejected for a typo.
- The request format is the standard chat completions shape (messages, max_tokens), so any provider that speaks it can be added by changing the list.
- `js/ai.js` gets the list once, stores the chosen id, and sends it with each request.

## Tests (before it is switched on)

- Logic: an unknown `endpointId` falls back to the first; a list entry without its key is left out of the GET response; no URL or key appears in any response (test by searching the response text); an endpoint not in the list is never called.
- Browser: with no endpoints set, the choice is hidden and the no-AI path works; with two endpoints, the choice shows both labels and the chosen one is remembered after a reload.
- Answer-giving attempts: the five attempts in `design/ai-path.md` run against **each** endpoint, with the results recorded there.
- The no-AI path and the current checks must not change, except for new tests.

## Open risks

- Each endpoint's data policy differs. Adding one is a parent decision, not a code change.
- Two endpoints mean two bills. The per-visitor limit is per endpoint call, and a spending cap is set on each key.
- A mistake in `server/endpoints.js` could send text to the wrong place. The list is short, reviewed by the parent, and recorded in DECISIONS.md.

## Update: Ben's direction (2026-11-17)

- Ben wants **students to bring their own endpoint and key**, so the app can be shared with others. Ben will add his own key from his parents as they give it to him.
- Labels may be model names for OpenRouter. Locally, the labels are shown as they are.

**Conflict, not built.** Students bringing their own key means:

- the key is typed into the app and stored on the student's device, so it reaches the browser (T6 says it never does);
- a student would create an account and spend money, which AGENTS.md lists as a parent action;
- the student would be handling a key, which the agent never does.

So this needs a parent decision (added to DECISIONS "still the parent's to decide"). Until then, the design stays as above: keys on the server, set by Ben or a parent.

**Options for the parent to choose between:**

1. **Parent sets keys on the server (current design).** Students choose labels only. Sharing with others needs each school setup to have a server with keys, so it is a hosted app run by the parent (T7).
2. **Each student runs the app on their own computer** with their own key in a local settings file. The key never reaches the browser. Sharing means students install Node and run one command, which is hard for them (T14 is about Ben, but the same concern applies).
3. **Students enter their own key in the app** (T6 changed). Key stored on the device, sent only to the chosen service. Needs a change to T6 and a stated privacy and safety review before any classmate uses it.

**Recommendation:** option 1 for the beta. Option 3 only after a parent approves changing T6.

## Questions for Ben

1. Which option does the parent prefer (1, 2, or 3)?
2. Labels: OpenRouter model names as labels are fine. Should students see the model name or a friendly label?
3. "Local we'll see": does this mean endpoints on the student's own computer (for example a local model), or just running the app locally for testing?

## Parent decision: keys in the student's browser (Ben's intent, 2026-11-17)

Ben's intent: each student enters their own key, and the app stores it in the student's browser. This changes T6 and needs the parent's written approval before it is built.

**What "secure storage" can mean in a browser.** Web pages have no true secure storage. The options:

- **Plain browser storage (localStorage):** easy, but the key is readable by any script on the page and by anyone at that browser. Not recommended.
- **Encrypted with a non-extractable browser key (recommended):** the app creates a key inside the browser that the page can use to encrypt and decrypt, but cannot read out. The encrypted copy is kept in the browser's database. This stops casual copying, for example from a file or by someone looking at storage, but not a malicious script running on the page. The page's security rules block scripts from other sites, which limits that risk.

**Mitigations, to be built if approved:**

- Key shown masked; "Forget this key" removes it at once.
- Sent only to the endpoint the student chose; the page's security rules allow only those addresses.
- The app tells the student to set a spending cap on the key before adding it, and warns not to use shared computers.
- Keys are never written to the log, the server, or the shared settings.
- Each endpoint must be zero-retention or safety-retention (T6).

**What the parent is asked to approve:** (a) students hold their own AI keys in the browser, encrypted as above; (b) the page may connect to the AI service the student picks; (c) the spending-cap and shared-computer warnings. Ben does not run the key setup for students.

## Decided by the parent (2026-11-17, in chat)

Parent (Ben's dad) approved items 1 to 3 above, and decided who pays:

- **Ben's endpoints run on the parent's bill.** Ben's key is held on the server, never in the browser, and set by the parent. It works only when the app runs on Ben's own computer (local testing). It is not offered in any shared or hosted copy, so classmates cannot use the parent's bill.
- **Classmates pay with their own keys** (their own parents or their own accounts). Their keys are kept in their own browser, encrypted as above. Their requests go straight from their browser to the service they chose. The app then needs no server function for them.
- **Spending caps:** the parent sets a cap on the parent's key. Each student sets a cap on their own key.
- Still needed before any classmate uses the app: teacher approval and written parent permission (DECISIONS T8).

Build split, in order:

1. Endpoint list with labels, the "Which AI?" choice, and no-AI fallback (tests).
2. Browser key storage for classmates: encrypt, mask, forget (tests).
3. Direct browser calls to the chosen service, with the security rules updated (tests, five answer-giving attempts per endpoint).
4. Ben's server endpoint on the parent's key, local only (tests).

## Settings: register an AI (requested 2026-11-17)

**What the student sees.** A "Settings" button on the home screen opens an AI section:

1. **Add an AI service**: pick "OpenRouter" (address and settings filled in) or "Other service that works like OpenRouter" (type an address).
2. Type the **API key**. It shows as dots; a "Show" tick box is available. It is saved encrypted in the browser (step 2 of the build).
3. **Name it** (for example "Home AI" or "OpenRouter, small model"). The name is the label shown on the paste screen.
4. "**Test it**" sends one harmless message and says "Connected" or what went wrong, in plain words. The key is never shown in the message.
5. "**Forget this key**" and "**Remove this service**" buttons. Keys are never written to the log.

The list of saved services is shown with the chosen one marked. The paste screen's "Which AI?" uses the same list.

**Points that need a decision before this is built:**

- **Plain http addresses.** The example `http://my-computer.example.ts.net:8080/` is not https. Over Tailscale the traffic is encrypted by Tailscale, but the address itself is still plain http, and a key sent to it is unencrypted outside the tailnet. Proposed rule: https is accepted anywhere; http is accepted only for a Tailscale address (`*.ts.net`) or localhost, with a warning shown. **Parent to decide.**
- **Security rules.** The page can only call addresses it is allowed to call. A student-typed address can't be listed in advance, so the page's rules would have to allow any https address (and http for Tailscale/localhost). That is wider than today's "self only". The app will still send text only to the service the student saved. **Parent to decide.**
- **Ben's key and the parent's bill.** The parent's decision was that Ben's key stays on the server and is never in the browser. Registering it through the settings screen puts it in the browser on Ben's own computer. Options: (a) Ben's key is entered in the settings screen, local only, on the parent's bill; (b) Ben's key stays in a server settings file as decided. **Parent to decide.**
- **Remote endpoints need CORS.** A custom service must answer the browser's cross-site request for the app's address (send the header that allows it). OpenRouter already does. Ben's Tailscale server must be checked for this before the test works.

**Tests (when built):** a bad address is rejected; a plain http address outside Tailscale or localhost is rejected; the key never appears in the page text or in the log; "Test it" with a bad key shows the friendly message; a removed service no longer appears on the paste screen; a reload keeps the saved services.

## Decided by Ben (2026-11-17): accept http or https

- The settings screen accepts either `http://` or `https://` addresses.
- When an address is `http://`, a warning is shown under it, in plain words: "This address is not encrypted. Anyone on the network path can read your key and your text. Use https if you can." The warning stays until the student saves it or changes the address to https.
- Nothing else changes: the key is still encrypted in the browser, the key is never written to the log, and the text goes only to the service the student saved.
- **Parent to note:** this is a weaker setting than https-only. It is Ben's choice for his own server, and the warning is the safeguard for classmates. If the parent wants https-only for classmates, the rule is a single check to add.
