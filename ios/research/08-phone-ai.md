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
