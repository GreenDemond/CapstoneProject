# Design: several chats, saved on the device

Status: **approved for build 2026-11-17** (Ben: "think through the user experience of multiple conversations and adjust"). This reverses the earlier default in `design/ai-chat.md` ("Keep the chat after a refresh? No"). Based on the advisor's Option B. Builds on `design/ai-chat.md`.

## What the student sees and does

1. **Talk it through** opens the most recent chat if it was used today, so a refresh, a phone swipe, or Back to home loses nothing.
2. Otherwise a fresh chat opens. If there is an older chat, one quiet line sits above it: **Carry on: Essay · how do I start my intro…** (one tap reopens it). Nothing says how long ago it was.
3. Inside a chat: **New chat** (replaces Start over; the current chat is kept in the list, so nothing is lost and no confirm is needed), **My chats**, **Back to home**.
4. **My chats** is its own screen (one thing at a time). Newest first. Each row is a full-width button with a title (two lines at most) and a plain date ("Today", "Yesterday", "Tue 17 Nov"). Each row has a **Delete** button that needs a second tap ("Delete this chat?" **Yes, delete** / **Keep it**). At the bottom: **Delete all my chats** (same second tap), and two lines: "Keeps your 10 most recent chats." and "Anyone using this browser can see these."
5. The line at the top of a chat changes from "This chat isn't saved" to "Your chats are saved on this device only."
6. An old chat opens with its kind of work already picked. If the AI helper has changed since, the top line already names where messages go now. With no helper, the chat can be read and Send says to add a helper first.

## Titles

Made on the device: the kind's label plus the first 40 characters of the student's first message ("Essay · how do I start my intro…"). Never written by the AI (that would send data and cost money). If no message is saved yet, "Chat · Essay".

## The trusted-adult line in a saved chat

The student's message that made the AI send its safety word is **not saved** (it shows on screen for this visit only; no message is saved before its reply has arrived) and is never used for the title. Only the line "If something serious is going on, please talk to an adult you trust." is saved. Devices are often shared, and the list says so. Nothing marks a chat as flagged, and nothing is reported (rule 5).

## What is stored, and where

- A **second storage key, `focusapp.v1.chats`**, still read and written only by `js/storage.js`. Chats are the biggest and least important data; in their own key, a full chat store can never stop the steps, profile, or calendar from saving. This changes T3 ("one storage key") and is recorded in the DECISIONS change log.
- `{ schemaVersion: 1, chats: [{ id, kind, title, startedOn, usedOn, items: [{ who: "you" | "ai" | "note", text }] }] }`.
- What is sent to the AI: the "you" and "ai" items only, newest that fit in about 6,000 characters (unchanged). Notes ("cut off", the trusted-adult line) are never sent. No guide and no key is stored in a chat.
- **Caps:** 10 chats (an 11th pushes out the least recently used one; the list says so); each chat keeps at most 20,000 characters (oldest items dropped from the saved copy, with the note "Older messages in this chat aren't kept."). About 200,000 characters at most.
- **If a save fails** (storage full or blocked): the chat keeps working on the page, and one line says "This chat couldn't be saved on this device. Deleting an old chat makes room." Nothing is deleted without the student knowing. Steps are never affected.
- **Damaged chat data:** bad chats or items are dropped one by one; the app never crashes; unreadable text is backed up once under `focusapp.v1.chats.backup`.
- **The kind of work is saved with the steps** (`work.kind`), so a chat can pre-select it after a refresh.

## Research and rules

- Design judgment, to be tested. Supports "make coming back easy" (`00` section 4) without adding pressure.
- Rule 2: no counts, streaks, "days ago", or reminders. Rule 4 and 5: on the device only, delete one or all, no sharing. Rule 11: the flagged message is not kept. T8: nothing new leaves the device; a resumed chat sends its recent messages to the helper named on screen (the parent's T8 confirmation should mention this).

## Distracted, stuck, or back after a week

- Refresh or swipe away mid-chat: today's chat reopens with everything up to the last saved item. A reply that was still coming is lost, and so is the one message it was answering: a message is saved only together with a usable reply (so a message that would be flagged is never in storage). The student types it again. Tapping New chat, My chats, Carry on, or Back while a reply is coming takes that message out too; if the student comes back to the same chat in this visit, its words are in the box.
- Back after a week: home is unchanged (the pick-up card). Talk it through opens a fresh chat with the Carry on line.
- Double tap on Delete: the first tap asks, the second confirms; nothing else is deleted.

## Not built (traps or clutter)

Search, folders, tags, pins, renaming, AI titles or summaries, an AI that remembers past chats, counts or reminders, flags, sharing, sync, unlimited history, opening on the list.

## Checklist (AGENTS.md stage 1)

- [x] Breaks no rule (see above).
- [x] DECISIONS: T3 changes (second key), recorded in the change log. T8 unchanged in what leaves; the parent's confirmation should mention resumed chats.
- [x] Not a trap: no counts, streaks, or flags.
- [x] The student does the thinking: the list is theirs to keep or delete.
- [x] One thing on screen: the list is its own screen; the chat opens straight to typing.
- [x] Small enough: logic file with tests, storage key, chat screen changes, list screen.
