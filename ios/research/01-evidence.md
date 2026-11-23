# Evidence base: what the research says about each part of the idea

**How to read this.** Each section covers one part of the app idea. Every claim has a confidence tag:

- **[Strong]** — meta-analysis or several controlled studies, in students with ADHD.
- **[Moderate]** — controlled studies, but small, or in a different group (adults, college students, people without ADHD).
- **[Weak]** — one study, lab-only, or self-report only.
- **[Gap]** — no direct evidence found.

**Limits of this review.** Most findings below come from paper abstracts, not full texts. Three sources are marked *(not read)* because the abstract was not retrievable. Nothing here is medical advice.

---

## 1. The idea, split into testable parts

| # | Part of the idea | Research name for it |
|---|---|---|
| A | Block distracting sites and apps | Digital self-control tools |
| B | Questionnaire on what helps the person reach flow | Personalized focus conditions |
| C | Ask "what are you doing?" during work | Self-monitoring |
| D | Quiz the student on the content | Retrieval practice |
| E | Find resources to deepen understanding | AI tutoring |
| F | Make it rewarding | Gamification |

"Quiz questions on what they are doing" can mean C or D. They are different interventions with separate evidence. Both have support.

---

## 2. Findings by part

### A. Blocking distractions

- **[Moderate]** Blocking tools reduce time on distracting sites. A meta-analysis of field experiments found a reduction of about 0.5 standard deviations (Roffarello & De Russis 2023; the effect size is from a secondary summary by Prosocial Design Network, which reports seven experiments).
- **[Moderate]** People with the least self-control benefit most. In a one-week field study of 32 office workers, focus and productivity ratings rose with blocking on. Those who gained most reported less control over their work and more susceptibility to social media (Mark et al. 2018). The participants were adults, not students, and the outcomes were self-rated.
- **[Moderate]** Awareness alone barely works. A systematic review of 28 interventions found that tools that only show usage statistics "were barely effective", and that blocks must be "sufficiently difficult to overcome" or users dismiss them. The authors rate overall confidence as low: small samples, short studies (Biedermann et al. 2021).
- **[Moderate]** A short delay plus an exit option beats a lecture. The *one sec* app shows a pause screen before a target app opens. Over 6 weeks with 280 users, actual app opens fell 57%. In a follow-up experiment (N = 500), the option to back out had the strongest effect, the time delay also helped, and the "think about it" message did nothing (Grüning et al. 2023).
- **[Moderate]** Static blockers wear off. Users start ignoring the same intervention. Rotating interventions kept them effective but made more users uninstall; explaining the rotation halved that attrition (Kovacs et al. 2018, HabitLab browser extension).
- **[Gap]** None of these studies tested students with ADHD, and none measured learning. They measured time on site or self-rated focus.

**Design implication.** Use friction (a pause screen with a "go back to work" button) rather than a hard wall or a usage dashboard. Let the student choose the blocked list. Vary the pause screen over time.

### B. Flow questionnaire and personalization

This is the weakest-supported part of the idea, and the part that most needs redesign.

- **[Gap]** I found no validated questionnaire that takes a student's answers and prescribes conditions that then produce flow. Flow questionnaires exist, but they measure whether flow happened, not what will cause it.
- **[Moderate]** Hyperfocus and flow are not the same thing. Hyperfocus has no agreed definition in the literature (Ashinoff & Abu-Akel 2021). In two studies of adult gamers with ADHD traits, flow was linked to higher self-efficacy and hyperfocus to higher burnout (Pyszkowska et al. 2026). A student saying "I focus best on video games" may be describing hyperfocus, which does not transfer to homework.
- **[Moderate]** One condition does differ by person, and the difference is measurable. White or pink noise gave a small benefit on attention tasks for youth with ADHD or high ADHD symptoms (g = 0.249, 13 studies, N = 335) and impaired performance in people without ADHD (Nigg et al. 2024). The studies used exposures of a few minutes. The authors warn about hearing damage from sustained use at volume.
- **[Weak, conflicting]** Break schedules. One study (87 university students) found fixed breaks gave better concentration and motivation than self-chosen breaks, with the same work completed in less time (Biwer et al. 2023). A later study (94 students) found no difference in productivity or flow, and found Pomodoro breaks raised fatigue faster (Smits et al. 2025). Neither studied ADHD.

