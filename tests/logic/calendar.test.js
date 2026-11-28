import { test } from "node:test";
import assert from "node:assert/strict";
import { bucketFor, parseDue, makeItem, groupItems, removeItem, parseLinks, MAX_LINKS, MAX_NOTES, makeEvent, isEvent, GROUPS } from "../../js/logic/calendar.js";

const NOW = new Date(2026, 10, 17, 10, 0); // 17 Nov 2026, 10:00 local

test("due within the hour is urgent; a time that has passed goes to the calm group", () => {
  assert.equal(bucketFor(new Date(2026, 10, 17, 10, 30), NOW), "urgent");
  assert.equal(bucketFor(new Date(2026, 10, 17, 9, 0), NOW), "passed");
  assert.equal(bucketFor(new Date(2026, 10, 1, 9, 0), NOW), "passed");
});

test("the passed group comes last and has calm wording", () => {
  const last = GROUPS[GROUPS.length - 1];
  assert.equal(last.id, "passed");
  assert.equal(last.label, "Time has passed");
  assert.equal(last.hint, "Mark it done or delete it. No rush.");
});

test("a past-due task is grouped under passed, not urgent", () => {
  const groups = groupItems([{ id: "p", title: "Old", due: "2026-11-10T09:00" }], NOW);
  assert.deepEqual(groups.passed.map((i) => i.id), ["p"]);
  assert.equal(groups.urgent.length, 0);
});

test("due later today is significant", () => {
  assert.equal(bucketFor(new Date(2026, 10, 17, 17, 0), NOW), "significant");
});

test("due tomorrow or the day after is not urgent", () => {
  assert.equal(bucketFor(new Date(2026, 10, 18, 9, 0), NOW), "notUrgent");
  assert.equal(bucketFor(new Date(2026, 10, 19, 9, 0), NOW), "notUrgent");
});

test("due 3 to 5 days away can wait, and further out is later", () => {
  assert.equal(bucketFor(new Date(2026, 10, 20, 9, 0), NOW), "insignificant");
  assert.equal(bucketFor(new Date(2026, 10, 22, 9, 0), NOW), "insignificant");
  assert.equal(bucketFor(new Date(2026, 10, 25, 9, 0), NOW), "later");
});

test("parseDue rejects impossible dates and times", () => {
  assert.equal(parseDue("2026-02-31", "10:00"), null);
  assert.equal(parseDue("2026-11-17", "25:00"), null);
  assert.equal(parseDue("", ""), null);
  assert.ok(parseDue("2026-11-17", "15:30") instanceof Date);
});

test("makeItem needs a title and a valid date and time", () => {
  assert.equal(makeItem({ title: "  ", day: "2026-11-17", time: "10:00" }, "a").ok, false);
  assert.equal(makeItem({ title: "Essay", day: "", time: "10:00" }, "a").ok, false);
  const ok = makeItem({ title: " Essay draft ", day: "2026-11-17", time: "15:30" }, "a");
  assert.equal(ok.ok, true);
  assert.equal(ok.item.title, "Essay draft");
  assert.equal(ok.item.due, "2026-11-17T15:30");
});

test("items are grouped and sorted soonest first", () => {
  const items = [
    { id: "b", title: "Later one", due: "2026-11-17T17:00" },
    { id: "a", title: "Soon", due: "2026-11-17T10:30" },
    { id: "c", title: "Far", due: "2026-11-30T09:00" },
  ];
  const groups = groupItems(items, NOW);
  assert.deepEqual(groups.urgent.map((i) => i.id), ["a"]);
  assert.deepEqual(groups.significant.map((i) => i.id), ["b"]);
  assert.deepEqual(groups.later.map((i) => i.id), ["c"]);
});

test("removing an item leaves the rest", () => {
  const items = [{ id: "a" }, { id: "b" }];
  assert.deepEqual(removeItem(items, "a"), [{ id: "b" }]);
});

test("links must be https web addresses, one per line", () => {
  assert.deepEqual(parseLinks("https://example.org/a\n  https://example.org/b  ").links, [
    "https://example.org/a",
    "https://example.org/b",
  ]);
  assert.equal(parseLinks("javascript:alert(1)").ok, false);
  assert.equal(parseLinks("http://example.org").ok, false);
  assert.equal(parseLinks("not a link").ok, false);
  assert.deepEqual(parseLinks(""), { ok: true, links: [] });
});

test("too many links is refused", () => {
  const many = Array.from({ length: MAX_LINKS + 1 }, (_, i) => `https://example.org/${i}`).join("\n");
  assert.equal(parseLinks(many).ok, false);
});

test("notes are kept, trimmed and cut to the limit", () => {
  const result = makeItem({ title: "Essay", day: "2026-11-17", time: "10:00", notes: "x".repeat(MAX_NOTES + 10) }, "a");
  assert.equal(result.item.notes.length, MAX_NOTES);
});

