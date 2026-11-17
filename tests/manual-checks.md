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

## How I like to work (2026-11-16)

Start the app with `npm start`, then open http://localhost:3000 in Chrome.

1. On the paste screen, press **How I like to work**. You should see the heading "How I like to work" and a **Start** button.
2. Press **Start**. The first question is "Sound or quiet?". Tap **Quiet**.
3. Answer the next three questions: "Short (about 12 minutes)", "Phone", and "A very small first step".
4. You should see the heading "My first guess" and four lines, each showing your pick. The line "This is only a first guess" should be at the bottom.
5. Press **Change** on the first line. You should go to the sound question. Pick "A steady background hiss, like a fan". You should come back to the card, and the first line should now show the hiss.
6. Start again, and tap **Not sure** on every question. The card should show "Not sure yet" on all four lines.
7. Press **Close** on any screen. You should return to the paste screen. Open the intake again: it should start fresh.
8. Refresh the page halfway through. The answers are gone, and the intake starts again. This is expected until saving is built.
9. Narrow the window to about phone width. Answer buttons should wrap, with no sideways scrolling.
