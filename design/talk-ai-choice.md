# Choosing the AI in Talk

## What the student sees

- On Talk it through, a **Which AI helper?** menu shows whenever at least one helper is saved. With one ready helper it shows that helper, so the student can see which AI will answer.
- A helper that is saved but cannot answer yet is listed but cannot be picked, with the reason: "<name> (needs a key)", "<name> (needs an AI picked)" or "<name> (needs a key and an AI picked)". The wording matches the Settings cards and the paste screen.
- If helpers exist but none is ready: "Finish setting up a helper in Settings." and the existing **Open Settings** button. The student can still read saved chats.
- With no helper at all: unchanged ("Add an AI helper in Settings first.").
- With two or more ready helpers: unchanged. The next message goes to the one chosen, even mid-chat, and the paste screen's menu shows the same choice (one shared saved choice).

## Research support

None needed; design judgment, to be tested. It shows which service gets the student's text (DECISIONS T8).

## Data stored

Nothing new. The choice uses the existing saved helper choice. What is sent to the AI is unchanged.

## Distracted, stuck, away

Picking is one tap and a half-typed message stays. Nothing is shaming; the unready line is calm.

## Not done

Remembering a separate AI per saved chat (the iPhone app does this).

## Logic

`talkHelperMenu` in `js/logic/ai-services.js` (tests in `tests/logic/ai-services.test.js`); browser tests in `tests/browser/talk-helper.spec.js`.
