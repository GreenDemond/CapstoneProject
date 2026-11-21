# T01 Skeleton
Status: built 2026-11-20

## What the student sees and does
1. Nothing yet. This task adds the package, the content loader and the check command.

## Research link
None. Design judgment: tooling only.

## What it stores
Nothing.

## What leaves the phone
Nothing.

## Distracted, stuck, back after a week
Not applicable.

## Differs from the web app
No.

## Tests
- Logic: content loads; six kinds each with starter steps; five hints; safety word and line not empty; missing file throws; missing key throws; unknown extra key ignored.
- UI main path, UI awkward path, device-only: none.

## How `Shared/` is reached
`FocusKit/Sources/FocusKit/Resources/Shared` is a symlink to `ios/Shared`, declared as a `.copy` resource. SwiftPM copies the real files into the bundle, so `Shared/` stays the one source of truth. `Content.bundled()` reads it; `Content.load(from:)` reads any URL.

## Unverified
- Plain `swift test` fails in this sandboxed environment (manifest sandbox error); `--disable-sandbox` works and `check.sh` uses it. On a normal Mac plain `swift test` should also work; not confirmed here.
- Whether Xcode's app build follows the symlink resource: checked when T04 adds the app.

## Gates
- Gate 2 (Advisor): not run in this session. The Advisor was not available to the Builder here; the Checker pass is the Builder's own re-run of check.sh (same model as Builder).
