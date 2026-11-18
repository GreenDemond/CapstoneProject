# Settings redesign: "AI helpers" (v2)

Status: **built (2026-11-17).** v2, after five reviews: a 10-year-old, a UX designer, an accessibility and ADHD reviewer, a security and privacy reviewer, and an engineer.** v1 was "not ready" from all five. This version adopts their must-fix items. It changes only how the screen looks and flows. Earlier decisions stand: students bring their own key, it is stored encrypted in this browser, the app calls the chosen service directly, and every helper needs a key and an AI chosen (design/ai-direct.md, DECISIONS.md).

Research basis: design judgment, to be tested with Ben's beta students. It follows 00-knowledge-summary.md section 4 (one thing at a time, no shame, short and plain).

## What was wrong (Ben: "awful")

One long page held a list, a form, and about ten controls per saved service. Jargon (address, model, key, CORS). Messages at the bottom of the page. Setup order was hidden. Layout shifts made phone taps fail.

## Decisions taken from the reviews

| Topic | Decision |
|---|---|
| Name | "AI helper" (Ben may change it). The paste screen says "Which AI helper?" too. |
| Moving between steps | Every step has a main **Next** button and a quieter **Back** button, plus **Cancel** (a button). |
| Nothing saved until it works | The key, address, and AI are held in memory during setup. They are stored only when the check passes, or the student chooses "Save it anyway". |
| Leaving mid-way | Honest wording: "Leaving mid-way starts the setup over. A half-typed key is never kept." Reload, closing the tab, or the browser's back button throws the draft away. Opening Settings again shows Screen A. |
| Escape | Closes an open search or tips block only. It never cancels setup. |
| Save it anyway | Offered only after "Couldn't reach it", a timeout, or an empty reply. Never after a rejected key or "not found". The helper then shows **Not checked yet** and is never made "In use" by itself. |
| `openrouter/free` | **Ben's decision (2026-11-17, in chat): default it.** Recorded in DECISIONS.md. It is pre-selected, and shows even if the list does not include it. A visible note: "Free AIs may keep or learn from what you send, unless you turned that off in your OpenRouter account. Pick a paid one for private work." For the five answer-giving checks, a fixed paid model is used, because the free router picks different models each time. |
| Where the key goes | OpenRouter's AI list is fetched **without** the key (it is public). For any other service, step 2's button names the host: "Next (sends your key to ai.example.com to look up its AIs)". |
| Redirects | Requests do not follow redirects. An address that redirects shows "Couldn't reach it". |
| Key box | Not inside a form, no submit button, `autocomplete="off"`, `spellcheck=false`, `autocapitalize="off"`, `autocorrect="off"`, `data-1p-ignore`, `data-lpignore="true"`, `data-bwignore`. Starts empty on every visit. Pasting is allowed. Spaces and line breaks are trimmed. |
| Show toggle | A button with `aria-pressed`. Turns off on leaving step 2, when the tab is hidden, and on pagehide. |
| Key lifetime | One variable in memory. Emptied and the box removed from the page on leaving step 2. Going Back to step 2 shows "Key entered: ••••7890" and a "Paste a different key" button; the box is never refilled. Cleared on Cancel, Done, Save it anyway, leaving Settings, and pagehide. (A browser cannot truly wipe memory; the note does not promise that.) |
| Unique ids | Helper ids never repeat (an old encrypted key can never attach to a new helper at another address). |
| Quietly switching | Never. If the helper in use is removed, the app chooses the first Ready helper or none. |
| Wording of failures | Setup has its own kinder message set. The paste screen keeps its existing wording. |

## Who and when

A student, 13 to adult, on a phone or laptop, who may have ADHD. Setup is once, and optional. Often an adult hands over a key. The paste screen works fully without any helper.

## Screens

### Screen A: "AI helpers"

```
Settings
[Back]

AI helpers
An AI helper can suggest steps for your assignment. It's optional.
Without one, you still get the built-in steps.

+-----------------------------+
| OpenRouter                  |
| ✓ Ready · In use            |
| [Manage OpenRouter]         |
+-----------------------------+
| Home server                 |
| ! Needs a key               |
| [Finish setup] [Manage ...] |
+-----------------------------+
[+ Add an AI helper]
```

