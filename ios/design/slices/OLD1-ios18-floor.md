# OLD1 Lower the minimum iOS to 18.0
Status: built 2026-11-27. Gate 1 GO, gate 2 GO. The parent asked for it ("yes to all", after "can we build for an older version of iOS for the iPhone 11 and just reduce features?" and "what's the oldest we can use without changing functionality").

## What the student sees and does
1. On iOS 26 and later: nothing changes.
2. On iOS 18 to 25 the app installs and works with two things off:
   - **Apple's on-device AI.** It does not exist before iOS 26. The app behaves as it already does on a phone that cannot run Apple Intelligence, with the existing line "This device can't run the AI helper. Hints and Look it up still work.": starter steps, the fixed lines, hints-only Talk. A student's own AI service (My AI services) still works.
   - **Talking into the microphone (on-device dictation).** It does not exist before iOS 26. The microphone button, if Talk is switched on, shows the existing calm line "Talking isn't available right now. You can type, or use the keyboard's microphone." The keyboard's own microphone still works.
3. Read-aloud is unchanged (Apple's older speech synthesizer, available on iOS 18).
4. The look on iOS 18 is the system's plain style (a standard tab bar instead of iOS 26's glass one). Checked from iOS 18.2 simulator screenshots of the editor; no layout problem seen.

## Why 18.0 and not lower
Measured 2026-11-27 in a throwaway copy: at iOS 17 the app's tab bar (`RootView.swift`, SwiftUI `Tab`, iOS 18 and later) does not compile. At 18.0 the whole app builds. Supporting iOS 17 would also cost a tab-bar rewrite. (From memory, not checked against Apple's list: iOS 17 and 18 run on the same iPhones, so 17 may reach no extra phones.)

## Research link
Not a research question. It follows D5 (the app is fully usable with no AI), extended to students whose phones are not on iOS 26.

## What it stores
Nothing new.

## What leaves the phone
Nothing new. The no-AI path sends nothing. A student's own AI service follows its existing D8 rows.

## The change
- `FocusKit/Package.swift`: `.iOS("26.0")` becomes `.iOS("18.0")`. `.macOS("26.0")` is unchanged, so the Mac tests and the eval tools (`PhoneAIEval`, `StepsEval`) still use Apple's model.
- `App/FocusApp.xcodeproj/project.pbxproj`: `IPHONEOS_DEPLOYMENT_TARGET` 26.0 becomes 18.0 (2 places; the UI test target has none of its own).
- `AI/Apple/AppleLanguageModel.swift`: the class is marked `@available(iOS 26.0, macOS 26.0, *)`. No other change.
- `Voice/Apple/AppleSpeechInput.swift`: the class and its private helper `Pump` are marked the same way. No other change.
- `App/FocusApp/AppBoot.swift`: the real launch uses Apple's model and dictation inside `if #available(iOS 26.0, *)`; otherwise it uses the existing services with no dictation and `UnavailableLanguageModel(reason: .deviceNotEligible)`, so the existing "This device can't run the AI helper" line shows rather than "isn't available right now", keeping Apple's speech output, headphones, the Keychain, the network and the backup flag. The fake-AI and `-focus-no-ai` test paths are untouched.
- UI test helpers, needed because iOS 18 behaves differently, not weakened:
  - `UITestHelpers.openMe`: re-tapping the Me tab returns to the top on iOS 26 but not on iOS 18. If the row is above the navigation bar (off screen at the top), scroll down until it is below it. No swipes when it is already visible, so iOS 26 runs are unchanged.
  - `MeUITests.testAddAndDeleteANote`: the new note row sat under the tab bar on iOS 18 and XCUITest still called it hittable, so the swipe hit the tab bar. Scroll until the row is above the tab bar, judged by position.
- Records: D12 and design note I3 (`design/04-engineering-and-plan.md`) change to iOS 18.0; a change-log row; `PARENT-STEPS.md` keeps the iOS 26 SDK requirement for building (the SDK, not the floor). `PROGRESS.md` gains how to run the suite on iOS 18.

## Distracted, stuck, back after a week
No change.

## Differs from the web app
No.

## Tests
- Unit: `swift test` (macOS) unchanged: 683 tests. Also run in the trial: 683 of 683 passed with the iOS 18 package floor.
- UI on iOS 26: the full `checks/check.sh` (iPhone 15 Pro Max) must pass with the changed helpers.
- UI on iOS 18: the full suite on the iPhone 11 simulator with iOS 18.2 (`CA32B322-11C7-44A1-BE0F-61DF1CAAA7F0`). Trial result before the helper fixes: 68 passed, 1 expected iPad-only skip, 2 failed; after the fixes both passed when run alone. Full rerun after the change (2026-11-27): 71 tests, 70 passed, 1 expected iPad-only skip, 0 failures.
- Many UI tests launch with only `-focus-fresh-data` and no AI argument, so on iOS 18 they go through the new no-AI branch of `AppBoot`.
- Device only: an iPhone on iOS 18 is not available here. Not checked on a real phone.

## Known gaps (not fixed here)
- On iOS 18 to 25 the Me **Talk** switch can be turned on, and the microphone then only says talking is not available. That is the same as today on an iOS 26 phone whose dictation is unavailable. A clearer line ("not on this iPhone") would be new student words and its own small task.
- `checks/check.sh` still runs only the iOS 26 simulator. The iOS 18 run is manual, documented in `PROGRESS.md`.
- App Store / TestFlight will list iOS 18.0 as the minimum; nothing else changes for the parent's devices.

## Unverified
- That iOS 17 and 18 support the same iPhones (from memory).
- Behaviour on a real iOS 18 phone, including read-aloud voices.

## Gates
- Gate 1, 2026-11-27, independent read-only reviewer (same model family as the Builder): **GO**, no must-fix. Suggestions taken: correct the rule citation; show the existing "This device can't run the AI helper" line below iOS 26; scroll in `openMe` only when needed; fix the stale `check.sh` comment; log the Talk-switch gap as a task; run the Me and navigation tests on an iPad. Reviewer's note on the note-row case: most likely an XCUITest quirk, since the row is in a scrollable list.
- Gate 2, 2026-11-27, same reviewer: **GO**, no must-fix. Suggestion taken: the note test scrolls only when the tab bar is at the bottom (iPad tabs are at the top). Results: unit 683 of 683; iOS 18.2 iPhone 11 full UI suite 70 passed, 1 expected skip, 0 failures; iOS 26 `checks/check.sh` ALL CHECKS PASSED; iPad Me, navigation and iPad tests 18 of 18; after the last tweak the note test passed on iOS 26, iOS 18 and iPad. No fresh-context Checker. Not run on a real iOS 18 phone.
