# PRESET1 Start-from buttons on Add a service
Status: built 2026-11-28. The parent asked: "perhaps we can have some canned setups ... openrouter, gemini where i can just paste the key?" and said "let google's page handle the adults only".

## What the student sees and does
1. Add a service shows a "Start from" row: OpenRouter, Gemini, Other (new services only, not Edit).
2. OpenRouter or Gemini fills in label, address and model name (Gemini: `models/gemini-flash-lite-latest`). Other empties the three boxes.
3. The student pastes a key and saves. Every box stays editable. Look up models and Check connection work as before.
4. No adults-only note on the form (the parent's choice; Google's own page covers it; D8 note stays in the docs).

## Research / decision
Design judgment, to be tested. Same own-AI path as D6; no new data stored or sent. Keys are pasted by hand and held as today; the app never supplies one.

## Left out
Groq: free tier not confirmed from Groq's page. A "my own server" button: Other covers it.

## Tests
Logic: preset list ids, valid addresses, Gemini address and default model. UI: tap Gemini, see label, address, model filled.
