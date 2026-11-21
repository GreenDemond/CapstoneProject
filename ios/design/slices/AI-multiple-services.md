# AI-multiple-services: up to five own AI services, http, and Look up models
Status: built 2026-11-21 (decided by the parent the same day, D6). Replaces the single service of `AI-own-service-and-backup.md`; that note's backup part is unchanged.

## What the student sees and does
1. Nothing changes for a student who never opens Me: Apple's on-device AI is used.
2. Me, **My AI services**. The line about what is sent is first. Until it has been shown, nothing can be added. The list starts empty ("No services added. The AI on this iPhone is used.").
3. **Add a service** opens an editor: Label (required, trimmed, 30 characters at most, not the same as another label), Address (https, or http with a calm "not encrypted" line; user:password, query and fragment still refused), Key (secure box that empties after Save), Model name. **Look up models** is optional: it asks the service for its model names and offers a pick list; typing a name always works and overrides the list. **Save service** needs a label and a good address; the model and key can come later.
4. Each listed service shows its label, a status (Ready, or what it needs) and **Edit**, **Check connection** and **Remove**. Remove asks once ("Tap again to remove") and also deletes that service's key. At five, **Add a service** is greyed out with "That's five services. Remove one to add another."
5. Talk shows a choice whenever at least one service is ready (good address, model name, key saved): **On this iPhone** first, then each ready service by label. A segmented control for up to two services, a menu for more. The line above the chat names the AI in use. The step coach follows the same choice.
6. If the chosen service is removed, loses its key, or has its address changed to another host, Talk goes back to this iPhone's AI and says so in one calm line.
7. Delete everything removes every key first, then the data.

## Research link
Design judgment, to be tested. Rule 1 is enforced by the same `ChatEngine` and `AnswerGuard` for every AI. How a larger web model obeys hints-only is **not known** until T14 is run for each service used.

## What it stores
Settings: `ownAIServices` (id, label, endpoint, modelId, per service) and `chosenServiceId`. The ids are UUIDs. **Keys are only in the Keychain** (`kSecAttrAccessibleWhenUnlockedThisDeviceOnly`), one item per service, account `service-<id>`, never the label. Field names avoid "address" and "name" because the "never stores" test rejects them.

