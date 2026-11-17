# DECISIONS.md

Decisions already made for this project, with reasons. Agents follow these without re-asking. A decision changes only when Ben or his parent says so; record the change here with the date and reason, and keep the old entry.

Entries marked **(parent)** need an adult to act, because they involve accounts, money, or other people's children.

Entries marked **(default)** are product choices made in advance so work can start. Ben can overrule any of them.

---

## Technical decisions

### T1. The app students use is plain HTML, CSS, and JavaScript. Node is used for everything around it.

- **Shipped app:** files run in the browser as written, using standard modules (`<script type="module">`). No framework and no build step.
- **Tooling:** Node and npm packages are fine for the local server, tests, code checks, and the server function. These are development dependencies only, with versions pinned in `package-lock.json`.
- **Why:** no one on the project can fix a broken build or an outdated framework, and each session's agent starts with no memory. An app with no build step cannot have a build failure. Tooling is different: it never reaches students, and good tests are the only review this project has.
- **Not allowed without a new decision:** React or any other framework, TypeScript, bundlers, CSS frameworks, or any npm package inside the shipped app.

### T2. No third-party code loaded in the browser.

- No CDN scripts, web fonts, analytics, or embedded widgets.
- **Why:** each one can break, track students, or change without notice.

### T3. Data lives in the browser's local storage. No accounts, no database.

- One storage key, `focusapp.v1`, holding one JSON object with a `schemaVersion` number.
- All reading and writing goes through one file, `js/storage.js`.
- If stored data is missing or damaged, the app starts fresh and keeps a copy of the damaged data under a backup key. It never crashes on bad data.
- **Why:** matches the privacy rules in the research, costs nothing, and removes the hardest part of the original plan.

### T4. No login or sync. Use export and import instead.

- A "Save my data to a file" button and a "Load my data from a file" button.
- **Why:** login means storing accounts for minors and a week of build time. Export and import covers moving between devices and gives beta testers a way to share data by choice.
- This replaces "login so sessions sync" in the original week 2 plan.

### T5. Version 1 makes no AI calls. The AI is an add-on, built second.

- Splitting an assignment has two paths behind one function, `suggestSteps(text, type)`:
  1. **No-AI path (built first, always present):** the student picks the kind of assignment (essay, reading, problem set, project, studying for a test). The app offers a starter list of steps for that kind, plus any numbered items or bullet points found in the pasted text. The student edits.
  2. **AI path (added later, off until a key exists):** the app asks the AI for suggested steps fitted to the pasted text. The student edits.
- "Stuck" works the same way: built-in strategy hints first ("re-read the instructions", "try the first small part"), AI hints later.
- If the AI path is off or fails, the app uses the no-AI path and says so in one friendly line.
- **What the AI adds:** steps fitted to a specific open-ended assignment, and hints about the actual content. Nothing else in the app needs it.
- **Why:** the build can start today with no accounts or cost, and the beta works even if the AI is down or out of credit. The research supports students doing the splitting themselves, and warns that AI doing the thinking can hurt learning.

### T6. If AI is added, it goes through OpenRouter, called from one small server function. The key never reaches the browser. (parent)

- **Provider:** OpenRouter, chosen by the parent. A Claude Pro subscription does not include API access, so the app's own AI calls need a separate paid key either way.
- **Model:** one small, low-cost model, pinned by name. Check OpenRouter's current model list when wiring it up; do not pick a model name from memory.
- **OpenRouter settings the parent must apply,** because its providers differ on keeping and training on inputs:
  - in account settings, turn off routing to providers that may train on data, for both paid and free models;
  - prefer an endpoint marked zero data retention, and pin the provider so requests are not routed elsewhere;
  - set a spending cap on the key.
- The browser calls the project's own endpoint, `/api/suggest`. That function holds the key as a server secret and calls OpenRouter.
- The function must:
  - keep the instructions to the AI on the server, including the hint-only rule, so a student cannot change them;
  - include child-safety instructions in those server-side instructions;
  - reject input over 6,000 characters;
  - limit each visitor to a small number of requests per hour;
  - accept requests only from the app's own web address;
  - never log or store assignment text.
