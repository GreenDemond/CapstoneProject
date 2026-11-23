# P0 Talk reply tally
Status: built 2026-11-23 (gates 1 and 2 FIX FIRST, all must-fix applied)

Parent's yes: DECISIONS 2026-11-23 (P0-1). Plan: `design/slices/PHONE-AI-plan.md` P0 item 3.

## What the student sees and does
1. Nothing changes on Talk.
2. Under **Me → About and privacy**, below the privacy text and above the version line, one small section "How Talk replied on this iPhone" with five plain counts and no total, percentage, colour or chart:
   - The AI's reply was shown
   - The app showed "I can give hints, not the finished answer" instead
   - The app showed "The AI couldn't answer that one"
   - The chat got too long
   - The AI was not available
3. A note under it: "Counts only. What was said is not kept. Deleting chats does not change these; Delete everything does."

The trusted-adult line is **not** counted (gate 1): a count above zero would tell anyone holding the phone that the student wrote something about danger or distress, and the parent's yes did not include it.

## Research link
Design judgment, to be tested. It answers the question in `research/08-phone-ai.md` section 6: how often the app's own fixed lines replace a reply.

## What it stores
`talk-counts.json` (Storable, version 1): a plain struct `TalkCounts` with five whole-number fields, `shown`, `hintsOnly`, `couldNotAnswer`, `tooLong`, `unavailable`. No text, no dates, no chat id, no AI name. Each count is raised with `min(count + 1, 1_000_000)`, so it never overflows.
Never stored: any message, any reply, which AI was used, when.

## What leaves the phone
Nothing.

## Distracted, stuck, back after a week
No effect; the counts only grow.

## Differs from the web app
Yes; the web app has no tally.

## Behaviour
- **What is counted is what the student saw, not why.** `ChatEvent` does not say why a reply failed: an Apple guardrail hit with no text so far becomes the trusted-adult line (not counted); a guardrail hit after some text, a refusal, any other error, and an empty reply all become "couldn't answer". So the parent's "guardrail" and "refusal" are one count here.
- Mapping, inside `ChatModel.handle` only, after its existing guard: `finished` → shown; `answerRefused` → hintsOnly; `couldNotAnswer` → couldNotAnswer; `tooLong` → tooLong; `unavailable`, `keyNotAccepted`, `busy` → unavailable; `trustedAdult` → nothing.
- Nothing is counted in `stopAndKeep`, `endRun`, or when `handle` returns early. A stopped or superseded reply counts nothing.
- `ChatModel` owns the counts (`public private(set) var counts`). About reads `model.talk.counts`. They are loaded at launch; a damaged file loads as zero and is not written until the next counted reply.
- A failed save is silent; it never sets `saveNote`.
- `ChatModel.reset()` (called by Delete everything) sets the counts to zero in memory and saves nothing; the store's delete-all removes the file.
- "Older messages left out" is not counted until P2, which is where the trimming is reported (recorded in DECISIONS).

## Tests
Logic: each event adds one to the right count and nothing else; the trusted-adult line adds nothing; a stopped reply adds nothing; counts survive a relaunch (the same store); a damaged file loads as zero; Delete everything then one reply leaves exactly 1 in one count; the saved file holds only `version`, `value` and the five count keys.
UI: none (About already has a test-unfriendly scroll; device check instead).
Device-only: open About after a few chats and confirm the counts move.

## Unverified
Whether the counts are useful to the parent before P1; that is the point of collecting them.

## Gates
Gate 1 (2026-11-23, `semantic_reviewer`, Claude, version not stated, same family as the Builder): FIX FIRST, 5 must-fix, all applied: trusted-adult not counted; counts are what the student saw (guardrail and refusal are one count) and DECISIONS says so; "older messages left out" deferred to P2 and recorded; `ChatModel` owns the counts and `reset` zeroes them; a plain five-field struct so the key-set test holds. Suggestions taken: neutral heading, no total or colour, section below the privacy text, note that deleting chats does not change the counts.
Gate 2 (2026-11-23, `semantic_reviewer`, Claude, version not stated, same family as the Builder): FIX FIRST, 3 must-fix, all applied: the eval cases used kind ids that do not exist (fixed; the tool now stops on an unknown kind; the baseline was rerun); tests for every count (too long, key not accepted, busy) compare whole values; the Delete everything test now checks the file is gone before the next reply. Suggestions taken: `--runs` must be 1 or more; the damaged-file test checks nothing is rewritten.