test("an item keeps its notes and links", () => {
  const result = makeItem({ title: "Essay", day: "2026-11-17", time: "10:00", notes: " Read section 2 ", links: "https://example.org" }, "a");
  assert.equal(result.item.notes, "Read section 2");
  assert.deepEqual(result.item.links, ["https://example.org/"]);
});

import { setStatus, finishedThisWeek, completedItems, CATEGORIES } from "../../js/logic/calendar.js";

test("completed items leave the priority groups and show as finished", () => {
  const items = [{ id: "a", title: "Essay", due: "2026-11-17T10:30", status: "open", completedOn: null }];
  const done = setStatus(items, "a", "completed", "2026-11-17");
  assert.equal(done[0].status, "completed");
  assert.equal(done[0].completedOn, "2026-11-17");
  assert.equal(groupItems(done, NOW).urgent.length, 0);
  assert.equal(completedItems(done).length, 1);
});

test("reopening an item clears the finished day", () => {
  const items = setStatus([{ id: "a", status: "completed", completedOn: "2026-11-17" }], "a", "in progress", "2026-11-18");
  assert.equal(items[0].status, "in progress");
  assert.equal(items[0].completedOn, null);
});

test("the weekly log counts only what was finished since Monday", () => {
  const items = [
    { id: "a", status: "completed", completedOn: "2026-11-16" }, // Monday
    { id: "b", status: "completed", completedOn: "2026-11-17" }, // Tuesday
    { id: "c", status: "completed", completedOn: "2026-11-09" }, // last week
    { id: "d", status: "open", completedOn: null },
  ];
  assert.equal(finishedThisWeek(items, new Date(2026, 10, 18, 12, 0)), 2);
  assert.equal(finishedThisWeek([], new Date(2026, 10, 18, 12, 0)), 0);
});

test("categories are the five agreed ones", () => {
  assert.deepEqual(CATEGORIES.map((c) => c.id), ["school", "personal", "family", "friends", "other"]);
});

test("a new item gets a category, and an unknown category falls back to other", () => {
  const a = makeItem({ title: "Call", day: "2026-11-17", time: "10:00", category: "family" }, "a");
  const b = makeItem({ title: "Call", day: "2026-11-17", time: "10:00", category: "nonsense" }, "b");
  assert.equal(a.item.category, "family");
  assert.equal(b.item.category, "other");
  assert.equal(a.item.status, "open");
});

test("an event covers a range of days and keeps its dates", () => {
  const r = makeEvent({ title: "Trip to Lisbon", start: "2026-12-01", end: "2026-12-05" }, "e1");
  assert.equal(r.ok, true);
  assert.equal(r.item.kind, "event");
  assert.equal(r.item.start, "2026-12-01");
  assert.equal(r.item.end, "2026-12-05");
  assert.equal(isEvent(r.item), true);
});

test("an event needs a title, valid dates, and an end on or after the start", () => {
  assert.equal(makeEvent({ title: "", start: "2026-12-01", end: "2026-12-05" }, "x").ok, false);
  assert.equal(makeEvent({ title: "Trip", start: "2026-12-01", end: "" }, "x").ok, false);
  assert.equal(makeEvent({ title: "Trip", start: "2026-12-05", end: "2026-12-01" }, "x").ok, false);
  assert.equal(makeEvent({ title: "Trip", start: "2026-02-31", end: "2026-03-01" }, "x").ok, false);
});

test("events are kept out of the priority groups", () => {
  const items = [
    { id: "t", title: "Essay", due: "2026-11-17T10:30", status: "open", kind: "task" },
    { id: "e", title: "Trip", kind: "event", start: "2026-11-17", end: "2026-11-20", status: "open" },
  ];
  const groups = groupItems(items, NOW);
  assert.deepEqual(groups.urgent.map((i) => i.id), ["t"]);
  assert.equal(Object.values(groups).flat().some((i) => i.id === "e"), false);
});

test("a class on a task or event: kept tidy, left out when blank, and kept when read back", async () => {
  const { makeItem, makeEvent, normalizeCalendarItems } = await import("../../js/logic/calendar.js");
  const task = makeItem({ title: "Essay", day: "2026-12-01", time: "10:00", classLabel: "  History  " }, "a").item;
  assert.equal(task.classLabel, "History");
  assert.equal("classLabel" in makeItem({ title: "Essay", day: "2026-12-01", time: "10:00", classLabel: "   " }, "b").item, false);
  assert.equal(makeItem({ title: "E", day: "2026-12-01", time: "10:00", classLabel: "x".repeat(90) }, "c").item.classLabel.length, 40);
  const trip = makeEvent({ title: "Trip", start: "2026-12-01", end: "2026-12-03", classLabel: "Geography" }, "d").item;
  assert.equal(trip.classLabel, "Geography");
  const back = normalizeCalendarItems([task, trip, { ...task, id: "e", classLabel: 5 }]);
  assert.deepEqual(back.map((i) => i.classLabel), ["History", "Geography", undefined]);
});
