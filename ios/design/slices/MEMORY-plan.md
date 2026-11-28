# MEMORY: the learner record, retrieval, and feedback
Status: plan, 2026-11-22. Nothing built. Pairs with `design/slices/COACH-plan.md`; research in `research/07-ai-coaching.md` sections 1 to 5 and `research/00-knowledge-summary.md` findings 3 and 6.

**Stance (parent, 2026-11-22):** the app is a partner to one person. No diagnosis matters; the question is always "what helps this person succeed". Nothing in the record describes the person. Everything in it describes **conditions, settings, work and outcomes**, in the person's own words where possible, and the person can see, dispute and delete every line.

**Who this is for.** A Sonnet- or Haiku-class Builder, one slice per session. The three layers below are deliberately separate so each can be built and tested alone.

---

## 1. The three layers

```
 moves (COACH-plan)  <-- facts (≤ 5 lines, ≤ 600 chars)  <-- selector  <-- learner record
       |                                                                       ^
       v                                                                       |
   one line to the student  -->  feedback (👍 / 👎 / 😐 + optional why)  -------+
```

- **Learner record** (section 2): structured, versioned, on the phone, written by the app from what the student does and by the student directly. The AI never writes to it.
- **Selector** (section 3): picks the few lines relevant to one move right now. Rules first; semantic search second, on the phone only.
- **Feedback** (section 4): one tap after any AI line, feeding the record and the selector.

The moves themselves do not change. They receive a `facts: [String]` list exactly as `COACH-plan.md` section 0.1 already specifies.

---

## 2. The learner record (slice MEMORY-0)

### 2.1 What is in it

One file, `learner.json`, a `Storable` like `Profile` (`Storage/SavedTypes.swift`), with a `version`. Six kinds of entry. Each has `id`, `date`, `text` (plain words), `source` (`.app`, `.student`, `.confirmed`), and optional `tags` (see 2.3).

| Kind | What it holds | Who writes it | Example text |
|---|---|---|---|
| `setting` | A setting tried and the verdict | App, from "did that help" taps; summarised, not raw | "25-minute block: too long, 3 of 4 times" |
| `pattern` | A hunch the student confirmed with Yes | App proposes, student confirms (COACH-8) | "Starting is the hard part; a Get ready step helps" |
| `obstacle` | What got in the way | Student (the notes under Me, moved here) | "Phone kept buzzing" |
| `reflection` | Weekly answers | Student | "What helped: doing the reading first" |
| `course` | A class or subject and what has worked for it (see 2.2) | App + student | "History: sources first, then outline" |
| `feedback` | A thumbs tap on an AI line, with the move and the line's hash | Student | "stuckQuestion: 👍" |

