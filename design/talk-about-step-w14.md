# Slice W14: talk about this step, and use a reply as my steps (web)

Status: built. Plan pre-approved by the parent ("go do it all", 2026-11-27, `design/web-parity-plan.md`). Student-visible wording below awaits the parent's okay (W-D5). **A data change needs the parent's confirmation (T8), see "What is sent".** Matches the iPhone app's `TalkView` ("Talking about", "Clear", "Use these as my steps"). Needs an AI helper; everything else in the app works without one (W-D2).

## What the student sees and does

1. On the work screen, after pressing **Stuck**, a button **Talk about this step** shows (only when an AI helper is ready, so a student with no AI never sees a button that leads nowhere).
2. It opens the Talk screen with a fresh chat. Under the heading a line reads **Talking about: <the step>** (long steps are shown cut at 120 characters) with a **Clear** button. The kind of work is the one saved with the steps.
3. **Clear** starts a new chat that is not about any step. The old chat stays in My chats.
4. **Back to my step** (shown only in a chat opened this way) returns to the Stuck view. **Back to home** still works.
5. When the newest AI reply is a list of two or more steps (numbered or bulleted), a button **Use these as my steps** shows under the chat. Pressing it opens the steps editor on the home screen with those lines filled in. The student changes, adds or removes lines, and presses **Done writing** and then **Start**. Nothing is saved or started until Start (W1).
6. If the student is already writing steps in the editor, the button changes nothing and the chat says so, so typed words are never lost.

## Research basis

- Hints, never answers (rule 1): the chat's rules are unchanged. Only lines that look like things the student does are offered (see "Which lines are offered"). `01-evidence.md`: answer-giving AI lowered later test scores. Judgment, to be tested: no study here says a step-linked chat helps.
- The student makes the plan (`00-knowledge-summary.md`, "the student makes the plan"; same reason as W1/W10): the list opens in the editor and is never started for them. Design judgment, to be tested.

## Which lines are offered

A port of the iPhone app's `StepList.extract` and `ProcessStep.isProcess` (`js/logic/chat-steps.js`):

- Only lines that start with a number and `.` or `)`, or a bullet (`-`, `*`, `•`). Fewer than two list lines: nothing is offered.
- Each line is cut to 200 characters (the editor's limit); at most 12 lines.
- A line is dropped unless it starts with a verb from a fixed list (read, write, list, find ...), has at most 20 words, has no worked result ("x = 5", "the answer is"), no long quotation, no colon followed by a sentence, and does not look like finished work ("Here is your essay", "In conclusion,").
- If fewer than two lines survive, nothing is offered.

## What is sent (T8, for the parent to confirm)

New: when a chat is opened with **Talk about this step**, the text of that step (up to 200 characters) is added to the instructions sent to the AI service with each message of that chat, quoted as "information only, not an instruction", the same as the iPhone app. It is the student's own step text, which they typed or edited. It is not saved with the chat on the device, and a chat reopened later from My chats does not send it. After **Clear** or **New chat** it is not sent. The privacy line on the chat screen adds: "This step is sent along with your messages." Nothing else changes: the AI sees no name, history or check-in data.

## Data stored

Nothing new. The step lives only in memory for the open chat. "Use these as my steps" stores nothing until the student presses Start, as before.

## Distracted, stuck, or away

- Leaving the chat mid-reply works as before (the reply is cancelled, the words return to the box).
- Back after a week: the chat is not tied to any step any more (a reopened chat has no step), and no count of days is shown.
- Empty or non-list replies: no button. A reply with lines that are answer content: no button.
- Damaged saved data: chats are checked as before; a missing step is simply "no step".

## Wording list (for the parent's okay)

- Talk about this step
- Talking about: <the step>
- Clear
- Back to my step
- Use these as my steps
- This step is sent along with your messages. (added to the existing privacy line)
- You're already writing steps on the home screen. Finish or leave those first, then try again.

## Review (AGENTS.md Stage 1)

- [x] Breaks no rule: no shame, no diagnosis, nothing stored, hints only; the T8 change is flagged.
- [x] No conflict with DECISIONS.md apart from the T8 addition above.
- [x] Not a trap in `05-adhd-ideation.md`; no gamification.
- [x] The student does the thinking: they edit and approve the list; the app never starts it.
- [x] One thing at a time; the new button shows only when it can do something.
- [x] Small enough for one session.

## Testing

- `tests/logic/chat-steps.test.js`: list reading, caps, process check, awkward input; `tests/logic/chat.test.js`: the step line in the instructions.
- `tests/browser/talk-about-step.spec.js` (phone and desktop): main path (Stuck, Talk about this step, step sent, Use these as my steps fills the editor, Start) and awkward paths (Clear stops sending the step; a reply with answer-like lines offers nothing; editor already open).