- The app must say plainly that suggestions come from an AI, not a person, and have a privacy note stating what is sent and that the app stores none of it.
- The model provider's own rules on products used by minors also apply. Read them before classmates use the AI path.
- **Why a server function:** a key in browser code can be copied by anyone and run up a bill.
- **Switching later:** only `server/suggest.js` knows which provider is used. Changing provider means changing that one file and the key.
- **Parent action:** create the OpenRouter account as an adult (its terms require 18 or over), apply the settings above, and create the key. Agents never create or handle the key; it is set as a secret on the host.

### T7. Hosting is chosen and set up by the parent, outside this project. (parent)

- Agents do not choose a host, create hosting accounts, or deploy. When the app is ready to go online, say so and stop.
- What the host needs to provide:
  - serving a folder of static files over HTTPS;
  - for the AI path, running one small server function that can hold a secret.
- Keep the server function portable: one file using the standard web `Request` and `Response` objects, with the key read from an environment variable named `OPENROUTER_API_KEY`. Most hosts can run that with little change.
- If the host cannot run a function, the app still works on the no-AI path (T5).
- Until hosting is set up, the app runs locally with `npm start` and uses the no-AI path.

### T8. What leaves the device.

- Only the assignment text the student pastes, and only when the AI path is used. Nothing else: no name, no history, no check-in data.
- The paste screen says in plain words: "This text is sent to an AI service to suggest steps. Don't paste your name or anything private."
- **Why:** this is the one exception to "data stays on the device", so it is stated openly.

### T9. Git from the first line of code.

- The agent creates the repository and commits after every change that passes its checks, with a plain-language message.
- The `main` branch always works. Nothing is committed that fails tests.
- **Why:** Ben cannot undo a bad change by hand. Git history is the undo button.

### T10. Two layers of automated tests, run with one command.

- **Logic tests:** logic that does not touch the screen lives in `js/logic/` and is tested with Node's built-in test runner.
- **Browser tests:** Playwright opens the real app and clicks through it like a student, at phone width and desktop width. Every feature gets at least one browser test covering its main path and one awkward path.
- **Code checks:** ESLint with its recommended rules catches common mistakes.
- `npm run check` runs all three. It must pass before any commit.
- Written steps for a person also go in `tests/manual-checks.md`.
- **Why:** no reviewer reads the code, so tests are the only check that survives between sessions. Browser tests matter most, because they catch what Ben would otherwise find by accident.

### T14. Ben never runs a command or edits a file.

- The agent installs, starts, tests, and commits. Ben's part is using the app in a browser and saying what he sees.
- Three commands exist, and the agent runs them: `npm install` (set up), `npm start` (run the app locally and print its address), `npm run check` (all tests and checks).
- When Ben needs to try something, the agent starts the app and gives him the address to open.
- If a step ever seems to need Ben at a terminal, the agent finds another way or asks a parent.

### T11. Security basics.

- Text from the student or the AI is put on screen as text, never as HTML (`textContent`, not `innerHTML`).
- The pages set a Content Security Policy that allows only the app's own files and its own `/api/` endpoint.
- No secrets in the repository. A `.gitignore` excludes `.env` and `.dev.vars` from the first commit.

### T12. Works on a phone and with a keyboard.

- Layout fits a 360-pixel-wide screen. Every action works by keyboard. Buttons are real `<button>` elements with visible text.
- Honors the device's reduced-motion setting.
- **Why:** beta testers will use phones and school Chromebooks.

### T13. Folder layout.

```
index.html
css/styles.css
js/app.js            screen wiring
js/storage.js        the only file that touches local storage
js/ai.js             the only file that calls /api/suggest
js/logic/            pure logic, fully tested
server/suggest.js    server function (portable; wired to the host later)
tests/logic/         logic tests
tests/browser/       Playwright browser tests
tests/manual-checks.md
design/              one design note per feature
package.json         the three commands and the pinned tooling
```

---

## Product defaults

Chosen from the research and the idea files so that work can start. Ben can change any of them.

