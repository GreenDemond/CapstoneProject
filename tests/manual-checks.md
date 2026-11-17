# Manual checks

Steps for a person to try in a browser. Each feature adds its own section here.

## Paste and split (2026-11-16)

Start the app with `npm start`, then open http://localhost:3000 in Chrome.

1. You should see "Focus app" and the heading "What's the assignment?".
2. Press **Show my steps** without typing anything. You should see "Paste something to start." and no steps.
3. Paste this into the box:
   ```
   Your task:
   1. Find three sources
   2) Take notes on each one
   - Write a draft
   Due Friday.
   ```
4. Press **Show my steps** without picking a kind. You should see "Tap the kind of work it is, then try again."
5. Tap **Essay**. It should turn dark green to show it is picked.
6. Press **Show my steps**. You should see "Here's a start" and five steps. The first three should be "Find three sources", "Take notes on each one", and "Write a draft". The last two should be starter steps for an essay.
7. Press **Show more steps**. Ten steps should appear, and the button should disappear.
8. Press **Start**. You should see "10 steps ready. The work screen comes next."
9. Paste a line that looks like code, such as `<b>bold</b>`, as a bullet. It should appear exactly as typed, not bold.
10. Narrow the window to about phone width. The buttons should wrap onto more lines, with no sideways scrolling.
11. Use Tab and Enter only (no mouse). Every button should be reachable and show a focus outline.

## Setup check (2026-11-16)

1. You should see the heading "Focus app" in Chrome at http://localhost:3000.
2. Make the browser window narrow, about phone width. The text should still fit with no sideways scrolling.
