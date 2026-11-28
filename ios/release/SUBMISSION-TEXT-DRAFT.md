# Submission text: DRAFT for the parent and Ben to approve

Draft 2026-11-27. Nothing here is entered anywhere. Student-visible and public words need the parent's and Ben's okay (`AGENTS.md` section 3). Limits are Apple's usual ones (check): name 30 characters, subtitle 30, keywords 100, promotional text 170, description 4000.

Words rule: no claim to treat ADHD or improve attention, no "flow state", no "proven to raise grades", no mention of a diagnosis (rules 3 and 8). The supported sentence is: "A tool that helps students stay on task, plan their work, and remember what they studied, built on research about ADHD and attention." That sentence names ADHD, so the store text below leaves out the second half.

## 1. Store page

**Name:** Ben's Steps (working name; Ben decides the final one. It must not contain "ADHD" or "Focus", `DECISIONS.md` 2026-11-21.)

**Subtitle (29):** Small steps for schoolwork

**Promotional text (about 130):** Paste an assignment, make it into small steps you edit yourself, and do one at a time. Everything stays on your device.

**Description:**

> Ben's Steps helps students get started and keep going with schoolwork.
>
> Paste or say what you have to do, then turn it into small steps. You choose and change the steps. The app suggests a starting point, and you decide.
>
> One step at a time. You see only the step in front of you, with five honest buttons: Done, Still working, Stuck, Drifted and Later. "I drifted" counts the same as "done", and coming back is always fine. Nothing resets and nothing shames.
>
> When you're stuck, you get a hint, a question, or a pointer. The app never gives finished homework.
>
> Also: an optional timer you set yourself, a place to park a stray thought, a short question to help you remember what you read, your own goals and private notes, and a weekly look back in your own words.
>
> Private by design. Your steps, goals and notes stay on your device. There is no account, no ads and no tracking. On phones with Apple Intelligence, the AI runs on the device. You can also add an AI service of your own in Me, and the app tells you where your words would go before you use it.
>
> The app is a study tool. It is not medical advice, it does not treat or diagnose anything, and it is not a counsellor.

(Under the 4000 limit. Check the wording once more against the never-shame list before submitting.)

**Keywords (about 90):** homework,study,planner,steps,school,student,tasks,timer,assignment,reading

(Leaves out "ADHD" and "focus" on purpose; the parent may choose otherwise.)

**What's new (first release):** First version.

**Category:** Education. Secondary: Productivity.

**Copyright:** 2026 [your name]

**Support URL:** [hosted page]. **Privacy policy URL:** [hosted page]. **Marketing URL:** none.

## 2. Age rating: facts to answer the questionnaire

The new scale is 4+, 9+, 13+, 16+, 18+ and the questions changed (confirmed in Apple news). Answer in App Store Connect; these are the facts, not the answers, because I do not know the exact questions today.

- No violence, sexual content, profanity, gambling, alcohol, tobacco or drugs of its own.
- No user accounts. No messaging or social features between users. No content shared with other people.
- **Generative AI chat:** yes. Talk is a chat with an AI (Apple's on-device model, or a service the student adds). It is instructed to give hints and never answers, to avoid advice, and to reply with a trusted-adult message if a student seems in danger. Model replies are checked by the app, but a model can still be wrong or say something unexpected. The questionnaire may ask about this directly.
- **Web access:** "Look it up" searches Wikipedia, and a source link opens a normal web page. The app has no address bar and no general browser. Whether this counts as "unrestricted web access" is a question for the parent to answer in App Store Connect.
- **Student's own AI service:** a student can point the app at any AI service they choose, so what that service says is outside our control.
- **Medical or wellness:** the app is not a medical app and makes no health claim. It is for students with attention difficulties among others, but never asks about or stores a diagnosis.
- **Parental controls / age assurance:** none in the app.

Recommendation (a decision for the parent): choose the lowest rating the honest answers allow, expect 13+ or higher because of the AI chat, and do not choose "Made for Kids".

## 3. App Privacy answers ("nutrition label")

- **Tracking:** no.
- **Data linked to you, used to track you, or collected:** recommended answer **"Data Not Collected"**.
- **Why:** the app has no server of its own and no analytics, ads or crash reporting. Everything the student writes stays on the device or in their own device backup. Search words sent to Wikipedia, and messages sent to an AI service the student adds, go straight from the student's phone to those services at the student's request, and the publisher never receives them.
- **Risk:** Apple's definition of "collected" is about data leaving the device in a way that you or your partners can access for longer than a live request. Whether a reviewer treats a student's own AI service or Wikipedia as outside that definition is not certain. If a reviewer disagrees, the fallback is to declare "User Content" (messages) and "Search History" as not linked to the user and not used for tracking, with the purpose "App functionality".
- **Third-party AI disclosure (guideline 5.1.2(i)):** the app discloses where messages go on the screen where they are sent (Talk, the assignment screen and About). See checklist A1 for the open question about an explicit "I agree" step.

## 4. Notes for App Review

> Ben's Steps is a study planner for students. There is no account, no sign-in and no demo account is needed. The app is fully usable with no AI: start by pasting an assignment on the first screen.
>
> **AI.** On phones with Apple Intelligence (iPhone 15 Pro and later, iOS 26), the app uses Apple's on-device model, and nothing leaves the phone. On other phones the app works without AI. **No third-party AI service is built in or turned on.** A student may add an AI service of their own under Me, My AI services, by entering its address, model name and key; none is added by default, and the reviewer does not need one. When a student chooses such a service, the Talk screen shows "Your messages go to [service name]…" and the About screen lists exactly what is sent. Keys are kept only in the Keychain.
>
> **App Transport Security.** `NSAllowsArbitraryLoads` is set because a student may enter an `http://` address for their own AI service (for example a service on their home network). The app warns on screen that such messages are not encrypted. The app's own connections (Wikipedia) use https.
>
> **Permissions.** The microphone and speech recognition are requested only when a student turns on Talk and taps the microphone button, with a one-sentence explanation first. Speech is turned into text on the device and is never recorded.
>
> **Network.** The app contacts Wikipedia only for "Look it up" (the student's search words), and contacts an AI service only if the student has added and chosen one. There is no analytics, advertising or tracking. Everything else is local.
>
> **Health.** The app makes no health claim, does not diagnose or treat anything, and never asks about a diagnosis. If a student's words suggest distress, it shows a message encouraging them to talk to a trusted adult.
>
> **Test path.** Open the app, tap Start, paste any assignment text, tap "Suggest some to start" (starter steps, or the on-device AI if present), edit a step, tap Start, then use the five buttons.

Add the contact name, phone and email in App Store Connect.

## 5. Before pasting any of this

- Re-read it against `research/00-knowledge-summary.md` section 6 and rule 8.
- Confirm every statement about what the app does is still true (the privacy lines in `WordsAI.swift` and `DECISIONS.md` D8 are the source).
- Ben chooses the name and icon.
