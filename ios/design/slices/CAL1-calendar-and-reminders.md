# CAL1 Put it on my calendar (and the optional pick-up reminder)
Status: draft 2026-11-26. Parent said "this all looks good" to the proposal in conversation (one event per work session, generic text by default, student-chosen calendar, start-time alert first, pick-up reminder later).

## What the student sees and does
1. After the steps are ready (editor) and again from the Plan tab, a quiet optional row: **Put it on my calendar**. Never blocks Start.
2. Tapping it opens Apple's own event sheet (the same one the Calendar app uses), already filled in:
   - Title: "Ben's Steps: time to start" (generic). A switch under the row, **Show my step in the title**, off at first, puts the first step's words in the title instead.
   - A start time the student picks. No default time is chosen for them beyond the sheet's own.
   - Length: 25 minutes as the sheet's starting value only (an ordinary choice, no claim it is best).
   - The student picks the calendar. If they added their Google account in iPhone Settings, it is in the list.
   - The sheet's own alert setting; the app sets none.
3. The student taps Add or Cancel in Apple's sheet. The app does nothing else. Cancel changes nothing.
4. A line afterwards: "Added. You can change or delete it in Calendar." The app does not track whether the event still exists.

## Research link
Design judgment, to be tested. No study in `research/` supports calendar events or reminders as an intervention. `ROADMAP.md` item 3 (tomorrow's first step) rests on weak if-then evidence only. No claim is made that this helps.

## What it stores
Nothing new in the app. The event lives in the student's calendar, under their control. The app does not store an event id, a time, or whether one was made, so nothing can show "you did not schedule".

## What leaves the phone
Nothing from the app. If the student chose a Google calendar, the phone's own account sync sends the event to Google, as for any event they add. The app holds no Google credentials and uses no Google API or third-party code (decided 2026-11-26: EventKit).
Backup: nothing stored here, so nothing new in the device backup.
Delete everything: cannot remove events already in a calendar. The About screen says so in one line.

## Permission
- Uses `EKEventEditViewController` (EventKitUI) with an `EKEventStore`. From general knowledge, not confirmed from the SDK headers: on iOS 17 and later this sheet runs outside the app, so adding an event needs **no calendar permission** and the app cannot read the student's calendar. If testing shows a prompt is required, use `requestWriteOnlyAccessToEventsWithCompletion:` (verified in the SDK headers, iOS 17.0+) and never full access. Add the matching `Info.plist` usage text only if a permission turns out to be needed.
- The app can neither edit nor delete the event afterward. That follows from the above and is intended: the student owns it.
- No `UserNotifications` permission in CAL1. The alert is the Calendar's own.

## Part 2 (CAL2, later, off by default): the pick-up reminder
Not part of CAL1. Logged here so it is not lost.
- One local notification, only after the student turns on **Remind me to pick up** in Me, off at first.
- Sent only for an assignment that has a started step and is not finished, once, at a time the student chose. Cancelled when the assignment is finished, replaced, or Delete everything runs.
- Text: "Pick up where you left off" (generic). Never "unfinished", "missed", "overdue", a count or a streak. The step's words only if a second switch is on.
- Needs the notification permission, asked only when the student turns the switch on. Needs `UserNotifications` declarations checked in the SDK first, a scheduling protocol in an `Apple/` folder, a fake for tests, and a one-line D8 sentence (local only).
- Its own design note and gates before any code.

## Distracted, stuck, back after a week
- Distracted: one optional row; Apple's sheet is self-explanatory and Cancel is always there.
- Stuck: nothing in the app depends on a calendar entry.
- Back after a week: nothing says an event was missed; the app does not know about it.

## Differs from the web app
No (iOS only).

## Tests
- Logic: title builder gives the generic text by default; the step words only when the switch is on; a long step is cut to one line; blank step falls back to generic. Words pass the never-shame test.
- A fake `EventComposer` behind a protocol records what the app asked for (title, 25 minutes, notes empty) and what the student chose (saved / cancelled). Cancelled and saved leave app state identical.
- Nothing is stored: a test confirms no new file or field appears in `settings.json`, `work.json` or `learner.json` after either result.
- UI main path: tap Put it on my calendar, the sheet appears (simulator: Apple's sheet, Cancel). Awkward path: Cancel, then Start still works. Large text: the row is reachable.
- Device only: the real sheet, a Google calendar added in iPhone Settings, and whether a permission prompt appears.

## Unverified
- Whether `EKEventEditViewController` needs a permission on iOS 26 and 27 (checked on a phone).
- Whether the sheet pre-fills a title and duration from `EKEvent` set before presenting (expected, from the header: "a partially constructed event").
- That an event reaches a Google calendar via the phone's account sync.
- Behaviour on an iPad (the sheet is a popover or form sheet).

## Gates
(none yet)
