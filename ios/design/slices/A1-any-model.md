# A1 Any model (own AI services)
Status: not needed 2026-11-26 (parent: typing `any` as the model name works on his server, Polystrata, an Ollama fork; no code change). Asked for by the parent: "give it an option to select any, but not for openrouter, that can get expensive."

## What the student sees and does
1. In the editor for an own AI service, below the address, a switch "Use whichever model this service offers" (off at first). It shows only when the address is not OpenRouter's.
2. With it on, the Model name box and the Look up models button are hidden. The typed name is kept, so switching off brings it back.
3. A line under the switch: "The app asks the service for its models and uses the first chat model it lists. Some services charge by model, so check yours."
4. In the services list, a service using Any reads "Ready · any model", and after a reply "last used <model name>". The student can see which model answered.
5. If the address is changed to OpenRouter while the switch is on, the switch goes off, the saved model name is used, and the service shows "Needs a model name" if there is none.
6. If the list cannot be fetched, the chat or step action fails the same way it does today for an unreachable service. Nothing is guessed.

## Research link
Design judgment, to be tested. Not a research claim.

## What it stores
One new saved flag per service, `anyModel` (default false; older files load unchanged). The resolved model name is kept in memory only, never saved, and is cleared on edit, on relaunch and when a reply says the model is gone (400 or 404 naming the model). The shown "last used" name is in memory too.

## What leaves the phone
One new automatic request, a GET for the list of model names, to the list address built from the service's own address (the same one Look up models uses). No student words. The service's own key goes in the Authorization header. Made once per launch per service, before the first chat or step request, and again after the cache is cleared. New D8 row, "parent to confirm before classmates".
The chat request itself is unchanged except for the model name chosen.

## Rules
- OpenRouter is refused in the code, not only in the screen: `OwnAIConfig.allowsAnyModel` is false for host `openrouter.ai` and any `*.openrouter.ai`, and `anyModel` has no effect when it is false. A hand-edited or migrated file cannot bypass it.
- Known gap: a proxy or another aggregator in front of OpenRouter cannot be detected by address. The line in step 3 is the only warning there.
- Which name: the first listed name that does not contain embed, whisper, tts, moderation, dall, image, audio, rerank or transcribe (any case). None left means unavailable.
- Rule 1 and the safety layers are unchanged: every reply still passes the safety word, the answer guard and the process-step check.
- T14 (answer-giving checks) is per AI. A service on Any can answer with different models over time, so it can never count as cleared. It is "built, not cleared", like every own service today.

## Distracted, stuck, back after a week
- Distracted: the switch is off at first; nothing changes unless it is turned on.
- Stuck: a failed list lookup gives the existing unreachable-service wording.
- Back after a week: the name is looked up again after relaunch, so a retired model does not linger.

## Differs from the web app
No.

## Tests
- Logic: `allowsAnyModel` false for openrouter.ai, www-less and subdomain, uppercase host, trailing dot, a port; true for api.openai.com, localhost, a 100.x tailnet address, a `*.ts.net` name; false for an unparseable address.
- A file saved with `anyModel` true and an OpenRouter address does nothing: the service needs a model name.
- Older saved files (no `anyModel`) load with false.
- Name choice: first name; skips embedding, speech and image names; none left gives unavailable; a name with odd characters is dropped by the existing reader.
- Flow with fakes: Any on, list once then chat uses the name; two chats make one list request; an edit clears the cache; a 404 naming the model clears it and the next chat looks up again; list fails gives unavailable and no chat request is sent; the key goes only in the Authorization header to the same origin; the thinking-setting retry still works with a resolved name.
- UI: the switch shows for a normal address, hides for OpenRouter, and turning it on hides the model box. Awkward: switching the address to OpenRouter turns it off.
- Device only: a real service on Any.

## Unverified
Whether `/models` lists chat models first on the services the parent uses. Checked on the parent's phone with the services he has.

## Gates
- Gate 1, 2026-11-26, independent read-only reviewer (same model family as the Builder): FIX FIRST (7). Must-fix: (1) "first listed chat model" can land on an arbitrary or costly model and the 400/404 retry would loop; use Any only when the list has exactly one chat-capable name, or ask the parent for first-of-many with failed names remembered; (2) enforce the OpenRouter exclusion in `complete`, in `limitedServices` and in `OwnAIModel.save`, with a fail-closed host test; (3) define "ready" for Any (allowed, a list address exists, a key exists) and hide the switch when there is no list address; (4) one resolver in `OwnAIModel`, keyed by service id plus address, cleared on save, remove, reset and key erase, with a run counter; (5) show the asked-for model wherever the service label is shown (Talk, Stuck), not only in Me; (6) amend D6 and D8 and add a change-log row; (7) split into A1a (logic, no UI) and A1b (switch, label). Open question for the parent: what "any" should mean (see below). Not yet fixed in this note.
