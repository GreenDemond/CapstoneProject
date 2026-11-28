# A class on calendar items

Status: built. Reference (read only): `ios/design/slices/M0b-class-and-courses.md`. Nothing imported.

## What the student sees and does
1. In the My calendar add form, under "What part of life is it?", a box "Class (optional)" with the hint "For example: History". Up to 40 characters. Empty is fine.
2. An item added with a class shows "Class: History" next to its category in the list (tasks, trips and events, and the Completed list). Items without a class look as before.

## Research link
Design judgment, to be tested. It is the student's own word, the same as the class on an assignment (W11). No research claim.

## What it stores
`classLabel` on a calendar item: the student's words, spaces tidied, cut to 40, left out when blank. Older items load with none. It travels in a saved copy with the calendar (the existing calendar normalizer keeps it). Nothing else is stored; no link between calendar classes and course memory is made.

## What leaves the device
Nothing. It is not added to the phone-calendar (.ics) file.

## Distracted, stuck, away
Optional and quiet: a blank box adds nothing, nothing is required, nothing is counted. Tag-like text shows as plain text (textContent).

## Design review
- [x] No rule broken; no shame; student's own text; deleting the item deletes the class.
- [x] No conflict with DECISIONS; storage through `js/storage.js` (calendar section).
- [x] Small: one field, one tag.

## Wording for the parent's okay
"Class (optional)" and "For example: History" (same as W11), "Class: <text>".

## Tests
`tests/logic/calendar.test.js` (class kept, tidied, cut, left out when blank, kept when read back); `tests/browser/calendar-class.spec.js` (main and awkward path, phone and desktop).
