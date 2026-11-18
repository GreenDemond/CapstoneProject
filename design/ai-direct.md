# AI step 3: calling the chosen service from the browser

Status: **built.** The app calls the AI service the student chose, directly from the browser. The parent approved the page rule on 2026-11-17 (DECISIONS.md change log).

Builds on `design/ai-endpoints.md` (parent decision 2026-11-17: students bring their own keys, kept encrypted in their browser; Ben's own endpoints run on the parent's bill, local only).

## What the student sees

1. **Settings, add a service.** Name, address (the full chat-completions address, not a base address; http or https; http shows the warning), **model name**, and a key. The model name is typed by the student or Ben from the service's own list. **No model name is hard-coded or suggested anywhere, including in example text.** A shortcut button fills in the OpenRouter address only. Any other service (for example DeepSeek) is added the same way.
2. **Before a key is saved**, Settings shows: "Set a spending limit on this key first. Don't save a key on a shared computer. In your AI account, turn off any setting that lets providers keep or train on your text."
3. **Test it.** Shown beside each service that has a key. Sends one tiny message ("Reply with the word ok.") and uses a small amount of the service's credit. "Connected" means the service sent back any text. It does not mean the service is safe or keeps no data. Failure gives one plain line. Test and Suggest are disabled while a request is running.
4. **Paste screen.** The Suggest button appears only when the chosen service has a key saved. Its privacy line names the service: "This text is sent to the AI service [name] to suggest steps. Don't paste your name or anything private."
5. **Suggest steps.** Text and kind go straight from this browser to the chosen service. Results are labelled "Suggested by an AI ([name])". The 6,000-character limit applies before sending. At most 5 steps are shown, each cut to 200 characters, all shown as plain text. If the call fails, one plain line says why and the starter steps appear instead.

## Services with and without a key (decided here)

A service is **ready only when it has a key**. A tick box "This service needs no key" is offered for services such as a local server; if ticked, the service is ready without one. Test, the paste screen, and the status line follow the same rule. **Open question 2.**

## What is sent, and where

- Only the pasted assignment text and the kind of work, and only on Suggest. The kind is sent so the steps fit the work; this is the only addition to what T8 names, and T8 is updated to say so.
- Test sends only its fixed line.
- Sent to the one service the student chose, and nowhere else. The key goes only in the authorisation header to that service. Requests carry no cookies and no referrer.
- Never sent to the app's server, never logged, never written to the shared settings.

## Page security rule: needs the parent's decision first

Proposed: `connect-src 'self' https: http://localhost:* http://127.0.0.1:* http://*.ts.net:*`. That is any https address, plus plain http only for this computer and Tailscale. It is narrower than `http:` and is the version proposed to the parent. It is **not** yet approved. Ben's decision to accept http addresses (2026-11-17) is separate from this rule.

Recorded here so it is not missed: if the app is ever served over https (T7), browsers block calls to plain http addresses as mixed content. So plain-http services work only when the app runs on this computer. Unverified; confirm with a browser test before relying on it.

The parent must also know what the browser path loses compared with the server path: the hints-only instructions sit in the student's own browser and could be changed by that student, and there is no per-hour request limit. This is acceptable because it is the student's own key and bill, but it must be recorded in DECISIONS.md.

## Failure cases

Failure lines are fixed text. They never include the service's reply, error details, the address, the key, or the pasted text. Nothing is written to the browser's developer log. A test searches the page after each failure for the key and the pasted text.

- No key, or the key cannot be read: "The key couldn't be read. Forget it and save it again." No call is made.
- Address unreachable, blocked, or CORS refused: "Couldn't reach the service. Check the address and your connection. (Some services must be set up to allow this app.)"
- 401 or 403: "The service didn't accept the key. Check it in Settings."
- 400 or 404: "The service didn't accept the address or the model name. Check both in Settings."
- 402, 429, or 5xx: "The service is busy or out of credit right now. Try again later."
- No response in 20 seconds: treated as "couldn't reach". (Design judgment, to be tested.)
- Reply with no usable steps: "The service didn't suggest any steps."
- Reply starting with TRUSTED_ADULT: the trusted-adult line, no steps (rule 11).
- In every failure case the starter steps are used, with the reason in one line.

