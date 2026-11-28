# Design and gamification ideas

Ideas only; nothing here is built. Written against the current plan: a web app, three weeks to build, assignment breakdown as the core feature, goals with a progress bar, and a beta with 5 to 10 students.

Each idea is tagged:

- **[Evidence]** — follows from a study in `01-evidence.md` or section 1 below.
- **[Judgment]** — a design opinion with no study behind it. Treat these as things to test in the beta.

---

## 1. What the new plan changes

The new plan changes three things from the earlier recommendation.

| Change | Effect | Suggested handling |
|---|---|---|
| Web app instead of extension | A web app cannot block other sites. | Blocking moves to the stretch extension. Check-ins move into the step flow (idea D4). |
| Login and sync in week 2 | Accounts mean storing data about minors, which the earlier plan avoided. It is also a large build for little benefit in a 3-week beta. | Skip login for the beta and save in the browser. If kept, use no real names and have a parent set up the account. |
| Beta with 5–10 students | Other people's children will use it. | Get the teacher's approval and written parent permission first. Check the AI provider's age terms. |

**Evidence for assignment breakdown.** This feature was not in the first review.

- Organizational skills training helps students with ADHD. A meta-analysis of 12 randomized trials (1,054 children) found improvements in teacher-rated organizational skills (g = 0.54), parent-rated organizational skills (g = 0.83), and grade point average (g = 0.29) (Bikic et al. 2017).
- One such program, HOPS, teaches students "how to break projects and studying for tests down into small, manageable pieces" and plan when to do each piece (Langberg et al. 2018).
- **The gap:** these programs teach the student to do the planning. An app that does the breakdown for the student is untested. Combined with the AI-crutch finding (Bastani et al. 2025), this argues for keeping the student involved in the breakdown (idea D2).

**Evidence for read-aloud.** Text-to-speech improved reading comprehension for students with reading disabilities (d = 0.35) (Wood et al. 2018). That study is about reading disabilities, not ADHD.

---

## 2. Design principles

1. **Make starting easy.** The first step should be nearly effortless. [Judgment]
2. **Show one thing at a time.** [Judgment]
3. **Respond immediately.** Every action gets visible feedback within a second. [Evidence: immediate feedback was part of the gamified condition in Dai et al. 2025]
4. **Keep the student doing the thinking.** The app proposes; the student decides. [Evidence: Bastani 2025; organizational-skills programs]
5. **Never shame.** Drifting and missed days are expected, and coming back is the behavior to reward. [Judgment]
6. **Keep it changing.** The same screen stops working after a while. [Evidence: Kovacs et al. 2018]

---

## 3. Design ideas

### Assignment breakdown

**D1. Starter step.** The first step of every plan takes under two minutes, such as "open the document and type the title". [Judgment]

**D2. You split first, then the app helps.** Three possible levels:

| Level | How it works | Trade-off |
|---|---|---|
| App splits | Paste the assignment, get the steps. | Easiest to demo; student learns least. |
| App splits, student edits | Student must reorder, merge, or rename at least once before starting. | Small effort; keeps ownership. |
| Student splits, app coaches | Student writes steps; app asks "is this one too big?" | Best fit to the evidence; hardest to build. |

The middle level is the practical choice for three weeks. A later version could reduce the app's help as the student improves. [Evidence]

**D3. One-step screen.** After planning, show only the current step in large type, with a small "step 3 of 7" marker. The full list is one tap away. [Judgment]

**D4. Check-in at each step change.** Finishing a step asks one question with four buttons: Done, Still working, Stuck, Drifted. This puts self-monitoring at natural pauses, so it does not interrupt work. [Evidence: self-monitoring, Gaastra et al. 2016]

- *Stuck* opens a hint or a pointer to a resource, never the answer.
- *Drifted* shows "Welcome back" and the current step.

**D5. Guess the time.** Before each step, the student guesses how many minutes it will take. Afterward the app shows the actual time. Over a week the student sees whether they over- or under-estimate. [Judgment; time management is a target of the organizational-skills programs]

**D6. Visual timer.** A ring or bar that shrinks, not a digital countdown. [Judgment]

### Staying on track

**D7. Parking lot.** A small box always on screen for stray thoughts ("look up that song"). The thought is saved for later and the student returns to the step. [Judgment]

**D8. Resume screen.** Returning to the app opens straight to "You were on step 3 of 7. Pick up here?" [Judgment]

**D9. Tomorrow's first step.** Ending a session asks the student to pick the first step for next time and when they will do it. [Evidence, weak: if-then plans]

**D10. One-line recall.** After a reading or study step, ask "One thing you just learned?" [Evidence: retrieval practice]

### Intake conversation

**D11. Five taps, not a form.** At most five questions, answered by tapping. Example questions: when do you work best, do you like sound or quiet, long blocks or short. [Judgment]

**D12. Output a "focus recipe" card.** The intake produces an editable card of starting settings, labelled as a first guess. The app later asks whether each setting helped. [Evidence: no questionnaire predicts flow; noise helps some students and hurts others]

### Look and feel

**D13. Calm by default.** Few colors, no red, short sentences, large buttons. A reduced-motion setting. [Judgment]