**Never stored:** attention, focus, mood as a measure, effort judgments, a diagnosis, a name, a school. A `ContentTests`-style test greps the type definitions and the fallback strings for those words (same as today's "never stores" test).

**Caps** (constants on the type, like `Profile.noteCount`): 40 settings, 30 patterns, 200 obstacles, 26 reflections, 20 courses with 10 entries each, 500 feedback. Oldest dropped on save, newest kept.

### 2.2 Courses and assignments that build on each other

The parent's point: assignments ladder on each other within a class. Today the app knows only the kind of work (essay, reading…). Add:

- **Course** (optional): a short label the student types once per assignment ("History", "Algebra 2"), offered as a picker of recent courses. Stored on the assignment and the saved work. Not a school name, not a teacher.
- **Course memory**: when an assignment finishes, the app writes one `course` entry: the kind of work, the steps the student kept (their words, up to 8), which steps were marked Drifted or Stuck most, and the dread/crux pair if answered. That is the "what worked in this class" record.
- **Ladder link**: when a new assignment is started in a course with entries, the selector (section 3) offers the previous assignment's kept steps as facts to the step coach, and the comeback and stuck moves see that course's patterns first.

This makes "suggest some steps" learn per class without any model training: it is retrieval of the student's own past plans.

### 2.3 Tags

A small fixed set, chosen by the app from where the entry came from, never free text from the AI: `starting`, `stuck`, `drifting`, `finishing`, `time`, `place`, `sound`, `course:<id>`, `kind:<id>`, `move:<key>`. Tags make rule-based selection cheap and keep semantic search as a second step, not the first.

### 2.4 Tests for MEMORY-0

- Round trip for every kind; caps enforced newest-first; an older `learner.json` with no `version` or missing kinds loads as empty, not a crash (same pattern as `StorageTests`).
- The never-stores grep over the type and the words.
- Delete one entry; Delete everything removes the file (`AppModel.eraseEverything`).
- Course entry is written on finish with the kept steps, and not written when the assignment had no course.

---

## 3. The selector (slice MEMORY-1)

### 3.1 Rules first

`LearnerSelector.facts(for move: String, context: SelectorContext) -> [String]`, pure, in `Logic/`. `SelectorContext` carries: current kind, current course id, current step text, hints shown, and the move key. Per move, a fixed allow-list of kinds and tags (declared in the move's slice, mirrored in a table in `Shared/content.json` under `coach.moves.<key>.sees` so gate 2 reviews it):

| Move | May see |
|---|---|
| stuckQuestion | `pattern` tagged `stuck` or `starting` (newest 2); `course` for this course (1) |
| splitNudge | nothing |
| comebackSlice | `setting` about `time` (newest 1); `pattern` tagged `starting` (1) |
| settingFollowUp | `setting` for that setting (newest 3) |
| weeklyReflection | `reflection` (last 2); `obstacle` this week (up to 3) |
| tidyQuestion | nothing |
| stepCoach suggest / idea | `course` for this course (1, the kept steps); `pattern` tagged `starting` (1) |
| checkHunch (COACH-8) | the candidate pattern only |

Each line is rendered as `"<kind>: <text>"` and quoted with `CoachText.quoted` before use. Hard budget: at most 5 lines and 600 UTF-16 characters in total; drop the oldest first. Tested.

### 3.2 Semantic search, on the phone (slice MEMORY-2, after MEMORY-1 works)

**Why:** rules cover "the same class" and "the same tag". They miss "this step is like one that went badly before" when the wording differs. That is the case the parent raised (patterns and steps that work or don't).

**How, with no server and no third-party code:** `NaturalLanguage.NLEmbedding.sentenceEmbedding(for: .english)` is in the iOS kit (verified 2026-11-22 in `NLEmbedding.h`, iOS 14+): `vector(for:)` gives a fixed-length vector for a sentence, `distance(between:and:)` compares two. Store one vector per record entry alongside the text (a `[Float]`, about 512 numbers; at the caps above that is under 2 MB). At selection time, embed the current step (or the current question) and take the nearest 2 entries of the allowed kinds under a distance threshold, appended after the rule-selected lines, still inside the 5-line, 600-character budget.

**Guardrails:**
- Apple frameworks only in `Apple/` (`AGENTS.md` section 7): `Logic/Embedding.swift` declares `protocol SentenceEmbedding { func vector(for text: String) -> [Float]? }`; `Storage/Apple/AppleSentenceEmbedding.swift` wraps `NLEmbedding`; a `FakeSentenceEmbedding` returns deterministic vectors for tests (e.g. a bag-of-letters hash) so nearest-neighbour tests run on the Mac without the model.
- English only at first; if `sentenceEmbedding(for:)` returns nil for the phone's language, the selector uses rules only and says nothing about it.
- Vectors are computed when an entry is written, never at read time, so selection stays fast.
- Vectors are in the same file and the same backup rule as the text; they are derived data and are deleted with it.
- The AI never sees a vector or a distance, only the chosen lines.

**Not now:** a vector database, a graph, or cloud retrieval. Linear scan over at most a few hundred vectors is well under a millisecond.

### 3.3 Tests for MEMORY-1 and MEMORY-2

- Allow-list: a move never receives a kind or tag outside its row (table-driven test over every move).
- Budget: 20 candidate lines → at most 5 and ≤ 600 characters, newest kept.
- Course: a stuck question for "History" sees History's pattern and not Algebra's.
- Nearest-neighbour with the fake embedding: a step worded differently from a past bad one still pulls that entry; an unrelated one does not; threshold respected.
- No embedding available → rules-only result, no error.

---

## 4. Feedback on AI lines (slice MEMORY-3)

### 4.1 What the student sees

Under every AI line (a stuck question, a split nudge, a comeback slice, a chat reply): three small equal buttons, **👍 Helped · 😐 Meh · 👎 Not this**. One tap, haptic, no words. After 👎 or 😐, one optional line appears: "Why? (optional)" with a text box and Skip. Nothing is shown about totals. Same style for every move (rule 6: honesty earns the same; here, every rating is equally welcome).

### 4.2 What it does

- Writes a `feedback` entry: move key, the line's hash (not the line itself for chat replies, to keep saved text small), the rating, the optional why (quoted, cut to 200).
- **Per-move fallback bias:** if a move's last 5 ratings are 👎 or 😐 by majority, the app shows the move's non-AI fallback first and the AI line only on a tap ("See the AI's question"). The move's prompt does not change; what changes is how eagerly its output is shown. Resets when the next 3 are 👍.
- **Into the selector:** the "why" text becomes an `obstacle`-kind line tagged `move:<key>`, so future selections for that move can see "last time: too vague". Capped at 3 per move.
- **For the parent/Ben (on-device only):** Me → "How I work" shows per move: shown N, helped N, meh N, not-this N. No export, no upload.

### 4.3 Why thumbs and not a score

A 1-to-5 scale invites judging oneself; three equal buttons are a check-in, the same shape as Done/Drifted. The research on self-monitoring favours the simple honest tap; the research on rewards says never make one answer pay more.

### 4.4 Tests

- A 👎 writes one entry and never changes the prompt text sent (check `calls[0].instructions`).
- Majority 👎 over 5 → fallback-first; three 👍 → AI-first again.
- "Why" text is cut to 200 and quoted; it appears as a fact only for that move.
- Thumbs buttons have equal frame and the same style (view configuration test, as for the five work buttons).

---

## 5. "How I work" screen (slice MEMORY-4)

Under Me. Lists the record by kind in the student's words, newest first, with a delete per line and a one-line explanation at the top: "This is what the app has learned about how you work. The AI sees only a few of these lines at a time, and only the ones that fit what you're doing. Delete anything." Nothing here is a chart, a score, or a streak.

The exact lines the AI was shown for the last move appear under the AI's line as a collapsed "What the AI knew" row, so there is never a hidden prompt. This is the open-learner-model idea from the tutoring literature and rule 5 in practice.

---

## 6. Order, and how it joins COACH-plan

| Slice | Needs | Size | Notes |
|---|---|---|---|
| COACH-0, COACH-1, COACH-2 | nothing | as planned | Prove the guardrails with no memory |
| MEMORY-0 record + courses | COACH-0 | one session | Storage, caps, courses, tests |
| MEMORY-3 feedback | COACH-1 | one session | Thumbs under AI lines; fallback bias |
| MEMORY-1 rule selector | MEMORY-0 | one session | Facts into COACH moves; allow-list table |
| COACH-3 to COACH-6 | MEMORY-1 | as planned | Now with facts |
| MEMORY-2 semantic search | MEMORY-1 | one session | On-phone embeddings behind a protocol |
| MEMORY-4 How I work screen | MEMORY-0 | one session | Can be built any time after 0 |
| COACH-8 check a hunch | MEMORY-0, 3 patterns | one session | The one move that asks the student about themselves; one per week; Yes writes a `pattern` |
| COACH-7 fading coach | MEMORY-0 | one session | Reads `ownStepsCount` from the record instead of the profile |

## 7. Decisions needed (parent) before building

1. **D8 row:** when a student's own AI service is chosen, the selected record lines (≤ 5) go to it with the move's prompt. Recommendation: allow, since they are the student's own words and the student can see them.
2. **Course label:** is a free-typed class name ("History") acceptable to store? It is not a school or a teacher. Recommendation: yes, with the never-stores grep extended to common school-name words only if a problem appears.
3. **Feedback shown for chat replies too**, or only for coaching moves? Recommendation: both; the chat is where most AI words are.

## 8. Backlog (not for now)

- **Use a subscription instead of a key.** OpenAI's "Sign in with ChatGPT" (September 2026) lets Plus/Pro users let an app run requests against their plan with a weekly cap; the app never sees a key or their chats. Anthropic's terms do not allow Claude plan logins in third-party apps as of 2026-11-22. xAI/Grok: not checked. Needs: a parent decision, a D8 row, an OAuth flow, and a check of OpenAI's current terms. **The parent asked to be reminded about this later.** Recorded in `ROADMAP.md` Phase 3.
