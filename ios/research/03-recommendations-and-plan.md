# Recommendations and plan

Built on `01-evidence.md` and `02-platform-and-privacy.md`. Written so a parent and student can work through it together.

---

## 1. Recommendation in brief

1. **Build the Chrome extension first.** It can deliver every part of the idea, costs almost nothing, and is within reach of a student with AI help. Treat the phone app as a later phase.
2. **Lead with self-monitoring check-ins and recall quizzes.** These have the strongest evidence in students with ADHD.
3. **Block with friction, not walls.** A pause screen with a "back to work" button.
4. **Change the flow questionnaire into personal experiments.** The questionnaire sets a starting guess; the app tests it.
5. **Add AI last, hint-only.** It carries the most risk to learning and to privacy.
6. **Keep all data on the device and never ask about diagnosis.**
7. **Measure whether it works.** A small before-and-after test makes this a research project, not only a coding project.

---

## 2. Three approaches

| | A. Focus Coach extension | B. Extension plus phone companion | C. Phone app only |
|---|---|---|---|
| What it is | Chrome extension with all core features | A, plus a simple phone piece for blocking | iOS app using Screen Time |
| Covers the idea | Fully, in the browser | Fully, both devices | Blocking and manual quizzes only |
| Evidence fit | Best | Best | Partial |
| Build effort | Low | High | High |
| Main risk | School Chromebook may block it | Scope too large for a school deadline | Apple approval; cannot see the task |
| Recommended | **Yes, start here** | Later phase | No |

