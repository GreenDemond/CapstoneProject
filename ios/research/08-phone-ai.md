# 08. Getting good replies from the phone's own AI

Written 2026-11-23, after the parent reported that the phone's AI "provides similar canned answers that have little bearing on reality". This note says why, what Apple's framework offers, and what was measured. The plan that follows from it is `design/slices/PHONE-AI-plan.md`.

## 1. The short version

- The repetition is mostly caused by **our prompt**, not by the model. With our current rules, the model answers almost every message with a variation of "What part of X feels hardest?" (measured, section 4). The rules push it there: "give hints, questions…", the default guide's "End with one question for me", and "never give the answer" together make a generic question the safest reply.
- Rewriting the rules so the reply leads with **one concrete next move**, and asks a question only when needed, made replies specific to what the student typed. It also brought new problems that have to be designed out: invented details, echoing the student's words, refusing legitimate help, and one false trusted-adult reply.
- Apple's **guided generation** (a fixed reply structure the model must fill) gave the steadiest replies in the test, with no echo and no invented details. It is the most promising direction, and it fits the coaching moves even better than the chat.
- The app itself also shows **fixed lines** in place of the AI's reply when a check trips ("I can give hints, not the finished answer. What have you tried so far?", "The AI couldn't answer that one."). How often that happens on Ben's phone is not known. It should be counted before anything else changes.

## 2. What the model is, from Apple's sources

- The on-device model has about 3 billion parameters. Apple says it suits summarising, classifying, multi-turn conversation, composing and revising text, and tagging. It is not meant for world facts, maths, or code, and it may make things up about what it does not know. Source: Apple, WWDC25 session 248, "Explore prompt design & safety for on-device foundation models" (transcript read in full).
- Apple's prompting advice for this model, from the same session: give one clear, specific task; say the length you want ("in three sentences"); a role helps; fewer than five examples can help; an all-caps "DO NOT" works for things to stop. Instructions take priority over prompts, so safety belongs in the instructions, and student text belongs in the prompt, never in the instructions.
- The context window is 4,096 tokens per session on iOS 26: instructions, every prompt, and every reply share it (Apple technote TN3193, as summarised with sources at sairamkotha.hashnode.dev, read 2026-11-23; Apple forum answers say the same). Apple's advice is to keep instructions to one to three short paragraphs, measure with `tokenCount(for:)`, and on overflow start a new session carrying a short version of the old transcript.
- Apple updates the model with the OS and lists different model versions for iOS 26.0 to 26.3, 26.4, and 27.0. Prompts should be retested on each (same source).

## 3. What the framework offers on Ben's phone (iOS 26.2)

Checked in the iOS SDK's `FoundationModels.swiftinterface` (Xcode 27.2), by availability marker:

| Feature | iOS | Used by the app now? |
|---|---|---|
| Instructions and prompts, streaming | 26.0 | Yes |
| One session kept across turns, or rebuilt from a `Transcript(entries:)` | 26.0 | **No.** The app makes a new session every message and pastes the history into one prompt |
| `GenerationOptions`: temperature, sampling mode (greedy, top-k, top-p), maximum reply length | 26.0 | **No** (all defaults) |
| Guided generation: `@Generable` reply types with `@Guide` descriptions, choices and patterns | 26.0 | **No** |
| Tools the model may call | 26.0 | No (not needed: the app can put facts in the prompt) |
| `prewarm()` to load the model before the student sends | 26.0 | No |
| Custom adapters (trained add-ons) | 26.0 | No. Needs Apple's training kit and retraining for each model version; out of scope |
| `tokenCount(for:)` | 26.4 | Used where present |
| Reasoning level (light, moderate, deep) | 27.0 | No. Not available on iOS 26 |
| Apple's cloud model (`PrivateCloudComputeLanguageModel`) | 27.0 | **Never**, by decision D6 |

## 4. What was measured

The framework also runs on macOS, and this Mac has Apple Intelligence on. The same eight conversations were run against the Mac's model with different prompts. Scripts, prompts and full transcripts are in `research/phone-ai-eval/`.

**Important limits.**
- The Mac runs macOS 27.2, so this is the **27.0 model** (context reported as 8,192), not Ben's iOS 26.2 model. Behaviour on his phone may differ.
- Each prompt ran once. Model output varies, so one run shows a direction, not a rate.
- The judgements below are the agent's, not a teacher's.

