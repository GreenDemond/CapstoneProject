# App Store acceptance checklist

Draft 2026-11-27. Status key: **done**, **open**, **parent** (only the parent can do it), **decide** (a choice for the parent or Ben), **check** (from memory; verify first).

## A. Must be true before submitting

| # | Requirement | Source | Where the app stands | Owner | Status |
|---|---|---|---|---|---|
| A1 | **Clear disclosure and explicit permission before personal data goes to third-party AI.** Guideline 5.1.2(i), updated 13 Nov 2025: you must clearly disclose where personal data is shared with third parties, including third-party AI, and get explicit permission first. Developers report rejections under this rule on Apple's forums, including a children's education app. | Confirmed: Apple developer news; Apple forums | By default nothing leaves the phone. The student adds their own AI service in Me and chooses it on Talk; Talk's top line names where messages go (`FocusKit/Sources/FocusKit/Models/WordsAI.swift` lines 25 to 35), the assignment screen says "Steps will be made by", and About lists it. There is **no separate "I agree" step** the first time a service is chosen. Apple may want one. | Agent (design note first) | **decide**: add a one-time consent step when a student first chooses their own service? Recommended: yes |
| A2 | **Privacy policy at a public web address**, linked in App Store Connect, and reachable from inside the app. No login, no broken link. | Confirmed (3rd-party summaries of 5.1.1(i)); Apple lists broken links as a common issue | A draft exists (`PRIVACY-POLICY-DRAFT.md`). No page is hosted. The app has an About and privacy screen but no link to a web page. | Parent hosts; agent adds the in-app link | **parent** |
| A3 | **App Privacy answers ("nutrition label")** that match what the app does. | Confirmed: Apple "App Privacy Details" | Draft answers in `SUBMISSION-TEXT-DRAFT.md` section 3. The app has no account, no analytics, no ads, no tracking. | Parent enters | **parent**, after reading |
| A4 | **Privacy manifest (`PrivacyInfo.xcprivacy`)** declaring tracking (none), collected data (none) and any "required reason" APIs the app uses. Required since 1 May 2024. | Confirmed: Apple developer news 2024 | The app has **no** privacy manifest file. A search of the app code found none of the usual required-reason APIs (UserDefaults, file timestamps, uptime, disk space), but Xcode's own report on the archive decides. | Agent | **open**: add the file, run Xcode's Privacy Report on the archive |
| A5 | **Updated age rating questionnaire** answered in App Store Connect. The scale is now 4+, 9+, 13+, 16+, 18+; apps that had not answered by 31 Jan 2026 could not submit updates. | Confirmed: Apple developer news | Facts to answer it are in `SUBMISSION-TEXT-DRAFT.md` section 2. Nothing is answered. | Parent enters | **parent**, **decide** the rating |
| A6 | **No unsupported health claims.** Guideline 1.4 and the project's rule 8: no "treats ADHD", no "improves attention". Apple also rejects health apps that claim to measure or diagnose without disclosing method and accuracy. | Confirmed (health-claim rule); project rule 8 | The app makes no measurement or diagnosis claim. The store text draft uses only the supported wording from `research/00-knowledge-summary.md` section 6. The app name and keywords avoid "ADHD" and "Focus" (`DECISIONS.md` 2026-11-21). | Agent writes; parent approves | **done** in draft |
| A7 | **More than a web page.** Guideline 4.2 (minimum functionality). | Confirmed | Native SwiftUI app with its own storage, timers, voice, on-device AI. No concern. | | **done** |
| A8 | **No crashes, no placeholders, finished screens** (2.1 completeness). | General rule | Placeholders remain: the staircase icon, the app name "Ben's Steps", the Wikipedia contact in `WikipediaLookUp.userAgent` (`example.invalid`). The full check passes, but nothing has run on a real iOS 18 phone. | Ben decides name and icon; agent fixes the contact | **open** |
| A9 | **Support URL and a way to contact you**, in App Store Connect and in the app. | Required by App Store Connect (check exact fields) | None exists. A simple page or email contact is needed. | Parent | **parent** |
| A10 | **Answer-giving checks (T14) passed for every AI move and every model enabled**, and D8 confirmed. | Project rule 1; `AGENTS.md` section 4 | Not done. This is also the main blocker for classmates. | Parent with a real phone, then agent | **open** |
| A11 | **Export compliance.** | `Info.plist` key set | `ITSAppUsesNonExemptEncryption = NO` is already set (only standard HTTPS and the Keychain). | | **done** |
| A12 | **Microphone and speech permission text** that says why. | Confirmed in project settings | Set in `project.pbxproj` (`NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription`), plain words. | | **done** |
| A13 | **Explain the App Transport Security exception.** The app sets `NSAllowsArbitraryLoads` so a student can enter an http address for their own AI service (D6). Apple often asks why. | The setting is in `App/Info-Extra.plist`. How Apple treats it: (check) | Reason: the address is typed by the student, so it cannot be listed in advance; the app warns "not encrypted" on Talk (`WordsAI.swift` line 33). Put this in the review notes. | Agent writes; parent pastes | **open** |