- Empty state: the intro and one big "Add an AI helper" button.
- Two-line cards. Name, then status as text plus ✓ or !. Buttons below, at least 44 px tall, each named with the helper ("Manage OpenRouter", "Use Home server").
- Statuses, one word each: **Ready**, **Needs a key**, **Needs an AI picked**, **Not checked yet**. Needs a key shows first when both are missing.
- "In use" is plain text, not a button. A Ready helper not in use shows "Use this one". The first helper that becomes Ready is put in use, and the student is told.
- "Finish setup" is shown for Needs a key and Needs an AI picked, and opens the add flow for that helper starting at the missing step. "Not checked yet" shows "Check it".

### Screen B: "Add an AI helper" (one question per step)

A header "Step 2 of 4" and Cancel. Main button under the box. One message line per step, directly under the main button.

1. **Which service?** Two big buttons: "OpenRouter" ("A popular service with many AIs. You need a key. An adult may need to make the account.") and "Another service" ("An AI on a computer or service you already have."). "Another service" asks for its web address, with an example. The app works out the rest. If the address contains "openrouter" but is not openrouter.ai: "That isn't OpenRouter's address. Go back and pick OpenRouter." If the address starts with http://, a short note shows under the box: "This address isn't encrypted. Your key and text can be read on the way. Use https if you can." The space for it is always kept. Duplicates and an address the app cannot use are refused here, before any key is typed.
   - One line shown here and on step 2: "Only use a key and address from your own account or a parent's. Whoever runs the address can read what you send."
