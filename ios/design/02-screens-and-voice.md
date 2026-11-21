# 2. Screens and voice

Placeholders: the app's name, the words Drifted and Stuck, and how progress is shown are Ben's to choose. This file uses the web app's current words.

## 2.1 The shape of the app

Four places, in a bar at the bottom. The bar hides while a step is in progress.

| Place | What is there |
|---|---|
| **Today** | The next step, or "What's the assignment?" when there are no steps |
| **Talk** | Talk it through: the hints-only chat, by voice or typing. Look it up |
| **Plan** | Version 1: all my steps for the current assignment. Later: the calendar list and reminders |
| **Me** | My goals, What got in the way?, How I like to work, How the AI talks, Voice, About and privacy |

Rules for every screen:

- One main action, and it is the only filled button.
- Words are short. No screen needs scrolling to reach its main action on the smallest supported iPhone.
- Everything works by touch alone, by voice alone where voice is offered, and with VoiceOver. Text follows the phone's text-size setting. Motion follows the reduce-motion setting.
- Colours are the earthy palette Ben chose, in light and dark.
- A light tap of haptic feedback answers each check-in. It is silent, immediate, and identical for every button (rules 2 and 6).

## 2.2 Voice: how talking works

**Three settings, chosen by the student under Me, changeable at any time:**

| Setting | The student | The app |
|---|---|---|
| **Quiet** (the default) | taps and types | shows text. No sound at all (`DECISIONS.md` P10) |
| **I talk** | holds the microphone button and speaks; lets go to send | shows text |
| **We talk** | speaks | shows text **and** says it aloud |

Details that matter:

- **The microphone is on only while the student holds the button** (or taps once to start and once to stop, for students who find holding hard). A clear on-screen sign shows when it is listening. There is no wake word and no background listening.
- **Words appear as they are spoken,** in the same box typing would use, and the student can fix them before sending. Nothing is sent until they let go and tap Send, except in We talk, where letting go sends.
- **Speech is turned into text on the phone.** The recording is never saved and never leaves the device. Only the text is kept, exactly as typed text would be.
- **"Only speak through headphones"** is on by default in We talk. With no headphones connected the app shows text and stays silent, so it cannot speak up in a classroom or library. The student can turn this off.
- **Stop is always one tap.** Tapping anywhere on a spoken reply stops the voice at once.
- **The first time** the student taps the microphone, the app explains in one sentence what the microphone is for, then iOS asks permission. If they say no, typing works and the microphone button shows a quiet "Turn on in Settings" line. The app never asks again by itself.
- **The phone's own dictation key** on the keyboard keeps working in every text box, with no code at all. It is the fallback if the app's own speech feature is unavailable in the student's language.
- **The voice** is one of the phone's built-in voices, at a calm pace. No name, no character.

**Where voice is offered, and where it is not:**

| Place | Voice in | Voice out |
|---|---|---|
| Saying the assignment | Yes | Reads the app's one question |
| Saying each step when planning | Yes | Reads steps back on request |
| Work screen check-in | **No.** The five buttons stay one silent tap. This is the form the research tested, and a spoken check-in cannot be used in class | A "Read this step" button, any setting except Quiet |
| Stuck | Yes: "say what you tried" | Reads the hint |
| Talk it through | Yes | Yes, in We talk |
| Recall question | Yes | Reads the question |
| Goals and notes under Me | Yes | No |

## 2.3 First run

1. One screen: what the app does in two sentences, "Your work stays on this iPhone", and **Start**.
2. No account, no name, no age, no diagnosis question, no permission requests. Permissions are asked only at the moment each is first needed.
3. It goes straight to **Today**, which asks for the first assignment.

## 2.4 Today, with no steps: "What's the assignment?"