## B. App Store Connect entries (the parent does these)

| # | Item | Notes | Status |
|---|---|---|---|
| B1 | Apple Developer account in good standing, agreements signed | The parent has a paid account | **done** |
| B2 | App record with bundle id `com.craighagan.benssteps` | `PARENT-STEPS.md` step 22 | **parent** |
| B3 | App name (30 characters), subtitle (30), keywords (100), description, promotional text, "What's new" | Draft in `SUBMISSION-TEXT-DRAFT.md` section 1. The name is Ben's to finalize | **decide** |
| B4 | Category | Suggested: Education, with Productivity second | **decide** |
| B5 | Screenshots for each device size you support. The app runs on iPhone and iPad, so both are needed. Exact sizes change over time. | (check) the current required sizes in App Store Connect. The UI tests already produce screenshots; matching sizes would take a small task | **open** |
| B6 | App icon, 1024 by 1024, no transparency | The staircase is a placeholder | **decide** (Ben) |
| B7 | Copyright and contact name | e.g. "2026 Craig Hagan" (confirm legal name) | **parent** |
| B8 | **EU trader declaration.** If the app is available in the EU, Apple asks whether you are a trader. | (check) | **parent** |
| B9 | Price and countries | Free is the plan. Consider limiting countries | **decide** |
| B10 | App Review information: contact details and notes | Notes drafted in `SUBMISSION-TEXT-DRAFT.md` section 4. No sign-in, so no demo account | **parent** |
| B11 | Version `1.0` and a build uploaded from Xcode Organizer, built with the stable Xcode | The current build number is 26, version 0.1 | **parent** |
| B12 | Release choice: manual release after approval | Recommended, so nothing goes live by surprise | **decide** |
| B13 | Not "Made for Kids". Do not opt into the Kids Category. | (check) Kids Category bars some things the app does, such as links out and third-party AI. Teens are the audience | **decide** |

## C. Work the agent can do before submission (each is its own task with a design note)

| Task | What | Why |
|---|---|---|
| REL1 | Add `PrivacyInfo.xcprivacy` and check it with Xcode's Privacy Report | A4 |
| REL2 | One-time consent step the first time a student chooses their own AI service; words approved by the parent and Ben | A1 |
| REL3 | A link to the hosted privacy policy and a support contact on the About screen | A2, A9 |
| REL4 | Replace the Wikipedia contact placeholder | A8 |
| REL5 | Screenshots at the required sizes from the UI tests | B5 |
| REL6 | Review the wording of every screen, the store text and the screenshots once more against the never-shame list and rule 8 | A6 |
| OLD2 | Clearer words when talking is not available on a phone (already logged) | A8 |

## D. Suggested order

1. Finish T14 and confirm D8 (needed for classmates anyway).
2. Run the TestFlight beta with a small group (`PARENT-STEPS.md` section E).
3. Do REL1 to REL6 and decide the items marked **decide**.
4. Host the privacy policy and support page.
5. Fill in App Store Connect from the drafts, upload build 1.0, submit with manual release.

## E. What I could not verify

- Review time, screenshot sizes, EU trader rules, the Kids Category rules and how reviewers treat the ATS exception. These are marked (check).
- Whether Apple would accept "Data Not Collected" for an app whose students can send their own words to an AI service they chose. The draft recommends it, with the reasoning, and names the alternative. A reviewer may disagree.
- Anything about legal obligations toward minors in the parent's country. The policy draft is not legal advice.