| # | Default | Source |
|---|---|---|
| P1 | The app suggests steps; the student must be able to edit, merge, reorder, and add steps before starting | `04`, idea D2 |
| P2 | The student picks how many steps to aim for: about 3, 5, or 8 | `05`, section 3 |
| P3 | The work screen shows one step at a time, with "step 3 of 7" | `04`, idea D3 |
| P4 | Finishing a step offers four buttons: Done, Still working, Stuck, Drifted | `04`, idea D4 |
| P5 | "Drifted" splits the current step in two and earns the same credit as "Done" | `05`, section 4 |
| P6 | "Stuck" gives a hint or a pointer to a resource, never the answer | `00`, section 2 |
| P7 | A weekly goal ("4 of 5 days"), not a streak that resets | `04`, idea G4 |
| P8 | After a day or more away, the app opens to one "pick up here" button and nothing about missed days | `05`, section 4 |
| P9 | After a study or reading step, one optional recall question: "One thing you just learned?" | `00`, section 2 |
| P10 | No sound by default | `00`, section 5 |

## Still Ben's to decide

These are his choices. Ask him; do not pick for him.

1. The name of the app.
2. How progress is shown: pet rock, quest map, or build-a-picture.
3. The words used for drifting, getting stuck, and coming back.
4. Colors and overall look.
5. Which features to cut if time runs short.

## Still the parent's to decide

1. Hosting: which service, and when (T7). Handled privately by the parent.
2. Whether to add the AI path at all, and if so, setting up the OpenRouter key (T6).
2. Whether classmates take part in the beta, with teacher approval and written parent permission.
   Ben now wants students to bring their own keys (T6 says keys never reach the browser). Options are in `design/ai-endpoints.md`. Not built until the parent chooses.
3. Whether the app is ever published beyond the beta group.

---

## Change log

| Date | Change | Reason | Decided by |
|---|---|---|---|
| 2026-11-16 | T1, T10 revised and T14 added: Node tooling, Playwright, and ESLint allowed; shipped app stays framework-free | Parent said Node and JavaScript are fine as long as Ben does not have to deal with them | Parent |
| 2026-11-16 | T5: version 1 makes no AI calls; assignment-type starter steps added to the no-AI path. T6: Anthropic chosen over OpenRouter, with reasons | Parent asked whether the app needs AI calls, and for a choice between Anthropic and OpenRouter | Parent asked; agent chose |
| 2026-11-16 | T6: AI provider set to Anthropic's Claude API; minors safeguards added. T7: hosting left to the parent; Cloudflare default removed | Parent said Ben has an Anthropic subscription and that hosting will be arranged privately | Parent |
| 2026-11-16 | T6: provider changed from Anthropic to OpenRouter; data and spending settings added | Parent chose OpenRouter after confirming a Pro subscription includes no API access | Parent |
| 2026-11-17 | T6: Ben, who says he is 18 or over, will create the OpenRouter account and key himself, starting with a free model to avoid cost. Free-model training must be blocked in account settings (the switch is separate from the paid one), and only a provider marked zero retention or safety retention may be used. Agents still never create accounts or handle the key | Ben asked to start the AI path at no cost; many free models run on providers that may train on prompts | Ben |
| 2026-11-17 | T6 changed for the beta: students bring their own AI key, kept encrypted in their own browser and sent only to the service they choose. Ben's own endpoints run on the parent's bill, held on the server and local only; they are never offered in a shared copy. Classmates still need teacher approval and written parent permission (T8) | Parent (Ben's dad) approved in chat, saying Ben uses the parent's bill and peers pay with their own | Parent |
| 2026-11-17 | AI step 3: the app calls the service the student chose, directly from the browser (design/ai-direct.md). Page rule widened to any https and any http address, as Ben asked; the parent must confirm this before classmates use it. Every service needs a key; no model name is suggested by the app. The kind of work is also sent (T8 updated) | Ben's answers after advisor review; parent's approval of the page rule still pending | Ben; parent to confirm |
| 2026-11-17 | Parent confirmed the wider page rule in chat, in these words: "I approve the wider page rule for the Focus app beta: any https address, and plain http, as described in design/ai-direct.md." This clears the open item for the beta. Classmates still need teacher approval and written parent permission (T8) | Parent (Ben's dad), in chat | Parent |
