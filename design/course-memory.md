# Course memory: the student's own earlier steps for a class (no AI)

Status: built. Reference (read only): `ios/design/slices/M0b-class-and-courses.md`, iPhone `FEATURES.md` F6 item 6 and C9. Nothing imported.

## What the student sees and does
1. They finish every step of an assignment that has a class (W11). The app quietly keeps those steps for that class. No message.
2. Later, on the paste screen, they type the same class (capitals and extra spaces do not matter). Under the class box: "You have steps from last time for History." and a button "Use my History steps from last time".
3. The button opens the steps editor ("Write my steps") with those steps in the boxes. They change, add or remove steps, then Done writing and Start, as for any steps of their own. Nothing is saved or started until Start.
4. In What the app remembers, a group "Steps I used for a class" lists each class with its steps and a Delete for each line. Delete all of this removes them too.

## Research link
Design judgment, to be tested. It reuses the student's own words (the iPhone F6 idea 6). No research claim is made, and the app does not say it helps attention.

## What it stores
Section `courses` in the saved data: up to 20 entries, one per class (compared ignoring capitals and spaces). Each is `{ label, steps (up to 8, each up to 200 characters), on (date) }`. The newest finish for a class replaces the older one. Only finished assignments write an entry; unfinished work writes nothing. Blank class: nothing. Not part of a saved copy (like block-length answers). Removed by Delete all, and by Delete everything (all `focusapp` keys). All through `js/storage.js`.

## What leaves the device
Nothing. No AI.

## Distracted, stuck, away for a week
- Unfinished work writes nothing and nothing says so.
- A week away changes nothing: the offer is the same.
- The offer is a button, never applied by itself; if the student is already writing steps it only moves focus to what they typed.
- Damaged saved data loads as no offer.

## Design review
- [x] No rule broken: student's own text, no shame, no counts, deletable line by line, text only via textContent.
- [x] No conflict with DECISIONS (T3 storage in storage.js, T8 nothing leaves device, T5 no AI).
- [x] Not a trap: no streak, no points.
- [x] The student does the thinking: it is their own earlier plan and opens editable.
- [x] Small: one logic file, one offer line, one list group.

## Wording for the parent's okay (W-D5)
"You have steps from last time for <class>.", "Use my <class> steps from last time", "Steps I used for a class".

## Tests
`tests/logic/courses.test.js`; `tests/browser/course-memory.spec.js` (main path, awkward path, delete), phone and desktop.