**D14. Read-aloud button.** Browsers have built-in speech, so this is cheaper to build than it sounds. [Evidence for reading disabilities only]

**D15. Wording.** "Pick up where you left off" in place of "You missed 3 days". [Judgment]

---

## 4. Gamification ideas

### Rules for the game layer

1. **Reward the behaviors the research supports:** finishing steps, honest check-ins, recalling, returning. Do not reward time spent in the app.
2. **Reward honesty equally.** "Drifted" earns the same as "Done". If only "Done" pays, students will tap "Done".
3. **Build up; do not take away.** Nothing dies, breaks, or resets to zero.
4. **Compare students only with themselves.**
5. **The game must take seconds.** If the game is more interesting than the homework, it has become the distraction.

These five are judgment. The evidence for gamification in ADHD is one trial in children aged 6 to 12 (Dai et al. 2025), plus the finding that reward-based classroom interventions had the largest effect in group studies (Gaastra et al. 2016).

### Ideas

**G1. Assignment as a quest.** Each assignment is a quest, each step a stage, and submitting is the final stage. The progress bar becomes a path on a map. This reuses the breakdown and the progress bar already planned, so it costs little.

**G2. Build-a-picture.** Each finished step adds a piece to a picture: a constellation gaining stars, a pixel image being revealed, a creature growing. A finished assignment is a finished picture, kept in a gallery. This gives a visible record of work done.

**G3. Comeback bonus.** Returning after a drift or a missed day earns extra points. Most apps punish the gap; this rewards the return.

**G4. Weekly goal in place of a streak.** "4 of 5 days this week" resets every Monday. A consecutive-day streak that breaks on one bad day tends to end with the student quitting.

**G5. Momentum meter.** An alternative to G4. A meter fills with each step and drains slowly, but never reaches zero.

**G6. Bullseye.** Paired with D5. A time guess within about 20% of the actual time scores a bullseye. The skill being scored is time sense, not speed.

**G7. Boss round.** Paired with D10. The end-of-session recall question is a "boss", and each thing remembered counts as a hit.

**G8. Fast-start bonus.** Points for starting the first step within five minutes of the planned time. This rewards starting, which is often the hardest part.

**G9. Unlockable looks.** Levels unlock themes, timer styles, and sounds. This supplies novelty without adding features.

**G10. Surprise at the finish.** Completing an assignment reveals a small surprise, such as a new theme or picture. Cosmetic only.

**G11. Personal bests.** "Most steps in a day", "best bullseye week". No ranking against others.

**G12. Team total.** The beta group shares one anonymous counter: "Together we finished 140 steps." Cooperative, with no individual scores shown.

**G13. Trophy card.** A weekly summary the student can choose to show a parent or teacher.

### What to avoid

| Mechanic | Problem |
|---|---|
| Leaderboards among classmates | Public comparison, and it shows who is using the app. |
| Streaks that reset to zero | One bad day erases progress. |
| Things that die or are lost (Forest-style) | Punishes the exact behavior the app expects. |
| Speed bonuses for finishing steps | Rewards rushing over quality. |
| Points for time in the app | Rewards the wrong thing. |
| Random prize draws or anything paid | Not appropriate for children. |
| Long animations or mini-games | Become the distraction. |

---

## 5. Suggested picks for a three-week build

Three mechanics fit the schedule because they reuse features already planned.

| Pick | Reuses | Why |
|---|---|---|
| D2 (middle level) + D3 + D4 | Assignment breakdown | Makes the core feature match the evidence. |
| G1 or G2 | Progress bar | Turns the planned bar into the reward. Choose one. |
| G3 + G4 | Daily and weekly goals | Replaces a streak with something forgiving. |

Cheap extras if time allows: D1, D7, D8.

Save for later: D5 with G6, G7, G9, G12.

---

## 6. Questions for the beta

With 5 to 10 students the beta cannot prove anything, but it can show which ideas to keep. Add these to the feedback form:

1. Did you change the steps the app gave you? Why or why not?
2. Which reward did you notice most? Which annoyed you?
3. Did you ever tap "Done" when you were not done?
4. After a day off, did you come back? What made you?
5. Was the game part ever more interesting than the homework?

---

## 7. Choices for Ben

1. Quest map (G1) or build-a-picture (G2)? If G2, what gets built?
2. How much should the app split the assignment for the student (D2)?
3. Weekly goal (G4) or momentum meter (G5)?
4. Is login worth a week of the build?
5. What should the app call drifting? The word sets the tone.

---

## Sources added in this file

- Bikic A, et al. (2017). Meta-analysis of organizational skills interventions for children and adolescents with ADHD. *Clinical Psychology Review*. https://doi.org/10.1016/j.cpr.2016.12.004 (abstract)
- Langberg JM, et al. (2018). Overcoming the research-to-practice gap: a randomized trial with two brief homework and organization interventions for students with ADHD. *Journal of Consulting and Clinical Psychology*. https://doi.org/10.1037/ccp0000265 (abstract and one excerpt)
- Wood SG, et al. (2018). Does use of text-to-speech and related read-aloud tools improve reading comprehension for students with reading disabilities? A meta-analysis. *Journal of Learning Disabilities*. https://doi.org/10.1177/0022219416688170 (abstract)