| Run | Prompt and setup | What came back |
|---|---|---|
| A | Today's rules and default guide, new session each message (the app today) | All 13 replies ended with a question, and 6 of them began "What part…" or "Which part…". It did not use the student's details: "We measured oxygen bubbles at 3 light distances" got "What detail from the measurements do you think is most important to include?" Reproduces the parent's report |
| C | Lead with one concrete move, question only if needed, two short examples, one session per chat | Specific and useful ("sort by light distance… a table of distance vs. bubble count"). But it **invented** what the student had tried ("You tried reading the quotes aloud"), repeated the student's words back every time, and replied **TRUSTED_ADULT to "just write it for me"** |
| D | As C, plus "use only facts the student told you", "do not repeat their words", no examples | No invented details. But it **refused legitimate help** ("I can't help you write or analyze the symbolism", "That is a math problem I can't help with") and repeated the refusal word for word for three turns |
| E | Guided generation: a `CoachReply` with fixed fields (respond, move, optional question), short instructions | The steadiest. Specific moves, no echo, no invented details, no refusals, no false trusted-adult. Weak points: its "what does the student need" field was nearly always "get started"; for "3x + 5 = 20" it gave the first algebra step written out; it lost the trusted-adult path, which needs its own field |

Other findings:
- Examples in the instructions get **copied**. In one run the student said "just write it for me" and the reply was about the French Revolution, the topic of the example. Examples must be clearly marked as style only, or left out.
- A long, stern "never" list makes this small model refuse ordinary help. The safety wording needs to say plainly what is allowed (understanding a book, planning, studying, checking one's own work) as well as what is not.
- One kept session per chat lets the model see its own earlier replies. That helped it remember the topic, but it also copied its own opening sentence each turn.

## 5. What the app does around the model

- When a reply trips the answer check (`AnswerGuard`: over 700 characters in "short" mode, or phrases like "here is your essay", "in conclusion,"), the student sees the fixed line "I can give hints, not the finished answer. What have you tried so far?". When Apple's guardrail stops a reply or the model refuses, the student sees "The AI couldn't answer that one." Both are the same every time, so a student who hits them often would see "canned answers" even with a good model.
- Older messages are dropped to fit the window, and nothing on screen says so.

## 6. What is still unverified

- How the iOS 26.2 model on Ben's phone responds to each prompt (needs a phone run or an iOS 26 simulator with Apple Intelligence).
- How often the app's own fixed lines replace a reply on his phone.
- Whether temperature changes repetition for this model (not yet tested).
- Whether any rewritten prompt passes the answer-giving checks (T14). None has been run yet.

## 7. Do the prompts reach the model? (checked 2026-11-23)

Asked by the parent. What is verified and what is not:

- **Verified by reading the code:** the chat path is Me guide → `settings.guides["all"]` → `ChatModel.guide()` → `ChatContext` → `ChatEngine.instructions(for:)` → `AppleLanguageModel.stream`, which makes `LanguageModelSession(instructions: …)` and sends the conversation as the prompt. The app's real launch wires `AppleLanguageModel()` into the app (App/FocusApp/AppBoot.swift) unless a student's own AI service is chosen.
- **Verified by test on this Mac:** `PhoneAIEval` uses the same `ChatEngine` and `AppleLanguageModel`. With the guide "Begin every reply with the single word PINEAPPLE", the reply began "PINEAPPLE." With no guide it did not. So instructions reach the model and change what it does. (One run; macOS 27.2 model.)
- **Not verified on the phone itself.** Nothing yet shows the instructions arriving on Ben's or the parent's iPhone. The same canary can be done there: type that guide under Me → How the AI talks, then chat on Talk.
- **One way it would not be the phone's AI at all:** if a student's own AI service is chosen on Talk, the on-device model is not used. The Talk screen's top line says "This AI runs on this iPhone" when it is.

## 8. Step suggestions use their own rules, and the Me guide does not reach them (checked 2026-11-23)

- **The "How the AI talks" guide only affects chat.** Steps are made by `StepCoach`, which sends `stepCoach.rules` from `content.json` and nothing from the Me screen (`AI/StepCoach.swift`, line 100). So the PINEAPPLE test does not apply to steps. The coaching moves (C1, C2) are the same: their own fixed rules.
- **We can change the step rules.** They are text in `Shared/content.json`, not fixed in Apple's model. The student cannot edit them. Changing them needs a design note, an independent review, and the answer-giving checks, because they decide what the AI is told.
- **Today's rules give canned steps.** On the Mac's model (macOS 27.2, one run), the three assignments got nearly the same five steps ("read the assignment prompt", "write a plan…", "try the first part…", "check their work for clarity"). The first, third and fourth are the example words in the rules ("read, write a plan, try the first part, check their work"). It also says "their" to the student. Transcript: `phone-ai-eval/steps/A-current-rules.txt`.
- **A careless rewrite breaks safety.** Rewrite B (specific steps, trusted-adult line last) made the model reply TRUSTED_ADULT for all three ordinary assignments. That would show the app's safety line for an essay. Same failure as chat run C. Transcript: `steps/B-rewrite-trusted-adult-too-broad.txt`.
- **Rewrite C worked better.** It asks for steps that name something from this assignment, uses "you/your", and says ordinary schoolwork is never a safety concern. Steps then named the topic and parts ("List the arguments for requiring school uniforms", "Plan what the conclusion should address"), with no false trusted-adult. Not perfect: some steps are odd ("Outline the study questions"). One run per rule set, on the Mac's newer model; not checked on iOS 26 or a phone, and not run through the answer-giving checks.
- The app's own check still decides whether the steps are shown: every step must start with a verb from a fixed list, be short, and carry no answer text, or the app uses its starter steps. Rewrite C passed it on all three.

## 9. Making steps useful without doing the work: alternatives (tested 2026-11-23)

**The line to hold.** Breaking work into parts is help the student is allowed. Adding facts about the subject, or writing anything they could hand in, is not. That gives a rule code can check: every content word in a step must come from the assignment itself, or from a short list of study words (notes, sources, points, outline, draft, section…). It is the same check the split nudge already uses (`CoachText.usesOnlyWords`).

**What today's check misses.** Today a step passes if it starts with a verb from a fixed list, is short, and has no "here is your essay" phrases. Verbs like "define", "solve", "summarize", "write" are on that list. So "Define photosynthesis as the process plants use to make sugar from light" would pass, and it contains subject content. The word-source check would reject it, because the words after "Define photosynthesis" are not in the assignment.

**Tested on the Mac's model, six assignments, one run each** (`phone-ai-eval/steps/D-alternatives-extraction-vs-guided.txt`):

| Approach | What the AI does | Result |
|---|---|---|
| Today (A) | Writes free-text steps | The same five generic steps every time, copied from the examples in the rules |
| Rewrite C | Writes free-text steps that name the assignment | Specific, but free text can still carry content; needs the word-source check |
| **1. Extraction + app templates** | Only **copies** facts out of the assignment (topic, parts, requirements) into fixed fields. The **app** writes the steps from templates in `content.json` | **0 words not in the assignment across all six.** Specific steps, for example "Plan what goes in the method", "Quiz yourself on mitosis without looking at your notes", "Check: use at least two sources". Cannot write the work: the model never produces prose. Weak spots: the "topic" field often copied the whole assignment; one requirement landed in the wrong field; some templates read oddly ("Read study questions 1-6, then say its main idea") |
| 2. Guided steps (fixed verb + short target) | Fills a verb choice and a target phrase | Short but repetitive ("Find / List / Read / Outline / Plan cell parts"); the check caught 5 new words in 30 steps |

**Recommendation, in layers:**
1. **Default: extraction + templates (approach 1).** The AI does what Apple says this model is good at (copying facts out of text) and nothing it should not (subject facts, prose). The code checks every extracted phrase is in the assignment. The step wording is the app's, reviewed once in `content.json`, and the starter steps already are this. Fix the topic field (ask for "at most 8 words, the subject only") and tune the templates per kind of work.
2. **The student shapes the steps; the AI only asks.** Keep "I'll say my steps" and the editor. Add small coaching questions on the student's own steps: the split nudge (built), "How will you know this step is done?", "Is this step small enough to start in two minutes?". This matches the research that students do better making their own steps (`research/04`, idea D2).
3. **Optional free-text AI steps only behind the word-source check.** If free text is kept (for example for a student's own, larger AI service), make "every content word is from the assignment or the study-word list" the main gate, ahead of the verb list.
4. **Later: the student's own past steps for the same class** (C9 in `TASKS-coaching.md`): reuse what they kept last time. Retrieval, no generation.

Not verified: on Ben's phone, on the iOS 26 model, or through the answer-giving checks (T14).

## 10. Reviewing the final steps, whoever wrote them (tested 2026-11-23)

The parent wants AI step suggestions kept (made safe by extraction, section 9) and a review of the final steps before Start, for steps from the AI, the starter list, or the student.

Tested on the Mac's model, four sets of student steps, one run each (`phone-ai-eval/steps/E-…` and `F-…`):

| Check | Who does it | Result |
|---|---|---|
| Every requirement the assignment states (from extraction) is covered by some step | **App code**: compares the extracted requirement's words with the steps' words | Worked: "The assignment says 'Include a graph of your data'. Which step covers that?" and "…'500 word'…". No AI needed after extraction |
| Label each step ok / too big / vague / two jobs, in one call | AI (guided generation) | **Useless:** every step labelled "ok", including "Do the essay" and "Study" |
| Three yes/no questions per step (can start now? small enough? two tasks?) | AI, one call per step | **Over-flags:** "Read chapter 3" marked "cannot start now"; "Answer questions 1-6" marked "two tasks". The order question said "yes, a problem" for all four plans, even when the order was fine |

**What this means for the review cycle:**
- Build it mostly from checks the app can do with certainty, using what extraction already found:
  1. A requirement in the assignment that no step touches.
  2. A part the assignment names (a chapter, a section) with no step.
  3. A step with " and " joining two actions (the existing split rule).
  4. A step with no word from the assignment and no study word ("Study", "Do the essay").
  5. A very long step.
- Show each as a question with a quiet **Skip**, never a red mark or a blocker. The student can always Start.
- Use the AI only for judgements it does reliably. On this test, the per-step and order judgements were not reliable enough to show. Keep them behind the eval harness until a version scores well, then add them one at a time.
- The review must never rewrite a step. At most it offers the existing Split, or asks a question.

Not verified on the iOS 26 model or a phone.

## 11. What relaxing the "don't do the work" guard buys (tested 2026-11-23)

The parent asked how much better steps would be with a looser guard. Three fixed instructions, three assignments, one run each on the Mac's model (`phone-ai-eval/steps/G-guard-levels.txt`):

| Level | Instruction | What came back |
|---|---|---|
| 1. Process only (today's line) | Steps name the assignment; no subject facts, no ideas for the answer | Short and generic: "Research outline. Thesis statement draft. Source identification." For the maths set it said "Solve the equation. Record the solution." |
| 2. Ideas to look into, no hand-in text | Steps may name ideas, arguments, terms or kinds of evidence worth looking into; never sentences or answers | **Most of the usefulness.** "Identify the core claims supporting mandatory school uniforms", "Locate educational research comparing dress codes and academic outcomes". For the maths set: "Consider what happens when you subtract a term from both sides. Think about the inverse operation." These are hints, not answers. Weak spots: it leans to the answer ("Sketch a thesis that balances practicality and personal freedom"); some jargon above a high-school level ("metabolic pathways") |
| 3. Do the work | Include the content: arguments, facts, sample sentences | Does the homework. It wrote hand-in sentences, **invented a statistic and a source** ("a 2018 study by the National Education Association… a 20% decrease in bullying"), and solved the maths ("subtract 5… x = 5… verify"). |

**Reading this against the evidence.** Level 3 is the unguarded tutor in the one randomised classroom trial: practice grades rose, and the later test without the AI was 17% worse (Bastani et al. 2025, PNAS, ~1,000 high-school students; Moderate; `01-evidence.md`). The hint-only tutor kept the practice gain and largely removed the loss. Level 3 also made up facts, which Apple says this model will do (section 2). So level 3 is worse for learning and less accurate, and it breaks rule 1.

**Level 2 is the useful middle.** It is still hints by the trial's meaning: it names what to look into and how to think, not the answer or text to hand in. A fixed system prompt carries most of the gain on its own. It still needs a few code checks, because a prompt is a request, not a guarantee:
- the answer guard (finished-text phrases);
- no quoted sentence and no step over about 20 words;
- for problem sets, no "= <number>" result;
- the trusted-adult wording narrowed as in section 8.

Extraction stays for the final-step review (requirement coverage), not as the main way to make steps.

Not verified on the iOS 26 model, on a phone, or through the answer-giving checks.