**Design implication.** A questionnaire cannot reliably predict what works. Use it to form a starting guess, then have the app test the guess. Each session, the student tries one setting (noise on or off, 12-minute or 25-minute blocks) and rates focus afterward. After two weeks the app shows which settings went with the best sessions. This turns an unsupported claim ("the quiz knows your flow state") into a supported one ("the app helps you find out").

### C. Self-monitoring check-ins

- **[Strong]** Self-regulation interventions reduce off-task behavior in students with ADHD symptoms. A meta-analysis of 100 studies (627 participants) found classroom interventions overall reduced off-task and disruptive behavior. In the 76 single-subject studies, self-regulation interventions had the largest effect (mean SMD 3.61). In the 24 within-subject group studies, the self-regulation effect was smaller (0.56) and reward-based interventions were largest (1.82) (Gaastra et al. 2016).
- **Caveats.** Single-subject effect sizes are not comparable to group-study effect sizes and run much larger. The review covered only published studies, which the authors say biases effects upward. The interventions were mostly paper-and-teacher, not software.

**Design implication.** This is the best-supported feature. A periodic prompt ("Are you on your task? Yes / Drifted") with the student recording the answer is the classic form. Keep the answer private to the student.

### D. Content quizzes (retrieval practice)

- **[Strong for the technique, Moderate for ADHD]** Self-testing improves long-term recall. College students with ADHD (n = 25) and without (n = 75) showed the same moderate testing effect (d = 0.50 and 0.57) two days later (Knouse et al. 2016).
- **[Moderate]** A second study (36 with ADHD, 36 controls) confirmed the benefit and found ADHD status did not change it. Unmedicated students with ADHD still scored lower overall because they used shallower strategies when first studying (Minear et al. 2023). Quizzing helps but does not fix weak first-pass learning.
- *(not read)* Knouse, Rawson & Dunlosky 2020 tested key-term definitions in college students with ADHD. The Minear paper describes the three prior studies as having "conflicting results".
- **[Gap]** All of these are college students. I found no study in middle or high school students with ADHD.

**Design implication.** Short recall questions at the end of a session, and again a day or two later, are well supported. Free recall ("type what you remember") counts.

### E. AI help and resources

- **[Moderate]** AI that gives answers harms learning. In a field experiment with nearly 1,000 high school math students, a ChatGPT-style tutor raised practice grades 48%, but when access was removed those students scored 17% worse than students who never had it. A tutor prompted to give hints instead of answers raised practice grades 127% and largely removed the harm (Bastani et al. 2025).
- **[Gap]** Not tested in students with ADHD.

**Design implication.** Any AI feature must give hints, questions, and pointers to resources. It must not produce finished answers. This is a hard requirement, not a preference.

### F. Gamification

- **[Weak]** One randomized trial: 80 children aged 6–12 with ADHD, 8 weeks. The gamified version of a learning app (immediate feedback, rewards, levels) beat the same content without game elements on attention tests and on reading, writing, and math scores (Dai et al. 2025). One trial, younger children, not yet replicated.
- **[Strong, related]** Reward-based ("consequence-based") classroom interventions had the largest effect in group studies in the Gaastra meta-analysis (SMD 1.82).

**Design implication.** Immediate feedback and small rewards are reasonable. Keep them light; the goal is the homework, not the game.

---

## 3. What not to build, and what not to claim

