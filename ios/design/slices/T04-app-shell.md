# T04 App shell
Status: built 2026-11-20 (compile-checked; not run on a simulator)

## What the student sees and does
1. First launch: one screen with two sentences about the app, "Your work stays on this iPhone", and **Start**. No account, name, age, diagnosis or permission request.
2. Four tabs: Today, Talk, Plan, Me. Each is a placeholder in this task; later tasks fill them.

## Research link
Design judgment (`design/02` sections 2.1 and 2.3). Colours: Ben's earthy palette (sand, dark brown, olive moss, a little clay), light and dark.

## What it stores
`flags.json`: whether the first-run screen was seen, and whether the student was on the work screen. Nothing personal. The data folder is excluded from the phone's own backup (the recommendation in `design/04` 4.7 item 5; the parent has not yet confirmed it).

## What leaves the phone
Nothing.

## Distracted, stuck, back after a week
Not applicable yet.

## Differs from the web app
Native tabs; no pop-out window.

## Project file
Written by hand: `App/FocusApp.xcodeproj` uses Xcode's folder-based groups (every file under `App/FocusApp` and `App/FocusAppUITests` is picked up) and the local package `../FocusKit`. It built on the first attempt, so the "two attempts" fallback in T04 was not needed. No signing team; the bundle identifier is the placeholder `example.focusapp` at the time; since replaced by `com.craighagan.focusapp` (see DECISIONS.md change log).

## Findings
- Xcode follows the `Resources/Shared` symlink inside FocusKit: `content.json` is inside `FocusApp.app/FocusKit_FocusKit.bundle/Shared/` in the built app. The `Shared/cases` test files are copied into the app too (small, harmless; remove with a build-setting exclusion later if wanted).
- `@Observable` and `@State` are macros. Inside some sandboxed agent tools, Swift cannot start the macro plug-in (`sandbox-exec: Operation not permitted`). `check.sh` adds `-disable-sandbox` and a few cache settings only when it detects this. On a normal Mac nothing extra is needed.
- `Theme.Type` is not allowed as a name; the type scale is `Theme.Typography`.

## Tests
- UI (`AppShellUITests`): first-run screen then four tabs; no permission alert on first run. **Written, compiled, not run** (no simulator).
- Logic: none new.

## Unverified
Layout at the largest text size, in dark mode, and on the smallest iPhone: not seen on a screen. Device checks added.

## Gates
Gate 1 and 2: no Advisor agent available in this session. Self-review only (same model as Builder). Gate 2 owed (project settings, bundle contents).
