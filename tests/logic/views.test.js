import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays, addMonths, mondayOf, weekDates, splitWeek, monthGrid, itemsOnDay, blockPlacement, dayKey,
} from "../../js/logic/views.js";

const WED = new Date(2026, 10, 18); // Wednesday 18 Nov 2026

test("the week starts on Monday, and Wednesday's Monday is the 16th", () => {
  assert.equal(dayKey(mondayOf(WED)), "2026-11-16");
  assert.equal(weekDates(WED).length, 7);
});

test("the week splits into weekdays (Mon to Fri) and the weekend (Sat and Sun)", () => {
  const { weekdays, weekend } = splitWeek(WED);
  assert.deepEqual(weekdays.map((d) => d.getDate()), [16, 17, 18, 19, 20]);
  assert.deepEqual(weekend.map((d) => d.getDate()), [21, 22]);
});

test("a month grid starts on Monday and lines up the days", () => {
  const weeks = monthGrid(new Date(2026, 10, 1)); // November 2026 starts on a Sunday
  assert.equal(weeks[0][6].getDate(), 1); // Sunday is the last column
  assert.equal(weeks[0][0], null);
  assert.ok(weeks.every((w) => w.length === 7));
});

test("items are picked for the right day and sorted by time", () => {
  const items = [
    { id: "b", due: "2026-11-18T15:00" },
    { id: "a", due: "2026-11-18T09:00" },
    { id: "c", due: "2026-11-19T09:00" },
  ];
  assert.deepEqual(itemsOnDay(items, WED).map((i) => i.id), ["a", "b"]);
});

test("a block is placed by its start time, and times outside the grid are not placed", () => {
  const nine = blockPlacement({ due: "2026-11-18T09:00" });
  assert.ok(Math.abs(nine.top - (120 / 900) * 100) < 0.001);
  assert.equal(blockPlacement({ due: "2026-11-18T23:30" }), null);
  assert.equal(blockPlacement({ due: "2026-11-18T06:00" }), null);
});

test("month navigation moves by whole months", () => {
  assert.equal(addMonths(new Date(2026, 10, 18), 1).getMonth(), 11);
  assert.equal(addDays(WED, 7).getDate(), 25);
});
