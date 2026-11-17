# Design: time blocks you can move and resize

Status: **proposed, waiting for Ben's go-ahead.** Not built yet.

## What the student sees and does

1. **Timeline view** on My calendar, with a **Day** and a **Week** switch. Hours run down the side (from 7 am to 10 pm). Each item is a block placed at its start time, with its height showing its length.
2. **Move a block:** press and drag it up or down to change the time, or across to another day in Week view. It snaps to 15-minute steps. The new time is shown while dragging, for example "3:30 pm to 4:15 pm, Tuesday."
3. **Resize a block:** drag its bottom edge to make it longer or shorter. Snaps to 15 minutes, with a minimum of 15 minutes.
4. **Add a block:** press and drag on an empty part of a day to draw a new block. Or use the **Add** form from the list view.
5. **Keyboard, for every action above:** Tab to a block and press Enter to select it. Then:
   - Arrow up or down moves it 15 minutes.
   - Arrow left or right moves it to the previous or next day (Week view).
   - Shift with up or down makes it longer or shorter by 15 minutes.
   - Escape finishes.
   Each change is announced in plain words on the page, for example "Moved to 3:45 pm."
6. **Undo:** a single "Undo last move" button under the timeline, for the last change only. Nothing is lost silently.

Wording: no red, no "late," no "overdue." A block that has passed looks the same as one ahead, with no count.

## What changes in the data

- Each item gets a **start** (day and time) and a **length in minutes**, instead of only a due time. The existing "due" value becomes the start, with a 30-minute length, so nothing already saved is lost.
- The five priority groups (Urgent, Significant, Not urgent, Can wait, Later) are still shown in the list view, computed from the start time.
- Still on the device only, in the same `calendar` section (T3).

## Rules that apply

- Every action works by keyboard (T12). Dragging is an extra, not the only way.
- Blocks use real buttons, labelled with their title, time, and length, so a screen reader hears them.
- Dragging works with touch on a phone as well as with a mouse.
- No outside libraries. The timeline is plain HTML and CSS, with a small amount of JavaScript (T1, T2).
- Titles are shown as text (T11).

## Distracted, stuck, or back after a week

- **A drag that goes wrong:** Escape cancels it, and the block returns where it was.
- **Blocks that overlap:** they sit side by side, not on top of each other, so both can be seen.
- **Dragging off the bottom of the screen:** the view scrolls, rather than losing the block.
- **Back after a week:** the view opens on today, with no reminder of blocks that passed.

## Checklist (AGENTS.md stage 1)

- [x] Breaks no rule. No outside service, no login, data stays on the device, no shame, no streaks.
- [x] Fits DECISIONS: T1 and T2 (plain code, no library), T3 (same section), T11, T12 (keyboard first).
- [x] The student does the placing; the app only shows and snaps.
- [ ] One thing at a time: the timeline is a single view with a short list of its controls. Drag hints may need to be short and visible.
- [ ] Small enough for one session? **No.** Suggested order: (1) the Day timeline with keyboard moves and resizing; (2) dragging with a mouse and touch; (3) Week view across days; (4) overlapping blocks.

## Decisions for Ben

1. **Go ahead with the Day timeline first,** with the keyboard controls, then dragging, then the Week view?
2. **Default block length:** 30 minutes, or 25 (matching the work block option)?
3. **Keep the five priority groups** as a list view beside the timeline, or replace them with the timeline? I recommend keeping both.

## Added 2026-11-17: calendar views (read-only)

Built: a view switcher on My calendar with **List, Day, Week, Month**, and Previous, Next, and Today buttons.
- **Day:** an hour grid from 7 am to 10 pm. Each item is a block at its start time, 30 minutes long for now. Items outside those hours are listed below the grid.
- **Week:** two calendars, Weekdays (Mon to Fri) and Weekend (Sat and Sun), with each day listing its items.
- **Month:** a grid of the month. Each day shows up to two items. Tapping a day opens its Day view.
- Blocks are coloured by their priority group. Finished items show struck through.

**Not yet built:** moving or resizing blocks by dragging, or with the keyboard. Blocks don't yet have their own length; that's the next design step, waiting for Ben's answer on the Day timeline.
