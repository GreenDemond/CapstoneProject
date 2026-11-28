# Web app: getting as close to the iPhone app as a browser can (plan)

Written 2026-11-27 at the parent's request. Status: plan approved by the parent ("go do it all"). Each slice below still gets its own design note, tests and commit.

## Why

Classmates cannot all use TestFlight: some phones are restricted, some are Android, some are old and cannot run iOS 26. A web page opens on all of them with no store and no install rights. The iPhone app stays the richer version for Ben, the parent and recent iPhones.

## Decisions for this work

| # | Decision | Reason |
|---|---|---|
| W-D1 | Plain web app, as in T1. **Not required to be a PWA. Offline is not needed.** | Parent, 2026-11-27. A service worker adds stale-file risk and nobody technical watches it. |
| W-D2 | **No AI for classmates.** The web version must be fully useful without AI (T5). The existing "own AI key" helpers stay for the parent and Ben. | Classmates under 18 do not use external AI; a browser cannot use Apple's on-device model. |
| W-D3 | **Better no-AI heuristics are built here first** (iOS `FEATURES.md` F6), in JavaScript, with a fixture set. | The web app is the classmates' product, so it is where they matter. The iPhone app can adopt the same fixtures later. |
| W-D4 | The web app **owns its own words and rules**. Ideas and wording may be read from the iPhone app (a separate project, `AGENTS.md`), but nothing is imported from `ios/`, no test depends on it, and nothing in `ios/` is changed. | The two projects stay independent; the deployed site contains no `ios/` folder. |
| W-D5 | Student-visible wording is flagged in each slice note for the parent's okay before classmates see it. | `AGENTS.md` and the iPhone app's convention. |
| W-D6 | Hosting is the parent's (T7). The site must serve **only** `index.html`, `js/`, `css/` (and later an icon and manifest), never the repository. On 2026-11-27 `https://www.cih.com/ben/CapstoneProject/.git/config` and `.git/HEAD` answered 200, so the whole repository, its history, `server/` and the notes were public. A deploy script that builds a clean folder is slice D1. | Rule 9 and the privacy plan. |

## What cannot match the iPhone app

Apple's on-device AI, voice input, haptics, the Apple calendar sheet (a downloaded `.ics` file replaces it), the Keychain (the existing browser-encrypted key store stays), and automatic backup (Export and Import replaces it, T4).

## Slices, in order

| Slice | What the student gets | iPhone equivalent | Status |
|---|---|---|---|
| H1 | Suggestions from the pasted text: a suggested kind of work, the assignment's own requirement lines, numbered-question ranges turned into chunks | F6 items 1, 2, 3 | built |
| W1 | Steps editor: change, reorder, split, join, Get ready and Put it away; better splitting and vague-step questions | EditorView, F6 items 4, 5 | built; browser tests unrun |
| W2 | Step count (3, 5, 8) and the good-step card | A2, R6 | Built, browser tests not run. See `design/step-count-w2.md` |
| W3 | Four-tab layout (Today, Talk, Plan, Me), welcome screen, phone and tablet widths | RootView, IPAD1 | Built, browser tests not run. See `design/tabs-w3.md` |
| W4 | Work screen extras: the Stuck sheet, park a thought, recall question after study steps | StuckView, WorkView Built, browser tests not run. See `design/work-extras-w4.md` |
| W5 | Check my steps against the assignment, with no AI (word matching) | S3, S2 | Built, browser tests not run. See `design/check-steps-w5.md` |
| W6 | Looking back: Did that help, What I did, weekly look-back with fixed lines, What the app remembers with per-line delete | R5, PROG1, C5, M4 | Built, browser tests not run. See `design/looking-back-w6.md` |
| W7 | Me screens, Export and Import, Delete everything | MeView | Built, browser tests not run. See `design/me-export-w7.md` |
| W8 | Look it up (Wikipedia). The API allows browser requests with `origin=*` (from its documentation; not tried live) | LookUpView | Built, off until parent confirms; browser tests not run. See `design/look-it-up-w8.md` |
| W9 | Put it on my calendar as a `.ics` download | CAL1 | Built, browser tests not run. See `design/ics-w9.md` |
| W10 | Write my own steps as the main path; Show my steps becomes Suggest some to start | AssignmentView, T05 | Built, browser tests not run. See `design/own-steps-w10.md` |
| W11 | Class name on an assignment; return visit: weekly look-back card, set-aside thoughts, all-done line | M0b, C5, NextStepView | Built, browser tests not run. See `design/class-and-return-w11.md` |
| W12 | During a step: Done when: line, "Did that time feel about right?" with a length suggestion, Drifted uses the better split | WorkView, BlockLength | Built, browser tests not run. See `design/during-a-step-w12.md` |
| W13 | Plan tab shows all steps and saved thoughts; tabs leave a sub-view; Load a copy keeps the welcome note hidden | PlanListView | Built, browser tests not run. See `design/plan-tab-w13.md` |
| D1 | Deploy script that builds the clean folder; parent runs it | n/a | Built. See `design/deploy.md` |

Each slice follows `AGENTS.md`: design note, review, tests first, build, review, `npm run check`, one commit, `PROGRESS.md`.

## Rules every slice holds

`AGENTS.md` rules 1 to 11. In short for heuristics: they sort, copy and split the student's own words, never write subject content, never shame, say "suggested from your text" and never "I understood", and fail closed to today's behavior when unsure.
