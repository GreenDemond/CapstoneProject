# GOOGLE1 Accept Google's (and similar) provider addresses
Status: built 2026-11-27. Gate 1 and gate 2 GO. The full check and the parent's device check with his own key are the last steps. The parent asked: "can we adjust the app to also accept google's api paths?" and has a Google key to try it with.

## The problem (read from the code and its tests)
The app turns the address a student types into the chat address (`OwnAIConfig.chatPath`). It completes only bare addresses: nothing, `/v1`, `/api`, `/api/v1`. Any other path "is the student's own and is kept as typed". So:
- Google's OpenAI-compatible base address `https://generativelanguage.googleapis.com/v1beta/openai/` is **not** completed, and the request goes to `.../v1beta/openai` with no `/chat/completions`. It only works today if the student types the full `.../openai/chat/completions`.
- Groq's base address `https://api.groq.com/openai/v1` has the same problem.
- The model list (Look up models) already works for a typed full address, because it swaps `/chat/completions` for `/models`.

## What the student sees and does
1. In My AI services, the student can paste the base address the provider shows, for example `https://generativelanguage.googleapis.com/v1beta/openai/`, and it works. Nothing else on the screen changes.
2. **Look up models** on a Google address lists names without the `models/` prefix Google puts on them (for example `gemini-2.5-flash`), so a name picked from the list is the one chat expects. A name typed by hand is never changed.
3. Addresses that are already complete, or that end in a different path, behave exactly as before.

## The change
- `OwnAIConfig.chatPath` (`Network/OpenAICompatibleModel.swift`). The old branch is untouched: an empty path, `/api`, `/v1` and `/api/v1` still get OpenRouter's `/api` prefix and `/v1` as before, and a path ending `/chat/completions` is returned as it is. A new branch runs only for any other path, using the last segment of the path (names are exact and lower case; nothing here changes the host):
  - If the last segment matches the version pattern `^v[0-9]+((alpha|beta)[0-9]*)?$` (named helper `isVersionSegment`), append `/chat/completions` and nothing else. `v1`, `v2`, `v10`, `v1beta`, `v1alpha`, `v2beta3` match. `v`, `V1`, `v1.5`, `v1x`, `version2` do not.
  - If the last segment is `openai`: when the segment before it is a version marker (Google's `/v1beta/openai`), append `/chat/completions`. A lone `/openai` (Groq's and Azure-style roots) gets `/v1` first, becoming `/openai/v1/chat/completions`.
  - Any other path is kept as typed, as today.
  - The OpenRouter prefix and the `/v1` addition never run for the new branch.
- `ModelLister` (same file). `readNames(_:stripPrefix:)` takes an optional prefix, default none. `lookUp` passes `"models/"` only when the lower-cased host of the chat address is exactly `generativelanguage.googleapis.com`. The prefix is removed once, from each name, before the existing checks (plain characters, 1 to 100 long, no duplicates), so `models/` alone is dropped and `models/x` and `x` count as one. Other prefixes such as `tunedModels/` are not touched. A name the student types is never changed.
- Not changed: the key goes only in the Authorization header to the host the student entered; an address with a query (for example `?key=...`) is refused, so a key can never reach the settings file; http and https handling; the thinking setting and its retry.
- A gateway path such as Cloudflare AI Gateway's `.../<name>/openai` would get `/v1` added (`.../openai/v1/chat/completions`), which is wrong for that provider. It was already a 404 before (no `/chat/completions`), and typing the full `.../openai/chat/completions` address still works.
- Not built: Google's native API (`generateContent`, `x-goog-api-key`), which has a different request and reply format. The Perplexity-style root with no `/v1` is also left for later; it works today if the student types the full `.../chat/completions` address.

### Saved addresses
The chat address is worked out from the stored text each time it is used. A service already saved with a path that ends in a version marker or `openai` (and not in `/chat/completions`) will now get `/chat/completions` added, where before it was sent as typed. That is intended: such a path is almost never a complete chat address. The key still goes to the same host. Addresses ending anywhere else, for example `/custom/path`, `/v1/responses` or `/v1/chat`, behave exactly as before. (`/api/paas/v4` ends in a version marker, so it is now completed, which is right for that provider.)

## Research link
Not a research question. It follows D6 (a student may add their own AI service).

## What it stores
Nothing new.

## What leaves the phone
Nothing new. A request to a Google address goes to `generativelanguage.googleapis.com` and is covered by the existing D8 rows for the student's own service ("the address of the service the student chose"). Google's own terms apply to those words: from Google's pages (confirmed 2026-11-26), free-tier prompts may be used to improve Google's products, and the Gemini API terms say users must be 18 or older. That belongs in the parent's decision on who may use an own service, and in the privacy policy and review notes (`release/`). It does not change the code.

## Distracted, stuck, back after a week
No change.

## Differs from the web app
Not checked.

