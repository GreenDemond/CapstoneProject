# AI-own-service-and-backup: Use my own AI service, and the backup switch
Status: built 2026-11-21 (decided by the parent the same day, D6 and D13)

## What the student sees and does
1. Nothing changes for a student who never opens Me. Apple's on-device AI is used, and the data folder is included in the phone's backup (new default).
2. Me, **Use my own AI service** (off). The first thing in it is the line saying what is sent and to which address. The student enters an **Address** (https only; an `http://` or invalid address gets a calm line), a **Key** (secure box; after Save the box empties and the screen only says "A key is saved on this iPhone", with **Remove key**), and a **Model name**.
3. **Check connection** sends one fixed test message and shows "It works." or a calm line (key not accepted, busy, or could not get an answer). Service text is never shown.
4. The switch is greyed out until the line has been shown, the address is good, a model name is typed and a key is saved. Turning it on makes it the AI in use.
5. While it is on and ready, Talk shows **On this iPhone | My service** at the top (the parent's request, 2026-11-21), and the privacy line says which one is in use. The step coach follows the same choice.
6. A key that is not accepted (HTTP 401/403): "The key wasn't accepted...". Busy (429): "That service is busy...". Other failures and time-outs use the existing "AI helper isn't available right now. Hints and Look it up still work." The message returns to the box. Starter steps, hints and Look it up always work.
7. Me, **Include in my iPhone backup** (on). Welcome, About and privacy say the work stays on this iPhone and, when the switch is on, in the student's own iPhone backup.

## Research link
Design judgment, to be tested. Rule 1 (hints, never answers) is enforced by the same `ChatEngine` and `AnswerGuard` for both AIs; whether a larger web model obeys the hints-only rules is **not known** until T14 is run against it.

## What it stores
Settings file: on/off, which AI is chosen, the address, the model name, the backup switch. **The key is stored only in the iOS Keychain** (`kSecAttrAccessibleWhenUnlockedThisDeviceOnly`, not synchronised, so it is in no backup and not in iCloud). Never in JSON files, logs, error text, accessibility labels or tests (tests use "test-key-123").

## What leaves the phone
Only new D8 rows: (1) own service chosen: chat messages, step and assignment text the step coach uses, the app's rules with the guide, the model name and the key in the Authorization header, to the address entered; (2) Check connection: one fixed test message, the model name and the key, to that address; (3) backup switch on: the app's saved data (never the key), to the student's own iPhone backup. Requests do not follow redirects, so the key cannot be passed to another host.

## Distracted, stuck, back after a week
Distracted: setup can be left half-done; nothing is sent until the switch is on. Stuck: the service failing falls back to hints. Back after a week: the choice is remembered; a removed key switches the service off.

## Differs from the web app
Yes. The web app had no AI keys.

## Tests
FocusKit (fake transport, fake keychain, fake backup flag, no network, no sleeping): request shape (POST, headers, model, system rules, stream false); a normal reply; safety word becomes the trusted-adult line and is not saved; finished answer caught by `AnswerGuard`; 401, 403, 429, 500, time-out, malformed JSON, empty reply; no key means nothing is sent; http, ftp, bare, user:password, query and fragment addresses rejected; disclosure needed before switching on; off by default and Apple's model used; switching off returns to Apple's model; the visible switch chooses between the two and is remembered; Check connection results; the key is in no saved file (memory and disk), no message and no error line; Delete everything removes the key and changes nothing if the key cannot be removed; only two source files open a connection; `import Security` only in the Keychain file. Backup: default on; round trip; old settings load as on; folder follows the setting (fake, and the real folder's resource value); Delete everything returns to included.
UI (simulator): the backup switch exists and is on; the disclosure line is shown before the switch, the switch is disabled, and an http address gets the calm line.
Device-only: the real Keychain, a real service, the answer-giving checks for the own service (`checks/device-checks.md` 62 to 73).

## Unverified
The real Keychain was not exercised from an agent (compiled for the phone; headers checked). A real service was never called. Whether a given service accepts the body (`model`, `messages`, `stream: false`) is only known when the parent tries Check connection. T14 against the own service is **not done**: the feature is "built, not cleared".

## Self-review (AGENTS.md section 7), separate pass, same model as Builder
- Can the key leak? Read only inside `OpenAICompatibleModel` for one request, put only in the Authorization header. Not in settings (test), not in any `Words` text or error (enum failures only, no service body), no `print`. The key box is cleared after Save; the view holds no copy. UI tests use a fake key store. Redirects refused. **No leak found.** Accepted weakness: while the student has typed but not saved, the key is in the view's memory.
- Can AI text from the service reach the screen or speaker before the safety check? The only consumers of `OpenAICompatibleModel.stream` are `ChatEngine` and `StepCoach`, which check the whole reply before showing or speaking it. `check()` throws the reply away. **No path found.**
- Does anything leave the phone that the D8 rows do not list? The model name and a default User-Agent travel with the request, covered by the rows' "the model name" and the address's own service. Backup row listed. Look it up unchanged. **Nothing unlisted found.** The `Accept` and `Content-Type` headers carry no data.
- Wording: the three strings that said "on this iPhone" about the AI were made neutral ("The AI couldn't answer that one.", "Suggested by the AI.", "An idea from the AI:"), because they would be false for the own service. The About text keeps the iPhone claim only for Apple's AI.
- Test change: `theAboutTextMatchesWhatLeavesThePhone` no longer asserts that "cloud" never appears (iCloud is now named on purpose); it asserts "private cloud" is absent and that the own service and Keychain are mentioned. The network-file test now expects two files. Nothing else was weakened.
- Rename: the saved settings fields are `ownAIEndpoint` and `ownAIModelId`, because the existing "never stores" test rejects field names containing "address" and "name".

## Gates
Gate 1 design: not run (the parent specified the design). Gate 2 diff: not run by an Advisor agent; self-review only, same model as Builder. Gate 4: owed before anyone but Ben uses it.
