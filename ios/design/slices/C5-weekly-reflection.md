# C5 Weekly reflection
Status: approved for build 2026-11-25 after gate 1 FIX FIRST (applied below)

## What the student sees and does
1. On the Plan tab, once seven days have passed since the student last did a reflection (or on the first visit after seven days of use), a card offers **A quick look back at your week**. It never nags: it is one card, not a pop-up, and it goes away when the student does it or taps Not now (it returns after seven more days).
2. The screen asks two things: "What helped this week?" and "One thing to try next week?" Each has a box. Both are optional; the student can answer one or both.
3. **Done** saves the answers and shows a two-sentence reply: the first restates one thing they said in their own words, the second is a question about next week. Under it are the three feedback buttons (M3). With no AI, or if the AI's reply fails a check, the fixed line shows instead: "Noted. Same two questions next week."
4. The answers are kept as lines in What the app remembers about me, under Reflections, each deletable.

## Research link
`design/slices/COACH-plan.md` COACH-5 and `design/slices/MEMORY-plan.md`. Self-monitoring with a prompt for one small change is the supported shape; the reply restates and asks, never praises or judges. Design judgment for the wording.

## What it stores
Up to two `reflection` lines per week: the student's own words (cut to 300), source "student". The reply is not stored. The date of the last reflection is the newest reflection line, so deleting the lines makes the card come back, and nothing else is stored.

## What leaves the phone
Nothing with Apple's on-device model. With the student's own AI service, the student's two answers (quoted), up to ten kept step names from assignments finished in the last seven days (quoted), and up to two earlier reflection lines, plus the fixed rules, go to the service once per Done. A D8 row names this; parent to confirm before classmates.

## Rules for the AI line
New shape `twoSentences`: exactly two sentences, the second ends with a question mark, under 40 words in all, one line, no long quotation. The first sentence may use only words of five letters or more that appear in the student's answers (so it restates and cannot invent). Fixed rules: restate, then ask one question about next week, do not praise or judge, do not mention attention or focus. A safety word shows the trusted-adult line. Any failed check shows the fixed line.

## Distracted, stuck, back after a week
Optional and never blocking. A double tap of Done makes one call. Leaving the screen after Done keeps the lines.

## Differs from the web app
No.

## Tests
Seven-day rule with the fake clock (shows on day 7, not day 6; Not now defers seven days; deleting the lines brings it back); two-sentence shape (one sentence, three sentences, a first sentence with a new long word, no question mark, 41 words); NOTHING and every failure show the fixed line; the safety word shows the line; instructions are the fixed ones; the allow-list for the move is pinned (reflection last two, obstacle this week up to three) and a deleted line is never sent; one call per Done; with only one answer the call still works and with none no call is made; answers are saved as deletable lines of the student's own words; the words have no shame or praise. UI: answer both, Done, see the reply or the fixed line.

## Unverified
Whether a real model restates faithfully. Phone check later.

## Gates
Gate 1 (semantic_reviewer, a fresh read-only agent, 2026-11-24): FIX FIRST, applied in the Gate 1 response below. Gate 2: pending. Gate 3: pending.

## Gate 1 response (changes to this design)
- **When the card shows.** A small stored date in Settings, the day the reflection card was last handled (Done with words, Done with nothing, or Not now). The seven days run from there. With no date, the first visit to Plan starts the clock and shows nothing. Deleting reflection lines never brings the card back, so a student is not prompted again for deleting their own words. Not now waits seven days, like Done; it is as easy to tap as the action.
- **Only the two answers are sent.** No step names, notes or earlier reflections, so there is nothing sent that the reply could not use, no `sees` rule and no day window in the allow-list. The D8 row names only the two answers.
- **Word checks.** The whole reply, both sentences, may use only words (three letters or more) that are in the student's answers or in a short allowed list of function words (the move's `allow`), and any number must come from the answers. The second sentence must start with one of the move's start words. Nothing about attention, focus or a diagnosis can appear, because those words are in neither the answers nor the list unless the student wrote them. The check restates words, not meaning, so a reply can still misreport what the student meant (Unverified).
- **Sentence shape.** Exactly one sentence boundary: a full stop or exclamation mark followed by a space and a capital letter or digit. Exactly one question mark, as the last character. A known abbreviation (e.g., i.e., Mr., Mrs., Dr., p.m., a.m.) makes the reply fall back, as does anything with more or fewer boundaries. Decimals have no following space, so they are safe. At most 300 characters and 40 words.
- **Feedback.** The three buttons (M3) sit under the AI's reply, not under the fixed line. `weeklyReflection` is added to the feedback moves and to the plain names in What the app remembers about me.
- **Reflection lines.** Source student, cut to 300, deletable in M4. New lines get fresh ids, so the deleted-id list is not involved.
