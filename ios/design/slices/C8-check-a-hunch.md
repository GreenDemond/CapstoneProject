# C8 Check a hunch
Status: DEFERRED 2026-11-25 (parent decision: go with the recommendation; revisit after C5 has run for a few weeks)

## What the task asks
After the same tag (starting, stuck, drifting, time) appears on three record lines within 30 days and no pattern exists, the AI words one yes/no question; only Yes writes a pattern.

## Why it cannot be built yet
- Nothing in the app writes tags. Notes mirror into the record with no tags, class lines carry counts but no tag, and block answers (R5) have no tag. The only tagged lines would be ones that do not exist.
- Without a writer there is never a candidate, so the move would never run. Building the move now would be dead code.

## Decision needed (parent and Ben)
How should lines get tags? Options: (a) derive them from what the app already knows (a class line with Stuck or Drifted taps gets "stuck" or "drifting"; a block answer gets "time"; a note the student marks); (b) let the student tag a note in Me with one tap from the four words; (c) drop C8. Recommendation: (a) for class and block lines, and revisit C8 after C5 has run for a few weeks. Needs its own design note and a gate 1 review.

## Gates
Not started.

## Decision (parent, 2026-11-25: "go with recommendation")
Taken as accepting the recommendation above, with one amendment from the gate 1 reviewer: do not add a "time" tag to block-length answers, because any answer would count whichever way it points and R5 already acts on those answers.
- C8 is not built now. Revisit after C5 (weekly reflection) has run for a few weeks, when there are reflection lines to look at.
- When it is built: derive "stuck" and "drifting" candidates at read time from class lines' Stuck and Drifted counts (no tag writer needed), and for reflection lines use a one-tap tag the student chooses (option b). It needs its own design note and gate 1 first.
- Unresolved: the parent's message could also have meant C7's recommendation (leave as is). C7 stays open until the parent says so.
