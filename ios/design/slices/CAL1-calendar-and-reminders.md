# CAL1 Put it on my calendar
Status: gate 1 passed 2026-11-26 (GO on the second round). Not built. Wording needs the parent's and Ben's okay before code (AGENTS.md section 3 step 4). Parent said "this all looks good" to the shape (one event per work session, generic text by default, the student picks the calendar and time). The pick-up reminder is a separate task, CAL2, in `FEATURES.md` F2; this note covers CAL1 only.

## What the student sees and does
1. A quiet link-style row, **Put it on my calendar**, in two places: the editor (near the end of the scrollable list, never in the fixed bottom area) and the Plan tab. It never blocks Start and is never turned into a prompt.
2. Tapping it opens Apple's own event sheet, pre-filled:
   - **Which step:** the first step that is not done. From the editor that is the first step in the list; from Plan it is the current step.
   - **Title:** "<app name>: time to start". The app name comes from one constant (it may be renamed), not a typed literal.
   - **Start:** the next round quarter-hour. The event needs a start and end date to exist at all, so the app must set them; the student changes both in the sheet. No time is chosen for them beyond that starting value.
   - **Length:** the student's own current block length (the one they chose or the app suggested from R5), else 25 minutes. It is only a starting value in the sheet, with no claim that it is best.
   - Notes, location and invitees are left empty. The app never fills them.
   - The student picks the calendar. If they added their Google account in iPhone Settings it is in the list. The alert is whatever the student sets in Apple's sheet; the app sets none.
3. **Show my step in the title** is a switch under the row. It is **not saved**. It lives only in the view and is off every time the row is tapped. While it is on, one quiet line shows under it: "The calendar you pick, and anyone who can see it, will see these words, and so will any alert you set. School and family calendars may be seen by others." The line is hidden while the switch is off. It is not a banner.
4. Apple's sheet reports one of three results to the app's delegate, and the app dismisses the sheet in each case:
   - **Saved:** show one line, "Added. You can change or delete it in Calendar."
   - **Canceled:** nothing changes, nothing shows.
   - **Deleted:** nothing changes, nothing shows.

## Research link
Design judgment, to be tested. No study in `research/` supports calendar events as an intervention. No claim is made that this helps.

## What it stores
Nothing. No new field in any file. The step-words switch is view state, not a setting. The app keeps no event id, time, or record that an event exists, so nothing can show "you did not schedule". It never edits or deletes an event afterward; that is a design choice (the student owns the event), not something the API forces.

## What leaves the phone
The app makes no request. The event is saved by the phone into the calendar the student picked (the Settings default if they do not choose). If that calendar is iCloud, Google or a school or family account, the phone's own account sync sends the event to that provider, and anyone who can see that calendar can see it. This is not the app syncing (D3 clarification, to be added). With the default generic title the event shows only that the student has something to start at a time. With the switch on it also shows the first step's words, on the calendar and on the lock-screen alert.
- **D8 row (deliverable of this task, marked "parent to confirm before classmates"):** "The student taps Put it on my calendar and saves the event in Apple's event sheet. The event holds the app's generic title, or the first step's words if the student turned on Show my step in the title, a start time and length the student confirmed, and nothing else. The phone saves it into the calendar the student chose. The app sends nothing; the phone's own account sync may send it to that calendar's provider (iCloud, Google, school or family), and anyone who can see that calendar can see it."
- Backup: nothing stored by the app, so nothing new in the device backup.
- Delete everything cannot remove events already in a calendar. About says so in one line.

## Permission
- Uses `EKEventEditViewController` with an `EKEventStore`, wrapped in a `UIViewControllerRepresentable` shown through `.sheet` (not inside a `NavigationStack`). On iPad the system presents it as a form sheet. Unverified; see below.
- From general knowledge, not confirmed in the headers: on iOS 17 and later the sheet needs no calendar permission. `EKEventStore.requestWriteOnlyAccessToEventsWithCompletion:` is confirmed in the SDK (iOS 17.0 and later). Never request full access.
- **First device check, before any other UI work:** open the sheet on the phone and confirm no permission prompt appears. If one does, stop and ask the parent. Adding any permission or `Info.plist` key means gate 2, and the exact key name must be read from the SDK, not written from memory.

## Distracted, stuck, back after a week
- Distracted: one optional row; Cancel is always in Apple's sheet.
- Stuck: nothing in the app depends on a calendar entry.
- Back after a week: nothing says an event was missed; the app does not know about it.

## Differs from the web app
No (iOS only).

## Tests
- Logic: the title builder gives the generic text by default; the step words only when asked; a long step is cut to one line; a blank step falls back to generic; the app name comes from the constant. The start date is the next quarter-hour at any minute, including 59 and across midnight and daylight-saving changes. The length is the student's block length, else 25. Words pass the never-shame test.
- A fake `EventComposer` behind a protocol records what the app asked for: title, start, length, empty notes, no invitees, no location. It then returns each of Saved, Canceled and Deleted. Saved shows the one line; the other two show nothing; all three dismiss the sheet; none changes app state.
- A test confirms no new file or field appears in `settings.json`, `work.json`, `learner.json` or any other file after any result, and that the step-words switch resets to off each time.
- UI: the row shows in the editor and in Plan and does not hide Start at the largest text size. Main path: tap the row, the sheet appears, Cancel, Start still works. Switch path: turn the switch on and the warning line shows; off and it is gone. Run on an iPhone and an iPad simulator.
- Device only: the real sheet, no permission prompt, a Google calendar added in iPhone Settings, the event reaching it, and iPad presentation.

## Unverified
- Whether the sheet needs a permission on iOS 26 and 27, and the exact `Info.plist` key if it does.
- Whether the sheet pre-fills the title and times we set (expected from the header: "a partially constructed event").
- That the event reaches a Google calendar through the phone's account sync.
- iPad presentation as a form sheet inside a representable.

## Gates
- Gate 1, 2026-11-26, independent read-only reviewer (same model family as the Builder): FIX FIRST (7). Applied above: switch not saved and warned at the point of risk; start and end dates stated; all three delegate results handled and tested; D8 row and D3 clarification named as deliverables; CAL2 split out; the permission and edit claims reworded with a first device check; block length instead of a fixed 25 and an app-name constant. Second round, same reviewer: **GO**. Two small wording points applied (alert wording; which step).
