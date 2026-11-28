# T02 Content and logic
Status: built 2026-11-20

## What the student sees and does
Nothing yet. This task adds the pure rules the screens will call (`FocusKit/Sources/FocusKit/Logic/`): work steps and the five choices, hints, starter steps, pasted-text cleaning, the welcome line, guide cleaning and AI instructions, safe sources, and conversation trimming.

## Research link
Rules are ported from the web app's tested logic (`js/logic/`). Drifted counts the same as Done (DECISIONS P5); Still working and Stuck never change steps (rule 6).

## What it stores
Nothing. `Step`, `Work` and `ChatMessage` are `Codable` so T03 can save them.

## What leaves the phone
Nothing.

## Distracted, stuck, back after a week
- Distracted: Drifted with a blank box or the same words changes nothing.
- Stuck: hints run out and return nil; Stuck never changes steps.
- Back after a week: the welcome line never mentions how long, and shows no count.

## Differs from the web app
Ported to Swift types (`Choice`, `Work.applying`). Choices are an enum, so an unknown choice cannot be made in Swift; the case file's "unknown choice" case is checked as "no such Choice exists, nothing applied". A work list with zero steps is not "all done" (the web app said it was). `Work(texts:)` drops blank steps. `History.trim` takes a `measure` so T11 can pass token counts; the case file uses characters (UTF-16 units). Rule shape kept: newest first, never start on an assistant message, newest always kept.

## Tests
`SharedCasesTests` runs all eight files in `Shared/cases` (test names are `cases/<file>.json`; a failure names the file and case number). `LogicTests` adds: zero steps, steps of only spaces, the Drifted/Still/Stuck invariants, cutting never splitting a character, trimming with a custom measure. The `guide.json` cases do not record which length and search setting each used; the test table infers them from the expected text (kind is always "Essay").
Mutation check: breaking Later made `cases/work.json` fail.

## Unverified
Text length limits count UTF-16 units to match the web app; non-ASCII behaviour is covered only by the `cut` test.

## Gates
Gate 1 and 2: no Advisor agent was available in this session. Self-review only (same model as Builder); `Shared/` unchanged. Advisor gate 2 still recommended for the changed-lines size.
