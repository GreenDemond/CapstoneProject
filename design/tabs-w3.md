# Slice W3: bottom tabs (Today, Talk, Plan, Me) and a welcome note (web)

Status: built, **additive only**. Logic tests pass (`tests/logic/tabs.test.js`), lint clean. **The browser tests (`tests/browser/tabs.spec.js`) were written but NOT run**, and nobody has looked at the bar at 360px or tablet width: Chrome aborts on launch in the build sandbox. Please run the whole suite and look at both widths before classmates see this. Plan pre-approved by the parent ("go do it all", `design/web-parity-plan.md`). Student-visible wording is listed at the end and awaits the parent's okay.

## What the student sees and does
1. A bar at the bottom with four tabs: **Today** (home), **Talk** (the chat), **Plan** (the calendar), **Me** (Me and my data). The tab for the current screen is marked bold with a line above it. Profile, How I like to work, What I did, Look it up and Settings count as Me, since the Me screen links to them.
2. Pressing a tab leaves the current screen by its own "Back to home" button (so its own checks run, such as the profile's unsaved-changes warning), then presses the existing home button (Talk it through, My calendar, Me and my data). If the screen has no "Back to home" button, or it stays put (unsaved changes, a sub-view), nothing happens and the student uses the screen's own Back. Pressing the tab you are on does nothing.
3. The bar is hidden on the work screen (one thing on screen). It shows on every other screen.
4. A welcome note at the end of the home screen, first visit only: one line and a **Hide this note** button. Not a page, not a popup, no focus trap, not before any existing control. Hidden for good once pressed (saved in the `welcome` section via `js/storage.js`; anything but `true` counts as not seen, so damaged or refused storage just shows it).
5. Tablet (768px and wider): the column and the bar are centred with more padding and larger tabs. No side-by-side layout (left out on purpose; cannot be checked without a browser).
6. The old top buttons all stay as they are.

## Research link
None needed; navigation only. Idea only from the iPhone app's tab shell and `ios/design/slices/IPAD1-ipad-support.md`; nothing imported from `ios/`. No claims about ADHD.

## What is stored
One new flag, `welcome: { seen: true }`, only after the student hides the note. It is not in "Save a copy" (so Load a copy shows the note once more). Delete everything removes it with the rest.

## Which existing browser tests could be affected, and why I believe they are not
All locators were read (`tests/browser/*.spec.js`):
- **Role button queries** (about 30 specs): the tabs have `role="tab"`, so `getByRole("button")` never matches them. The only new button is "Hide this note"; no test name is a substring of it ("Hide my steps" is not).
- **Heading queries** ("Focus app", "What's the assignment?", "Talk it through", "Me and my data"): no new heading.
- **`getByRole("status")...last()`** (ai, model-list, reasoning, multi-helper specs): nothing new has a status or live role; the welcome note is a plain paragraph.
- **`getByText`** ("Welcome back. Pick up where you left off.", "Pick up where you left off.", "Saved on this device.", "Your steps are saved on this device.", "Hide my steps"): the welcome line "Welcome. Paste an assignment above to begin, or use the tabs at the bottom." contains none of them. Tab text (Today, Talk, Plan, Me) is not searched as text by any spec.
- **Screen visibility checks** (`navigation.spec.js`, ids `*-screen`): no section was added or changed; the bar is outside the sections.
- **Clicks at 360px**: the bar is fixed at the bottom, and the page gets bottom padding while it shows, so the last controls can scroll clear. Playwright scrolls into view before clicking. The bar is hidden on the work screen, where specs press Done, Stuck and so on. This is the part I cannot prove without a browser: a control that sits exactly at the bottom edge of the window after scroll-into-view could be covered. Check this first.
- **`js/ui/screens.js`**: only a callback was added at the end of `showScreen`; its behavior for the screens is unchanged.
- No spec checks the exact saved object when the note is not hidden; the flag is written only on Hide.
- Worth watching: tests that press Back through screens with `.first()` inside a screen scope are unaffected (the bar is outside every screen).

## Design review (AGENTS.md Stage 1)
- Breaks a rule? No. No shame, score or comparison (2, 6, 7); nothing leaves the device (4); no diagnosis (3); no claims (8); no key or secret (9); no AI (1).
- Conflicts with `DECISIONS.md`? No: storage only through `js/storage.js` (T3), no packages or third-party scripts, student text only with `textContent`, plain DOM.
- Listed as a trap in `05-adhd-ideation.md`? No. Navigation is one tap; one screen at a time; the bar is hidden during a step.
- Does the student do the thinking? Yes; this only moves between screens.
- Seconds to use, one thing at a time? Yes: four labelled targets, 3.25rem tall (larger on tablet).
- Small enough? Yes. Awkward cases: refresh (the note flag survives, screens reopen on home as before), distracted (nothing blocks), damaged storage (note shows, app works), away a week (nothing time-based).
- CSS uses plain media queries and no flex `gap`, `:has()`, container queries or nesting, for older Safari.

## Left out because it cannot be made safe without running a browser
A full-screen welcome page; a two-column tablet layout; sticky tabs on the work screen; opening Talk, Plan or Me directly from a sub-view without that screen's Back.

## Student-visible wording (awaits the parent's okay)
Tabs: Today, Talk, Plan, Me. Bar label (read aloud): "Main tabs". Welcome: "Welcome. Paste an assignment above to begin, or use the tabs at the bottom." Button: "Hide this note".
