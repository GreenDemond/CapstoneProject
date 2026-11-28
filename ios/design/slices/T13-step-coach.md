# T13 Step coach
Status: built 2026-11-20 (compile-checked; logic tested with the fake model; UI tests written, not run; the real model was not run; not cleared until T14)

## What the student sees and does
1. **Suggest some to start**: with the phone's AI on, it suggests process steps for the assignment (about the number chosen). The steps open in the editor with the line "Suggested by the AI on this iPhone. Change any you like." With no AI, or if the AI's steps are not usable, the starter steps open instead (with a calm line when the AI's were rejected). Either way the editor comes first; Start is only possible from it.
2. **I'll say my steps**: the app's two questions, as before. **Give me an idea** offers one possible next step, never the list, with **Use it** and **No thanks**. With no AI, the idea is the next starter step the student does not have yet.
3. If the AI says the safety word for an assignment, the words are cleared, no steps are made, and the fixed trusted-adult line is shown.

## Research link
`design/02` 2.5; `design/03` 3.2; `research/04` section 1 (the gap about apps that plan for the student), idea D2; DECISIONS P1, P12.

## How "answer content instead of process steps" is detected (decided here)
Fails closed: one bad step means none of the AI's steps are used. A step is a process step only if it is at most 200 characters, starts with a verb from a fixed list of things a student does (read, write, list, check, try, ask, set...), does not look like finished work (`AnswerGuard`), has no quotation of 25 or more characters, and has no colon followed by a sentence. "Courage is shown when Atticus defends Tom." starts with "Courage", so it is rejected. This will also reject some good steps; the starter steps are then used, which is the safe direction. All starter steps and the two-minute step are tested to pass. The list is a heuristic and T14 on a real phone still decides.

## Why plain lines and not `@Generable`
The shared rules text already asks for "one per line, with no bullets or numbers". Parsing lines into a typed list avoids the `@Generable` macro (extra build risk) and still gives typed output: the parser returns `[String]` or a reason to fall back. This differs from the task text ("typed output (@Generable)"); not an Apple API doubt.

## Guardrail on the assignment
A guardrail or refusal on an assignment falls back to starter steps with no trusted-adult line. An assignment is a topic, not a personal message, and "Holocaust essay" must not show a distress line. Only the AI's own safety word does.

## What it stores
The draft, as before, plus `fromAI` (the steps came from the AI). Old draft files without it still load (tested).

## What leaves the phone
Nothing.

## Distracted, stuck, back after a week
The draft survives closing the app, with its label. A double tap on Suggest asks the AI once.

## Differs from the web app
Yes: the web app had no coach and no idea button.

## Tests
`StepCoachTests` (29, fake model): bullets and numbers cleaned; rules are the shared text and the assignment is quoted; a quote-closing assignment cannot escape; answer content falls back; one bad step falls back; a verb followed by an answer or a long quotation falls back; zero steps; twenty steps keep the first few; a very long step; the safety word (also late and in another form); refusal, guardrail, other errors; each unavailable reason sends nothing; every starter step passes the process check; AI steps open in the editor with the label, never the work screen; the label stays after editing; unusable steps give starter steps with a note; with no AI both ways work end to end through Start; the trusted-adult word clears the words and saves nothing; empty assignment sends nothing; double tap asks once; one idea even if the AI returns a list; No thanks; idea falls back to a starter step; starter ideas skip steps already there; ideas run out calmly; the word on an idea; an old draft file loads.
UI (`StepCoachUITests`, written, not run): with no AI Suggest opens the editor with the starter label and Start reaches the work screen; Give me an idea works with no AI.

## Unverified
How the real model's steps fare against the process check (too strict or too loose); the screens; VoiceOver.

## Gates
No Advisor available. Gate 2 owed (AI/, words a student reads).
