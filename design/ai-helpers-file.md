# Save and load my AI helpers (a separate, opt-in file)

Status: built (logic FEAT-001, Settings screen FEAT-002). Screen code: js/settings-helpers-file.js. Load asks for a passphrase only after Yes; three wrong tries add a 5 second wait.

## Why

A student sets up helpers (address, AI, thinking effort, key) and then loses them if they clear browser data or use another device. Ben asked for a way to save and bring them back. The data copy (`js/logic/backup.js`, design/me-export-w7.md) never holds AI settings or keys and **does not change**. This is a second file, made only when the student asks.

Research support: none; design judgment, to be tested. It supports rule 5 (the student owns their data).

## What the student sees

Settings, in the AI helpers area. One thing at a time.

**Save my AI helpers**
1. Taps **Save my AI helpers**. Two choices, the first already picked:
   - **Without keys (safest)**: addresses, names, AIs and thinking effort only.
   - **With keys, locked with a passphrase**.
2. If they pick keys: "Pick a passphrase you will remember. It can't be recovered." Two boxes (type it twice), at least 10 characters. Mistakes show plain lines ("The two passphrases don't match. Type them again.").
3. The browser downloads `focus-app-ai-helpers-YYYY-MM-DD.json`. The screen says what was saved and whether keys are in it.
4. Only helpers whose key is saved on this device get a key in the file. Others are saved without one.

**Load AI helpers**
1. Taps **Load AI helpers**, picks a file.
2. A bad file shows one plain line ending "Nothing was changed." and nothing happens.
3. A good file shows a preview: "These helpers will be added:" with each name, AI and address as text. Helpers already there (same AI at the same address, or the same name) are listed as left out, with the reason. Also shown: "These helpers send what you type to the address shown. Only load a file you made yourself."
4. Buttons: **Yes, add these helpers** and **No, keep what I have**. Nothing is added until Yes.
5. If the file holds keys: after Yes, a passphrase box. A wrong passphrase shows "That passphrase didn't open the keys." and offers to try again, or **Add the helpers without their keys**.
6. Added helpers behave like hand-made ones: ticked as checked, not ready until a key is saved. If keys were opened, each is saved through the normal key path (`saveKey`), so `keyReady` and the last four characters come from the saved key, not the file.

Distracted or returning later: nothing is saved by this feature except what the student confirms. Leaving mid-step changes nothing. The passphrase is never stored.

## Wording (exact)

Save my AI helpers; Without keys (safest); With keys, locked with a passphrase; Pick a passphrase you will remember. It can't be recovered.; Load AI helpers; These helpers will be added:; These helpers send what you type to the address shown. Only load a file you made yourself.; Yes, add these helpers; No, keep what I have; That passphrase didn't open the keys.; Add the helpers without their keys.

Bad-file lines (all end "Nothing was changed."): "That file isn't an AI helpers file.", "That file is too big to be an AI helpers file.", "That file was made by a newer version of the app.", "That file has no helpers that can be added." The wrong-passphrase line is the one above; it never says why (wrong passphrase, changed file and damaged keys look the same).

## File format

```json
{
  "app": "focus-app-ai-helpers",
  "version": 1,
  "note": "This file holds AI helper settings. If it holds keys, they are locked and need the passphrase.",
  "savedOn": "2026-11-28",
  "helpers": [{ "ref": "h1", "label": "...", "url": "https://.../chat/completions", "model": "...", "effort": "low" }],
  "keys": { "kdf": "PBKDF2-SHA-256", "iterations": 600000, "salt": "base64", "iv": "base64", "data": "base64" }
}
```

`keys` is absent in the safe file. `data` is AES-GCM of JSON `{ "h1": "<key>" }`. A helper with no key is not in it. No ids, no key hints, no chats, no profile, no work.

## Code

