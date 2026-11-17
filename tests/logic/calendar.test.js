import { test } from "node:test";
import assert from "node:assert/strict";
import { bucketFor, parseDue, makeItem, groupItems, removeItem, parseLinks, MAX_LINKS, MAX_NOTES } from "../../js/logic/calendar.js";

const NOW = new Date(2026, 10, 17, 10, 0); // 17 Nov 2026, 10:00 local

test("due within the hour is urgent, including a time that has passed", () => {
  assert.equal(bucketFor(new Date(2026, 10, 17, 10, 30), NOW), "urgent");
  assert.equal(bucketFor(new Date(2026, 10, 17, 9, 0), NOW), "urgent");
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
