# GOOGLE2 Fill in a Gemini model when the address is Google's
Status: built 2026-11-28; gate review GO; the full check runs before the commit. The parent asked: "for gemini, can we default to models/gemini-flash-lite-latest".

## What the student sees and does
1. In My AI services, when the address is Google's (`generativelanguage.googleapis.com`) and the Model name box is empty or still holds the app's own starting name (`openrouter/free`), the box fills in `models/gemini-flash-lite-latest`.
2. A name the student typed or picked is never replaced. A different host never changes the box. Look up models still works and still lists names without Google's `models/` prefix (GOOGLE1).
3. The default service for a new entry stays OpenRouter; only the model box follows the address.
4. The fill is one way: if the student then changes the address to another host, the name stays in the box, because it is a name already there. They edit it by hand.

## Why exactly this string
The parent's value is used as given, prefix included. The app cannot confirm it: Google's own examples use short model names (`gemini-4-hydrogen`) and its page does not show the list output or the alias (`gemini-flash-lite-latest`). If Google's chat accepts only one form, the other fails with a plain "problem" line on Check connection. The parent's device check settles it. If the short form is the one that works, only `Words.ownAIGoogleModel` changes.

Evidence so far: the parent tested a service in the web app with the full chat address, this model name and thinking on Low. He did not say what "Test it again" returned, so it is not yet known that Google accepted it. Only the short form is shown in Google's own examples; the prefixed form is unconfirmed. If the device check fails with this default, the fix is to switch `Words.ownAIGoogleModel` to `gemini-flash-lite-latest`.

Known inconsistency: after Look up models the picker shows names without `models/` (GOOGLE1), so a picked name and this default can differ by that prefix.

## What it stores
Nothing new. The name is saved with the service as today.

## What leaves the phone
Nothing new. The Google data notes under D8 and in `GOOGLE1` apply.

## Tests
- Logic (`OwnAIConfig.suggestedModel(address:current:)`): Google host with an empty box, a spaces-only box, and `openrouter/free` gives the default; a typed name, `gemini-x` or `models/other` gives nothing; a non-Google host, a lookalike host (`generativelanguage.googleapis.com.example.org`), an unparseable address and an empty address give nothing; the host check ignores letter case.
- UI: add a service, type Google's base address, the Model name box shows the default; then type another address and the box keeps it (the student's choice is not replaced).
- Device check (the parent, own key): add the Google address, see the default, tap Check connection. Report the line, not the key.

## Unverified
Which form Google's chat accepts for the alias (above).

## Gates
- Combined gate 1 and gate 2 review (a departure; the change is a few lines), 2026-11-28, independent read-only reviewer (same model family as the Builder): **GO**, no must-fix. Results at review time: `swift test` 699 of 699; the new UI test passes on iOS 26 and iOS 18.2. Not tried against Google with a real key.
