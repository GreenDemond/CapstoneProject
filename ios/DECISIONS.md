# DECISIONS.md

Choices already made for the iPhone app, with reasons, so agents do not re-ask. A choice marked **(waiting)** is a proposal until the named person agrees; do not build past it. New and changed decisions go in the change log at the bottom.

## Standing decisions

| # | Decision | Why | Status |
|---|---|---|---|
| D1 | A native iPhone app in Swift and SwiftUI. No web view | Voice, the phone's own AI, and a publishable app all need it (`design/01-what-it-is.md` section 1.2) | Decided (parent, 2026-11-20) |
| D2 | No third-party code, in the app or in tooling. Only what ships with Xcode | Nothing can break that nobody here can repair; nothing unknown handles a student's words | Decided |
| D3 | Everything the student enters is stored on the phone only. No account, no sign-in, no sync | Rule 4; no data about minors held anywhere | Decided |
| D4 | The app never asks for a name, age, school, or diagnosis | Rules 3 and 4 | Decided |
| D5 | The app is fully usable with no AI | Not every phone has the AI, and the no-AI path must always exist | Decided |
| D6 | The AI is Apple's on-device model by default. Apple's cloud model is never used. A student may add up to five AI services of their own under Me (none at first). Each has a label, an address (https, or http, which is not encrypted), a model name and its own key. Each key lives only in the iOS Keychain, under an account made from the service's id and never from its label (this iPhone only, never in a backup). A visible choice on Talk picks between On this iPhone and each ready service. The optional Look up models button asks the service for its model names; typing a name always works | Keeps every word on the phone for a student who never opens the setting; lets the parent's own services be used when wanted. Every reply from every AI passes the same safety word, trusted-adult line and answer checks | **Decided (parent, 2026-11-21):** "For the AI default to Apple, but allow a setting for providing an endpoint/key." Then: "Can I register multiple AI services? I'd like that." Then: "accept http as well" (answered: http for any address). The answer-giving checks (T14) must be run against each AI service used, not only Apple's |
| D7 | Voice: speech is turned into text on the phone; the microphone is on only while the student holds or taps the button; recordings are never kept; the app is silent unless the student turns its voice on | Rules 4 and 5; "no sound by default" | **Parent decided 2026-11-20:** the microphone is used for voice interaction. Voice is two separate switches under Me: **Read aloud** (the app speaks) and **Talk** (the student speaks into the microphone). Either, both, or neither may be on. This replaces the three-way Quiet / I talk / We talk setting, which still needs changing in code. Still Ben's: whether both start off at first launch (recommended) |
| D8 | What may leave the phone: see the table below. Nothing else, ever | Rule 4 stated openly | **(draft: parent to confirm before classmates).** Rows added 2026-11-21 by the parent's decisions on the own AI service and the backup switch |
| D9 | Ben never runs a command or edits a file. The parent does every Apple account step (sign-in, signing, TestFlight, App Store). Agents never handle account details | Ben does not code; the account is the parent's | Decided |
| D10 | One check command, `checks/check.sh`. A skipped part is reported as skipped | A wrong "it works" cannot be caught by anyone | Decided |
| D11 | Work is done by a Builder, with an Advisor (strongest model, read-only) at fixed gates and a Checker (fresh context) before "done" (`AGENTS.md` sections 2 to 4) | Nobody reviews the code; the roles are the review | Decided |
| D12 | Engineering choices I1 to I13 in `design/04-engineering-and-plan.md` section 4.1 | Chosen so the next agent does not have to | Decided. I3 is iOS 26.0, set from Ben's phone; classmates' phones are not yet known |
| D13 | **Backup.** "Include in my iPhone backup" is a switch under Me, on by default. It sets or clears the data folder's exclude-from-backup flag, at launch and when changed. Existing installs with no saved value get on. The Keychain key stays device-only whatever the switch says | The parent chose a switch, defaulting to backed up, so a lost phone does not lose the student's steps | **Decided (parent, 2026-11-21):** "backup: switch, default to backed up" |

### D8. What may leave the phone