## What leaves the phone
D8 rows: (1) chat and step coach text to the chosen service's address; (2) Check connection: one fixed message; (3) **new** Look up models: a GET to the same host with `/models` in place of `/chat/completions`, with the typed or saved key of that service, no student words. http addresses are not encrypted. Requests do not follow redirects.
**iOS exception (needs the parent's attention):** plain http is blocked by iOS unless the app declares `NSAllowsArbitraryLoads`. `App/Info-Extra.plist` does that (the parent chose "http for any address"). Wikipedia and every other address in the app are https. App Store review may ask why; the answer is "the student enters their own AI service address, which may be on their own network". Not uploaded.

## Distracted, stuck, back after a week
Distracted: an editor can be cancelled; nothing is sent until a service is chosen on Talk (or Check connection / Look up models is tapped). Stuck: a failing service falls back to hints and shows a calm line. Back after a week: the choice is remembered by id; a missing key falls back with one line.

## Lessons taken from the web app (`js/ai-direct.js`, `js/logic/ai-services.js`; read only)
The model list address is the chat address with `/models` in place of `/chat/completions`, and nothing else is guessed. Only plain model names are kept (letters, digits, `. _ : / ~ -`, up to 100 characters), at most 1000. A key is optional for the list. A failed list never blocks typing. Labels are unique, ignoring case. Ids never repeat, so an old key cannot attach to a new service.

## Differs from the web app
Yes: keys are in the Keychain, not an encrypted browser store.

## Tests
FocusKit (fake transport, fake key store, no network, no sleeping): add, edit, remove (asks once), the limit of five, label required/trimmed/limited/unique, disclosure first, https and http accepted and everything else refused, per-id key storage and removal (accounts never contain labels), a failing key store, changing the address to another host removes the key, picker shows only ready services, choice remembered by id, fallback when the chosen service is removed, loses its key, or has no key at launch, the chat and the step coach use the chosen service's address, model and key and never another's, a model built for one service reads no other account, check connection per service, model list address derivation, list with the same host and the right key, typed key, no key, failures, cap and plain names, build 5 migration (on and chosen, off, nothing set, key only, key move fails then succeeds next launch, damaged entries, more than five), Delete everything removes every key (even an old one) and changes nothing if one cannot be removed, keys never in saved files (memory and disk), messages or errors, only two source files open a connection, key reads only in the store, the network file and the migration.
UI (simulator): the disclosure first, an empty list, a bad address and an http address; add a service, see it in the list and on Talk, remove it (asked once).
Device-only: real Keychain, real services, T14 for each service (`checks/device-checks.md` 62 to 78).

## Unverified
The real Keychain and real services were never called from an agent. The http exception was built but not tried against a real http server. T14 is **not done** for any service: the feature is "built, not cleared". Whether a given service's `/models` reply has the standard shape is only known when the parent taps Look up models.

## Self-review (AGENTS.md section 7), separate pass, same model as Builder
- **Found and fixed in this pass:** (a) Look up models, while editing a service whose address had been changed in the box to another host, would have sent that service's saved key to the new host. Now the saved key is used only when the typed address has the same scheme, host and port as the saved one; otherwise only a key typed now (or none) is sent. Test `aSavedKeyIsNeverSentToANewHostTypedInTheEditor`. (b) If the new settings list could not be saved on the first launch of build 6, the old key could have been moved under an id that was never saved, losing it. Now the key moves only after the list is saved, and only into a keyless "My service". Test `ifTheListCannotBeSavedTheOldKeyIsNotMoved`.
- Can one service's key be sent to another service's address? `OpenAICompatibleModel` is built with one service's config and one key account and has no other account to read. `OwnAIModel.makeModel()` and `checkConnection` build it from the same service record. The lookup reads either the typed key or, only when the box still holds the same scheme, host and port, the account of the service being edited; it sends only to the list address derived from the address in the box. Changing a service's address to another host (or https to http) deletes its key unless a new one is typed, and a key that cannot be deleted blocks the change. Tests send two services in turn and assert the other key is absent from the URL, headers and body. **No path found.**
- Can a key leak into storage, logs or errors? Keys pass only to `KeyStore`. Settings hold ids, labels, addresses, models. No `print`. Failures are enum cases mapped to fixed app words; no service body is shown. The key box is cleared after Save or Cancel. The lookup returns plain names only. Tests scan every saved file (memory and disk) and every status, note and error line for both keys. **No leak found.** Accepted weakness: while a key is typed but not saved it is in the editor's memory.
- Can AI text reach the screen or speaker before the safety check? Unchanged: the only consumers of `OpenAICompatibleModel.stream` are `ChatEngine` and `StepCoach`, which check the whole reply first. The model list text is never shown (names pass a plain-character filter, and they only fill a pick list). **No path found.**
- Other: an http address sends the key unencrypted. The editor says so and About says so. That is the parent's decision. The `NSAllowsArbitraryLoads` exception applies to the whole app; the only other network code (Wikipedia) uses https addresses.
- Wording: privacy and About text now say "add an AI service in Me and choose it on Talk".
- Tests changed: the single-service tests were rewritten for the list (all earlier cases kept in list form). `theAboutTextMatchesWhatLeavesThePhone` checks the new About lines instead of "Use my own AI service". The key-read test now allows the store, the network file and the migration. Nothing was weakened.

## Gates
Gate 1 design: not run (the parent specified the design). Gate 2 diff: not run by an Advisor agent; self-review only, same model as Builder. Gate 4: owed before anyone but Ben uses it.
