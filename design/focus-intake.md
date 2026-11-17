# Design: how I work (focus intake)

Status: **proposed, revised after advisor review (2026-11-16). Waiting for Ben's decisions (see the end) before any code.**

## What this is, and what it is not

The intake asks four questions by tapping, then shows a **first-guess card**: a starting guess at how the student might like to work. It does not claim to know what makes the student focus.

No questionnaire has been shown to predict what helps a person focus (`01-evidence.md` section B). So the intake only records the student's own picks and sets up the trial. The trial itself (one setting changed per session, then a comparison) is version 2 (`03-recommendations-and-plan.md` section 3). It is not in this design, and the card must not say it exists yet.

## Where it lives

- The paste screen gets one extra button, **How I like to work**, shown below the paste box. It opens the intake only when the student taps it.
- The intake is never shown on a first visit or on later visits by itself.
- In this build nothing is saved, so a page refresh or closing the tab loses the answers. The student starts again. This is stated on the start screen: "Your answers are kept only while this page stays open."

## What the student sees and does

1. **Start.** "Four quick taps. They give a first guess, and you can change any line. There are no right answers." Button: **Start**.
2. **Four questions**, one per screen, each answered by one tap. Every question has a **Not sure** answer. Each screen has a **Back** button.
   - **Q1. Sound or quiet?** Quiet · A steady background hiss, like a fan · Not sure
   - **Q2. Which work block would you like to try first?** Short (about 12 minutes) · Longer (about 25 minutes) · Not sure
   - **Q3. What usually pulls you away?** Phone · Browser or games · My own thoughts · People nearby · Something else · Not sure
   - **Q4. When you come back after a break, what helps you start?** A very small first step · A quick look at my notes · Just starting · Not sure
3. **The first-guess card.** Four lines, each showing the student's own pick:
   - Sound: quiet, a steady hiss, or not sure yet.
   - Work block to try first: short, longer, or not sure yet.
   - What pulls you away: the Q3 answer, or not sure yet.
   - Restart: the Q4 answer, or not sure yet.
   Every line shows **Change**, which goes straight back to that question and then returns to the card.
   The card's heading is **My first guess** (see decisions). Its footer says: "This is only a first guess. You can change any line any time."
4. **Done.** Button: **Close**. Nothing is saved or applied in this build.

Wording rules: no mention of flow, focus state, ADHD, diagnosis, or the trial. No "you should," no score, no ranking. One thing per screen. "Not sure" always means "not sure yet," never a failure.

## Research behind it

- **A guess the student makes, then a test later:** `01-evidence.md` section B. The card records the student's own pick. It does not assign settings from the answers.
- **Noise helps some and hurts others:** Nigg et al. 2024 (`01-evidence.md` B). The card offers a steady hiss as a choice; it is not played in this build. Any future sound needs a volume cap and a time limit (`03-recommendations-and-plan.md` section 3).
- **Work blocks:** design judgment, to be tested. The research on break schedules (Biwer et al. 2023; Smits et al. 2025) compared fixed breaks with self-chosen breaks; it did not compare 12-minute and 25-minute blocks. The two lengths come from the design idea in `01-evidence.md` section B, not from a study.
- **Hyperfocus is not flow:** `00-knowledge-summary.md` section 3, point 2. The intake does not ask "what do you focus best on?", since that answer may describe hyperfocus.
- **If-then plans:** weak evidence (a lab task only). The Q3 answer is only used later, to suggest wording the student writes themselves.
- **Few taps:** `04-design-and-gamification-ideas.md` D11 (at most five questions). This design asks four.

## What data it stores

- Nothing in this build. Answers live on screen until **Close**, or until the page is refreshed.
- Once saving exists (item 5 on the build list), the card is kept as one field inside the single `focusapp.v1` object, through `js/storage.js` (DECISIONS T3). Nothing leaves the device. The student can clear it.

## Distracted, stuck, or back after a week

- **Leaves mid-way or refreshes:** answers are lost; the student starts again. Stated on the start screen. Acceptable for four taps.
- **Changes their mind:** **Change** on any line returns to that question, then to the card. The other answers stay.
- **"Not sure" on every question:** the card reads "not sure yet" on each line. This is a valid result.
- **Double-tapping:** the second tap does nothing; the next screen appears once.
- **Q3 "Something else":** the if-then prompt has nothing to suggest. The prompt stays blank for that case, and the student types their own.
- **Back after a week:** the button is still there, and the intake is not offered again unless the student taps it. No reminder.
- **Reduced motion:** screen changes do not animate when the device asks for reduced motion (DECISIONS T12).

## Checklist (AGENTS.md stage 1)

- [x] Breaks no rule. No diagnosis question, no shame, no ADHD or flow claim, no data leaves the device.
- [x] Fits DECISIONS.md: T3 (saving later goes in `focusapp.v1`), T11 (text as text), T12 (phone width, reduced motion), P10 (no sound played in this build).
- [x] Not on the trap list in `05-adhd-ideation.md` or "Things to avoid" in `00-knowledge-summary.md`. It does not predict focus, reward time spent, or ask about a diagnosis.
- [x] The student does the thinking: every answer is theirs and can be changed.
- [x] Can be used in seconds with one thing on screen at a time: four one-tap screens and one card.
- [x] Small enough for one session: four screens and one card, with no storage and no sound.
- [ ] **Not yet approved.** Whether to build this now, or after saving (item 5). Ben's call (decision 1 below). The question wording, the card name, and the words for "coming back" are also his (`PROGRESS.md` "Waiting on").

## Plain-words summary for Ben

The student taps four questions about how they like to work: sound or quiet, which work block to try first, what pulls them away, and what helps them restart. They get a card showing their own picks, each with a Change button. The card says it's only a first guess. Nothing is saved or applied yet, and the card does not promise any trial. The trial comes later, as its own step.

## Decisions for Ben

1. **When to build it?** Options:
   - **After saving (item 5), recommended.** The card can be kept between visits, so it's worth more.
   - **Now.** Possible, but a card that disappears on refresh is less useful, and it uses time from the build list.
   - **Version 2.** Leave it out of the first version entirely.
2. **Card name:**
   - **My first guess (recommended).** Says plainly what it is.
   - How I'll try working. Friendly, and also honest.
   - Focus recipe. Avoid: it suggests a formula that works, which the research does not support.
3. **Q4 and the card's "Restart" line** use the words for coming back, which you still have to choose (`PROGRESS.md` "Waiting on"). Do you want to pick those words now, or leave them as they are?
4. **Q2 wording** now asks which block to try first, not how long the student can focus. Is that wording right?
