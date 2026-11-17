# Knowledge summary: helping students with ADHD get schoolwork done

This is the part of the research that holds whatever gets built: a web page, a phone app, a browser extension, or a paper planner. Platform details are in `02-platform-and-privacy.md`. Full sources and caveats are in `01-evidence.md`.

**How sure are we?** Each finding carries a rating:

- **Strong** — a meta-analysis (a study that pools many studies) or several controlled studies, in students with ADHD.
- **Moderate** — controlled studies, but small, or done with a different group such as adults or college students.
- **Weak** — one study, a lab task only, or self-report only.
- **None** — no direct study found.

Most findings were read from paper abstracts, not full papers. Nothing here is medical advice.

---

## 1. The short version

1. Have the student check their own attention. This has the best evidence.
2. Have the student recall what they studied. It works as well with ADHD as without.
3. Teach the student to break work into pieces and plan it. Do not do all of it for them.
4. Add friction before a distraction instead of a wall. Showing statistics alone does little.
5. If AI is involved, it gives hints, never answers.
6. No questionnaire has been shown to predict what helps a person focus. Help the student test it for themselves.
7. Do not build brain-training games, and do not claim to treat ADHD.
8. Collect as little data as possible, and never ask about a diagnosis.

---

## 2. What helps, and how well it is supported

| Technique | What it is | Rating | Key finding |
|---|---|---|---|
| Self-monitoring | The student regularly records whether they are on task | Strong | Largest effect on off-task behavior among classroom methods in single-student studies; smaller in group studies |
| Rewards for behavior | Immediate, small consequences for on-task work | Strong | Largest effect in group studies of classroom methods |
| Organizational skills training | Teaching students to split work into pieces and plan when to do each | Strong | Across 12 randomized trials with 1,054 children: better organization and a modest rise in grades |
| Recall practice | Recalling material from memory instead of re-reading | Moderate | Same benefit with or without ADHD; tested in college students only |
| Friction before distractions | A short pause and an easy way out before a distracting app or site opens | Moderate | One trial cut app opens by 57% in six weeks; not tested in students with ADHD |
| AI tutor limited to hints | AI that guides without giving the answer | Moderate | Largely avoided the learning loss caused by answer-giving AI; not tested in students with ADHD |
| Background noise | White or pink noise while working | Moderate | Small benefit for youth with ADHD; worse performance for those without it |
| Game elements | Immediate feedback, rewards, levels | Weak | One trial in children aged 6 to 12 |
| If-then plans | "If I get distracted, then I will…" | Weak | Improved a lab task only |
| Read-aloud | Text-to-speech while reading | Weak for ADHD | Helps students with reading disabilities; not studied for ADHD alone |
| Fixed break schedules | Pomodoro-style timed breaks | Weak, conflicting | One study favored fixed breaks, a later one found no difference; neither studied ADHD |
| Flow questionnaire | Asking what helps a person focus, then prescribing it | None | No such tool has been shown to work |

### What does not help

| Approach | Finding |
|---|---|
| Brain-training games | Across 36 randomized trials, no effect on ADHD symptoms or school performance when the raters did not know who was treated. Only working-memory test scores improved. |
| Usage statistics alone | A review of 28 tools found awareness-only tools "barely effective". |
| AI that gives answers | In a trial of nearly 1,000 high school math students, practice grades rose, but students later scored 17% worse without it than students who never had it. |
| Blocks that are easy to dismiss | Students dismiss them. The same static block also loses effect over time. |

---

## 3. Seven things the research says that are easy to miss

**1. "Quiz" means two different things.** Asking "are you on task?" is self-monitoring. Asking "what did you just learn?" is recall practice. Both work, for different reasons. Decide which is meant.

**2. Flow and hyperfocus are not the same.** Hyperfocus has no agreed definition. In adult gamers with ADHD traits, flow went with confidence and hyperfocus went with burnout. "I focus best on video games" may describe hyperfocus, which does not carry over to homework.

**3. What helps one student can hurt another.** Noise is the clearest case. So the useful move is to let each student try a setting and see the result, not to assign settings from a questionnaire.

**4. Recall practice helps but does not fix weak first learning.** In one study, unmedicated students with ADHD still scored lower overall because they used shallower strategies when first studying.

**5. The proven planning programs teach the student to plan.** A tool that does all the planning for the student is untested, and the AI findings suggest it may become a crutch.

**6. Honest reporting needs a payoff.** If only "done" is rewarded, students will say "done". Reward "I drifted" equally.

**7. Parent and teacher ratings look better than blinded ratings.** Several reviews report that digital tools reduce ADHD symptoms. Those effects shrink or vanish when the raters do not know who used the tool. Be skeptical of any product citing unblinded results.

---

## 4. Design principles

The first five follow from the evidence. The last four are design judgment and should be tested with real students.

**From the evidence**

1. **The student does the thinking.** The tool proposes; the student edits and decides.
2. **Feedback is immediate.** Seconds, not days.
3. **Reward the supported behaviors:** finishing a step, reporting honestly, recalling, and coming back. Do not reward time spent.
4. **Vary it.** The same prompt or reward stops working. Explain the changes so students do not quit.
5. **Let students test what works for them.** Try one setting, rate the session, compare.

