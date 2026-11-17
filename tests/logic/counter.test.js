import { test } from "node:test";
import assert from "node:assert/strict";
import { addCompletion, removeCompletion, totals, todayKey } from "../../js/logic/counter.js";

const NOW = new Date(2026, 10, 18, 12, 0); // Wednesday 18 Nov 2026

test("completions are added by day, and reopening takes one back out", () => {
  let counts = addCompletion({}, "2026-11-18");
  counts = addCompletion(counts, "2026-11-18");
  assert.equal(counts["2026-11-18"], 2);
  counts = removeCompletion(counts, "2026-11-18");
  assert.equal(counts["2026-11-18"], 1);
  counts = removeCompletion(counts, "2026-11-18");
  assert.equal(counts["2026-11-18"], undefined);
  assert.deepEqual(removeCompletion({}, "2026-11-18"), {});
});

test("totals split into today, this week, this month, this year and all time", () => {
  const counts = {
    "2026-11-18": 2, // today, this week, month, year
    "2026-11-16": 1, // Monday this week
    "2026-11-02": 3, // this month, not this week
    "2026-03-05": 4, // this year, not this month
    "2025-12-31": 5, // last year, all time only
  };
  assert.deepEqual(totals(counts, NOW), { today: 2, week: 3, month: 6, year: 10, all: 15 });
});

test("a week starting on Monday is counted from Monday, even if today is Monday", () => {
  const monday = new Date(2026, 10, 16, 9, 0);
  assert.equal(totals({ "2026-11-16": 1, "2026-11-15": 1 }, monday).week, 1);
});

test("todayKey gives the local date", () => {
  assert.equal(todayKey(NOW), "2026-11-18");
});
