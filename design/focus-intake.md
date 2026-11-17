# Design: how I work (focus intake)

Status: **proposed, waiting for Ben's go-ahead.** Not built yet.

## What this is, and what it is not

The intake asks a few questions by tapping, then shows a **"focus recipe" card**: a starting guess at the settings that might suit the student. It is labelled as a first guess. It does not claim to know what makes the student focus.

Research says no questionnaire can predict what will produce focus (`01-evidence.md` section B; `00-knowledge-summary.md` section 1, point 6). So the intake only sets up the test. The experiments that check the guess are version 2 (`03-recommendations-and-plan.md` section 3), and they are not part of this session.

## What the student sees and does

1. **Start.** "A few quick taps, so the app can make a first guess. Every answer can be changed later. There are no right answers." One button: **Start**.
2. **Four questions**, one per screen, each answered by one tap. Every question has a "Not sure" answer, which is treated as "try both," never as a missing answer. Each screen has a **Back** button.
   - **Q1. Sound or quiet?** Quiet · Background noise (white or pink) · Not sure
   - **Q2. How long can you stay on one thing?** About 12 minutes · About 25 minutes · Not sure
   - **Q3. What usually pulls you away?** Phone · Browser or games · My own thoughts · People nearby · Something else
   - **Q4. When you come back after a break, what helps you start?** A very small first step · A quick look at my notes · Just starting · Not sure
3. **The recipe card.** Four lines, each a plain guess:
   - Sound: quiet, or background noise. *First guess.*
   - Work blocks: about 12 minutes, or about 25. *First guess.*
   - Likely pull-away: the answer from Q3. Used later for the "If I get distracted, I will..." prompt.
   - Restart: the answer from Q4.
   The card says: "This is a first guess. The app will help you find out what works for you." Each line has a **Change** button that goes back to that question.
4. **Done.** One button: **Use this for now**. In this build the card is shown only on screen. It is not saved (see below).

Wording rules: no mention of flow, focus state, ADHD, or diagnosis. No "you should," no score, no ranking. Text is short, one thing per screen.

## Research behind it

- **A guess, then a test:** `01-evidence.md` section B, design implication. The app tests the guess later with one setting changed per session. The intake's wording must not claim more than that.
- **Noise helps some and hurts others:** Nigg et al. 2024 (`01-evidence.md`, B). So the card asks, and does not assign noise from the questionnaire. Noise is not played in this build. Any future noise setting needs a volume cap and a time limit (`03-recommendations-and-plan.md` section 3).
- **Block length:** break and block schedules have conflicting evidence (Biwer 2023; Smits 2025). The card offers two lengths and does not say one is better.
- **Hyperfocus is not flow:** `00-knowledge-summary.md` section 3, point 2. Q3 and Q4 ask about pull-aways and restarting, not about enjoying a game. The intake must not ask "what do you focus best on?", since that answer may describe hyperfocus.
- **If-then plans:** weak evidence (lab task only). The Q3 answer is used only to suggest wording for the student's own if-then plan. The student writes it.
- **Five taps at most:** `04-design-and-gamification-ideas.md` D11. This design uses four.

## What data it stores

- Nothing in this build. The answers live on the screen until **Use this for now**, then they are gone when the page is closed.
- Once item 5 ("saving and coming back") is built, the recipe will be saved on the device through `js/storage.js` (DECISIONS T3). Nothing leaves the device. The student can delete it.
- This is a deliberate gap, and it is noted in `PROGRESS.md` so it is not missed.

## Distracted, stuck, or back after a week

- **Leaves in the middle:** nothing is lost, because nothing is saved yet. Once storage exists, answers so far are kept (item 5).
- **Changes their mind:** **Change** on any line goes back to that question. The other answers stay as they were.
- **"Not sure" everywhere:** the card reads "We'll test both" on those lines. This is a valid result, not an error.
- **Tapping fast or double-tapping:** the second tap does nothing, and the next screen appears once.
- **Back after a week:** the intake is not shown again unless the student starts it. No "you haven't done this" reminder.

## Checklist (AGENTS.md stage 1)

- [x] Breaks no rule. No diagnosis question, no shame, no claim about treating ADHD or flow. No data leaves the device.
- [x] Matches DECISIONS.md: P2 and P10 (no sound by default: the noise option only records a preference), T11 (text as text), T12 (one thing on screen, large buttons).
- [x] Not on the trap list in `05-adhd-ideation.md` or "Things to avoid" in `00-knowledge-summary.md`. It does not predict focus, reward time spent, or ask about a diagnosis.
- [x] The student does the thinking: they choose each answer, and every line can be changed.
- [x] Small enough for one session: four screens and one card, with no storage and no sound.
- [ ] Ben has not yet approved the wording of the four questions and their answers. These are his to decide.

## Plain-words summary for Ben

The student taps four questions about how they work: sound or quiet, how long they can focus, what pulls them away, and what helps them restart. They get a card with a first guess for each, and "Change" buttons if they disagree. The card says plainly that it's a guess and the app will help them test it. Nothing is saved yet, and nothing is claimed about flow or ADHD.

## Things to confirm with Ben

1. Are the four questions and their answers right? Would you change the wording so it sounds like you?
2. Should the card be called a "focus recipe" (from `03` and `04`), or a different name? You chose the words for drifting and progress yourself, so this is yours.
3. OK to leave saving until the storage step, so the card is not kept between visits yet?