**From judgment**

6. **Make starting nearly effortless.** The first step should take under two minutes.
7. **Show one thing at a time.**
8. **Never shame.** Drifting and missed days are expected. Nothing dies, breaks, or resets to zero.
9. **Make coming back easy.** After a gap, show where to pick up, and nothing about what was missed.

**A caution on small steps.** Splitting work has good support, but a long list of tiny steps can look worse than the original assignment. Let the student choose how many steps to see.

---

## 5. Things to avoid

| Avoid | Reason |
|---|---|
| Claiming to treat or improve ADHD | Not supported, and it moves toward medical-device rules |
| Brain-training or attention-training games | No blinded benefit |
| Giving finished answers | Harms later performance |
| Ranking students against each other | Public comparison, and it reveals who uses the tool |
| Streaks that reset to zero; things that die | Punish the lapse the tool should expect |
| Speed bonuses on work steps | Reward rushing |
| Automatic reports to parents or teachers | Turns self-monitoring into surveillance |
| Asking whether the student has ADHD | Sensitive, and unnecessary; the tool works the same either way |
| Loud or long noise | The noise studies used minutes of exposure, and the authors warn of hearing risk |

---

## 6. What is honest to claim

**Supported:** "A tool that helps students stay on task, plan their work, and remember what they studied, built on research about ADHD and attention."

**Not supported:** "Treats ADHD." "Improves attention." "Puts you in a flow state." "Proven to raise grades."

**Limits to state openly**

- The distraction studies were done with adults and general users, not students with ADHD.
- The recall studies were done with college students.
- The classroom studies used paper and teachers, not software.
- No one has tested these parts combined in one tool.

---

## 7. Privacy rules that apply to any version

Not legal advice. Raise these with the teacher before other students use anything.

1. Keep data on the student's own device where possible. No accounts unless truly needed.
2. Never record a diagnosis.
3. The student owns and sees their data. Sharing is the student's choice.
4. If AI is used, send only the text the student chooses.
5. Get the teacher's approval and written parent permission before classmates take part.
6. US law has specific rules for online services that collect personal information from children under 13 (COPPA), and separate rules for student records held by schools (FERPA). Collecting nothing avoids most of both.

---

## 8. How to tell whether it works

The classroom research on ADHD mostly uses single-student designs, and a student can run one.

**Design.** Alternate weeks: without the tool, with it, without, with. If results improve in both "with" weeks and fall back in between, the tool is the likely cause.

**What to measure**

- Share of check-ins answered "on task"
- Items recalled the next day
- Time to finish a comparable assignment
- Self-rated focus, 1 to 5
- Whether the student came back after a missed day

**What to admit.** One person, self-reported, and the person knows which week is which.

**What to ask testers**

1. Did you change the steps you were given? Why?
2. Did you ever say "done" when you were not?
3. After a day off, what brought you back?
4. Was the game part ever more interesting than the homework?
5. Did the small steps make the work feel shorter or longer?

---

## 9. Open questions

No study found answers these. Each could be a project question in its own right.

- Does AI-generated task splitting help, or does it replace a skill the student needs to build?
- Do these techniques work as well in middle and high school as in the groups studied?
- What brings a student back after a lapse?
- Is dread of a task a better target than the size of the task?
- Do game elements keep working after the first few weeks?

---

## 10. Key sources

Full list with links and reading notes in `01-evidence.md` and `04-design-and-gamification-ideas.md`.

| Topic | Source |
|---|---|
| Self-monitoring and rewards | Gaastra et al. 2016, *PLoS ONE*. https://pmc.ncbi.nlm.nih.gov/articles/PMC4757442/ |
| Organizational skills training | Bikic et al. 2017, *Clinical Psychology Review*. https://doi.org/10.1016/j.cpr.2016.12.004 |
| Recall practice | Knouse et al. 2016. https://doi.org/10.1177/2167702614565175 · Minear et al. 2023. https://doi.org/10.3389/fpsyg.2023.1186566 |
| Friction | Grüning et al. 2023, *PNAS*. https://doi.org/10.1073/pnas.2213114120 |
| Blocking tools reviewed | Biedermann et al. 2021. https://doi.org/10.1111/jcal.12581 |
| Interventions wearing off | Kovacs et al. 2018. https://doi.org/10.1145/3274364 |
| AI and learning | Bastani et al. 2025, *PNAS*. https://doi.org/10.1073/pnas.2422633122 |
| Noise | Nigg et al. 2024, *JAACAP*. https://pmc.ncbi.nlm.nih.gov/articles/PMC11283987 |
| Hyperfocus and flow | Ashinoff & Abu-Akel 2021. https://doi.org/10.1007/s00426-019-01245-8 · Pyszkowska et al. 2026. https://doi.org/10.1016/j.ridd.2026.105241 |
| Brain training | Westwood et al. 2023, *Molecular Psychiatry*. https://doi.org/10.1038/s41380-023-02000-7 |
| Game elements | Dai et al. 2025, *Frontiers in Education*. https://doi.org/10.3389/feduc.2025.1668260 |
| Read-aloud | Wood et al. 2018. https://doi.org/10.1177/0022219416688170 |