- `js/logic/ai-helpers-file.js` (pure): `FILE_APP`, `FILE_VERSION`, `MAX_FILE_BYTES` (200000), `MIN_PASSPHRASE` (10), `helpersFileName(nowIso)`, `refFor(index)`, `keysByRef(services, keysById)` (Map helper id to plain key, gives Map ref to key), `buildHelpersFile(services, { keysBlock, nowIso })`, `checkPassphrase(pass, again)` gives `{ ok, passphrase }` or `{ ok:false, reason }`, `parseHelpersFile(text)` gives `{ ok:true, helpers:[{ref,label,url,model,effort}], keys: block|null, dropped }` or `{ ok:false, reason }`, `planLoad(existing, helpers)` gives `{ toAdd:[{ref, service}], skipped:[{label, reason}], list }`, plus the exported message constants (`WRONG_PASSPHRASE` etc).
- `js/logic/helpers-crypto.js` (pure; SubtleCrypto passed in): `encryptKeys(subtle, getRandomValues, passphrase, keysByRefMap, iterations?)` gives the `keys` block; `decryptKeys(subtle, passphrase, block)` gives `{ ok:true, keys: Map ref to key }` or `{ ok:false }`; `cleanKeysBlock(block)`; `PBKDF2_ITERATIONS` (600000).
- The screen (FEAT-002) reads keys with `readKey`, applies `planLoad`'s `list` only after Yes, saves each opened key with `saveKey` (key first, then list, as `commit()` does), and never touches `chosenId`.

## Strict loading

200 KB cap (bytes); JSON parsed in try/catch; `app` and integer `version` checked, newer versions refused; every property read with `Object.hasOwn`; unknown properties dropped (new objects are built from named fields); label and model cut to `MAX_LABEL`/`MAX_MODEL`; effort must be in `EFFORTS` else Low; addresses must pass `chatAddress` (this refuses `user:password`, non-http(s) and non-chat paths); at most `MAX_SERVICES` entries read; `planLoad` uses `addService` so duplicates (`modelTaken`, `nameTaken`), the limit and name rules are the same as by hand. A damaged helper entry is dropped on its own; if none are usable the file is refused. Keys block is shape-checked: `kdf` fixed, iterations 1,000 to 2,000,000 (stops a hostile file freezing the page), salt 16 bytes, IV 12 bytes. Reasons are fixed strings; none can contain a key or passphrase.

## Threat model

| Threat | Safeguard |
|---|---|
| Crafted file with a hostile address (to collect what the student types) | Preview shows every address before anything is added; consent button; warning line "Only load a file you made yourself."; added helpers have no key, so they can't send one until the student adds a key; `chatAddress` limits the path shape |
| Stolen file with keys | Keys are AES-GCM encrypted under a PBKDF2 key; the default file has no keys |
| Weak or reused passphrase | 10 character minimum, shown advice to use a few words. Honest limit: an attacker with the file can guess offline; 600,000 rounds slows each guess but does not stop a weak passphrase |
| Huge or hostile JSON | 200 KB cap before parsing, iteration cap |
| `__proto__`, `constructor` | `Object.hasOwn` reads, fresh objects, tested |
| HTML in names | Names are text and shown with `textContent` (T11); tested as plain text |
| `user:password` in an address | Refused by `parseAddress`, via `chatAddress` |
| Plain http | Allowed as for hand-made helpers (T6 decision); the preview shows the address |
| Wrong passphrase or changed file | One generic failure; AES-GCM detects changes |
| File replaces or edits current helpers | Never: loading only adds; existing objects and the chosen helper are untouched (tested) |

## Why PBKDF2 at 600,000 rounds

WebCrypto in every browser has PBKDF2 and no third-party code is allowed (T1, T2). 600,000 rounds with SHA-256 is the current OWASP figure and takes well under a second on a phone. The count is stored in the file, so it can rise later, and a reader accepts 1,000 to 2,000,000.

## Rules check

- Rule 4 (data on the device): the file is made in the browser and goes only where the student saves it. Nothing is uploaded.
- Rule 5 (student owns data): opt-in, made on request, no automatic sharing.
- Rule 9 (no secrets in the repo): no key is in code or tests; tests use fake keys. The file never holds a plain key.
- Rule 1: Load does not give answers; it only adds helper settings.

## Stage 1 self-review

- [x] Breaks no rule above (see Rules check).
- [x] No conflict with DECISIONS.md. The data copy still never holds AI settings or keys. T8: nothing leaves the device. This is a separate file the student chooses to make. **Parent to confirm**: a DECISIONS.md change-log row should record this; not added yet because no existing decision changed.
- [x] Not a listed trap (no streaks, no rewards, no shame).
- [x] The student decides everything; the app does not pick or add anything unasked.
- [x] Seconds to use: two buttons, one preview, one confirm.
- [x] Small: logic and tests in FEAT-001, screen in FEAT-002.

## Not tested here

The screen and browser flow (FEAT-002). Real AI services (no real key is used anywhere).
