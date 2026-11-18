# Whole-app review and fix plan (2026-11-17)

Ben asked: think through the code and the experience of several chats, review all code and the base design, plan fixes for every problem found, and carry the plan out with a review after each step.

Reviews done (read-only): Opus advisor (whole student journey + several chats), Sonnet reviewers (screen code in `js/app.js`; storage, keys, AI and server code; tests, accessibility and layout).

Each step below: implemented by a cheaper model where possible, then `npm run check`, then a review of the diff, then one commit. Steps run one at a time so two agents never edit the same file.

## Progress
- Step 1 done (storage: shared save helper, damaged and other-version data handled, 18 new tests; also fixed a false "couldn't be read" warning on the profile when only other sections were saved).
- Step 2 done (local server: malformed address no longer crashes it; only `index.html`, `js/` and `css/` are served).
- Step 3 done (one `showScreen` for every screen, including Settings; the steps preview survives a visit elsewhere; the home AI request is cancelled when the student leaves; focusable headings; 12 navigation tests).
- Steps 4 and 6 done (profile keeps typed text, warns about a note not yet added, local dates; Start uses the steps shown with a "Showing 5 of N" line; reward line only on a real change; countdown from the clock; focus kept, including when time runs out; "Time's up" goes on Still working; leftover developer text removed).
- Step 5 done, with the calendar parts of step 11 (form kept and behind Add something, Delete confirm, double-tap guard, reward only after a confirmed save, calm "Time has passed" group, hour labels fixed, form styling, readable rows in dark mode, 44 px buttons, role fixes, zero totals hidden).
- Step 7 done (merged imports, dead variable and shadowed names gone, stale design status lines fixed, shared test helper).
- Step 8 done (timeout and Stop cover the whole reply; an already-cancelled request sends nothing; the guide is one quoted line that cannot imitate or close the app's markers, even nested or split; TRUSTED_ADULT detected anywhere in both paths; the master key is created atomically and a missing master means no helper is shown as ready; short keys show no hint; server/suggest.js marked parked).
- Steps 9 and 10 done (several chats saved on the device in their own storage key: today's chat reopens, Carry on line, New chat, My chats with Delete and Delete all; a message is saved only with its reply, so a flagged message never reaches storage; kind saved with the steps; Opus review fixes applied).

## Phase 1: keep data safe, one screen at a time

1. **Storage can get stuck or drop data.** If the saved data is unreadable, every later save fails forever. If it has a different version number, the next save quietly drops every other section. Fix: one shared `saveSection` / `readSection` helper in `js/storage.js`: unreadable data is backed up once and replaced with a fresh object; a different version is never overwritten (save refuses, data kept); every caller checks the result. Logic tests for both cases.
2. **Local test server** can be crashed by a malformed address and can serve any `.js` file outside `js/`. Fix the decode and the folder check in `dev-server.mjs`.
3. **Screens leak into each other.** Settings opened after Show my steps leaves the steps visible under it; a late AI reply pops the steps over whatever screen is open; coming back home loses the steps preview. Fix: one `showScreen(name)` used by every opener and closer (including `js/settings.js`), the steps preview kept when returning home, the paste-screen AI request cancelled when the student leaves. Browser test that visits every screen and checks exactly one is visible.

## Phase 2: stop losing what the student typed, and stop false or shaming signals

4. **Profile:** Back, Clear and Cancel wipe unsaved typing; the "unsaved" warning overwrites the wrong line; the Clear question reappears; notes can get yesterday's date in the evening (UTC). Fix all four.
5. **Calendar:** the add form is wiped by any other tap (view switch, Complete, Delete); Delete is instant with no confirm and a double-click deletes the next item too; Complete can double-fire; "Fire it Up" shows after unrelated actions and even when the save failed; **past items sit forever in orange Urgent with "Due time has passed"** (rule 2). Fix: keep the form, second-tap confirm on Delete, a short guard on repeat taps, celebrate only on a confirmed save, and a calm grey "Date has passed" group below the current items.
6. **Steps and work screen:** Start runs all 12 steps when only 5 were shown (P2); the reward line ("Step done.") shows when nothing changed and lingers; the countdown counts ticks, so a sleeping laptop stretches it; focus jumps back to the step on every redraw. Fix: Start uses the steps on screen, with "Showing 5 of 12" when there are more; reward only on a real change; countdown from the clock; focus only when the step changes.
7. **Tidy, no behaviour change:** duplicate imports, dead variables, shadowed names, a developer note on screen ("Changing these steps is coming next."), stale comments and stale status lines in design notes.

## Phase 3: AI path robustness

8. The request timeout stops once headers arrive, so a slow reply body can hang and Stop cannot cancel it; an already-cancelled request still runs; the guide can contain the app's own end marker; two first-time key saves at once can lose a key; a missing master key shows the helper as ready but no key can be read. Fix each, with tests. `server/suggest.js` is unused by the app: marked as parked in PROGRESS (kept for the parent's possible endpoint).

## Phase 4: several chats (design: `design/chat-history.md`)

9. Write the design note (from the advisor's Option B) and review it.
10. Build: chats saved on the device in their own storage key (`focusapp.v1.chats`), so a full chat store can never stop steps from saving; today's chat reopens after refresh or Back; **New chat** replaces Start over and keeps the old one; **My chats** list (10 most recent, newest first, plain dates, Delete with a second tap, Delete all); the message that triggered the trusted-adult line is never saved; the kind of work is saved with the steps so the chat can pre-select it; a "Carry on" line for the last chat. Browser and logic tests.

## Phase 5: accessibility and layout

11. From the layout and accessibility review (86 screenshots at 360 px and desktop, light and dark; no sideways scrolling found anywhere):
   - **Day view hour labels all sit on top of each other**: the page's security rule blocks inline `style` attributes. Set positions through the style object instead; test the label order and that no security errors appear.
   - Calendar add form has no styling (labels run into inputs, tiny inputs) and sits above the list: style it like the profile, and put it behind an "Add something" button with the list first.
   - Grey text on the calendar's coloured rows is unreadable in dark mode (about 1.1:1) and weak in light: dark text on the fills.
   - Focus does not move to the profile heading or to the steps after Show my steps (headings lack `tabindex="-1"`).
   - Buttons touch each other in several places: one shared spacing rule.
   - Small buttons are about 36 px tall: 44 px.
   - Calendar month grid has an invalid `role="table"`; `aria-label` on plain divs is ignored.
   - Status lines created already filled are often not read by screen readers (Settings, How the AI talks, work screen): create empty, then fill.
   - A missing `--border` colour for the countdown ring track.
   - "Finished so far: today 0 ..." shows when everything is zero: hide until there is something (rule 2).
   - Tests: the phone project is 320 px, not the 360 px in T12; sleeps instead of conditions in work-screen and chat tests; a swallowed failure in the double-tap test; the "same look" test compares only class names; duplicated helpers; manual-checks.md out of date in several sections.
   - Back buttons: one word and one place on every screen.

## Phase 6: split `js/app.js` (1,600 lines) into one file per screen

12. Only after phases 1 to 5 pass. Move, do not rewrite: shared DOM helpers, then chat, intake, profile, calendar, work, paste. `npm run check` after each move.

## Ben's decisions (not changed by this plan)

- Step editing before starting (P1) is the biggest gap against the research; it is Next #3 and gets its own design note.
- "How I like to work" answers are never saved or used: save and use them as starting choices, or hide the button until they do something.
- The AI tick box on the paste screen is on by default; it could be off by default.
- Recall question (P9), weekly goal (P7), save to a file (T4) are not built; the advisor suggests these before more calendar work.
- The five answer-giving checks with a real AI (chat and guides) must be run with Ben's key before classmates use the chat; the parent confirms the T8/T6 draft.
- Back-button wording and position are made consistent in phase 5 unless Ben prefers otherwise.
