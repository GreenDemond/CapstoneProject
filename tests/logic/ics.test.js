import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIcs, escapeText, foldLine, TIMED_MINUTES } from "../../js/logic/ics.js";

const NOW = new Date(Date.UTC(2026, 10, 17, 10, 5, 9));
const task = { id: "c1abc", title: "Read chapter 5", due: "2026-11-20T15:30", notes: "", links: [], category: "school", status: "open" };
const trip = { id: "c2xyz", kind: "event", title: "Museum trip", start: "2026-12-01", end: "2026-12-03", notes: "", links: [] };

function unfold(text) {
  return text.replace(/\r\n /g, "");
}

test("a timed item makes a valid file with CRLF, required fields and a stable UID", () => {
  const r = buildIcs(task, NOW);
  assert.equal(r.ok, true);
  assert.ok(r.text.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"));
  assert.ok(r.text.endsWith("END:VCALENDAR\r\n"));
  assert.ok(!/[^\r]\n/.test(r.text), "no bare LF");
  for (const line of ["CALSCALE:GREGORIAN", "UID:c1abc@focusapp.local", "DTSTAMP:20261117T100509Z", "DTSTART:20261120T153000", "DTEND:20261120T160000", "SUMMARY:Read chapter 5", "BEGIN:VEVENT", "END:VEVENT"]) {
    assert.ok(r.text.includes(`\r\n${line}\r\n`), line);
  }
  assert.ok(r.text.includes("PRODID:"));
  assert.equal(TIMED_MINUTES, 30);
  assert.equal(buildIcs(task, new Date(Date.UTC(2030, 0, 1))).text.includes("UID:c1abc@focusapp.local"), true);
  assert.equal(r.fileName, "read-chapter-5.ics");
});

test("a timed item near midnight ends on the next day", () => {
  const r = buildIcs({ ...task, due: "2026-12-31T23:45" }, NOW);
  assert.ok(r.text.includes("DTSTART:20261231T234500"));
  assert.ok(r.text.includes("DTEND:20270101T001500"));
});

test("a trip is an all-day range with an exclusive end", () => {
  const r = buildIcs(trip, NOW);
  assert.equal(r.ok, true);
  assert.ok(r.text.includes("DTSTART;VALUE=DATE:20261201\r\n"));
  assert.ok(r.text.includes("DTEND;VALUE=DATE:20261204\r\n"));
  const one = buildIcs({ ...trip, start: "2026-12-31", end: "2026-12-31" }, NOW);
  assert.ok(one.text.includes("DTEND;VALUE=DATE:20270101\r\n"));
});

test("text is escaped: backslash, semicolon, comma and line breaks", () => {
  assert.equal(escapeText("a\\b; c, d\ne\r\nf"), "a\\\\b\\; c\\, d\\ne\\nf");
  const r = buildIcs({ ...task, title: "Math; ch 1, 2", notes: "line one\nline two" }, NOW);
  assert.ok(r.text.includes("SUMMARY:Math\\; ch 1\\, 2\r\n"));
  assert.ok(r.text.includes("DESCRIPTION:line one\\nline two\r\n"));
});

test("notes and https links go in the description; other links are left out", () => {
  const r = buildIcs({ ...task, notes: "bring book", links: ["https://example.com/a", "http://bad.example"] }, NOW);
  const text = unfold(r.text);
  assert.ok(text.includes("DESCRIPTION:bring book\\nhttps://example.com/a\r\n"));
  assert.ok(!text.includes("bad.example"));
  assert.ok(!buildIcs(task, NOW).text.includes("DESCRIPTION"));
});

test("long lines fold at 75 octets and never split a multi-byte character", () => {
  const title = "é".repeat(100) + "😀".repeat(30) + "日本".repeat(30);
  const r = buildIcs({ ...task, title }, NOW);
  const encoder = new TextEncoder();
  const lines = r.text.split("\r\n");
  for (const line of lines) {
    assert.ok(encoder.encode(line).length <= 75, `too long: ${line.length}`);
  }
  assert.ok(lines.some((l) => l.startsWith(" ")));
  assert.ok(unfold(r.text).includes(`SUMMARY:${title}\r\n`));
  // Unfolded text decodes to valid characters (no replacement characters).
  assert.ok(!r.text.includes("\ufffd"));
});

test("foldLine leaves short lines alone and folds an exact boundary correctly", () => {
  assert.equal(foldLine("a".repeat(75)), "a".repeat(75));
  assert.equal(foldLine("a".repeat(76)), `${"a".repeat(75)}\r\n a`);
  assert.equal(foldLine("a".repeat(74) + "é"), `${"a".repeat(74)}\r\n é`);
});

test("missing or invalid dates, titles and ids give no file and a calm reason", () => {
  for (const bad of [
    { ...task, due: "" }, { ...task, due: undefined }, { ...task, due: "2026-02-31T10:00" }, { ...task, due: "soon" },
    { ...trip, start: "nope" }, { ...trip, end: "2026-11-01" }, { ...task, title: "  " }, { ...task, id: "" },
    null, undefined, "text",
  ]) {
    const r = buildIcs(bad, NOW);
    assert.equal(r.ok, false);
    assert.ok(!/error|invalid|wrong/i.test(r.reason));
  }
});

test("odd ids cannot break the UID line, and an unusable title still gets a file name", () => {
  const r = buildIcs({ ...task, id: "a b\r\nc@d" }, NOW);
  assert.ok(r.text.includes("\r\nUID:abcd@focusapp.local\r\n"));
  assert.equal(escapeText("a\tb\u0001c"), "abc");
  assert.equal(buildIcs({ ...task, title: "???" }, NOW).fileName, "calendar-item.ics");
});
