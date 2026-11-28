# Release documents (App Store)

Written 2026-11-27. Everything here is a DRAFT for the parent to read, change and approve. Nothing here has been submitted, hosted or sent to Apple. Agents never create accounts, host pages or enter anything in App Store Connect; those are the parent's steps (`DECISIONS.md` D9, T7).

| File | What it is | Who acts |
|---|---|---|
| `APP-STORE-CHECKLIST.md` | Every requirement for acceptance, where the app stands today, who does what | Parent and agent |
| `PRIVACY-POLICY-DRAFT.md` | A plain-language privacy policy, ready to host once the parent has read it | Parent |
| `SUBMISSION-TEXT-DRAFT.md` | The words for the store page, the age-rating facts, the App Privacy answers, and the notes for App Review | Parent and Ben approve |

## How these were made

- **Confirmed on 2026-11-27 from Apple's pages or Apple developer news:** the new rule on sharing data with third-party AI (5.1.2(i)); the updated age ratings (4+, 9+, 13+, 16+, 18+); the privacy manifest and "required reason" API rule; that a privacy policy link is required.
- **From my memory, marked (check):** screenshot sizes, the EU trader declaration, the Kids Category rules, how Apple treats an App Transport Security exception, review times. Check these against App Store Connect and Apple's pages before relying on them.
- **From the repository:** everything about what the app stores, sends and asks for. Each item names its source.

## The short version

1. The app is not ready for public release yet. The blockers are in the checklist under "Must be true before submitting".
2. TestFlight is the stage before it and does not need most of this. Apple reviews the first external TestFlight build, but it does not apply the full App Store checks.
3. Rule 8 (no claims to treat ADHD or improve attention) applies to the store page, the screenshots and the review notes as much as to the app.
