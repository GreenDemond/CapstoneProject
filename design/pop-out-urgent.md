# Design: Urgent pop-out window

Status: **proposed, waiting for Ben's answers** (the three questions at the end).

## What the student sees and does

1. On **My calendar**, the Urgent group has a button: **Pop out Urgent**.
2. Pressing it opens a small window that stays on top of other apps. It shows only the Urgent items: title, time, and a **Done** button that removes the item from the list. (Deleting stays on the main page.)
3. The window updates by itself as items become urgent or are removed.
4. **Close** on the small window returns everything to the main page. Nothing is lost.

If the browser can't float a window, the button is replaced by one plain line: "Your browser can't float a window. Keep this tab open to see Urgent items." No error, no red.

## Which browsers

- **Works:** Chrome and Edge on Mac, Windows, and Chromebooks (the Document Picture-in-Picture feature).
- **Doesn't work:** Safari on iPhone and iPad, and Firefox. The line above appears there.

## Rules that apply

- Built into the browser. No outside library or service (T2).
- Items stay on the device (T3). Nothing new is sent anywhere.
- The window opens only when the student presses the button (browsers require this).
- Text is shown as text (T11). Everything works with the keyboard (T12).
- Wording: no red, no "overdue." A passed item shows "Due time has passed," as now.

## Limits to tell the student

- The window only appears on Chrome and Edge, and only while the app is open in a tab.

## Distracted, stuck, or back later

- **Window closed by mistake:** Pop out again. Nothing is lost.
- **No Urgent items:** the window says "Nothing urgent right now."
- **Browser refuses:** the one plain line above appears.

## Checklist

- [x] No rule broken. Nothing leaves the device. No shame wording.
- [x] Uses only the browser's own feature.
- [x] One thing on screen: the Urgent list.
- [x] Small enough for one session.

## Questions for Ben

1. Should the floating window also show a **Still working** or **Later** button, or only **Done**?
2. If the browser can't float a window, is the one plain line OK, or do you want a different message?
3. Is it OK that the window only appears on Chrome and Edge, not on iPhone?
