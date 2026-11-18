# Design: paste and split

Status: **built.** Paste, the six kinds of work, starter steps, the two-minute start, and Start opens the work screen. Editing the steps is not built yet.

## What the student sees and does

1. **Paste screen.** A large box with the heading "What's the assignment?" and this line under it: "Paste the instructions or what you have to do. This stays on your device." (See the AI note below; this line changes if the AI path is ever added.)
2. The student pastes the text. Nothing is sent anywhere.
3. **Describe it.** Below the box, five buttons ask "What kind of work is this?": Essay, Reading, Problem set, Project, Studying for a test. Plus a "Something else" option that uses the general starter steps. The student taps one.
4. **Starter steps.** The app shows five steps, with a short line at the top: "Here's a start. Change anything you like." The steps come from:
   - the starter list for the kind of work the student picked (for example, an essay: "Read the instructions again", "Write down the question in one sentence", "List three points", "Write a rough first paragraph", "Re-read and fix one thing"), and
   - any numbered items or bullet points found in the pasted text, which replace the matching starter steps first.
   The list is trimmed to five. Extra items the student may want stay one tap away ("Show more steps").
5. The student can edit a step's words, delete a step, reorder steps, add a step, or merge two steps. Nothing is saved until they tap **Start**.
6. Tapping **Start** leads to the work screen (item 3). Until then, the button does nothing more than confirm the steps are ready.

Pasted text is cleaned with `cleanPastedText` (already built and tested), and text over 6,000 characters is cut off with a plain message: "That's a long one. The first 6,000 characters are kept."

## Research behind it

- **Splitting work into pieces:** Bikic et al. 2017, rated Strong (`00-knowledge-summary.md` section 2). The student does the splitting; the app proposes.
- **Starter list not the answer:** DECISIONS P1 (the app suggests; the student edits). Rule 1 in `AGENTS.md`: hints, never answers. The starter steps are process steps, not content.
- **Five steps by default:** DECISIONS P2 gives the choice of about 3, 5, or 8. Ben chose five. Section 4 of `00-knowledge-summary.md` warns that a long list of tiny steps can look worse than the original work, so the cap matters.
- **Describe first, then steps:** design judgment, to be tested with students. Asking "what kind of work is this?" after the paste is a choice Ben made; we will check whether students find it helpful.

## What data it stores

- Nothing is stored in this step. The pasted text and the steps live only in the page until **Start** is tapped.
- Item 4 (saving and coming back) will decide what is saved, through `js/storage.js`, the only file that touches local storage (DECISIONS T3).

## Distracted, stuck, or back after a week

- **Nothing pasted, tap Next:** the box says gently "Paste something to start." No red text.
- **Nonsense or a single word pasted:** the steps still appear from the chosen kind; no error. The student can edit them.
- **Leaving mid-step** (closing the tab on the paste screen): nothing is lost because nothing is saved yet. Once item 4 is built, drafts can survive a refresh.
- **Back after a week:** this screen is the start of a new piece of work, so nothing special happens here. Item 4 covers the "pick up here" button.
- **Stuck on a step:** not on this screen. The work screen handles it (item 3).

## Checklist (AGENTS.md stage 1)

- [x] Breaks no rule. Hints and process steps only; no answers; no shame text; no data leaves the device.
- [x] Matches DECISIONS.md: P1 (student edits), P2 (five by default), T3, T11 (text shown with `textContent`), T12 (phone width).
- [x] Not on the trap list. Checked against `05-adhd-ideation.md` and "Things to avoid" in `00-knowledge-summary.md`. It does the splitting only in the sense of a starter list, which the student must edit.
- [x] The student does the thinking: they describe the work, choose the kind, and edit every step.
- [x] One thing on screen at a time for the work itself; this screen is a single paste box plus one choice and a list to edit.
- [ ] Small enough for one session: it is large. If Ben wants, the first build is paste + kind + starter steps, and editing (add, delete, reorder, merge) is a second session.

## Plain-words summary for Ben

The student pastes their assignment, taps the kind of work it is, and sees five starter steps they can change, delete, reorder, or add to. Nothing is sent anywhere and nothing is saved yet. The first build could cover just pasting and the starter steps, with editing as a second session. Is that what you want?

## Things to confirm with Ben

1. Is the five-kind list right (Essay, Reading, Problem set, Project, Studying for a test, plus Something else)?
2. OK to build editing in the same session, or split it into two?

## Added 2026-11-17: two-minute start

Idea from the ADHD Free Tools upload (its "Quick Wins" tool), rebuilt in our own words.

- On the steps screen, a button: **Give me a two-minute start.** It puts one step at the top of the list: "Set a timer for 2 minutes and start the first step. You can stop when the timer ends."
- The step is a process step, not an answer. The student may stop after two minutes, which is no failure.
- Pressing the button again does nothing extra; the step is never added twice.
- Nothing is saved. The student can still edit the list when editing is built.

**Research:** "The first step should take under two minutes" is design judgment, to be tested (`00-knowledge-summary.md` section 4, point 6). Quick Wins' own claims about dopamine and sound are not used.