## Tests (logic only, no key, no network)
The Google cases use the examples in Google's own OpenAI-compatibility page (https://aistudio.google.com/docs/openai, read 2026-11-27): base address `https://generativelanguage.googleapis.com/v1beta/openai/`, REST chat URL `.../v1beta/openai/chat/completions`, `Authorization: Bearer <key>`, a `system` message then a `user` message, the short model name `gemini-4-hydrogen`, `reasoning_effort: "low"`, and the list URL `.../v1beta/openai/models`. The key in tests is a made-up string.
- Address completion: Google base with and without a trailing slash and without `/v1beta/openai`'s slash; `/v1beta/openai/chat/completions` unchanged; Groq `https://api.groq.com/openai/v1` and `https://api.groq.com/openai` and `.../openai/`; `/v2`, `/v10`, `/v1beta`, `/v1alpha`, `/v2beta3` complete; `/v`, `/V1`, `/v1.5`, `/v1x`, `/version2` stay as typed; `https://example.com/custom/path`, `/v1/responses`, `/v1/chat` stay as typed; a path ending in `/v4` is completed (it matches Zhipu's documented base address as the reviewer remembered it; not verified); `openrouter.ai/v2` gets no `/api`; every existing OpenRouter, OpenAI and local case unchanged; an address with `?key=abc` is refused.
- `isVersionSegment` tested on its own with the lists above.
- The model list address for the Google base address is exactly `https://generativelanguage.googleapis.com/v1beta/openai/models`.
- The request the app sends to a Google service: POST to the REST chat URL above, `Authorization: Bearer <key>` and `Content-Type: application/json`, a body with `model` `gemini-4-hydrogen`, a `system` message then a `user` message, and `reasoning_effort` `low`. The key appears in no other header, in no URL and not in the request body. (That a saved service never holds the key is covered by the existing own-service storage tests, not repeated here.)
- A reply in the standard shape (`choices[0].message.content`) is read; a 400 that names `reasoning_effort` is retried once without it (existing behavior, run for a Google service).
- Model names: for the Google host a list with `models/gemini-4-hydrogen`, `models/embedding-001`, `models/`, `tunedModels/x` and a plain `gemini-4-neon` gives `gemini-4-hydrogen`, `embedding-001`, `tunedModels/x`, `gemini-4-neon` in order, with no duplicates; for `api.example.com` and for `evil.googleapis.com.example.org` the same list keeps every `models/` prefix.
- Device check (the parent, with his own key; the agent never sees it): add a service with the Google address, tap Look up models, pick a Gemini model, tap Check connection, then use Talk once, and try the address once without the trailing slash. Report what the status line says, not the key.

## Unverified
- Whether Google's `/models` list returns ids with a `models/` prefix. The docs' list example does not show the reply, and every chat example uses the short name. Stripping is a no-op if there is no prefix and safe if there is, because the short name is the documented one.
- Whether Google's chat would also accept the prefixed name (not needed: the short name is documented).
- Whether Google rejects `reasoning_effort: "none"` for models that cannot turn thinking off (the docs say reasoning cannot be turned off for Gemini 2.5 Pro, Gemini 3 and Gemini 4), and whether its error text names the setting. If it does not, a student who picks the "none" thinking level for such a model would see a failed check, with no automatic retry. Settled only by the device check.
- Everything above about Google's terms (free-tier prompts may be used to improve products; users must be 18 or older) is from Google's pages read on 2026-11-26.

## Parent decision (blocks classmates, not the code)
School accounts do not solve it: Google says users under 18 cannot use AI Studio with a Google Workspace for Education account, even when the school's setting is on (https://ai.google.dev/gemini-api/docs/workspace, read 2026-11-27).
Classmates must not be pointed at a Google free-tier key until the parent answers: may a student's words go to a service whose free tier may use them, and whose terms say users must be 18 or older? This goes under "Waiting on" in `PROGRESS.md` and is noted beside the D8 rows for a student's own service (parent to confirm before classmates). The code is used only on the parent's own phone with his own key.

## Gates
- Gate 1, 2026-11-27, independent read-only reviewer (same model family as the Builder): FIX FIRST (7), all applied above: a lone `/openai` gets `/v1`; the version pattern is exact; the new branch is separate from the OpenRouter and `/v1` logic; saved addresses change and the unchanged cases are listed; the `models/` strip is exact-host, once, before the checks; the Unverified section covers it; the free-tier question is a visible stop for classmates. Tests are built from Google's examples. No D6 or D8 data change is needed. Second round pending.
- Gate 2, 2026-11-27, same reviewer: **GO**, no must-fix. Suggestions applied: a test that `models/x` and `x` collapse to one name; the Cloudflare-style path noted; the Zhipu claim reworded; status line fixed. `swift test` 695 of 695 (12 new). The full check is run before the commit. No fresh-context Checker. Not tried against Google with a real key.