| When | What | To |
|---|---|---|
| The student taps Look it up | The look-up words | Wikipedia |
| The AI looks something up (only if the answer-giving checks pass) | The search words the AI chose | Wikipedia |
| The student opens a source | A normal web page visit | That website |
| The student has added an AI service under Me (none at first), has chosen it on Talk, and chats or uses the step coach | The student's chat messages, the step text and assignment text the step coach uses, the app's rules (with the student's AI guide and the kind of work), the model name, and that service's own key in the Authorization header | The address of the service the student chose. That service's own privacy rules apply. If the address starts with http:// it is not encrypted |
| The student taps Check connection on a service | One short fixed test message (no student words), the model name, and that service's key in the Authorization header | The address of the service the student chose |
| The student taps Look up models while adding or editing a service | A request for the list of model names (no student words), with the key just typed or that service's saved key in the Authorization header. The list address is the entered address with /models in place of /chat/completions, on the same host; the app never guesses another | The address of the service the student chose |
| The backup switch is on (it starts on) | The app's saved data. Never the AI key, which stays on this iPhone only | The student's own iPhone backup (iCloud or computer), when the backup switch is on |

**Tailscale exception (parent, 2026-11-21):** an http address on a `*.ts.net` name or in 100.64.0.0/10 does not get the "not encrypted" line on Talk, because a tailnet encrypts it end to end. The tick box when saving any http address still applies. Caveat: 100.64.0.0/10 is also used by internet providers for their own networks, so an address in that range is not proof of Tailscale. Before classmates, decide whether to keep the range or only `*.ts.net` names.

No analytics, crash reporting, advertising, or sync. Audio never leaves and is never stored. The AI key is stored only in the Keychain and goes nowhere except in the Authorization header to the address of the service it was saved for. Each key is kept under that service's id, so one service's key is never sent to another service's address.

## Product defaults

Chosen from the research so that work can start. Ben can change any of them.

| # | Default | Source in `research/` |
|---|---|---|
| P1 | The student makes or edits the steps before starting: change words, delete, reorder, add, split, join | `04`, idea D2 |
| P2 | The student picks how many steps to aim for: about 3, 5, or 8 | `05`, section 3 |
| P3 | The work screen shows one step at a time, with "step 3 of 7" | `04`, idea D3 |
| P4 | Each step offers Done, Still working, Stuck, Drifted, Later | `04`, idea D4 |
| P5 | Drifted splits the current step in two and earns the same as Done | `05`, section 4 |
| P6 | Stuck gives a hint or a pointer to a resource, never the answer | `00`, section 2 |
| P7 | A weekly goal, not a streak that resets (not in version 1) | `04`, idea G4 |
| P8 | After a day or more away, the app opens to one "pick up here" button and nothing about the gap | `05`, section 4 |
| P9 | After a study or reading step, one optional recall question | `00`, section 2 |
| P10 | No sound by default | `00`, section 5 |
| P11 | The check-in is always a silent tap, never a spoken exchange | The tested form of self-monitoring; usable in class |
| P12 | Suggested steps always open in the editor, never straight on the work screen | `04`, idea D2; rule 1 |

## Waiting on

The questions, options and recommendations are in `design/04-engineering-and-plan.md` section 4.7. Task T00 records the answers here.

**Parent:** sign in to Xcode and set the team; confirm D8; the two extra safety signals; who may receive a build.

**Ben:** whether Apple Intelligence is on; voice at first launch; which way of making steps comes first; whether a suggested step must be changed before Start; the four places; what waits until after version 1; the app's name, the words for drifting and stuck, and how progress is shown.

Already answered:

- The parent has a paid Apple developer account and Ben may publish through it (2026-11-20).
- Ben would prefer to talk to the app (reported by the parent, 2026-11-20).
- Ben's phone is an iPhone 15 Pro Max on iOS 26.2 (parent, 2026-11-20). Whether Apple Intelligence is switched on is not yet known.
- The work will move to another computer that already has the iOS simulator (parent, 2026-11-20).
- Ben is 18 (parent, 2026-11-21). He can be an internal TestFlight tester. Classmates in a later beta may be minors, so the parent-permission rule for them stays.

## Change log

| Date | Change | Reason | Decided by |
|---|---|---|---|
| 2026-11-20 | Folder created as a self-contained design for a native iPhone app. Words, rules and test cases seeded from the web app into `Shared/` | The parent asked for an iPhone design in a new folder that can be handed off whole | Parent asked; agent wrote |
| 2026-11-20 | Minimum iOS set to 26.0 (was 26.4 in the first draft). Token counting is used only where the phone has it | Ben's iPhone 15 Pro Max runs iOS 26.2. The kit shows the model and its context size from 26.0 and token counting from 26.4; the first draft wrongly put context size at 26.4 | Agent, from the parent's answer |
| 2026-11-20 | D1 decided: go ahead with a native iPhone app. The parent asked for "a complete working app" | The parent's request | Parent |
| 2026-11-20 | T09 to T13 and T15 built on the recommendations for D6 and D7 without changing their status. They stay waiting for the parent (and Ben for D7). If either answer differs, the voice and AI parts switch off by setting Voice to Quiet and by `Services.none` | The parent asked for a complete working app; no answer had been given | Agent, on the parent's request |
| 2026-11-20 | D7 and parent question 7 decided: the microphone is used for voice interaction (on-device speech to text, nothing recorded). Voice becomes two independent switches, Read aloud and Talk, instead of Quiet / I talk / We talk. Needs a code change to the voice setting and the Me screen, done as its own task | The parent wants reading aloud and talking to be separately toggleable | Parent |
| 2026-11-20 | Bundle identifier set to `com.craighagan.focusapp` (tests: `com.craighagan.focusapp.UITests`) and signing team to ANA76MNRSN, automatic signing | The parent owns the Apple developer account and confirmed these | Parent |
| 2026-11-21 | App name "Ben's Steps" for now (home screen and App Store Connect). Bundle identifier changed to `com.craighagan.benssteps` (tests `.UITests`) before any App Store Connect record existed. Staircase placeholder icon. The Xcode project and target keep the internal name FocusApp | "Focus" was taken in App Store Connect. A name with "ADHD" or "Focus" would read as a treatment or attention claim (rule 8) and would tell others the student has ADHD (rule 3). Ben may still choose the final name | Parent || 2026-11-21 | D6 changed: Apple's on-device model stays the default; a setting **Use my own AI service** (address, key, model name) is allowed. Built as a second `LanguageModel`, so the safety word, trusted-adult handling and answer guard apply as before. Key only in the Keychain. Three D8 rows added. T14 checks must be run against each AI service used. The old "No AI keys in version 1" is withdrawn | The parent asked for the AI default to be Apple's, with a setting for providing an endpoint and key | Parent |
| 2026-11-21 | Added decision D13, Backup: a switch "Include in my iPhone backup", on by default. This replaces the earlier recommendation to exclude the data folder from backup. The privacy wording now says the work stays on this iPhone and, when the switch is on, in the student's own iPhone backup. D8 row added | The parent chose "switch, default to backed up" | Parent |
| 2026-11-21 | A visible switch on Talk between "On this iPhone" and "My service" appears while the own service is on and ready. Turning the service on makes it the one in use | The parent asked that when an additional AI is enabled there is a visible switch between them | Parent |
| 2026-11-21 | D6 changed again: up to five student-entered AI services replace the single one. Each has its own key in the Keychain under an account made from its id. Talk gets a visible choice (On this iPhone first, then each ready service). Build 5's single service becomes the first entry, "My service", keeping its key. Editing a service's address to another host removes its saved key. Addresses may be https or http (a calm line says http is not encrypted); iOS needs an App Transport Security exception for this (`App/Info-Extra.plist`). New optional Look up models button. D8 rows rewritten and one added | The parent asked: "Can I register multiple AI services? I'd like that." and "accept http as well" (http for any address) and asked for model lookup with typing as an override | Parent |
| 2026-11-21 | Tailscale addresses skip the Talk "not encrypted" line (see the note under D8) | The parent found the warning annoying: "not show it for tailscale" | Parent |
| 2026-11-21 | A chat stays with the AI it was written to. Changing the AI and then sending starts a new chat and says so; the earlier chat stays saved in My chats and is not sent. Saved chats remember their AI | The independent review found that earlier on-phone messages were sent to an external service after a switch, which breaks "Your messages don't leave it" (rule 4, D8) | Agent, from the review |
| 2026-11-21 | Starter step "Check what you missed" became "Check your answers against your notes" (`Shared/content.json` and its case file together) | The word "missed" is on the never-shame list. The parent approved fixing it | Parent |
| 2026-11-21 | Text fields are 56 points tall and tappable across their full width (one shared style). Main, outlined and link buttons give a light tap on press. Build 10 | The parent found the small text fields hard to touch, and asked for better haptic feedback throughout the app | Parent |
| 2026-11-21 | The AI choice is shown on the assignment screen too, with the line "Steps will be made by". It is the same setting as Talk | The parent asked why steps had no AI option; one shared setting avoids two choices that could disagree | Parent |
