# Design: my profile (first slice)

Status: **built 2026-11-16**, after advisor review. Open decisions for Ben are at the end.

## Scope of this slice

- Saving on the device (`js/storage.js`, DECISIONS T3). This is the first part of build item 5.
- A "My profile" page with two parts: **goals** and **What got in the way?**
- Not in this slice: the wider profile questions, "pick up here" after time away, the weekly goal display, suggestions based on the profile, and saving the "How I like to work" card.

## What the student sees and does

1. From the paste screen, a button **My profile**.
2. **My goals.** Four boxes, each optional: **Today**, **This week**, **This month**, **This year**. Each has a short hint, such as "One thing you want done this week."
3. **What got in the way?** A note box, a button **Add note**, and the list of notes, newest first. Each note has a **Delete** button. Under the box: "If something serious is getting in the way, talk to an adult you trust." This follows rule 11 in AGENTS.md. It is a fixed line, not a check of what the student writes.
4. **Save.** Keeps goals and notes on this device. Shows "Saved on this device." only after the browser confirms the save. If the browser refuses, it shows "Couldn't save in this browser." Under the button: "Anyone using this browser can see this."
5. **Clear my profile.** Asks "Clear everything in my profile? This can't be undone." Needs a second tap to confirm.
6. **Back.** If there are unsaved changes, the first Back shows "You have changes that aren't saved." The second Back leaves.

Wording rules: no shame words ("missed," "failed," "behind"), no streaks, no counts of lapses, no diagnosis, no comparison with other students.

## Where the data lives

- One object in the storage key `focusapp.v1` (T3), with `schemaVersion: 1`.
- Shape: `{ schemaVersion: 1, profile: { goals: { today, week, month, year }, gotInTheWay: [{ id, text, savedOn }] } }`.
- `savedOn` is the day only (YYYY-MM-DD), not the time. The profile does not log when the student lost focus.
- Only `js/storage.js` reads or writes this key. When it saves, it keeps any other sections already in the object, so later features (such as saved progress) are not erased.
- Text is plain text, shown with `textContent` (T11).
- Nothing leaves the device. No export in this slice.

## Damaged or missing data

- Missing data: starts with an empty profile. No message.
- Damaged top-level data (not valid JSON, or not this schema): the damaged text is kept under `focusapp.v1.backup`, and the page starts fresh with: "Something in your saved data couldn't be read, so we started fresh. A copy was kept."
- One damaged note in an otherwise good profile: only that note is dropped. Goals and other notes are kept.
- A second damage does not overwrite the first backup. The first copy is kept.
- Browser refuses storage: the page says "Your profile can't be saved in this browser."
- Save not confirmed by the browser (for example, storage full): the page does not say "Saved."
- Note text longer than 500 characters: the box stops accepting more characters at 500. Nothing the student has written is cut after it is written.

## Research behind it

- **Goals and notes:** design judgment, to be tested. Writing down what got in the way is related to self-monitoring (`00-knowledge-summary.md` section 2), but it is not the same thing. Self-monitoring in the research means recording whether you are on task while you work. This slice does not do that.
- **Honest reporting:** `00-knowledge-summary.md` section 3, point 6 says honest reporting needs a payoff. This slice has no payoff yet. The payoff comes in a later slice, and this is not claimed to work yet.
- **Weekly goals, not streaks:** P7 is about a count of days ("4 of 5 days") in the weekly goal display, which is not in this slice. Nothing here counts or resets anything.
- **No judgment:** rule 2 and rule 8 in AGENTS.md. The student's own words are kept as written.

## What data it stores

- Goals, notes, and the day each note was added. Nothing else.
- No names, diagnosis, school, location, or device details.

## Distracted, stuck, or back after a week

- **Left mid-note:** typed words are kept while the page stays open. Pressing **Add note** or **Save** keeps them.
- **Empty everything:** **Save** writes an empty profile without any message about it.
- **Back after a week:** goals are shown as they were written. This is an open decision (below).
- **Deleting a note:** the note is removed at once. Clear my profile is the only step with a confirmation.
- **Phone and keyboard:** every control is a real button or text box, full width on a phone (T12).

## Checklist (AGENTS.md stage 1)

- [x] Breaks no rule. Rule 11 has its fixed line. No diagnosis, no shame words, no comparison, nothing leaves the device.
- [x] Fits DECISIONS.md: T3 (one key, one file, backup key, other sections kept), T4 (no login), T11 (text as text), T12 (phone width).
- [x] Not on the trap list. No streaks, no rankings, no counter of lapses. The "losses column" pattern is avoided by showing no lapse count.
- [x] The student writes the thinking. The app stores and shows.
- [ ] One thing at a time: the page has four goal boxes, a note box, and a list on one screen. The advisor suggested showing one goal at a time. Open decision (below).
- [x] Small enough for one session: storage, one page, and tests.

## Decisions for Ben

1. **Old goals after time away.** The "Today" goal from last week still shows. Options:
   - **Keep them as written (current).** Simple, and the student can edit them.
   - **Empty "Today" each new day,** with the other goals showing "Still want this?" and a one-tap clear. This avoids showing a goal that was not met, which the research on returning after a gap suggests (`00-knowledge-summary.md` section 4, point 9). I recommend this.
2. **Goals on one screen or in steps.** Show all four boxes now (current), or start with "This week" and a button "More goals." I recommend "More goals," because it keeps one thing on screen at a time.
3. **Undo for deleted notes.** Add a few seconds to undo a mis-tap on a phone, or keep delete immediate (current). I recommend adding undo.
4. **Save as you type.** Keep the Save button (current), or save automatically. Automatic saving means a student who walks away mid-note does not lose it.
