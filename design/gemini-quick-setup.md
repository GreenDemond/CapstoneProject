# Google Gemini quick setup

Basis: design judgment, to be tested. No study is involved. It removes typing a long address and gives plain steps to get a key, which lowers setup effort.

## What the student sees

1. Settings, **Add an AI helper**. The first screen offers three services: OpenRouter, Another service, **Google Gemini**.
2. Choosing Google Gemini hides the address box. **Next** goes to the key step. No address is typed.
3. The key step shows, above the key box, three numbered steps:
   1. Open Google AI Studio and sign in with a Google account (an adult's account). A link, **Open Google AI Studio**, opens Google's site in a new tab.
   2. Choose **Get API key**, then **Create API key**.
   3. Copy the key and paste it below.
   Then: "Google may have renamed these buttons." and the privacy line.
4. After that the flow is the usual one: pick an AI (starts on `models/gemini-flash-lite-latest`, name box starts as "Gemini"), check, Done.

The same steps also show for a hand-typed Google address.

## Wording for the parent's okay

- Service hint: "Google's AI. You need a key from a Google account. An adult may need to make it."
- Key step steps and link text as above. Link hint: "This opens Google's website in a new tab."
- "Google may have renamed these buttons."
- Privacy: "What you type to Gemini goes to Google. Free plans may use it to improve Google's products. Don't type your name or anything private. This is for you and Ben, not for classmates. Check Google's current terms."
- Busy line for Google only: "Gemini says you've used the free quota for now. Wait a bit and try again."

## The link

It is an ordinary link with `target="_blank"` and `rel="noopener noreferrer"`. The app sends nothing to Google when it is clicked; the student's browser just opens the page. The address `https://aistudio.google.com/apikey` is from memory. **The parent should click it once** and tell Ben if it is wrong. The button names in step 2 should be checked the same way.

## Data

Nothing new is stored. A Gemini helper has the same fields as one added by hand: address, model, name (default "Gemini"), effort Low, key hint, key in the key store. The key is held in memory only while typing and never put in the page text.

## Awkward cases

- Cancel at any step saves nothing.
- Wrong key: the existing plain "That key didn't work" message.
- Quota used up (429): the Google busy line above.
- A helper named "Gemini" exists: Next on the pick step says the name is taken (existing rule).
- Back from key to service keeps Gemini selected.
- Switching to Another service after Gemini clears the automatic name "Gemini" so it does not leak into another helper. A name the student typed is kept.
- Leaving the tab and coming back: the flow and the typed key are still there; nothing is sent while away.
- Keyboard only: radio, link and buttons are all reachable.

## Self-review (AGENTS.md Stage 1)

- Breaks no rule: no diagnosis, no shame wording, key stays on the device, privacy stated.
- No conflict with DECISIONS (T2: link only, no third-party code loaded; T8: privacy line says what goes to Google).
- Not a listed trap. The student still does the thinking.
- One thing on screen at a time, small enough for one session.
