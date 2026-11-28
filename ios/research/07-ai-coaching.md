# AI coaching: what the research says about using an AI as a good helper

Research notes written 2026-11-22 for the question: **how should the app's AI be prompted and controlled so that it coaches well, without doing the student's thinking?** Sources and how much of each was read are in section 7. Nothing here is a decision; the plan that follows from it is in `design/slices/COACH-plan.md`.

**Ratings** follow `00-knowledge-summary.md`: Strong, Moderate, Weak, None. Most of the AI-tutoring work below is from 2025 and 2026, on college or high-school students without ADHD, and much of it is simulation rather than classroom trials. Treat it as **Moderate at best, and None for ADHD**.

---

## 1. The short version

1. **Withholding the answer is the product, not a wrapper.** The one randomised classroom trial (Bastani 2025, Moderate) found an unguarded chatbot raised practice scores and lowered the later test; a guarded version kept the gain and removed the loss. Every design below follows from this.
2. **The prompt alone cannot hold the line.** A deployed tutor that enforced answer-withholding as a per-turn, machine-checked rule found that one prose prompt asked to be warm, Socratic, never-revealing and factual at once "is overloaded, and these goals interfere under adversarial input" (Supervisor paper, 2026). Checks in code must run before and after the model. The app already does this (safety word, answer guard, process-step check).
3. **Help should be a ladder with a ceiling set by code, not by the student's words.** The same paper uses eight rungs, from "acknowledge" up to "state the approach", and sets the allowed rung per turn from trusted state (how many hints so far, what the student has tried), never from the student's text, so the student cannot talk the AI past it.
4. **Coaching that rises and fades beats both "always answer" and "only ask questions".** CoMeT (2026): support rises when the learner stalls at a decision and fades as soon as they take it up. It gave finished work in 1 session in 16, against 1 in 6 for a question-only tutor, and frustrated learners less.
5. **Models have a "compulsive intervention bias".** MetaCLASS (2026): in 41.7% of coaching turns the right move was silence; nine models chose silence only 6.6% of the time. A coaching prompt must offer "say nothing" as a first-class output and the app must honour it.
6. **Do not list banned phrases; state one principle.** A Socratic-probing agent that was told which praise phrases to avoid produced more praise. Replacing the list with one rule ("the reply after a right answer must be indistinguishable from the reply after a wrong one") fixed it. Length, warmth and pacing also leak judgment.
7. **The on-phone model is small.** Apple's own guidance: good at simple tasks; not facts, math or code; break tasks into steps; use length limits ("in one sentence"), clear commands, up to five examples; never put untrusted text in the instructions. This fits one-move prompts and rules out a free-ranging "coach".
8. **The coaching methods with evidence for ADHD are the plain ones** already in the app: self-monitoring, goal setting with an if-then plan, planning the work in small pieces. The AI's job is to run those well, not to invent new ones.

---

## 2. What the AI-tutoring research supports

| Finding | Source | Rating | What it means here |
|---|---|---|---|
| Guarded AI (hints, not answers) keeps the practice gain and removes the later loss | Bastani et al. 2025, PNAS, ~1,000 high-school students, randomised | **Moderate** (not ADHD) | Rule 1 stays a hard rule; every new AI job needs the answer check |
| A per-turn, machine-checkable withholding contract; deterministic detector before any model judgment; "prefer revising a reply over refusing it" | "Teaching an LLM Tutor to Withhold the Answer" (supervisor architecture), 2026, deployed CS tutor, simulated students only | **Weak** (no students; one course) | Keep checks in code; on a bad reply, fall back to a non-AI line rather than an error |
| Support rises when the learner fails at a decision point and fades on take-up; metacognitive demand held constant | CoMeT, 2026, 131 adults, within-subjects | **Weak to Moderate** (adults, coding) | The "stuck ladder" should rise one rung per stall and reset when the student acts |
| Models intervene when they should not; silence is a needed move | MetaCLASS, 2026, 1,015 simulated conversations | **Weak** (simulated) | Every coaching prompt gets a "nothing to add" output |
| Praise, reply length and warmth leak evaluation; a positive principle beats a banned list | Socratic probing design rules, 2026, eight simulated versions | **Weak** (simulated, physics) | No praise words in prompts; fixed short openers; same reply shape every time |
| Adding self-regulated-learning context to the system prompt raised tutoring quality only at an extensive level | "Prompting for Independent Learning", 2026 | **Weak** | Short SRL scaffolds in the prompt are not enough on their own; the app's structure (plan, monitor, reflect) must carry it |
| The on-device model needs simple tasks, length limits and clear commands | Apple WWDC25 session 248 | Vendor guidance | One job per prompt; no multi-step reasoning asked of the model |

## 3. Coaching methods with evidence for students with ADHD

These are the methods the AI should run. None is new to the project.

| Method | What it is | Evidence (from `01-evidence.md` and this search) | Already in the app |
|---|---|---|---|
| Self-monitoring | The student records whether they are on task at natural pauses | **Strong** (Gaastra 2016) | Yes: the five buttons at each step |
| Goal intention plus if-then plan | "My goal is X. If Y happens, then I will Z." | **Moderate** for self-regulation in children with ADHD (Gawrilow et al. 2013: lasting effects only when a goal session came first) | Partly: goals under Me; no if-then plan |
| Organisational-skills training | Break work into pieces, plan when to do each | **Strong** (Bikic 2017) | Yes: the editor, "I'll say my steps" |
| Goal Management Training | Stop, define the goal, list steps, do, check | One RCT in adolescents with ADHD (2026, 116 participants; abstract only, results not read) | The step loop is this shape |
| Motivational interviewing (OARS: open questions, affirmations, reflections, summaries) | A way of talking that keeps the student doing the deciding | Used with adolescents in schools; **Weak** for academic outcomes | No; relevant to tone only |
| Retrieval practice | Recall from memory instead of re-reading | **Moderate** | Yes: the recall question |