2. **Paste your key.** "A key is like a password. It lets this app use an AI account. Keep it private." A "Where do I get a key?" block (ask the adult who manages the AI account, or make one at openrouter.ai, which needs an adult). One line always shown: "Whoever made this key should set a spending limit on it." The rest under "Tips for whoever manages the account": don't save a key on a shared computer; turn off any setting that lets providers keep or train on text. If the browser cannot store keys safely, this step says so before anything is pasted and stops.
3. **Pick an AI.** Looked up by itself ("Looking up the list…"; a "Stop" button). The first 6 shown, then "Show more". A search box only when there are more than 12. "I know the name already" opens a text box (it opens by itself if the list can't be loaded). Pre-selected: the OpenRouter default, or the only AI if there is just one (then step 4 follows by itself). Names are shown as plain text only; ids with unusual characters are dropped.
4. **Checking it works.** A tiny test message goes out by itself ("Checking… Slower AIs can take a few minutes"; a "Stop checking" button). Works: "It works." and a Done button; "It works" means the service answered, not that it keeps no data. Doesn't work: the reason, Try again, Go back and fix (to the step the error names), and where allowed, Save it anyway with the line "It might not work when you ask for steps. If not, you'll get the built-in steps."

Cancel, Back, and leaving the screen abort a running request and ignore a late reply. Done and Save it anyway turn off after one press. Saving order: store the key; if that fails, save nothing; then store the list; if that fails, delete the key.

### Screen C: "Manage [name]"

Plain rows, one button each: **Rename**; **Change the AI** (the pick step alone, with the text box); **Replace key** (the key step alone; the new key is checked before it replaces the old one); **Test it again**; **Forget key** and **Remove this helper**, both asking first ("Forget the key for Home server? You'll need to paste it again. Ask whoever gave it to you if you don't have it." / "Remove Home server? You can add it again later.", with "Yes, forget it"/"Yes, remove" and "Keep it"). The address is shown read-only, with the http warning if it applies. Single-step screens say "Change the AI", not "Step 3 of 4".

## Messages (setup only)

| Situation | Message |
|---|---|
| Empty key | "Paste your key first." |
| Not a web address | "That doesn't look like a web address. It should start with http:// or https://." |
| Path the app can't use | "Type the address the service gives you, for example http://host:8080 or https://openrouter.ai/api/v1." |
| Same AI at the same address | "You already have a helper for that AI at that address." |
| Name already used | "You already have a helper called that. Pick another name." |
| Key rejected (401, 403) | "That key didn't work. Check you copied all of it. A grown-up can help you get a new one." |
| Address or AI not found (400, 404) | "Something doesn't match. Let's check the address and the AI together." |
| Out of credit (402) | "This key is out of credit. Whoever manages the account can add more." |
| Busy (429, 5xx) | "This AI is busy right now. Try again in a minute." |
| Can't connect | "Couldn't reach it. Check your internet. If it still fails, ask a grown-up." |
| Can't read the list | "Couldn't load the list. You can type the AI's name below." |
| Empty reply | "It replied, but the reply was empty. Try a different AI." |
| Took too long | "It didn't answer in time. Try again, or pick a faster AI." |
| Slow (after 10 seconds) | "Still waiting. Slower AIs can take a few minutes." |

## Accessibility

- Every step change moves focus to that step's heading (not in Tab order). After a failure, focus stays on the button that was pressed (the step is not redrawn). After Done, focus goes to the new card; after Cancel, to "Add an AI helper"; after Remove, to "Add an AI helper" or the next card; leaving Manage returns to that Manage button.
- One live message area per step, present before any text goes in. Status is text, never colour or icon alone.
- Visible 3 px focus outline on every control, including inputs and radios. Colours come from the existing variables, so dark mode works. Text 4.5:1, borders and marks 3:1.
- Cards stack at narrow widths. No sideways scroll at 320 px or 400% zoom. The message area keeps room for several lines and grows.
- No animation: "Checking…" is text.

## Security (unchanged rules, plus)

Key never shown in full, never put back into a box, never in a message, the log, or storage other than the encrypted store. The key list in storage keeps only the last four characters. Model names come from the service and are shown as text only. The paste screen's privacy line and its "Suggested by an AI" label include the host name as well as the helper's name.

## Data stored

Unchanged: name, address, chosen AI, last four key characters, the chosen helper. Saved helpers from before this change (no AI, with or without a key) show as Needs an AI picked or Needs a key.

## Build split

1. **This round:** logic with unit tests; Screen A; the add flow for OpenRouter and "Another service"; Manage with Rename, Change the AI, Replace key, Test it again, Forget key, Remove; Finish setup. All with tests at phone and desktop width.
2. A later round, if the beta shows it is needed: anything cut.

## Tests

Add each service with stand-in responses; cancel at each step saves nothing; a failed check offers Try again, and Save it anyway only when allowed; a redirect receives nothing at the second address; a reload mid-setup leaves no key and no helper in storage; double Done saves one helper; Finish setup from old saved data; the key is never in the page text; a message does not move a button; keyboard only; 320 px; dark mode.

## Open questions for Ben

1. "AI helper" as the name?
2. Is it OK that the first helper that becomes Ready is put in use automatically?

## Several helpers at one address (2026-11-17, Ben's request)

Ben wants more than one OpenRouter helper (for example a free one and a paid one).

- **Duplicates:** helpers may share an address. Only the same address and the same AI (model name, case-sensitive) is refused: "You already have a helper for that AI at that address." Checked on the pick step, again when saving, and when changing the AI of a helper. Step 1 no longer refuses an address.
- **Names:** the pick step has "Name this helper (optional)". Blank gives "OpenRouter · <model without vendor>" (other hosts: "<host> · <model>"; `openrouter/free` is kept whole), with " (2)", " (3)" added if used. Names are unique, ignoring capitals. A typed name already used, or a Rename to one, gets "You already have a helper called that. Pick another name."
- **Key reuse:** on the key step, a button "Use the same key as <name>" appears for each helper (up to 3) at the same address that has a key. The key is read into memory only (never the box or page), the message says "Using the key from <name>.", and the helper saves its own encrypted copy. If it cannot be read: "Couldn't read that key. Paste it instead."
- **Chat:** with more than one ready helper, the chat shows the same "Which AI helper?" menu as the paste screen, above the message box. Changing it updates the "Your messages go to..." line and the Search the web box (OpenRouter only). Changing in the middle of a chat is allowed; the next message goes to the new helper.
- Data stored: unchanged (names are already stored).

## Thinking off by default for OpenRouter (2026-11-17, Ben's request)

- Each helper has a saved setting `think` (yes or no). OpenRouter helpers start with it off; other services start on and never send anything about it. A helper saved before this existed follows the same rule.
- When off, every request to an OpenRouter helper (the check, Show my steps, the chat, with or without search) carries `reasoning: { effort: "none" }`. Thinking is slower, costs credit, and uses the reply limit.
- Some AIs always think and refuse this (an error, 400). The app then repeats that one request without the setting. If that works, the reply is used and a quiet line says "This AI always thinks first, so thinking can't be turned off." once per visit to the chat or the paste screen. The saved setting is not changed. If the repeat fails too, its failure is shown as usual.
- Manage (OpenRouter helpers only): tick box "Let the AI think before answering", hint "Off is faster and uses less of your credit. Some AIs always think." It saves at once and says "Saved."
- Data stored: one yes/no per helper, on the device.
