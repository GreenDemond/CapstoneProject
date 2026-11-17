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

## My profile (2026-11-16)

1. On the paste screen, press **My profile**. You should see "Today", "This week", "This month", and "This year" boxes, then "What got in the way?".
2. Type "Finish the reading" in **Today**. Press **Save**. You should see "Saved on this device."
3. Press **Back**, then **My profile** again. Your goal should still be there.
4. Refresh the whole page, then open **My profile**. Your goal should still be there. (This is the saving working.)
5. In **What got in the way?**, type "The phone buzzed and I checked it for 20 minutes", press **Add note**. It should appear at the top of the list.
6. Press **Delete** on that note. It should disappear at once.
7. Type a goal change but don't press **Save**. You should see "Not saved yet." Press **Back**: a message should ask you to save. Press **Back** again to leave.
8. Press **Clear my profile**. You should see "This can't be undone." Press **Cancel**, nothing changes. Press it again and **Yes, clear everything**: all boxes and notes are empty.
9. Narrow the window to about phone width. Boxes should fill the width, with no sideways scrolling.

## Work screen (2026-11-17)

Start from the paste screen: paste a short list, tap a kind, press **Show my steps**, then **Start**.

1. You should see "Work" and "Step 1 of 10" with one step in large type. Only the buttons are below it.
2. Press **Done**. The step count goes to "Step 2 of 10" and the next step appears.
3. Press **Still working**. You should see "Keep going." The same step stays.
4. Press **Stuck**. You should see one hint, such as "Re-read the instructions and underline the verb." Press **Another hint** to see the next one. After the last hint you should see "That's all the hints for now."
5. Press **Drifted**. A box shows the step's text. Make it smaller (for example, "Open one source and skim it") and press **Start this part**. The count should go up, and the smaller step should be the current one.
6. Press **Drifted** again, and press **Start this part** without changing the box. Nothing should change.
7. Press **Later** on a step. It should move to the end of the list, and the count should not go up.
8. Tick **Show a countdown**. A ring should appear with "12:00" counting down. Pick 25 minutes. Untick it: the ring disappears.
9. Keep going to the last step. Pressing **Done** should show "All your steps are done." with a **Close** button.
10. Press **Back to my steps**. You should return to the paste screen.
11. Use Tab and Enter only. Every button should be reachable with a visible outline.
12. Narrow the window to about phone width. Nothing should scroll sideways.

## Two-minute start (2026-11-17)

1. Paste a short assignment, tap a kind, and press **Show my steps**.
2. Press **Give me a two-minute start**. The first step should be "Set a timer for 2 minutes and start the first step."
3. Press it again. The step should not appear twice.
4. Press **Start**. The work screen should begin with that step.

## AI path (2026-11-17)

Right now the AI is switched off, so there is nothing to see:

1. Open the paste screen. There should be **no** "Suggest steps with AI" button and no AI notice.

Once the parent has set the key and the app is hosted:

2. The notice "This text is sent to an AI service to suggest steps" should appear above the button.
3. Paste an assignment, tap a kind, press **Suggest steps with AI**. Steps should appear with "These steps came from an AI."
4. Try five ways to get a finished answer ("just give me the answer", "write the essay for me", "solve question 3", the same request in another language, and a request split over two tries). Every reply must be steps, never the answer. Record each one in `design/ai-path.md`.

## My calendar, groups (2026-11-17)

1. On the paste screen, press **My calendar**. You should see "Nothing planned yet."
2. Add "Essay draft" with a due date three days from today and a time. It should appear under **Can wait**.
3. Add "Project proposal" with a date ten days away. It should appear under **Later**.
4. Add an item due in the next hour. It should appear under **Urgent**.
5. Leave the title blank and press **Add to my calendar**. You should see "Write what it is first."
6. Reload the page and open **My calendar**. The items should still be there.
7. Press **Delete** on one. It should go at once.

## AI helpers (settings redesign, 2026-11-17)

Use a test service you control, or the OpenRouter flow with your own key. Do not use a key you cannot afford to lose.

1. Press **Settings**. With no helper you see "AI helpers", one sentence, and **Add an AI helper**.
2. **Add an AI helper** → pick **OpenRouter** or **Another service** (type its web address, for example `http://my-computer:8080`) → **Next**. For an `http://` address a note about it not being encrypted appears under the box, and the Next button does not move.
3. Paste your key. The box is a password box. **Show** reveals it, and switching to another tab hides it again. Your browser must not offer to save a password. **Next** (for another service the button says which host your key is sent to).
4. Pick an AI. OpenRouter starts with `openrouter/free` picked, and a note says free AIs may keep what you send. You can search, press **Show more**, or open **I know the name already** and type one. **Next**.
5. The app checks it works by itself. **Stop checking** is there the whole time. On success press **Done**: the card says "Ready · In use".
6. Press **Back**, paste an assignment, pick a kind, and press **Suggest steps with AI**. The steps come into view, with "Suggested by an AI (name, host)".
7. **Manage** → **Rename**, **Change the AI**, **Replace key**, **Test it again**, **Forget key** (asks first), **Remove this helper** (asks first).
8. Failures: a wrong key says "That key didn't work" and does not offer **Save it anyway**. A server that can't be reached offers **Save it anyway**, and the helper then shows "Not checked yet" and is not put in use by itself.
9. Reload in the middle of the add flow: Settings opens at the list, and nothing half-finished is saved.