**What this means:** the AI should not be a general tutor. It should run six or seven small, named moves that each serve one of the methods above, and say nothing otherwise.

## 4. Design rules that follow

1. **One move per prompt.** Each AI job has its own fixed rules in `Shared/content.json`, one output shape, and one check in code. No prompt asks the model to decide which move to make; the app decides from state.
2. **A ladder with a code-set ceiling.** The stuck ladder keeps its order (hint, another hint, look it up, talk it through, ask a person). An AI rung may only be as revealing as its position allows, and the position comes from the count of hints shown, never from the student's message.
3. **Silence is an output.** Every coaching prompt ends with: "If there is nothing useful to add, reply with only the word NOTHING." The app shows nothing in that case.
4. **Rise and fade.** Support rises one rung when the student taps Stuck again on the same step; it resets to the bottom when the student completes a step or edits the plan.
5. **Interchangeable replies.** Prompts state a positive shape ("one question, under 20 words, that starts with What, How, Which or Where") rather than a list of banned words. No praise, no "great", no judgement of effort.
6. **Student text is data, never instructions.** It goes in the user message, quoted and cleaned (`Guide.clean`), as the app already does. Nothing the student typed ever goes in the instructions.
7. **Check in code first.** Safety word, answer guard, and a per-move shape check (one line, ends with "?", starts with a question word, under the cap) run before anything is shown or spoken. On any failure, show the fixed non-AI fallback from `content.json`, not an error.
8. **Measure it.** Each move gets scripted "student personas" in tests: the earnest stuck student, the answer-seeker, the "my teacher said it's fine" evader, and the injector. The must-pass gate is zero answer reveals.

## 5. What not to do

| Idea | Why not |
|---|---|
| A free-ranging "coach" persona that decides what to say | Models over-intervene (MetaCLASS); the small model is not built for multi-step reasoning (Apple); one overloaded prompt leaks under pressure (Supervisor paper) |
| Praise or encouragement lines from the AI | They leak judgement and shape behaviour toward pleasing the AI; the app's own fixed acknowledgements already do this job the same way every time |
| Letting the student's message raise the help level ("just tell me") | The ceiling must come from trusted state (Supervisor P2) |
| The AI judging whether a step is done or right | The app cannot check answers; Alpha School's accuracy loop is the failure case (`06`) |
| An AI "nudge" or reminder while a step is in progress | Breaks "never interrupt a step" (`06` M6); the check-in at step changes is the tested form |
| A banned-words list in the prompt | Made praise worse in the one study that tried it |

## 6. Open questions

- No study tests any of this with students with ADHD. The beta questions in `04` section 6 should add: "Did the AI ever tell you what to write?" and "Did it ever feel like it was grading you?"
- Whether the on-phone model follows a "reply NOTHING" instruction reliably is unverified; T14-style checks on a real phone are needed for each move.
- The hint-ladder ceilings (how revealing each rung may be) are design judgment until Ben tries them.

## 7. Sources and how much was read

| Source | Read |
|---|---|
| Bastani H. et al. (2025). Generative AI without guardrails can harm learning: evidence from high school mathematics. *PNAS*. https://hamsabastani.github.io/education_llm.pdf | Abstract and summary; already in `01-evidence.md` |
| "Teaching a Large Language Model Tutor to Withhold the Answer: A Supervisor Architecture and an Evidence-Driven Method for Tuning Socratic Behavior" (2026). arXiv:2608.12292 | Abstract, principles P1 to P6, hint ladder, method and results sections, by keyword |
| Cho B. (2026). Design Rules for Socratic Probing in Introductory Physics. arXiv:2610.22949 | Abstract and section 5 (design rules), by keyword |
| Hou X. et al. (2026). Adaptive Scaffolding Needs Contingency: An AI Tutor That Escalates and Fades on What the Learner Does (CoMeT). arXiv:2609.22993 | Abstract only |
| Liu N. et al. (2026). MetaCLASS: Metacognitive Coaching for Learning with Adaptive Self-regulation Support. arXiv:2602.02457 | Abstract only |
| "Prompting for Independent Learning: An Evaluation of Tutoring Behaviors in GenAI" (2026). *Future Internet* | Snippet only **(confirm)** |
| Apple. Explore prompt design & safety for on-device foundation models. WWDC25 session 248, via WWDCNotes summary | Full summary |
| Apple Intelligence Foundation Language Models Tech Report 2025. arXiv:2507.13575 | Abstract (3B on-device model, guided generation) |
| Gawrilow C. et al. (2013). Self-regulation strategies support children with ADHD... *PubMed* 24062181 | Abstract |
| Goal Management Training for Adolescents with ADHD: a multi-center RCT (2026). *J Abnorm Child Psychol* | Abstract only; results **(not read)** |
| NIDA. OARS: essential communication techniques (motivational interviewing handout) | Full handout |
| Khanmigo Lite system prompt (public gist, 2024) | Full text, as an example of a Socratic prompt |

Content from these sources was rephrased for compliance with licensing restrictions.
