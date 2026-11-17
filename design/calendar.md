# Design: calendar (day, week, month) with reminders

Status: **first part built 2026-11-17.** Built: adding items with a due date and time, sorted into groups. Not yet built: the Day, Week (weekday and weekend), and Month views, and reminders.

**Priority groups (built, as Ben asked):** Urgent (due within the hour, or already passed, shown neutrally); Significant (due later today); Not urgent (due within 2 days); Can wait (due within 5 days); Later (more than 5 days away, so nothing is forced into the wrong group). The "5 days after the day entered" rule is built as the due date the student chooses, not an automatic date from the day they add it. Ben to confirm.

## Scope

- A calendar the student keeps **on their own device**: day, week, and month views.
- Reminders that show in the browser at the chosen time.
- **Not in this slice:** Google Calendar or any other outside service. That needs your parent's approval (see the proposal to parent, not yet written). Also not in this slice: the calendar file export, which can come next.

## What the student sees and does

1. **Calendar page** from the paste screen, with a button **My calendar**.
2. **Three views** as buttons at the top: **Day**, **Week**, **Month**. The chosen view is remembered only while the page stays open.
   - **Day:** the day's events in time order.
   - **Week:** two separate calendars, as the student asked. **Weekdays** shows Monday to Friday, five columns. **Weekend** shows Saturday and Sunday, two columns. Each column lists its events. The week starts on Monday.
   - **Month:** a grid of the month, with a dot on days that have events. Tapping a day opens the Day view for it.
3. **Add an event:** title (in the student's words), date, start time, optional length, and an optional reminder ("remind me 5, 10, 15, or 30 minutes before, or not at all").
4. **Edit or delete** an event by tapping it. Delete asks once: "Delete this event?"
5. **Turn on reminders** (one button). The browser then asks for permission. If the student says no, the page says "Reminders are off. You can still see your events here." Nothing breaks.
6. **Reminder shown:** a card at the top of the page with the event's title and time, and a **Got it** button. Also a browser notification if permission was given.

Wording rules: no "overdue," "missed," or "late." Past events look the same as future ones, with no count of what was not done. No red.

## Where the data lives

- Only in the device's storage, in the same `focusapp.v1` object as the profile (T3), as its own section `calendar`. Saving keeps the other sections (`js/storage.js`).
- Shape: `{ id, title, day: "YYYY-MM-DD", start: "HH:MM", minutes (optional), remindBefore (0, 5, 10, 15, or 30) }`.
- Titles are plain text, shown with `textContent` (T11).
- Nothing leaves the device.

## Limits to tell the student

- **Reminders only work while the app is open** in a browser tab. The page says so when reminders are turned on: "Reminders show only while this page is open."
- A browser can refuse notifications; the in-page card still appears.

## Research behind it

- **A visible schedule:** design judgment, to be tested. The evidence on visual time tools is thin (`design/work-screen.md`, the countdown section). The calendar is not claimed to help attention.
- **Reminders:** related to planning (organizational skills training, `00-knowledge-summary.md` section 2, rated Strong for splitting and planning work). Reminders are the student's own, not the app's pressure.

## Distracted, stuck, or back after a week

- **No events:** the page shows "Nothing planned yet. Add something when you're ready."
- **Back after a week:** the calendar opens on today. Past events are visible but not highlighted.
- **Reminder missed because the page was closed:** nothing is shown as failed. The event is still in the calendar.
- **Deleting by mistake:** one confirmation, as described above.
- **Phone:** each view works on a 360-pixel screen. On a phone, the weekday columns stack one under another, and the weekend columns sit side by side.

## Checklist (AGENTS.md stage 1)

- [x] Breaks no rule. No outside service, no login, no data leaves the device, no shame, no diagnosis.
- [x] Fits DECISIONS: T3 (one key, own section, saves keep other sections), T4 (no login), T11, T12.
- [x] Not on the trap list. No streaks, no lapse counts, no "overdue."
- [x] The student enters everything; the app only shows and reminds.
- [ ] One thing at a time: three views plus an add form. The add form is one screen.
- [ ] Small enough for one session? **Probably not.** The month view and reminders are each a session. Suggested order: Day view with adding events and deleting (session 1), then Week and Month (session 2), then reminders (session 3).

## Decisions for Ben

1. ~~Week starts on Monday or Sunday?~~ Answered: the week starts on Monday, with a separate weekend calendar (Saturday and Sunday).
2. **Clock:** 12-hour (3:30 pm) or 24-hour (15:30)? I'd use what the device uses.
3. **Reminders on by default,** or off until the student turns them on? I recommend off.
4. **Should work steps also appear on the calendar** (for example, "Essay: step 3 at 4 pm")? That would link the two features, which is useful but adds data. I recommend not in this first slice.
5. **Order:** Day view first (as above), or all three views together?

## Added 2026-11-17: notes and links on an item

- **Notes:** a large box (up to 2,000 characters) for anything the student wants to write about the item. Plain text, shown with `textContent`.
- **Links:** up to 10 web addresses, one per line. Only addresses starting with `https://` are accepted; anything else gets the message "Links must start with https://." Links open in a new tab with `rel="noopener noreferrer"`. The app loads nothing from them.
- **PDFs:** not in this step. A PDF can be several megabytes, and storing it on the device needs a separate design and a change to the one-saved-object rule (T3). Ben to decide.
- **Push notifications:** not in this step. They need a push service run by a large company and a server (T2, T7). Needs a parent's decision and a new DECISIONS entry. Reminders that show while the app is open remain the plan.

## Added 2026-11-17: status, weekly log, and parts of life

- **Status:** every item is Not started, In progress, or Completed. Buttons: **Start** and **Complete**. A completed item moves to a **Completed** list, shows the day it was finished, and can be **Reopen**ed. Completed items leave the priority groups.
- **Weekly log:** one neutral line at the top: "You finished 3 things this week," or "Nothing finished yet this week." Counts only since Monday. No streak, no comparison with anyone, no count of what wasn't done.
- **Parts of life:** each item is tagged School work, Personal, Family, Friends, or Other. Chosen by the student; the tag is only a label for now.

**Not built, and why:**
- **Photo of handwritten notes, organized into priority:** reading a photo needs either an outside service (which sends the photo off the device, against T8) or a third-party reader (against T2). Needs a parent decision first.
- **The app learning your habits to decide priority:** this means watching how the student works over time. It goes against the rule on not monitoring students and needs a design and a parent's approval.
- **Conversation mode, where the app asks what the plan for the day is:** depends on the AI path, which is switched off until a parent sets it up.

## Added 2026-11-17: running count of finished items

- Shows finished items **today, this week (from Monday), this month, this year, and all time**.
- Only completions are counted. Nothing counts what was missed, and nothing compares students. No streaks: a day with none simply shows 0.
- Counts are kept per day beside the items. Deleting a finished item does not lower the count. Reopening an item takes that one completion back out.
- Shown as one neutral line at the top of My calendar.
