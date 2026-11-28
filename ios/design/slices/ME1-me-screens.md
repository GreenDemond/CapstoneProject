# ME1 Me tab: a short list of screens
Status: done 2026-11-24 (gate 3 PASS)

## What the student sees and does
1. Me shows a short list in three groups. Rows: Goals and notes; How I like to work; then "How the app helps": How the AI talks, Voice, My AI services; then "Privacy": the backup switch (stays on Me, with its note); then About and privacy.
2. Tapping a row opens its own screen with a back button. Every control inside is the same as before.
3. Goals and notes holds the goal fields, the notes list and the Delete-note confirmation.

## Research link
Design judgment, to be tested. `ROADMAP.md` 2d (parent's backlog: reorganise settings), `design/slices/UX-whole-app-review.md` item 5 (split Me into destinations), and the reviewer's note that Me at the largest text size is many screens tall.

## What it stores
Nothing new.

## What leaves the phone
Nothing new. The screens call the same model functions as before.

## Distracted, stuck, back after a week
Unchanged. Leaving a screen keeps the saved settings.

## Differs from the web app
Yes: the web app has one settings page.
Visible change beyond navigation: each sub-screen has an inline title, not the large Me title; Voice, How the AI talks and My AI services take two taps instead of a scroll; the Me list shows two new group headers ("How the app helps", "Privacy").

## Tests
- UI: `MeUITests` opens each row with `openMe` (helper in `UITestHelpers.swift`) and asserts a control on each screen. `testEveryMeRowOpensItsScreenAndComesBack` covers all five rows and the back button.
- UI: `LargeTextUITests` reaches each row at the largest text size, then opens My AI services to reach "Add a service".
- UI: `DemoWalkthroughUITests` opens My AI services by row.
- The existing Me tests (notes, voice, first guess, services, delete everything, backup) keep their assertions; only the navigation to their screen changed.

## Unverified
Layout on a real phone at the largest text size; whether a row reads well in the list. Device step 86 covers the About version line; the Me rows are a new device check to add when built.

## Gates
Gate 1 (design): not obtained in this session. The layout was chosen from the UX review and recorded in DECISIONS.md (2026-11-23). The 2026-11-23 waiver covers Ben's go-ahead only.
Gate 2 (diff, `semantic_reviewer`, model not stated, read-only, 2026-11-23): FIX FIRST. All of its must-fix items are applied: the note now records the visible changes above, stale "Me page" comments are fixed, the stray blank line is removed, and the new words sit in the existing `Words` extension. Its finding that nothing leaves the phone, nothing is stored differently, and every moved control and identifier is unchanged was confirmed by reading the diff against HEAD.
Gate 3 (fresh Checker, 2026-11-24, read-only, model not stated): PASS. A fresh run of `checks/check.sh` on commit 0247481 gave ALL CHECKS PASSED (40 UI tests, 0 failures), and each done-when line passed: 6 NavigationLinks, every earlier identifier present plus the five me-row-* ones, testEveryMeRowOpensItsScreenAndComesBack present, backup-switch and me-about on the root.
