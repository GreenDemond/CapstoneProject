# T12 Talk
Status: built 2026-11-20 (compile-checked; logic tested with the fake model; UI tests written, not run; real AI and voice not run)

## What the student sees and does
1. The Talk tab. At the top, always: "This AI runs on this iPhone. Your messages don't leave it. It can still be wrong." Then the fixed opening line (not from the AI, not saved): "What are you working on, and what's the first thing you're not sure about?"
2. The student types (or, with voice on, holds the microphone; in We talk, letting go sends). Send and Stop swap places. Replies appear a whole sentence at a time, after the safety check. In We talk each sentence is spoken as it is released (headphones only unless the student turned that off). Tapping a message stops the voice.
3. When the newest reply is a numbered or dashed list of two or more lines, **Use these as my steps** appears. It opens the editor on Today with the steps labelled as from the AI. It never opens the work screen.
4. **New chat**, **My chats** (the ten newest; Delete needs a second tap, so does Delete all chats).
5. From Stuck, **Talk it through** opens the same chat already knowing the step and the kind of work.
6. With no AI: one calm line saying why, plus **Get a hint** and **Look it up**. Everything else in the app works.
7. Trusted-adult case: the student's message and any reply text disappear and the fixed line shows: "If something serious is going on, please talk to an adult you trust." It is spoken only in We talk with headphones.

## Research link
`design/02` 2.9; `design/03` 3.3 to 3.5, 3.7; `AGENTS.md` rules 1, 4, 11.

## What it stores
Up to ten chats in `chats.json` (own file). A message that triggered the line is never saved: it is removed before anything is written, and the first message of a chat that triggers it creates no chat file at all (both tested by scanning every saved file). Nothing stores audio.

## What leaves the phone
Nothing, apart from Look it up (D8 row 1) if the student opens it.

## Distracted, stuck, back after a week
Leaving the screen stops the reply and the voice and keeps what was shown. Chats are kept as saved.

## Differs from the web app
Yes: replies are released by whole sentence, and the trusted-adult handling also covers Apple's guardrail on the student's message (a proposal in `design/03` 3.5 that the parent and Ben still have to approve). The fixed phrase list is not built.

## Tests
`TalkTests` (32, fake model): conversation saved; history sent; empty message; message at and over the limit; double tap sends once; Stop keeps shown text and cancels the model; stop before any text; leaving; trusted-adult removed and never stored (also on first message, and for the guardrail form, and not resent with the next message); the line spoken only in We talk with headphones; finished answer replaced and not kept; reply cut off; refusal; too long; no AI keeps the words; AI going away mid-send; list reply to editor not work screen; no list offers nothing; Stuck step and kind; guide and length; We talk speaks each sentence once; Quiet speaks nothing; eleven chats keep ten; delete and delete-all need a second tap; cancelling deletes nothing; opening a saved chat; unwritable store; long chat saved within limits.
UI (`TalkUITests`, written, not run): a conversation then Use these as my steps lands in the editor; the trusted-adult line replaces the reply and My chats stays empty; no AI offers hints and Look it up. They use a scripted fake chosen by the launch arguments `-focus-fake-ai` and `-focus-fake-ai-distress`.

## Unverified
The screens on a device or simulator; real streaming speed; VoiceOver reading; the layout at the largest text size; whether the keyboard hides the Send button on the smallest iPhone.

## Gates
No Advisor available. Gate 2 owed (AI/, Voice/, words a student reads, storage).