A cheaper version of B: use an existing phone tool (one sec, or Apple's built-in Screen Time) alongside the extension, and say so in the project write-up. That covers the phone without building for it.

---

## 3. Feature set for Approach A

Ordered by evidence strength. Each feature names its support.

**Must have (version 1)**

| Feature | What the student sees | Evidence |
|---|---|---|
| Session start | "What are you working on? For how long?" plus one if-then plan: "If I get distracted, I will ___." | Goal setting; if-then plans (weak, lab) |
| Check-ins | Every few minutes: "Still on it?" Yes / Drifted. One tap. | Self-monitoring (strong) |
| Pause screen | Opening a listed site shows a 10-second pause, the student's goal, and "Back to work" / "Continue anyway". | Friction (moderate) |
| Session end | "Type three things you remember." Then a 1–5 focus rating. | Retrieval practice (moderate); feeds experiments |
| My data | Simple chart: on-task share and focus rating by session. Visible only to the student. | Self-monitoring |

**Should have (version 2)**

| Feature | What the student sees | Evidence |
|---|---|---|
| Focus experiments | Start-up questionnaire picks settings to try. The app varies one per session (noise on/off, 12 or 25-minute blocks) and reports what went with the best ratings. | Noise helps ADHD, hurts others (moderate); breaks conflicting |
| Next-day recall | "Yesterday you studied X. What do you remember?" | Spaced retrieval |
| Light rewards | Streaks or points for completed sessions and honest check-ins. | Rewards (weak to moderate) |
| Rotating pause screens | Pause screen changes design over time. | Static interventions wear off (moderate) |

**Could have (version 3)**

| Feature | What the student sees | Guardrail |
|---|---|---|
| AI quiz questions | Questions generated from text the student selects. | Only selected text is sent |
| AI resource finder | "Stuck? Here are a hint and two places to look." | Hints and pointers only; no finished answers |

**Will not build**

- Brain-training games. No blinded effect on symptoms or grades.
- Reports to parents or teachers without the student choosing to share.
- Any screen asking about an ADHD diagnosis.
- Any claim to treat ADHD.

**Noise safety.** If the app plays noise, cap the volume and time-limit it. The supporting studies used exposures of minutes, and the authors flag hearing risk.

---

## 4. Phased plan

No dates are set because the project deadline is unknown. Each phase ends with something usable.

**Phase 0 — Feasibility checks**

1. Try to load an unpacked extension on Ben's school Chromebook. Record the result.
2. If blocked, ask the teacher who in district IT approves extensions.
3. Confirm project requirements and deadline with the teacher.
4. Try two existing tools for a few days each and note what is annoying.

Exit: a decision on which device the project targets.

**Phase 1 — Version 1**

Build the five must-have features. Use it for real homework for one week.

Exit: Ben has used it for at least five sessions and has a list of what to fix.

**Phase 2 — Test it**

Run the evaluation in section 5.

Exit: a results chart and a short write-up.

**Phase 3 — Version 2**

Add focus experiments, next-day recall, and rewards, in the order the test results suggest.

**Phase 4 — Optional**

AI features; phone companion; Chrome Web Store publication.

Phases 1 and 2 alone make a complete school project.

---

## 5. How to test whether it works

The ADHD classroom research relies heavily on single-subject designs: 76 of the 100 studies in the main meta-analysis. A student can run the same design.

**ABAB design, one person**

| Week | Condition |
|---|---|
| 1 | A — homework as usual. Extension records only. |
| 2 | B — extension features on. |
| 3 | A — features off again. |
| 4 | B — features on again. |

**Measures**

- Share of check-ins answered "on it".
- Number of attempts to open listed sites per session.
- Self-rated focus, 1–5.
- Next-day recall: items remembered.
- Minutes to finish a comparable assignment.

If the measures improve in both B weeks and fall back in the second A week, that is evidence the tool caused the change.

**Limits to state in the write-up.** One person. Self-report. The person knows which condition they are in. In week 1 the check-in prompt is itself part of the intervention, so the baseline may need to record site attempts only.

**If classmates take part.** Get the teacher's approval and written parent permission first. Collect no names; use participant numbers.

---

## 6. Risks

| Risk | Likelihood | Response |
|---|---|---|
| School Chromebook blocks the extension | High | Phase 0 check; fall back to a home computer |
| Student clicks "Continue anyway" every time | Medium | Lengthen the pause after each bypass; rotate screens |
| Check-ins become the distraction | Medium | One tap, no sound; let the student set the interval |
| AI gives answers and hurts learning | Medium if AI is added | Hint-only prompt; test it by trying to get answers out of it |
| Scope exceeds the deadline | Medium | Phases 1–2 are the project; the rest is optional |
| App is seen as surveillance | Low with local-only data | Student-owned data; no automatic reports |
| Evidence is thinner than it looks | Certain in places | Say so; most blocker studies are not in ADHD students |

---

## 7. Decisions to make with Ben

These are his choices. The recommendation is given for each, with the reason.

1. **Who is it for?** Himself first, classmates second, all public school students later. *Recommend: himself first.* He can test daily and needs no one's permission.
2. **Which device?** Depends on the Phase 0 result.
3. **How strict is blocking?** Pause screen with exit, or hard block. *Recommend: pause screen.* It has trial evidence, and hard blocks get uninstalled.
4. **What does "quiz" mean in version 1?** On-task check-ins, content recall, or both. *Recommend: both.* Each is one small screen.
5. **Keep the word "flow"?** The research separates flow from hyperfocus. *Recommend: call it "my focus recipe" and explain the difference in the write-up.* That distinction is a strength of the project.
6. **AI in version 1?** *Recommend: no.* It adds cost, privacy questions, and the risk of answer-giving.
7. **Who sees the data?** *Recommend: only the student.*
8. **What is the project's claim?** *Recommend:* "A tool that helps students stay on task and remember what they studied, built from research on ADHD and attention." Not "an app that treats ADHD".

---

## 8. Questions that would change this plan

- What is ACE, and what does the project have to deliver: a working app, a research paper, a presentation?
- What is the deadline?
- What grade is Ben in, and how much coding has he done?
- Which device does he do homework on, and is it school-issued?
- Does he want classmates to use it, or is it a personal tool?

---

## 9. First three steps

1. Ben reads section 4 of `01-evidence.md` (the summary table) and section 7 above, and marks where he disagrees.
2. Run the Phase 0 Chromebook check.
3. Sketch the five version-1 screens on paper before any code.
