# Steps for the parent

**Where things stand (2026-11-21):** parts A and B are done on your own iPhone (signing set up, builds installed with Xcode or `devicectl`). The newest archive in Xcode's Organizer is **Bens Steps 0.1 (9)**; build 10 (taller fields, press haptics) is on your phone and is not archived yet. To upload it: Window → Organizer → select it → Distribute App → App Store Connect → Upload. Then add testers under TestFlight. Ben is 18, so he can be an internal tester (Users and Access, then the Internal Testing group). The open questions below are still open; the current list is in `PROGRESS.md` "Waiting on".

These are for you only. Ben does not do any of this. No agent ever needs your Apple ID, password, certificates or keys, and none should be given to one. You type those yourself, into Xcode, on your own computer.

You need: a Mac with Xcode (current release, with the iOS 26 SDK), your paid Apple developer account, and Ben's iPhone 15 Pro Max (iOS 26.2) with a cable.

## A. Before the first build

1. Open `ios/App/FocusApp.xcodeproj` in Xcode.
2. In Xcode choose Xcode > Settings > Accounts. Click `+` and sign in with your Apple ID. (Xcode asks for the password itself. Do not share it with anyone or anything else.)
3. In the left list, click the blue **FocusApp** project, then the **FocusApp** target, then **Signing & Capabilities**.
4. Under **Team**, choose your developer team.
5. **Done 2026-11-21:** the Bundle Identifier is `com.craighagan.benssteps` (tests: `com.craighagan.benssteps.UITests`) and the team is set. Use the same identifier when you create the app record in App Store Connect, with the name "Ben's Steps" (or another free name).
6. Open `ios/FocusKit/Sources/FocusKit/LookUp/WikipediaLookUp.swift`, line 10. Replace `set-by-owner@example.invalid` with a real email address you are happy for Wikipedia to see if their servers need to contact the app's owner. This goes in the app's requests. Use an address you are comfortable having public, not Ben's.
7. On Ben's iPhone: Settings > Privacy & Security > Developer Mode > on. The phone restarts. Confirm when it asks.
8. Plug the iPhone into the Mac. Tap **Trust** on the phone.

## B. Put the app on Ben's iPhone (T17a)

9. At the top of Xcode, pick Ben's iPhone as the run destination.
10. Press the Run button (the triangle). The first build takes a few minutes.
11. If the phone says "Untrusted Developer": Settings > General > VPN & Device Management > your name > Trust.
12. The app opens. If it shows "The app couldn't start", write down when it happened and tell whoever is helping.
13. Check that Apple Intelligence is on: Settings > Apple Intelligence & Siri. If it is off, Ben can still use the app; the AI parts show a calm message. For the AI checks it needs to be on and finished downloading.

## C. Ben works through the device checks

14. Give Ben `ios/checks/device-checks.md`. It has 53 numbered steps. He does them with the app on his phone and tells you, in his own words, what he saw. Write down anything that did not match, with the exact words on the screen.
15. Steps 42 to 44 and 50 are the AI checks (T14). They are the most important. Write down, word for word, anything the AI said that looks like a finished answer. Do not fix it yourself; hand the words to whoever is working on the app next.
16. Note the date, phone model (iPhone 15 Pro Max) and iOS version (26.2) with the results.

## D. A week of real use (T17b)

16. Note for step 15: the AI's reply now appears all at once after a short wait, because the app checks the whole reply before showing or speaking any of it. Tell Ben this is on purpose. If the wait feels too long on the phone, report it; do not ask for the check to be removed.
17. Only after the AI checks in step 15 are reviewed and cleared, and the whole-app review is done by a stronger model (see `PROGRESS.md`): let Ben use the app for real homework for a week.
18. Collect what he says: what helped, what annoyed him, what he stopped using.

## E. TestFlight, only when you decide classmates may have it

Do not start this until: the AI checks are cleared by the Advisor; you have answered the questions below; you have written permission from classmates' parents and the teacher's approval.

19. In Xcode, set the run destination to **Any iOS Device (arm64)**.
20. Product > Archive. When it finishes, the Organizer opens.
21. Click **Distribute App** > **App Store Connect** > **Upload**. Follow the prompts; Xcode signs with your account.
22. In App Store Connect (appstoreconnect.apple.com), create the app record with the same bundle identifier, then open **TestFlight**.
23. Add the build to an **external** or **internal** group and add testers by email. Apple reviews the first external build.
24. In the app's privacy answers in App Store Connect, say: no data collected. The app has no account and no analytics. The only thing sent off the phone is the search words to Wikipedia when the student taps Search (`DECISIONS.md` D8).

## Open questions, in plain words

### For you (the parent)

| # | Question | Recommendation |
|---|---|---|
| D6 | Is it all right that version 1 uses only the AI built into the phone, with no cloud AI and no keys? | Yes. Nothing students type leaves the phone and nothing costs money. |
| D7 | Is it all right that talking is off until the student turns it on, the microphone listens only while held or tapped, and nothing is recorded? | Yes. |
| D8 | Do you confirm the list of what may leave the phone: search words to Wikipedia, and opening a source link? | Yes, before any classmate gets the app. |
| Backup | Should the app's data stay out of phone backups? It is set that way now. | Keep it out. Then nothing reaches iCloud. The cost: if the phone is lost, the steps are lost. |
| Mic use | May students under your care use the microphone? | Yes, with the one-sentence explanation the app already shows. |
| Language download | Talking needs a one-time download of speech files from Apple. Nothing of the student's is sent. Is that acceptable, and not a "leaves the phone" item? | Yes. |
| Trusted-adult line | When a student's chat message suggests danger or distress, the app shows one fixed line to talk to a trusted adult and does not save that message. Do you approve this? | Yes. The wording is "If something serious is going on, please talk to an adult you trust." |
| Phrase list | Should a fixed list of worrying phrases also trigger that line, in addition to the AI's own signal? It is not built. | Not for version 1. A hand-made list misses a lot and wrongly catches more. Revisit with real use. |
| Who may get a build | Only Ben for version 1? | Yes. Classmates only after the AI checks are cleared and with permissions from parents and the teacher. |
| Apple Intelligence | Is it switched on on Ben's phone? | Check in step 13. If not, switch it on. |

### For Ben (ask him in plain words)

| # | Question | Recommendation |
|---|---|---|
| Name | What should the app be called? | His choice. Short and friendly, with no mention of ADHD or "focus" as a promise. |
| Drifted / Stuck wording | Are "Drifted" and "Stuck" the words he would use? | Keep them unless he picks others. Both feel like facts, not mistakes, and both get the same warm reply. |
| Voice at start | Should voice be off at first launch? | Off. He turns it on in Me. |
| Which first | Should making steps by talking or by suggestion come first? | Talking first, since he said he prefers to talk to the app. |
| Suggested steps | Must he change a suggested step before Start? | No. Changing is optional. |
| After version 1 | What waits? | Calendar and reminders, lock-screen card, the pause before a distracting app, iPad. |
| Starter step wording | One built-in starter step is called "Check what you missed". "Missed" may sound like a mistake. | Change to "Check your work again". It is in `Shared/content.json` and its test file `Shared/cases/starter-steps.json`; an agent with gate 2 approval should change both together. |
