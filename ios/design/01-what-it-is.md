# 1. What the iPhone app is

## 1.1 In one paragraph

A student opens the app and sees the next small step of their schoolwork. They can say or type what the assignment is, split it into steps themselves with a little coaching, and work through one step at a time. At each step they tell the app honestly how it went: done, still working, stuck, or drifted. When stuck, they get a hint, a place to look, or help wording a question for a person. Coming back after a gap is one button. Nothing is counted against them.

That is the same product as the web app. The phone adds three things a browser cannot do: talking, an AI that runs on the phone itself, and (later) reminders and a short pause before distracting apps.

## 1.2 Why native Swift, and not the web app in a wrapper

An earlier plan wrapped the web app in a thin shell. Three things changed that.

| What changed | Why it points to native |
|---|---|
| The parent has a paid developer account and Ben may publish through it | A published app is now a real goal. Apple's review is known to reject apps that are a web page in a wrapper. **Unverified** from memory (App Review guideline 4.2); check the current text before relying on it |
| Ben would prefer to talk to the app | Speech recognition in a browser is unreliable (already judged a trap in `research/05-adhd-ideation.md` section 3). On the phone it is a system feature that runs on the device. **Verified:** the iOS 27.2 kit on this Mac has `SpeechAnalyzer` and `SpeechTranscriber` (iOS 26 and later) |
| The phone's own AI | It can be reached directly, including replies shaped as a typed list of steps, which a small model follows more reliably than free text. **Verified:** `FoundationModels` in the same kit has sessions, streaming, tools and the `@Generable` macro |

"Most efficient on the phone" has an honest two-part answer:

- **For the student's battery and speed, it makes little difference.** This is a text app. A web view would be fast enough.
- **For how it feels and what it can do, native wins clearly:** the keyboard, scrolling, text size settings, VoiceOver, haptics, the microphone, the on-device AI, the lock screen, reminders and the pause screen all work properly only in a native app.

**The cost, stated plainly.** There are now two apps to keep right. The web app's 236 logic tests and 365 browser tests do not cover the iPhone app; it needs its own. The iPhone app starts from the web app's exact words and rules (`04-engineering-and-plan.md` section 4.4) and then stands on its own. The web app stays for classmates on Chromebooks and non-Apple phones, who can use nothing else.

## 1.3 What Ben has asked for, and where it goes

Collected on 2026-11-20 from the web app's decisions, progress notes and design notes, and from the parent. **Which features to cut is Ben's choice**, so the "later" column is a proposal for him, not a decision.

| Ben's wish | Where it comes from | iPhone app |
|---|---|---|
| Talk to the app | Parent, 2026-11-20 | **Version 1.** The main new thing. Section 2 of `02-screens-and-voice.md` |
| Paste an assignment, get small steps, work one at a time | The core idea | **Version 1** |
| Honest buttons: Done, Still working, Stuck, Drifted, Later | Built on the web | **Version 1**, same words |
| A chat that helps without giving answers ("Talk it through") | Built on the web | **Version 1**, with the phone's AI |
| "How the AI talks": a guide per kind of work, and reply length | Built on the web | **Version 1**, simplified to one guide and three lengths; per-kind guides later |
| Search the web | Built for OpenRouter on the web | **Version 1** as Look it up (no key). OpenRouter search later, with own-key helpers |
| Earthy look: sand, dark brown, olive moss, a little clay | Chosen and applied on the web | **Version 1**, same colours, light and dark |
| My profile: goals, and "What got in the way?" notes | Built on the web | **Version 1**, under Me |
| How I like to work (four taps, a first-guess card) | Built on the web, not yet used | **Version 1**, and this time the answers are saved and used (countdown length, voice on or off) |
| My calendar with groups by how soon things are due; "Fire it Up" | Built on the web | **Later (version 1.1).** A simple list with the same groups, plus real reminders. Day, week and month grids are not planned for the phone |
| Reminders | Asked for; blocked on the web | **Later (version 1.1).** The phone can do them without a server |
| His own AI services and keys, several helpers, "how hard should the AI think" | Built on the web | **Later.** The phone's AI needs none of it. Own-key helpers come back as an advanced setting |
| His own search server (SearXNG) | Drafted for the web | **Later**, with own-key helpers |
| Urgent pop-out window | Proposed for desktop Chrome | **Not on the phone as a window.** Its purpose (see what is urgent without opening the app) is met later by a lock-screen card |
| Drag-to-move time blocks | Proposed | **Not planned for the phone** |
| Mood check-in | Proposed; no research support found (searched 2026-11-17) | **Not planned.** If Ben wants it, it stays a private note, never a measure |
| PDFs on calendar items, photo of notes | `PROGRESS.md`, waiting on a parent | **Not planned** |
| The name of the app; how progress is shown; the words for drifting and stuck | Still Ben's to decide | Still his. This design uses the web app's current words as placeholders |

