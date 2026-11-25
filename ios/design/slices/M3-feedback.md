# M3 Feedback under AI lines
Status: approved for build 2026-11-24 after gate 1 FIX FIRST (six must-fix, applied below)

## What the student sees and does
1. Under an AI question on the Stuck sheet, under an AI question in the editor's split nudge, and under each AI chat reply on Talk: three small equal buttons, "Helped", "Meh", "Not this". One tap, a light haptic. Once tapped, the three buttons are replaced by one quiet line, "Thanks.", for that line only. No score and no totals.
2. There is no "why" box in M3 (see Not built).
3. Under the trusted-adult line and under the app's own fixed lines, there is no feedback row.
4. Under the Stuck question, when record lines were sent with it, a collapsed row "What the AI was told" lists exactly those lines, each as its kind and its text ("pattern: ...", "course: ..."). When none were sent the row is not shown. It lists what was sent, whoever wrote it, so it is never hidden.
5. If the last five Stuck-question ratings from the past 30 days (at least three of them) are mostly "Meh" or "Not this", the next time the student asks, the app shows its own fixed starter question first, and makes **no AI call** until the student taps "See the AI's question". If the latest three ratings are all "Helped", the AI comes first again. Nothing tells the student why.

## Research link
`design/slices/MEMORY-plan.md` section 4. Three equal buttons, not a score, because a scale invites judging oneself and a simple honest tap is the supported shape. Design judgment for the wording, to be tested on a phone.

## What it stores
One `feedback` line in `learner.json` per rating: text is `"<rating> <move>"` with the rating first, for example `helped stuckQuestion`, `meh splitNudge`, `notthis chat`. The text is never empty, the rating can never be cut off, and it parses by splitting on the first space. Nothing the student typed and nothing the AI said is stored. A chat rating names the move `chat` and carries no content, so deleting a chat leaves nothing to delete with it. Delete everything erases the file.

At most 100 feedback lines are kept per move (newest), so a busy move such as chat cannot push out the Stuck question's ratings. The overall feedback cap (500) stays.

## What leaves the phone
Nothing. Ratings are stored on the device and are not sent to any AI in this task. Using ratings in a request would need its own D8 line.

## Distracted, stuck, back after a week
Distracted: the row is optional. A double tap rates once. Leaving the screen after a tap keeps the rating. After a week, only ratings from the last 30 days count towards the bias.

## Differs from the web app
No.

## The bias, exactly
- Applies to the Stuck question only. The split nudge already shows its fixed line first and the AI question on a tap; a chat reply has no non-AI line to fall back to.
- Window: the newest five `stuckQuestion` ratings no older than 30 days. With fewer than three, no change.
- Fallback-first when "meh" plus "notthis" is more than half of the window. AI-first again when the newest three are all "helped".

## Not built in this task (on purpose)
- The optional "why" box. A free-typed line stored where the student cannot see or delete it line by line strains rule 5, because the viewer and per-line delete (M4, and the Plan viewer) are not built. It returns with M4.
- Per-move totals ("shown N, helped N...") belong to M4.
- Turning ratings into selector lines needs its own design and D8 line.

## Tests
- A rating writes exactly one line, rating first, never empty, and never changes `calls[0].instructions` on the next call; round trip through `limited(by:)`.
- A double tap rates once; a second line can still be rated.
- Bias: five "meh" gives fallback-first with no AI call until the tap; two "meh" of three gives fallback-first; fewer than three changes nothing; ratings older than 30 days are ignored; three newest "helped" returns AI-first; chat and split-nudge ratings never move the Stuck bias.
- 100 per-move cap: 150 chat ratings do not remove a Stuck rating.
- No feedback row under the trusted-adult line or any fixed line (safety line explicitly).
- The three buttons share one frame and style.
- "What the AI was told": lists exactly the lines sent; absent when none were sent.
- UI: rate "Not this" and "Thanks." replaces the buttons; the same at the largest text size.

## Unverified
Whether "Helped / Meh / Not this" read well to a student. Check on a phone.

## Gates
Gate 1 (semantic_reviewer, 2026-11-24): FIX FIRST, six must-fix, applied above: rating-first storage format; no stored "why"; "What the AI was told" shows exactly what was sent; chat ratings carry no content and the per-move cap; the bias rules and call timing named; missing tests added. Scope cut recorded in TASKS-coaching.md.
Gate 2: pending. Gate 3: pending.