1. A large text box, "Paste or type it here", and a microphone button beside it. The student pastes, types, or says it: *"Five paragraphs on courage in To Kill a Mockingbird, due Friday."*
2. **What kind of work is this?** Six choices, one tap: Essay, Reading, Problem set, Project, Studying for a test, Something else.
3. **About how many steps?** 3, 5 or 8 (P2). Five is preselected.
4. Main button: **Make my steps**.

Empty input: the button stays, and a calm line says "Add a few words about the assignment first." Very long input is cut at the same limit as the web app, with a line saying so.

## 2.5 Making the steps: the student plans, the app coaches

This is the screen the web app is still missing (P1), and the one the research cares about most. It has two ways in. The student picks; neither is the default until Ben chooses.

**A. "I'll say my steps."** The best fit to the research (the student does the splitting).

1. The app asks one question, on screen and aloud if voice is on: *"What's the first small thing you could do? It can be tiny."*
2. The student says or types it. It appears as step 1.
3. *"And after that?"* This repeats until the student says "that's it" or taps **That's all**.
4. If a step looks like two jobs (it contains "and", or is long), one gentle line: *"This looks like two steps. Split it?"* Yes or No. The student can always say no.
5. If the student stalls, **Give me an idea** offers one possible next step, never the whole list.

**B. "Suggest some to start."** Easier to begin with.

1. The app shows the starter steps for that kind of work, the same ones the web app uses. With the phone's AI available, it may suggest steps fitted to the assignment instead, and says "Suggested by the AI on this iPhone."
2. The steps open **in the editor, not on the work screen.**

**The editor (both ways end here).**

- Each step is a row: tap to change the words, drag to reorder, swipe to delete, **Add a step** at the bottom, **Split** and **Join with next** in a small menu.
- By voice: hold the microphone on a row and say the new words.
- Optional, per step, one short line: *"How will I know it's done?"* It is hidden behind a tap so the screen stays simple.
- A **Get ready** step is offered first ("Open the document. Get the book.") and a **Put it away** step last ("Save. Write down what's next."). Both can be removed.
- Main button: **Start**.

With way B, the student must look at the steps before Start can be pressed, but is not forced to change one. (Forcing an edit was an option in `04` idea D2; forcing invites a meaningless edit. Ben decides.)

## 2.6 Today, with steps

One card and nothing else:

- A short line: "Pick up where you left off." After a day or more away: "Welcome back. Pick up where you left off." It never says how long.
- The next step in large type.
- Main button: **Start this step**.
- Two quiet links: **All my steps**, **New assignment**.

If everything is finished: "That's today done." and a suggestion to close the app. No prompt to do more.

## 2.7 The work screen

- "Step 2 of 5", small. The step, large. **Read this step** if voice is on.
- Five buttons, same size, same look, in a steady grid that never reflows: **Done**, **Still working**, **Stuck**, **Drifted**, **Later**. None is coloured as the right answer (rule 6).
- Optional countdown, off by default, 12 or 25 minutes, shown as a shrinking ring, silent.
- A small **Park a thought** box: type or say a stray thought, it is saved for later, and the step stays on screen.
- No pop-ups, sounds or prompts while a step is in progress.

What each button does (same logic as the web app):

| Button | What happens |
|---|---|
| Done | A brief acknowledgement; the next step appears. After a reading or study step, one optional question: "One thing you just learned?" (type, say, or skip) |
| Still working | "Okay. Keep going." Nothing else changes |
| Stuck | Section 2.8 |
| Drifted | "Good catch." The step is split in two and the first half is shown. Same acknowledgement as Done. The total work never grows |
| Later | The step is kept; the app returns to Today |

Leaving mid-step, a phone call, or the app being closed: the step and its state are saved after every tap, so the student returns to exactly where they were.

## 2.8 Stuck: a ladder, not an answer