## 1.4 The research behind each part

Ratings are the ones in `research/00-knowledge-summary.md` and `research/01-evidence.md`; `00`, `01`, `04`, `05` below mean those files in `research/`. Nothing here is a new finding. "Judgment" means design judgment, to be tested in the beta.

| Part of the app | Research link | Rating |
|---|---|---|
| Check-in at each step change, recorded by the student, private | Self-monitoring reduced off-task behaviour in students with ADHD symptoms (Gaastra 2016; `01` section C) | **Strong** |
| Small, immediate acknowledgement after each check-in | Reward-based interventions, group studies (Gaastra 2016); one gamified-app trial in ages 6 to 12 (Dai 2025) | Strong for the classroom form; **Weak** for apps |
| The student makes or edits the plan; the app coaches | Organizational-skills training (Bikic 2017; Langberg 2018; `04` section 1). An app that plans *for* the student is untested | **Moderate** for teaching the skill; the app form is **Judgment** |
| AI gives hints, never answers | High-school field experiment: answer-giving AI lowered later scores; a hints-only tutor did not (Bastani 2025; `01` section E) | **Moderate**, not ADHD-specific. A hard rule |
| One recall question after study or reading | Retrieval practice (Knouse 2016; Minear 2023; `01` section D) | **Moderate**, college students only |
| "If I get distracted, I will ..." and choosing tomorrow's first step | If-then plans (`01` source 23) | **Weak**, lab only |
| A short pause before a distracting app (later) | The *one sec* studies; friction beats walls (`01` section A) | **Moderate**, not ADHD-specific |
| Read steps and replies aloud | Text-to-speech helped comprehension for students with reading disabilities (Wood 2018; `04` section 1) | **Moderate for reading disabilities; no evidence for ADHD** |
| **Talking to the app instead of typing** | Nothing in the project's files | **Judgment.** The reasoning is "make starting nearly effortless" (`00` section 4). It must be tested, and must not be claimed as supported |
| One thing on screen; open on the next step; welcome back with no count | `00` section 4; `05` section 4 | **Judgment** |
| Get-ready first step, put-away last step, "that's today done" | Borrowed patterns (`research/06-alpha-school-and-montessori.md`, ideas M3, M4, A4) | **Judgment**; not evidence for ADHD |
| Background noise as a personal experiment | Small benefit for youth with ADHD, harm without (Nigg 2024) | **Not in this design.** It needs volume and time limits (`00` section 5) and is better built once the basics work |

## 1.5 What the app will not do

Each line is a rule in `AGENTS.md` section 0 or a trap already judged in the research files.

- Give finished answers, write the essay, or solve the problem (rule 1).
- Show anything red, count missed days, reset anything to zero, or say "behind" or "overdue" (rule 2).
- Ask about or store a diagnosis, or claim to treat ADHD or improve attention (rules 3 and 8). This includes the App Store name, subtitle, description and screenshots.
- Send reports to a parent or teacher, or let a parent lock the app onto the phone (rule 5).
- Rank students or show anyone else's numbers (rule 7).
- Listen when the student has not pressed the microphone. Keep recordings. Watch the screen or the camera.
- Act as a counselor (rule 11).
- Include brain-training games, streaks, prizes, speed bonuses, or points for time spent in the app (rule 10; `04` section 4 "What to avoid").
- Use a wake word, a named character, or a voice that pretends to be a person. Replies come from an AI and the app says so.
