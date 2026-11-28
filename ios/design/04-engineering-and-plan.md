# 4. Engineering and plan

Written for the agent who builds it. Ben and the parent need only sections 4.6 and 4.7.

## 4.1 Choices, made so nobody has to re-ask

| # | Choice | Why |
|---|---|---|
| I1 | Swift 6 and SwiftUI. No web view. No UIKit unless SwiftUI cannot do the job | One obvious way to build each screen |
| I2 | **No third-party packages**, not for the app and not for tooling | Nothing can break that nobody here can repair. `swift-format` ships with Xcode and is allowed |
| I3 | Minimum iOS 18.0 since 2026-11-27 (OLD1; was 26.0). Apple's on-device model and dictation need iOS 26 and are off below it. Originally: minimum iOS 26.0. Ben's phone is an iPhone 15 Pro Max on iOS 26.2 | The on-device model, its context size, and on-device speech are all declared from iOS 26.0 (verified in the kit). **Token counting is iOS 26.4 and later**, so on older versions the app estimates length from characters, conservatively, and relies on the context-full error with one retry. The context-full error has an older form (iOS 26) and a newer one (iOS 27); handle both |
| I4 | iPhone and iPad (from 2026-11-24, IPAD1). Mac later, from the same code. The iPhone is portrait only; the iPad turns to any orientation. Content stays in a column up to 820 points wide | The parent asked for iPad support |
| I5 | Storage is plain `Codable` structs saved as JSON files in the app's Application Support folder, through **one** type, `Store` | Boring, readable, easy to test, easy to migrate. No SwiftData or Core Data |
| I6 | Every piece of saved data carries a version number. Unreadable data is set aside as a backup and the app starts fresh | A damaged file must never stop the app from opening or saving |
| I7 | Every outside capability sits behind a protocol with a fake: `LanguageModel`, `SpeechInput`, `SpeechOutput`, `LookUp`, `Clock`, `Store` | The phone's AI and microphone cannot be tested in automation. The fakes are what the tests use |
| I8 | All logic lives in a Swift package, `FocusKit`, that builds and tests on the Mac with `swift test` | Fast checks with no simulator. This Mac has **no iOS simulator installed** today (verified 2026-11-20) |
| I9 | The app target holds only SwiftUI views and the wiring. A view contains no rules | So the tested package is where behaviour lives |
| I10 | Student and AI text is shown as plain `Text`. Never rendered as Markdown or HTML, never passed to a web view | Text from a student or an AI must never be able to act as markup |
| I11 | Network calls live in one file per destination (`WikipediaLookUp.swift`). Nothing else may open a connection | One place to review what leaves the phone |
| I12 | No secrets in the repository. Signing team and bundle identifier are set by the parent in Xcode and kept out of git where Xcode allows | Rule 9 |
| I13 | No analytics, crash reporting, or remote configuration | Rules 4 and 5 |

## 4.2 Folder layout

```
(this folder)
  README.md  AGENTS.md  CLAUDE.md  DECISIONS.md  PROGRESS.md  TASKS.md
  .claude/agents/             the Advisor and Checker definitions
  research/                   the research the app must match
  design/                     these notes, plus one short note per slice in design/slices/
  FocusKit/                   Swift package: everything testable
    Package.swift
    Sources/FocusKit/
      Content/                reads Shared/content.json (rules text, kinds, starter steps, hints, limits)
      Logic/                  pure functions: steps, split, check-ins, comeback, trimming, cleaning text
      Storage/                Store, saved types, versions, backup of unreadable data
      AI/                     LanguageModel protocol, rules builder, safety check, stream holder
      AI/Apple/               the only files that import FoundationModels
      Voice/                  SpeechInput, SpeechOutput protocols; sentence splitter
      Voice/Apple/            the only files that import Speech and AVFAudio
      LookUp/                 LookUp protocol, WikipediaLookUp, result cleaning
      Fakes/                  fakes for every protocol
    Tests/FocusKitTests/      logic tests, shared-case tests, fake-driven flow tests
  Shared/
    content.json              the app's words and rules (section 4.4)
    cases/*.json              inputs and expected outputs the Swift logic must match
  App/                        the Xcode project and the SwiftUI app
    FocusApp.xcodeproj
    FocusApp/                 App.swift, Today/, Work/, Talk/, Plan/, Me/, Theme/
    FocusAppUITests/          XCUITest: main path and awkward path per feature
  checks/
    check.sh                  the one command (section 4.5)
    device-checks.md          things only a real iPhone can show; Ben's steps
```