1. **A hint.** One of the built-in hints for that kind of work. **Another hint** gives the next. This needs no AI and always works.
2. **Look it up.** A box with the step's key words already in it; the student can change them. Results are a short list of reference pages. A page opens inside the app with a **Back to my step** button, so looking something up does not mean leaving.
3. **Talk it through.** Opens the chat already knowing the step and the kind of work. Only when an AI is available.
4. **Ask a person.** After two hints on the same step, the app offers to help word a question: "I'm on: ___. I tried: ___. I don't get: ___." The student fills it in by typing or talking, then copies it or shows the screen to someone. Nothing is sent anywhere.

Tapping Stuck never adds work, resets progress, or changes anything for the worse.

## 2.9 Talk

- The screen is the conversation. The message box and microphone stay at the bottom, above the keyboard.
- One line at the top, always visible: "This AI runs on this iPhone. Your messages don't leave it. It can still be wrong." (The wording changes if a web helper is in use; see `03-ai-search-privacy.md`.)
- The app's opening line is fixed text, not from the AI: "What are you working on, and what's the first thing you're not sure about?"
- Replies appear as they are written. In We talk they are spoken sentence by sentence once each sentence is complete and has passed the safety check.
- Under the latest AI message, when it contains a list: **Use these as my steps**, which opens the editor (section 2.5), never the work screen.
- **New chat** and **My chats** (the 10 most recent, delete one or all) in the top corner.
- **Look it up** is a small button by the message box. When the AI looks something up itself, the chat shows "Looking up: ___" and the sources appear as links under the reply.
- When no AI is available on this phone: the screen says why in one calm line, and offers **Look it up** and the built-in hints instead. It is never an error screen.

## 2.10 Me

- **My goals**: today, this week, this month, this year. All optional.
- **What got in the way?**: private notes, newest first. Fixed line beneath: "If something serious is getting in the way, talk to an adult you trust."
- **How I like to work**: four taps and a first-guess card, saved this time, labelled as a guess.
- **How the AI talks**: one guide in the student's own words, and reply length (short, medium, long).
- **Voice**: Quiet, I talk, We talk; headphones only; which voice; speed.
- **About and privacy**: what is stored, what leaves the phone and when, **Delete everything on this iPhone** (second tap to confirm).

## 2.11 The awkward cases

| Case | What the student sees |
|---|---|
| Nothing typed or said | A calm line; nothing happens |
| Nonsense or a very long paste | It is accepted and cut to the limit; starter steps for the chosen kind still appear |
| Double tap on a check-in | Counted once |
| Microphone permission refused | Typing works; a quiet line says how to turn it on |
| The speech feature is not available in this language | The microphone button is hidden; the keyboard's own dictation still works |
| Speech misheard | The words are on screen to fix before sending |
| Noise, or the student stops talking | Listening ends when the button is released; nothing is sent by a pause alone |
| A phone call or another app takes the audio | Speaking stops; text stays; nothing is lost |
| The phone's AI is off, not ready, or the phone is not eligible | One line saying which, and what to do. Everything that does not need AI still works |
| The AI refuses or its guardrail stops a reply | "The AI on this iPhone couldn't answer that one." |
| No network | Everything works except Look it up, which says "You're offline. Try again later." |
| Away for a week | Today shows "Welcome back" and the next step. Nothing about the gap |
| Saved data unreadable | It is set aside as a backup and the app starts fresh, as on the web |

## 2.12 Later screens (not in version 1)

- **Plan: calendar list.** The same groups as the web app (Urgent, Significant, Not urgent, Can wait, Later, and a calm Time has passed), shown only when a group has something in it.
- **Reminders.** "Tomorrow's first step, and when?" at the end of a session sets one reminder. The reminder names the step, never a miss.
- **Lock-screen card.** The current step, visible without opening the app. It replaces the idea of an urgent pop-out window.
- **Pause before a distracting app.** The student picks the apps. Opening one shows a short pause, their current step, and **Back to my step** or **Continue anyway**. The app never learns which apps they picked or used (Apple's design). Needs Apple's approval; see `04-engineering-and-plan.md` section 4.8.
