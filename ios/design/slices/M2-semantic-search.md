# M2 Semantic search on the phone
Status: NOT STARTED 2026-11-25 (sketch only, no review yet)

## What it would do
Store a small vector with each record line (computed on the phone with Apple's sentence embedding) and let the selector add the two nearest lines to a move's facts, inside the same five-line, 600-character budget.

## Why it was not built now
- Nothing in the app writes the kinds of line it would search over (patterns and tagged lines), so there is nothing useful to retrieve yet. M1's rules already pick the lines that exist.
- It adds vectors to `learner.json`. That file's key set is pinned by a test on purpose, and the vectors are derived from the student's words, so they are student data: they would need to show in What the app remembers about me and be removed with a deleted line.
- `AGENTS.md` section 7 requires the Apple API to be found in the SDK first. Not yet done: `NLEmbedding.sentenceEmbedding(for:)`, `vector(for:)` and `distance(between:and:distanceType:)` in `NaturalLanguage.framework/Headers/NLEmbedding.h`, and whether the embedding exists for the student's language on iPhone and iPad.

## Recommendation
Do not build M2 until C5 has produced reflection lines and C8 (deferred) has a source of tags, so there is something to search. Then check the API first (gate 5 if it differs), and write the design note.