## 4.3 How a screen is put together

- One `@Observable` model per screen in `FocusKit` (for example `WorkModel`), taking its dependencies as protocols. The view reads the model and sends it taps. Tests drive the model directly.
- Navigation: one `TabView` with four tabs; the work screen is a full-screen cover over it.
- Theme: one file of named colours, spacings and type sizes. Views never type a colour or a number in place.
- Accessibility is part of "built": every control has a label, works with VoiceOver and the largest text size, and has a 44-point touch area.

## 4.4 Starting from the web app's words and rules

The iPhone app begins with exactly the words and behaviour the web app already has, so nothing researched or reviewed is lost, and then this folder owns them.

- `Shared/content.json` holds the AI rules text, the safety word and trusted-adult line, the kinds of work, the starter steps, the built-in hints, the limits, and the How I like to work questions. It was written once, on 2026-11-20, from the web app's tested logic. The app reads this file and types none of these strings into Swift.
- `Shared/cases/*.json` holds inputs and the web app's own outputs for the pure rules: check-in choices, hints, starter steps, trimming a chat, cleaning a guide, cleaning sources, cleaning pasted text, and the welcome-back line. The Swift tests must produce the same outputs. This is how the port is proved correct without the web app being present.
- After the seed, **this folder is the source of truth for the iPhone app.** Changing `content.json` or a case file is a deliberate change: it needs gate 2 and a line in the `DECISIONS.md` change log.
- Where the iPhone app is meant to differ from the web app (voice, the editor, the ladder under Stuck), the slice's design note says so, and the case file for that rule is updated in the same commit.

`Shared/README.md` describes each file.

## 4.5 Checks

One command from this folder: `checks/check.sh`. It runs, in order, and stops at the first failure:

1. `swift-format lint` on the Swift sources (strict).
2. `swift build` and `swift test` for `FocusKit` on the Mac.
3. If an iOS simulator is installed: `xcodebuild build` and `xcodebuild test` for the app and its UI tests. If none is installed, it prints **"SKIPPED: no iOS simulator"** and exits with a distinct code, so a skip can never be reported as a pass.

What automation cannot show, and `checks/device-checks.md` covers with numbered steps for Ben on a real iPhone: the phone's AI answering; the answer-giving checks; speech in and out; headphones-only; a phone call interrupting; the app surviving being closed mid-step; real VoiceOver.

## 4.6 Build order

Each task is specified in `TASKS.md` with what to read, what to do, and what "done" means. About an hour each unless marked.

| # | Task | Result |
|---|---|---|
| T00 | Decisions recorded | The parent's and Ben's answers from section 4.7 are in `DECISIONS.md` |
| T01 | Skeleton | `FocusKit` builds and tests on the Mac; `check.sh` works; `Shared/content.json` loads |
| T02 | Content and logic | Kinds, starter steps, hints, split, check-ins, comeback, all passing the shared cases |
| T03 | Storage | `Store`, versions, damaged-data backup, save after every change |
| T04 | App shell | Xcode project, four tabs, theme, first-run screen; runs in the simulator |
| T05 | Assignment and editor | Sections 2.4 and 2.5 of the screens note, by typing |
| T06 | Today and the work screen | Sections 2.6 and 2.7, with comeback |
| T07 | Stuck ladder, without AI | Hints, Ask a person |
| T08 | Look it up | Wikipedia search, in-app page, offline message |
| T09 | Voice in | Microphone button, on-device speech to text, permission flow |
| T10 | Voice out | Read this step, We talk, headphones only, Stop |
| T11 | The phone's AI | Availability, rules builder, safety check with streaming, context trimming, fakes |
| T12 | Talk | The chat screen, saved chats, Use these as my steps |
| T13 | Step coach | "I'll say my steps" and "Give me an idea" |
| T14 | Answer-giving checks on a real phone | Transcript recorded; advisor verdict |
| T15 | Me | Goals, notes, How I like to work, How the AI talks, Voice, Delete everything |
| T16 | Whole-app review | Accessibility, text sizes, dark mode, every awkward case in section 2.11 |
| T17a | First build on Ben's phone (as soon as T06 is done) | Through the parent's account; Ben runs `device-checks.md` |
| T17b | Version 1 build on Ben's phone | Ben uses it for real homework for a week |

