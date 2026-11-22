# UX Whole-app review and prompt controls
Status: draft 2026-11-21

## Purpose
Review the complete interface for organization, ease of use, accessibility, Apple platform conventions, and comprehension by an expert iPhone user, a first-time user, a user under executive-function load, a parent setting up AI, and a 10-year-old usability/reading-level proxy. The app never asks for or infers age or diagnosis.

## Prompt map

| Prompt part | Current source | Editable now? | Recommendation |
|---|---|---:|---|
| Talk safety and hints-only rules | `Shared/content.json` → `chat.rules` and `chat.rulesReminder` | No | Keep fixed and never expose as editable text |
| Default conversational style | `Shared/content.json` → `chat.defaultGuide` | Indirectly | Show the effective default under Me → How the AI talks; let the student customize it or reset it |
| Reply length | `Shared/content.json` → `chat.lengths` and `chat.defaultLength` | Yes | Keep Short / Medium / Long; use a native picker and explain the effective choice |
| Student guide added to Talk | `Logic/Guide.swift` | Yes, globally | Keep separate from safety rules; rename to “How I want help” |
| Current-step context in Talk it through | `AI/ChatEngine.swift` | No; hidden | Show a visible “Talking about: <step>” context chip with Clear / New chat |
| General Talk conversation history | `Models/ChatModel.swift` | New chat only | When switching from on-device AI to an external service, explain that the existing chat will be sent, or start fresh by default |
| Step-suggestion rules | `Shared/content.json` → `stepCoach.rules` | No | Keep fixed; they protect student planning and hints-not-answers |
| Assignment, work kind and count sent to Step Coach | `AI/StepCoach.swift` | Through the planning form | Keep visible in the planning flow; resolve the current “3 to 5” rules versus an 8-step request |
| External-AI connection check | `Network/OpenAICompatibleModel.swift` | No | Keep fixed; it sends no student words |

## What the student sees and does
1. Today remains the first place and shows one next action.
2. Work remains one step at a time, but its content scrolls when text is large or a keyboard appears. Back to Today remains available.
3. Plan becomes the place to review: Current steps, Parked thoughts and Recall notes.
4. Talk visibly names its context and the AI in use. “New chat” clears context. The keyboard always has Done.
5. Me becomes a short list of destinations instead of one long settings page: Goals and notes; How I like to work; How I want help; Voice; Advanced AI services; Backup; About and privacy.
6. Destructive actions use native confirmation dialogs or Undo rather than changing a button to “tap again.”

## Research link
- `research/00-knowledge-summary.md` sections 3–5: the student does the thinking; make starting nearly effortless; show one thing at a time; make returning easy; never shame.
- Apple UI design tips: primary content fits the device; controls stay near the content they modify; touch targets are at least 44 × 44 points. https://developer.apple.com/design/tips/
- Apple Human Interface Guidelines are the platform reference for navigation, accessibility, controls and feedback. https://developer.apple.com/design/human-interface-guidelines/

## Panel review

| Perspective | What already works | What causes friction | Highest-value change |
|---|---|---|---|
| Expert iPhone user | Native tabs, NavigationStack, sheets, lists and forms | Custom “tap again” deletion; dense action rows; duplicated navigation concepts | Use native confirmation dialogs, menus and navigation destinations |
| First-time user | Clear welcome and Today primary action | “Drifted” and service terminology require prior knowledge; hidden prompt default | Explain status buttons once; show the effective AI guide |
| Executive-function load | One-step Work screen; easy return to Today; no shame | Work cannot scroll; Me mixes goals, voice, privacy and technical setup | Scroll Work; split Me into small destinations |
| 10-year-old usability proxy | Core work copy is short and concrete | AI address/key/model/encryption language dominates Me; saved items cannot be found | Put AI services under Advanced; make Plan the place to find saved material |
| Parent / AI administrator | Keychain storage, disclosure and connection checks | Setup lacks keyboard progression and focused validation; provider defaults can feel like entered data | Provider presets, field focus order, inline validation and a clear Test button |

## Findings, ordered by priority

### Must fix before wider beta
1. **Work must scroll.** `App/FocusApp/WorkView.swift` uses a fixed VStack. At large Dynamic Type sizes or with Park a thought / Drifted keyboards open, primary controls can move off-screen with no way to reach them.
2. **Saved material needs a destination.** Parked thoughts and recall answers are stored, but no screen displays them. Plan should show both, or “Save” must be renamed if retrieval is intentionally omitted.
3. **Delete needs native safety.** Notes can be deleted in one swipe; keys, services, chats and all data use inconsistent custom two-tap states. Use `confirmationDialog`, alerts or Undo.
4. **Make Talk context explicit.** A Talk-it-through chat receives a hidden step snapshot. Show it, allow Clear, and avoid sending an existing on-device conversation to an external service without a clear choice.
5. **Verify accessibility for real.** Existing identifiers prove automation can find controls; they do not prove VoiceOver reading order, Dynamic Type fit or named speech-stop actions.

### Strong improvements
6. Split Me into navigable sections; place My AI services under **Advanced AI services**.
7. Attribute VoiceOver bubbles correctly: “AI” only for model output; app safety/error messages should be “App message” or unprefixed.
8. Add a named VoiceOver “Stop reading” action to spoken chat replies.
9. Add keyboard Next/Done and focus-to-error behavior in AI-service setup.
10. Use a menu for AI selection when labels or Dynamic Type do not fit a segmented picker.
11. Add a Retry button to the app-wide startup failure screen.
12. Move the no-AI fallback into Talk’s scrollable content instead of the fixed composer area.
13. Disable Search while a lookup is in progress and label it Searching.
14. Group the privacy page under headings: Stored here, Leaves the phone, AI services and Delete.
15. Add first-use explanations and accessibility hints for Done, Still working, Stuck, Drifted and Later without visually favoring Done.

