# Shared/

The app's words and rules, and the cases its logic must pass. Written once on 2026-11-20 from the web app's tested logic. This folder now owns them (`design/04-engineering-and-plan.md` section 4.4). Changing any file here needs Advisor gate 2 and a line in the `DECISIONS.md` change log.

## content.json

| Key | What it is |
|---|---|
| `kinds` | The six kinds of work, each with its label and starter steps in order |
| `defaultStepCount`, `twoMinuteStep` | How many steps to show first; the optional two-minute first step |
| `stuckHints` | The built-in hints, in the order they are shown |
| `limits` | Character and count limits for pasted text, steps, messages, guides, sources and saved chats |
| `safety.word` | The single word the AI is told to reply with when a student seems in danger or distress |
| `safety.line` | The only thing the student then sees |
| `chat` | The fixed opening question, the AI rules, the default guide, reply lengths, the rules reminder, the look-up line |
| `stepCoach.rules` | The AI rules for suggesting steps |
| `coach` | The AI rules every coaching move shares (`common`), the word meaning "nothing to add" (`nothingWord`), and one entry per move under `moves` with its `rules` and non-AI `fallback` |
| `pickup` | The two welcome lines. Neither mentions how long the student was away |
| `howILikeToWork` | The four one-tap questions and their answers |

## cases/

Each file names the rule it covers in its `function` line, then lists inputs with the expected output. The Swift tests load these files and must match every case.

| File | Rule |
|---|---|
| `work.json` | What Done, Still working, Stuck, Drifted and Later do to the steps, including the cases where nothing must change |
| `hints.json` | Which hint comes next, and nothing after the last |
| `starter-steps.json` | Steps found in pasted text come first, then the starter steps, with no repeats |
| `trim-history.json` | Keeping the newest messages that fit; never starting on an AI message |
| `guide.json` | Cleaning the student's guide so it cannot imitate the rules, and the full instructions built from it |
| `sources.json` | Keeping only safe, distinct source links, at most five |
| `clean-text.json` | Cleaning and cutting pasted text |
| `pickup.json` | Which welcome line to show. Times are local |

Notes for the port:

- `trim-history.json` and the limits count characters as the web app did (UTF-16 units). The iPhone app trims by the model's token count instead (`design/03-ai-search-privacy.md` section 3.3); keep this rule's *shape* (newest first, never start on an AI message) and say so in the slice note.
- `guide.json` cases 4 and 5 are attempts to close the quoted block early. They must stay passing.