About 20 to 24 sessions. Tasks T01 to T03 need no simulator and no decisions beyond T00, so they can start at once.

Later, each with its own design note and decision: calendar list and reminders; lock-screen card; own-key helpers and OpenRouter search; TestFlight for classmates; the pause screen; iPad and Mac.

## 4.7 Decisions needed before building (T00)

**Parent**

| # | Question | Recommendation |
|---|---|---|
| 1 | Go ahead with a native Swift iPhone app, with no third-party code, alongside the unchanged web app. (This sets aside the web project's own rule that it has no native code.) | Yes |
| 2 | ~~Install the iOS simulator~~ **Answered 2026-11-20:** the work moves to another computer that already has it. The first session there confirms with `xcrun simctl list devices available` | |
| 3 | Sign in to Xcode with the developer account and set the team and bundle identifier yourself | Needed by T17a. Agents never handle account details |
| 4 | The "what leaves the phone" rows in `03-ai-search-privacy.md` section 3.7 | Yes |
| 5 | Should the phone's own backup include the app's data? | Decided 2026-11-21 (parent): a switch, on by default. The key is never backed up |
| 6 | Safety: add the two extra signals in `03` section 3.5 (with Ben) | Yes |
| 7 | Microphone use by students, on-device only, no recordings kept | Yes |
| 8 | Who may receive a build after T17b: Ben only, or classmates through TestFlight | Ben only until T14 passes, the teacher approves, and parents give written permission |

**Ben**

| # | Question | Options |
|---|---|---|
| 1 | Voice at first launch | Quiet until turned on (recommended, matches "no sound by default"); or ask on first run |
| 2 | Making steps | "I'll say my steps" first (recommended; it matches the research best); or "Suggest some" first |
| 3 | Must the student change a suggested step before Start? | No, but they must see the editor (recommended); or yes |
| 4 | The four places | Today, Talk, Plan, Me (recommended); or three, with Plan inside Today |
| 5 | What waits until after version 1 | The proposal in `01-what-it-is.md` section 1.3 |
| 6 | Name, words for drifting and stuck, how progress is shown | His. Rule 8 applies to the name on the App Store |
| 7 | ~~Which iPhone he has~~ **Answered 2026-11-20:** iPhone 15 Pro Max, iOS 26.2. Still to ask: is Apple Intelligence switched on (Settings, Apple Intelligence & Siri)? | Needed before T11 |

## 4.8 Unverified, to check at the task that depends on it

| Claim | Check at |
|---|---|
| Whether Ben's iPhone 15 Pro Max is eligible for Apple Intelligence (believed yes, from memory, not from a source read), whether it is switched on, and whether a child's Apple account can use it. The app's own availability check on the phone is the real answer | T00, T17a |
| Whether iOS 26.2 behaves like the iOS 27.2 kit the design was read from. Anything marked iOS 26.4 or 27 in the kit must not be assumed on Ben's phone | T09, T11 |
| The on-device model's real context size and speed on Ben's phone | T11 |
| Whether the on-device model and on-device speech work in the simulator | T09, T11 |
| Which languages on-device speech supports, and whether it needs a download first | T09 |
| How to detect headphones reliably | T10 |
| App Review rules: web wrappers (4.2), apps with AI chat used by minors, age rating | Before any TestFlight or App Store step |
| TestFlight's minimum tester age and whether outside testers need a review | Before classmates |
| Family Controls entitlement process for the pause screen | Before that later task |
| Whether Xcode's project file can be written by an agent without opening Xcode | T04; fallback in `TASKS.md` T04 |