- **Do not build brain-training games.** A meta-analysis of 36 randomized trials found computerized cognitive training had no effect on overall ADHD symptoms or on academic outcomes when raters were blinded. It improved working-memory test scores only (Westwood et al. 2023). An earlier meta-analysis found the same pattern: effects shrank when raters did not know who got the treatment (Cortese et al. 2015).
- **Why other reviews sound more positive.** Several meta-analyses report small symptom improvements from digital interventions (for example SMD −0.33 across 25 trials in Liu et al. 2024; SMD −0.35 on computer-rated inattention across 19 trials in Wong et al. 2023). These pool ratings from parents and teachers who knew the child was being treated. The blinded analyses are the stricter test.
- **Do not claim the app treats ADHD.** The supportable claim is "helps students stay on task and remember what they studied". A treatment claim is not supported by the evidence and would move the app toward medical-device regulation.

---

## 4. Summary table

| Part | Evidence in students with ADHD | Recommendation |
|---|---|---|
| C. Self-monitoring check-ins | Strong | Build first |
| D. Content quizzes | Moderate (college only) | Build |
| A. Blocking with friction | Moderate, but not ADHD-specific | Build, friction style |
| E. AI hints and resources | Moderate, not ADHD-specific | Build only with hint-only guardrails |
| F. Light rewards | Weak to moderate | Add lightly |
| B. Flow questionnaire as predictor | Gap | Redesign as personal experiments |
| Brain-training games | Negative when blinded | Do not build |

---

## 5. Sources

Read as abstract unless noted.