## Prompt-control recommendation
- Keep **App rules** fixed and visible only as a short explanation: “Ben’s Steps always asks for hints, not answers.” Never expose `chat.rules`, `rulesReminder`, the safety word or `stepCoach.rules` as editable fields.
- Replace the blank “How the AI talks” box with **How I want help**. Initially show the actual built-in guide, with Edit and Reset to default.
- Offer three optional style presets before free text: **Ask me questions**, **Give the smallest hint first** and **Be brief**. The student can then edit one plain-language guide.
- Keep one global style in version 1. The web app supports hidden per-kind dictionaries and per-kind UI, but that adds seven settings screens. Add per-kind overrides only after Ben asks for different behavior for essays, reading, problem sets, projects or studying.
- Add a visible Talk context row: **Talking about: <step> · Clear**. A general chat has no hidden assignment context.
- Starting a new chat clears prior assignment/step context. Switching to an external AI should default to a new chat; continuing should require a clear confirmation naming what will be sent.

## What it stores
No new data is required for the first UX slice. Later prompt work continues to store only the existing guide and reply-length values. Parked-thought retrieval displays data already stored.

## What leaves the phone
Nothing from the layout changes. Prompt/context changes do not add a new destination, but switching an existing chat to an external AI needs a disclosure because earlier messages and step context would leave the phone.

## Distracted, stuck, back after a week
- Distracted: Work remains one screen and Back to Today keeps the current step.
- Stuck: status choices gain one-time explanations and Talk shows exactly which step it knows.
- Back after a week: Today remains the re-entry point; Plan provides saved material without mentioning the gap.

## Tests
- Smallest supported iPhone and largest accessibility text: Work, Me, Talk and AI service setup; every primary action remains visible or reachable by scrolling.
- VoiceOver labels and reading order: Work status grid, Talk bubbles, AI selector, service setup and destructive confirmations.
- Work keyboard paths: Drifted, Park a thought and recall; Done dismisses the keyboard and controls remain reachable.
- Data retrieval: save, list and delete parked thoughts and recall notes.
- Context: Stuck → Talk shows the step; Clear removes it; New chat removes it; switching AI does not silently send existing history.
- Destructive actions: cancel and confirm paths; note Undo where used.

## Unverified
- Visual appearance at all Dynamic Type sizes and VoiceOver reading order require simulator/device checks.
- Whether Ben wants global or per-kind AI style settings.
- Whether “Drifted” and “Stuck” are his final words.

## Gates
- Gate 1 design review: pending parent approval.
- Advisor review: the codebase audit was read-only; a stronger-model design review is still recommended before implementation.

## Report: release-readiness pass, 2026-11-21 (build 8)

Builder and Advisor in this pass: Claude Opus (the strongest model available). A separate read-only reviewer agent checked safety and privacy. Its verdict was FIX FIRST on one item.

### Review findings and what happened

| # | Finding | Priority | Done |
|---|---|---|---|
| 1 | After switching Talk from the on-phone AI to an external service, earlier on-phone messages were sent to that service on the next message (rule 4, D8) | Must fix before Ben | Fixed. A chat remembers its AI (`Chat.aiId`). Changing the AI and sending starts a new chat with a calm line, and the earlier chat stays saved and unsent. 4 tests |
| 2 | Tailscale exception uses 100.64.0.0/10, which internet providers also use | Before classmates | Recorded in D8 as the parent's choice, with the caveat. Not changed |
| 3 | The build-5 key migration picks its new home by label, not address | Later | Not changed. Rare: needs a failed move plus a new "My service" at another host |
| 4 | Steps from a chat reply skipped the process-step check | Later | Fixed. 1 test |
| 5 | Two quote marks (＂ „) were not cleaned from the guide | Later | Fixed. 1 test |
| 6 | Starter step "Check what you missed" | Wording | Changed to "Check your answers against your notes" (content and case file together) |
| — | The trusted-adult line depends on the AI obeying TRUSTED_ADULT | Open question | The parent's pending "two extra safety signals" decision |

Safe, per the review: per-service key isolation; no key in saved data, errors, labels or logs; Delete everything removes keys first; every reply is checked before it is shown, spoken or saved; the backup never includes a key; prompt text is quoted and cleaned.

### UX fixes in this pass
- The work screen scrolls, and its header is one line at every text size ("Back to Today" shortens to "Today" if it must; the step position moved under it).
- Plan lists saved thoughts and recall answers, with a confirmed delete.
- Notes: confirmed delete; a full swipe does not delete.
- Talk: "Talking about: <step> · Clear"; the privacy line and the no-AI help now scroll with the chat, so nothing is cut off at large text; VoiceOver says who wrote each message; named Stop reading action.
- A keyboard Done button on every screen with a text box.
- Search is disabled while searching; startup failure has Try again.

### Large-text matrix
- `LargeTextUITests` runs at the largest accessibility size (AccessibilityXXXL) on the iPhone 15 Pro Max simulator, iOS 26.5. It walks welcome, assignment, editor, the work screen (all five buttons, Drifted with the keyboard), Me and Talk, and checks every main control can be reached and tapped.
- Screenshots showed two problems, both fixed: the work header wrapped "Back to Today" over four lines, and Talk's privacy line was cut off.
- Not run: the smallest iPhone (iPhone 17e) and dark mode. VoiceOver reading order still needs a person listening.

### Not done (needs a decision or a person)
- Splitting Me into short destinations. At the largest text size Me is many screens tall. This is a structure change for the parent or Ben to see first.
- "How I want help": visible default guide, presets, Reset.
- Native dialogs for chats, AI services, saved keys and Delete everything (they still use "tap again").
- Next order and focus-to-error in the AI-service form.
