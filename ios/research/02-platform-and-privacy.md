# Platform and privacy constraints

What each platform allows, and what that means for the idea. Items marked **(confirm)** come from my general knowledge and were not checked against a current source in this pass.

---

## 1. Browser extension (Chrome)

**What it can do**

- Block or redirect sites with the `declarativeNetRequest` API. Blocking runs on the device and the extension does not need to read page contents to do it (Chrome developer docs).
- Show a pause page in place of a blocked site.
- Run timers, show check-in prompts, and store data locally.
- Read the current tab's title and address, if the student grants permission. This is what makes "quiz on what you are doing" possible.

**The main risk: school-managed Chromebooks**

- School administrators control which extensions students can install. They can block all, allow a list, or force-install specific ones (Google Chrome Enterprise help).
- On a school account, an unlisted extension usually cannot be installed. A student-built extension would need the district IT department to approve it.
- This is the largest threat to the "for public school students" goal. Check it first, on Ben's own school device.

**Publishing**

- Publishing to the Chrome Web Store needs a developer account and a one-time registration fee (Chrome Web Store docs). The fee is $5 **(confirm)**.
- Chrome Web Store terms require users to be 13 or older, with parent permission from 13 to 18.
- For a school project, publishing is optional. An unpacked extension loaded in developer mode works on a personal computer.

**Difficulty.** Low. HTML, CSS, and JavaScript. A working blocker plus timer is a weekend-sized project with AI help.

---

## 2. iPhone and iPad app

**What it can do**

- Apple's Screen Time API (Family Controls, Managed Settings, Device Activity) lets an app shield chosen apps and sites on a schedule.
- It supports two modes: a parent approves for a child in the Family Sharing group, or an individual approves for their own device (Apple Family Controls docs).

**Limits that affect the idea**

- The app never learns which apps the user picked or is using. Apple returns opaque tokens by design. An iOS app therefore cannot ask "what are you working on?" based on what is on screen. Content quizzes would need the student to type or paste the topic.
- Distribution requires Apple to approve a Family Controls entitlement request, made by the developer Account Holder, before App Store submission (Apple docs).
- The Apple Developer Program costs $99 per year, and enrollment requires an adult **(confirm both)**. A parent would hold the account.
- When a parent authorizes the app for a child, the child cannot delete it. That is a design choice to make deliberately; see section 4.

**Difficulty.** High. Swift, Xcode, a Mac, app extensions, and an Apple approval step.

---

## 3. Comparison

| | Chrome extension | iOS app |
|---|---|---|
| Blocks distractions | Yes, sites | Yes, apps and sites |
| Can see what the student is working on | Yes, with permission | No |
| Works on school-issued devices | Only if district IT allows it | Only if the school's device management allows it **(confirm)** |
| Cost | One-time fee, or free unpublished | $99 per year **(confirm)** |
| Build difficulty | Low | High |
| Approval needed | Web Store review if published | Apple entitlement plus App Review |

**Reading.** Homework happens mostly in the browser; distraction happens mostly on the phone. The extension can deliver every part of the idea. The iOS app can deliver blocking and manually-entered quizzes only.

---

## 4. Privacy and legal

Not legal advice. These are the issues to raise with the teacher or a school administrator.

- **COPPA** applies to online services directed to children under 13, or that knowingly collect personal information from them. It binds the operator of the service directly. The FTC amended the rule effective June 23, 2025, with most compliance due by April 22, 2026 (Federal Register, 2025-05904).
- **FERPA** binds schools, and reaches software vendors through their contracts with schools. It matters if a school adopts the app, not if a student installs it at home.
- **A list of sites a student visits, tied to that student, is sensitive.** So is anything that implies an ADHD diagnosis.

**Recommended design rules**

1. Store everything on the device. No accounts, no server, no analytics.
2. Never ask whether the student has ADHD. The app works the same either way.
3. The student sees their own data. No automatic reports to parents or teachers. The student can choose to export or show a summary.
4. If an AI feature is added, send only the text the student selects, never browsing history.
5. Do not put an AI service key inside the extension; anyone can extract it.

Rules 1–3 avoid most COPPA and FERPA exposure because nothing is collected. They also match the evidence: the supported intervention is *self*-monitoring.

**AI service terms.** Consumer AI services set minimum ages for users, and API terms restrict use with minors **(confirm for whichever provider is chosen)**. A parent should hold any API account. Chrome also ships an on-device model for some extensions, which would keep text on the device; availability on school Chromebooks is unverified **(confirm)**.

---

## 5. Existing products

These already cover parts of the idea. Trying two or three is useful research for Ben.

| Product | What it does | Gap relative to this idea |
|---|---|---|
| one sec | Pause screen before opening an app; has published trial evidence | No learning features |
| Forest | A tree grows while you stay off the phone | No check-ins or quizzes |
| Freedom, Cold Turkey | Hard blocking across devices | No learning features |
| Opal | iPhone blocking using Screen Time | No learning features |
| Focusmate | Live partner works alongside you | Not a blocker; adults |
| HabitLab | Research extension that rotates interventions | Research project; status unknown **(confirm)** |

Product details are from comparison articles, not from testing.

**What none of them combine:** friction blocking, self-monitoring check-ins, retrieval quizzes, and personal focus experiments in one tool designed for students. That combination is the project's distinct contribution.

---

## Sources

- Chrome `declarativeNetRequest`: https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest
- Chrome Enterprise, allow or block extensions: https://support.google.com/chrome/a/answer/6177431
- Chrome Web Store registration: https://developer.chrome.com/docs/webstore/register
- Chrome Web Store terms (age): https://ssl.gstatic.com/chrome/webstore/intl/en-GB/gallery_tos.html
- Apple Family Controls: https://developer.apple.com/documentation/familycontrols
- Apple entitlement request: https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement
- COPPA amended rule: https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule
- FERPA and COPPA overview (secondary): https://www.iplocation.net/blog/what-ferpa-and-coppa-actually-require-from-edtech-software