1. Gaastra GF, et al. (2016). Effects of classroom interventions on off-task and disruptive classroom behavior in children with symptoms of ADHD: a meta-analytic review. *PLoS ONE*. https://pmc.ncbi.nlm.nih.gov/articles/PMC4757442/ (full text searched)
2. Knouse LE, et al. (2016). Does testing improve learning for college students with ADHD? *Clinical Psychological Science*. https://doi.org/10.1177/2167702614565175
3. Minear ME, et al. (2023). Is practice good enough? Retrieval benefits students with ADHD but does not compensate for poor encoding in unmedicated students. *Frontiers in Psychology*. https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1186566/full
4. Knouse LE, Rawson KA, Dunlosky J (2020). How much do college students with ADHD benefit from retrieval practice when learning key-term definitions? *Learning and Instruction*. https://doi.org/10.1016/j.learninstruc.2020.101330 *(not read)*
5. Roffarello AM, De Russis L (2023). Achieving digital wellbeing through digital self-control tools: a systematic review and meta-analysis. *ACM TOCHI*. https://doi.org/10.1145/3571810 — effect size via https://www.prosocialdesign.org/library/digital-self-control-apps
6. Mark G, Czerwinski M, Iqbal ST (2018). Effects of individual differences in blocking workplace distractions. *CHI '18*. https://doi.org/10.1145/3173574.3173666
7. Biedermann D, Schneider J, Drachsler H (2021). Digital self-control interventions for distracting media multitasking: a systematic review. *Journal of Computer Assisted Learning*. https://doi.org/10.1111/jcal.12581
8. Grüning DJ, Riedel F, Lorenz-Spreen P (2023). Directing smartphone use through the self-nudge app one sec. *PNAS*. https://doi.org/10.1073/pnas.2213114120
9. Kovacs G, Wu Z, Bernstein MS (2018). Rotating online behavior change interventions increases effectiveness but also increases attrition. *CSCW*. https://doi.org/10.1145/3274364
10. Lyngs U, et al. (2019). Self-control in cyberspace: applying dual systems theory to a review of digital self-control tools. *CHI '19*. https://arxiv.org/abs/1902.00157 — catalog of 367 existing tools; useful for feature ideas.
11. Nigg JT, et al. (2024). Do white noise or pink noise help with task performance in youth with ADHD or with elevated attention problems? *JAACAP*. https://pmc.ncbi.nlm.nih.gov/articles/PMC11283987 (full text searched)
12. Ashinoff BK, Abu-Akel A (2021). Hyperfocus: the forgotten frontier of attention. *Psychological Research*. https://doi.org/10.1007/s00426-019-01245-8
13. Pyszkowska A, Nowacki A, Dziura N (2026). Two papers on hyperfocus, flow, and burnout in gamers with ADHD traits. *Research in Developmental Disabilities*. https://doi.org/10.1016/j.ridd.2026.105241 and https://doi.org/10.1016/j.ridd.2026.105321
14. Grotewiel MM, et al. (2022). Experiences of hyperfocus and flow in college students with and without ADHD. *Current Psychology*. https://doi.org/10.1007/s12144-021-02539-0 *(not read; plain-language summary at https://chadd.org/attention-article/hyperfocus-in-college-students-with-adhd/)*
15. Biwer F, et al. (2023). Understanding effort regulation: comparing 'Pomodoro' breaks and self-regulated breaks. *British Journal of Educational Psychology*. https://doi.org/10.1111/bjep.12593
16. Smits EJC, Wenzel N, de Bruin A (2025). Investigating the effectiveness of self-regulated, Pomodoro, and Flowtime break-taking techniques among students. *Behavioral Sciences*. https://doi.org/10.3390/bs15070861
17. Bastani H, et al. (2025). Generative AI without guardrails can harm learning: evidence from high school mathematics. *PNAS*. https://doi.org/10.1073/pnas.2422633122
18. Dai J, Wufue A, Zhang H (2025). Effectiveness of a gamified educational application on attention and academic performance in children with ADHD. *Frontiers in Education*. https://doi.org/10.3389/feduc.2025.1668260
19. Westwood SJ, et al. (2023). Computerized cognitive training in ADHD: a meta-analysis of randomized controlled trials with blinded and objective outcomes. *Molecular Psychiatry*. https://doi.org/10.1038/s41380-023-02000-7
20. Cortese S, et al. (2015). Cognitive training for ADHD: meta-analysis of clinical and neuropsychological outcomes from randomized controlled trials. *JAACAP*. https://doi.org/10.1016/j.jaac.2014.12.010
21. Liu X, et al. (2024). The effect of digital interventions on ADHD: a meta-analysis of randomized controlled trials. *Journal of Affective Disorders*. https://doi.org/10.1016/j.jad.2024.08.156
22. Wong KP, et al. (2023). Effectiveness of technology-based interventions for school-age children with ADHD. A JMIR-family journal (exact title not confirmed). https://pmc.ncbi.nlm.nih.gov/articles/PMC10698651/
23. Paul-Jordanov I, Bechtold M, Gawrilow C (2010). Methylphenidate and if-then plans are comparable in modulating the P300 and increasing response inhibition in children with ADHD. https://doi.org/10.1007/s12402-010-0028-9 — lab task only; supports adding an "if I get distracted, then I will…" plan at session start. **[Weak]**

### Searched but not covered

Body doubling, mindfulness apps, and organizational-skills programs (for example HOPS, Langberg et al.) came up in searches. I did not review them. HOPS is a school-counselor-delivered homework and planner program with randomized-trial support in middle schoolers with ADHD, and is worth reading if the project expands toward planning features.

## Phone AI prompting (added 2026-11-23)

- Apple, WWDC25 session 248, "Explore prompt design & safety for on-device foundation models" (transcript read in full). The on-device model is about 3 billion parameters; suited to summarising, classifying, conversation and revising text; weak on facts, maths and code; one clear task, a stated length, fewer than five examples and an all-caps DO NOT help; instructions outrank prompts, so safety goes in instructions and user text in prompts. Strength: vendor guidance, not a study.
- Apple technote TN3193 on the 4,096-token context window, read through a sourced summary (sairamkotha.hashnode.dev, 2026-10-15), not the technote itself. Strength: vendor guidance.
- The agent's own measurement on this Mac (macOS 27.2 model, one run per prompt): `research/08-phone-ai.md` section 4. Strength: weak (one run, newer model than Ben's phone, scored by the agent).