## Saved services from before this change

Services saved without a model name are **kept**, shown as "Needs a model name," and cannot be used until one is typed. They are not dropped, and their saved keys are not orphaned.

## Data stored

No new stored data. Services keep name, address, model name, whether no key is needed, the last four key characters, and the chosen one. Keys stay as in step 2 (encrypted, IndexedDB).

## Shared rules

The hints-only rules, the child-safety line, and step parsing move into `js/logic/ai-prompt.js`, used by this browser path and by the server function, so they cannot drift. The server's behaviour must not change; this is checked by its existing tests.

## Build order (split, per the review)

1. **Piece A:** move the shared prompt file; the server is unchanged; tests for the prompt and reply reading. Nothing else.
2. **Piece B:** model name field, "needs no key" tick box, the direct call and failure lines, the page rule (only after the parent decides), the spending and shared-computer warning. Tests with stand-in responses.
3. **Piece C:** Test button and the paste-screen wiring.

## Required before classmates use it

- The five answer-giving attempts run against a real service, with results recorded here. Until then the AI path is for Ben's local testing only.
- DECISIONS.md updated: T6 gets a "student's own key (browser path)" paragraph, T8 mentions the kind of work, T11 gets the page rule, and T13 lists `js/ai-direct.js` and `js/logic/ai-prompt.js`.
- Teacher approval and written parent permission (T8).

## Tests

- Logic: prompt body contains the hints-only and child-safety rules and the kind; reply reader handles TRUSTED_ADULT, steps, empty, and non-text replies; each failure line; a service with no model name is kept but not ready; the model name is required unless a service is saved from before this change.
- Browser, with stand-in responses at a test address: add a service with key and model, Test shows "Connected"; Suggest shows steps labelled "Suggested by an AI"; a rejected key shows its line and the starter steps; the key and the pasted text do not appear on the page after a failure; the Suggest button is hidden with no ready service; the privacy line names the service; a double click sends one request.

## Open questions

1. **Page rule (parent):** approve the narrow rule above, or the wider `http:`?
2. **Key:** is a key always required (simpler), or may a service be marked "needs no key" (for a local server)? Recommended: allow the tick box.
3. **Ben's parent-billed key:** may it be typed into Settings on Ben's own computer, or does it stay on the server as first decided? Recommended: server, until the parent chooses.
4. **Shortcut button:** fill in only the address (current design)?

## Decisions by Ben (2026-11-17), applied

- **Page rule:** `connect-src 'self' https: http:`, so plain http is allowed from any address, as Ben asked. This widens the rule the parent decides. **Parent confirmed in chat (2026-11-17), recorded in DECISIONS.md.** The narrower rule above is the fallback.
- **Keys:** every service needs a key to be saved. For a server that doesn't check keys, any text is accepted and ignored. The "needs no key" tick box is removed.
- **Ben's parent-billed key:** typed into Settings on Ben's own computer only. The shared app never offers it, because keys live only in each browser.
- **Shortcut button:** removed. Address and model name are typed in full. Ben does not test through Settings; testing is done with stand-in responses.
- A service is ready only when it has a key and a model name.

## Change (2026-11-17, Ben): Show my steps uses the AI helper

Ben asked for Show my steps to "do something meaningful". With a ready AI helper, **Show my steps now asks the helper for steps fitted to the assignment**, and falls back to the built-in steps if it fails. The separate "Suggest steps with AI" button is gone.

- A tick box, "Use [helper] to suggest steps", sits above the button, ticked by default, with the privacy line: "If this is ticked, pressing Show my steps sends this text to the AI service [name (host)] ... Don't paste your name or anything private."
- The line at the top of the screen stays true: "This stays on your device" changes to "...except when you use the AI helper below" while the box is ticked and a helper is ready.
- Unticking sends nothing and gives the built-in steps. With no ready helper, the box and notice are not shown.
- The text is sent only when the student presses Show my steps, as before (DECISIONS T8).

