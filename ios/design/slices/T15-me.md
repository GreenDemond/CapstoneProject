# T15 Me
Status: built 2026-11-20 (compile-checked; logic tested; UI tests written, not run)

## What the student sees and does
1. **My goals**: today, this week, this month, this year. All optional, saved as typed.
2. **What got in the way?**: private notes, newest first, swipe to delete, a microphone beside the box when voice is on. Under it, always: "If something serious is getting in the way, talk to an adult you trust."
3. **How I like to work**: four questions (sound, work block, what pulls me away, what helps me restart), each with "Not sure". After one real answer, a card titled "A first guess" restates the answers and says it is a starting guess, not a test result. The block answer is marked "(your pick)" in the timer menu on the work screen (12 or 25 minutes). The timer is still off until the student starts it.
4. **How the AI talks**: one guide in the student's own words and a reply length (Short, Medium, Long). The line beneath says the AI still gives hints, never the answer. The guide is cleaned and quoted inside the rules (shared `Guide` code and cases).
5. **Voice**: Quiet, I talk, We talk, with one line explaining the one chosen; "Only speak through headphones" (on by default); which voice; speed. This is where voice is switched on (D7: off by default).
6. **About and privacy**: what is stored and what leaves the phone, and **Delete everything on this iPhone**: the first tap asks, the second tap deletes; "Keep my things" cancels.

## Research link
`design/02` 2.10; `research/01-evidence.md` section B (a questionnaire cannot predict what works: so the card is a first guess and makes no claim; the "app tests the guess" experiments are not in this version); `00-knowledge-summary.md` section 6 (wording).

## What it stores
Goals and notes in `profile.json`; answers, guide, length and voice in `settings.json`. No name, age, school or diagnosis. Notes are private to the phone and never shown to the AI.

## What leaves the phone
Nothing. The About text states the rows of `DECISIONS.md` D8 that exist in this build: Look it up (Wikipedia) and opening a source. D8 row 2 (the AI looking things up) is not built, so it is not in the About text.

## Delete everything
Removes every saved file including backups, then clears memory (steps, notes, goals, settings, chats, parked thoughts, recall, the microphone explanation) and returns to the first-run screen. Nothing is written afterwards until the student acts. If the files cannot be removed, nothing changes and a calm line says so. Tested with a memory store and with a real folder (empty afterwards).

## Distracted, stuck, back after a week
Every field saves as it is typed. Nothing is carried over that the student did not enter.

## Differs from the web app
Yes: voice settings are new; How I like to work is saved; it is a first guess with no experiments.

## Deviations (honest)
- "Used as starting choices for countdown length and voice": the countdown length is used. Voice is NOT changed by the sound answer; voice stays at the student's own setting under Voice (D7: off by default, never switched on by a guess).
- Reply length and guide are one setting for all kinds ("all"), as the settings type allows per-kind later.
- The first-guess card does not make the app "test" the guess (no per-session ratings). Not in this task.

## Tests
`MeTests` (23): goals saved and reloaded; long goal cut; notes newest first and deleted; empty and very long notes; answers only if offered; card needs one real answer; card restates answers and uses none of: focus, attention, ADHD, improve, treat, flow, missed, failed; block answer picks 12 or 25; guide and length reach the AI's instructions; a guide that tries to break the rules still sits inside them; long or empty guide; unknown length; voice settings saved and used at once; voice starts off and headphones-only on; speed kept in range; Delete everything needs a second tap, cancel keeps everything; leaves no file and the app starts fresh; failure changes nothing; real folder empty afterwards (including a backup); chats and the microphone explanation forgotten; About text states D8.
UI (`MeUITests`, written, not run): add and delete a note; changing voice shows the microphone; first-guess card; Delete everything returns to first run.

## Unverified
The layout of the Me list at the largest text size; VoiceOver reading of pickers; the voice list on a real phone.

## Gates
No Advisor available. Gate 2 owed (words a student reads, the About text vs D8, Delete everything).
