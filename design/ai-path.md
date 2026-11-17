# AI path: baseline and plan

Status: **built 2026-11-17, switched off.** Ben asked to build it now. The code is in place and tested with a stand-in. It stays off until the parent decides to add AI (DECISIONS "still the parent's to decide" #2), sets up the OpenRouter key as an adult (T6), picks the model from OpenRouter's current list, and arranges hosting (T7). Agents never create or handle the key.

**Not yet done:** the five answer-giving attempts against the real service (needs the key), and wiring `server/suggest.js` to the host.

## Baseline (before any AI)

Recorded on commit `1da56c5` ("Add a two-minute start to the steps screen"):

- `npm run check`: lint passes; 46 logic tests pass; 50 browser tests pass (phone and desktop width).
- No AI code, no `/api/` calls, no server function in the repository.
- No outside web addresses in the shipped app (`index.html`, `js/`, `css/`). The only one is the SVG namespace the countdown ring needs.
- All student text reaches the screen as plain text (`textContent`).

Any AI change must leave these numbers the same, except for tests added for the AI path. Any new outside address in the shipped app is a stop-and-ask.

## What the AI path adds, when approved

1. **Server function** `server/suggest.js` (T6, T7): holds the key from the environment variable `OPENROUTER_API_KEY`. Keeps the hints-only and child-safety instructions on the server. Rejects text over 6,000 characters. Limits each visitor to a small number of requests per hour. Accepts requests only from the app's own address. Never logs or stores the text.
2. **Client** `js/ai.js`: the only file that calls `/api/suggest`. If the AI path is off or fails, the app uses the no-AI starter steps and says so in one friendly line.
3. **Privacy line** on the paste screen (T8): "This text is sent to an AI service to suggest steps. Don't paste your name or anything private." Plus a note that suggestions come from an AI, not a person.
4. **Model:** one small, low-cost model, pinned by name. Check OpenRouter's current list at the time of wiring. Do not pick a model name from memory.

## Tests to write before it is switched on

- Logic: the size limit, the rate limit, the origin check, and the fallback to no-AI steps when the service fails.
- Browser: the AI path off by default; the privacy line visible; a failed call falls back with the friendly line.
- **Answer-giving attempts:** at least five different ways to get a finished answer (for example "just give me the answer", "write the essay", "solve question 3", a request in another language, a request split across two messages). Record what was sent and what came back, in this note, before the path is switched on. Any finished answer is a stop: fix the instructions and retest.
- Child-safety: a message that suggests danger or distress must show the trusted-adult line (rule 11), not advice.

## Stand-in for testing

Until the key exists, the server function can be tested with a stand-in that returns fixed text. The real service is tested only after the parent sets the key up.

## Needed from the parent (in order)

1. Yes or no on adding the AI path.
2. If yes: create the OpenRouter account as an adult, apply the settings in T6, set a spending cap, create the key, and set it as a secret on the host.
3. Hosting (T7), arranged privately.
4. Teacher approval and written parent permission before classmates use the AI path (T8 and `02` section 7).

## Open questions for Ben

- Should the AI path be available to the beta at all, or only to you at first?
- Which kinds of work should get AI suggestions: all six, or only Essay and Project?
