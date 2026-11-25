# IPAD1 Run natively on iPad
Status: done 2026-11-24 (gates 1 to 3; checked on the parent's iPad)

## What the student sees and does
1. The app installs on an iPad as a full-screen iPad app, not a small phone window.
2. Every screen works as on the iPhone: Today, Plan, Talk, Me, the editor, the work screen, the Stuck sheet.
3. On a wide screen the content stays in a centred column of comfortable width, so lines are not stretched across the iPad. The one-thing-on-screen rule holds.
4. The iPad can be held in any orientation. The iPhone stays portrait only.
5. Nothing new is added. No split view, no sidebar, no extra features.

## Research link
Design judgment, to be tested on an iPad. `design/04-engineering-and-plan.md` decision I4 said "iPad and Mac later, from the same code"; the parent asked for iPad on 2026-11-24 (DECISIONS change log).

## What it stores
Nothing new.

## What leaves the phone
Nothing new. The microphone and speech prompts now say "this device".

## Distracted, stuck, back after a week
Unchanged.

## Differs from the web app
No.

## Changes
- App target: `TARGETED_DEVICE_FAMILY = "1,2"` in both configurations; UI test target too, so the tests can run on an iPad simulator.
- `INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad` set to all four orientations; the iPhone key stays portrait only.
- A readable-width cap (`readableColumn`, 820 points) applied to each tab's content, the welcome screen and the work screen (which is a full-screen cover, so the root alone would not reach it). The first width tried, 640, folded Talk's second toolbar button into a "More" menu on iPad, because the cap also narrows the navigation bar; two UI tests caught it. 820 keeps the toolbar whole. It uses the space available, not the device type, so a narrow iPad window is unchanged. The iPad's tab bar keeps the default iOS 26 look; no sidebar is added.
- Multitasking: resizable windows (Split View, Slide Over, Stage Manager) are supported, not turned off; `UIRequiresFullScreen` is not set.
- The UI tests find tabs through a helper (`tab(_:)`) because the iPad's tabs float and are not a tab bar. An iPad-only landscape test is added. Phone tests are unchanged.
- Words: "this iPhone" became "this device", "my iPhone backup" became "my backup". Two tests that matched the old wording were updated to the new.
- Apple Intelligence is not on every iPad. The existing no-AI path covers it; device step 93 checks it.
- App Store: a universal build needs iPad screenshots later (the parent's step). TestFlight does not. Any tester with an iPad can now install a build, so who may receive a build is still the parent's decision.
- Words that say "iPhone" in places a student sees on an iPad are checked, and changed to "this device" only where the screen is shown on iPad too. About and privacy and the backup switch say "iPhone backup": check each.

## Tests
- Unit tests unchanged.
- UI tests: run the whole existing suite on an iPad simulator, in portrait and in landscape for the main path (Today, editor, work screen).
- Screens checked by screenshot on an iPad simulator: Today, editor, work screen, Talk, Me.
- Device: a real iPad is not available to the agent; device-check step 93 for the parent.

## Unverified
Real-iPad behaviour: Apple's on-device model on the parent's iPad, the microphone and speech, and the keyboard with a hardware keyboard.

## Gates
Gate 1 (semantic_reviewer, 2026-11-24): FIX FIRST, seven must-fix, applied above: wording and permission prompts changed; wording strategy chosen; multitasking decided; cap reaches the work screen; App Store and TestFlight effects noted; Apple Intelligence on iPad noted; iPad simulator tests added.
Gate 2 (semantic_reviewer, 2026-11-24): GO. Optional notes: on a real iPad, check that the navigation bar and scroll bar sit at the column edge not the screen edge (cosmetic); the landscape test does not check the column cap.
Gate 3: full check/check.sh ALL CHECKS PASSED on the iPhone simulator (501 unit tests, UI tests, 0 SKIPPED). All 44 UI tests also passed on an iPad Air 11-inch (M4) simulator, including the landscape test (not skipped). The parent installed build 18 on a real iPad Pro 11-inch (M4) and confirmed it fills the screen and looks right. No fresh-context Checker was run for IPAD1. The iPad run is manual, not in check.sh.
