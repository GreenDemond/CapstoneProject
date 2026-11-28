import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addMoment, normalizeMoments, addHelp, normalizeHelps, removeById, helpLine, plural,
  countsFor, doingLines, weeklyLines, shortDate, MAX_MOMENTS, MAX_HELPS, DAY_MS,
} from "../../js/logic/looking-back.js";

const NOW = Date.parse("2026-11-20T12:00:00.000Z");
const ago = (days) => new Date(NOW - days * DAY_MS).toISOString();

test("a finished step is added newest first; other kinds and bad dates are handled", () => {
  let items = addMoment([], "done", ago(0));
  items = addMoment(items, "drifted", ago(0));
  assert.deepEqual(items.map((m) => m.kind), ["drifted", "done"]);
  assert.equal(addMoment(items, "later", ago(0)), items);
  assert.equal(addMoment(items, undefined, ago(0)), items);
  assert.equal(addMoment([], "done", "nonsense")[0].date, "");
});

test("moments are cut to the cap, keeping the newest", () => {
  let items = [];
  for (let i = 0; i < MAX_MOMENTS + 5; i += 1) items = addMoment(items, "done", ago(0));
  assert.equal(items.length, MAX_MOMENTS);
  assert.equal(items[0].id, MAX_MOMENTS + 5);
});

test("damaged moments load as an empty list or drop one by one", () => {
  for (const bad of [null, undefined, 5, "x", {}, [null, 3, "a"]]) {
    assert.deepEqual(normalizeMoments(bad), []);
  }
  const raw = [
    { id: 1, kind: "done", date: ago(1) },
    { id: 1, kind: "done", date: ago(1) },
    { id: 2, kind: "bogus", date: ago(1) },
    { id: 3, kind: "done", date: "no" },
    { id: "4", kind: "done", date: ago(1) },
    { id: 5, kind: "drifted", date: ago(2) },
  ];
  assert.deepEqual(normalizeMoments(raw).map((m) => m.id), [1, 5]);
});

test("a help mark keeps a known answer and a known countdown only", () => {
  let items = addHelp([], "yes", 12, ago(0));
  assert.deepEqual(items[0], { id: 1, answer: "yes", timer: 12, date: ago(0) });
  items = addHelp(items, "no", 7, ago(0));
  assert.equal(items[0].timer, 0);
  assert.equal(addHelp(items, "great", 12, ago(0)), items);
  assert.equal(addHelp([], "bit", 25, ago(0))[0].answer, "bit");
});

test("help marks are cut to the cap and damaged ones drop", () => {
  let items = [];
  for (let i = 0; i < MAX_HELPS + 3; i += 1) items = addHelp(items, "yes", 0, ago(0));
  assert.equal(items.length, MAX_HELPS);
  assert.deepEqual(normalizeHelps("x"), []);
  const out = normalizeHelps([{ id: 1, answer: "yes", timer: 99, date: "?" }, { id: 2, answer: "meh" }, null, { id: 1, answer: "no" }]);
  assert.deepEqual(out, [{ id: 1, answer: "yes", timer: 0, date: "" }]);
});

test("removeById removes only that item", () => {
  assert.deepEqual(removeById([{ id: 1 }, { id: 2 }], 1), [{ id: 2 }]);
  assert.deepEqual(removeById([{ id: 1 }], 9), [{ id: 1 }]);
});

test("help lines are plain", () => {
  assert.equal(helpLine({ answer: "yes", timer: 12 }), "Working with a 12-minute countdown: helped");
  assert.equal(helpLine({ answer: "bit", timer: 0 }), "Working with no countdown: helped a bit");
  assert.equal(helpLine({ answer: "no", timer: 25 }), "Working with a 25-minute countdown: did not help");
});

test("plural and shortDate", () => {
  assert.equal(plural(1, "step", "steps"), "1 step");
  assert.equal(plural(2, "step", "steps"), "2 steps");
  assert.equal(shortDate("nope"), "");
  assert.match(shortDate("2026-11-20T12:00:00"), /^Nov 20$/);
});

test("counts: done and drifted both count as finished; old and future entries are left out", () => {
  const moments = [
    { id: 1, kind: "done", date: ago(1) },
    { id: 2, kind: "drifted", date: ago(2) },
    { id: 3, kind: "done", date: ago(40) },
    { id: 4, kind: "done", date: new Date(NOW + DAY_MS).toISOString() },
    { id: 5, kind: "done", date: "" },
  ];
  const c = countsFor({ moments }, NOW, 30);
  assert.equal(c.finished, 2);
  assert.equal(c.madeSmaller, 1);
  assert.equal(countsFor({ moments }, NOW, 7).finished, 2);
  assert.equal(countsFor({ moments }, NOW, 1).finished, 0);
});

test("doing lines: zero lines are left out, singular reads right, nothing for no data", () => {
  assert.deepEqual(doingLines({}, NOW), []);
  const lines = doingLines({ moments: [{ id: 1, kind: "done", date: ago(1) }], parked: [{ id: 1, text: "a", date: ago(1) }] }, NOW);
  assert.deepEqual(lines, ["1 step finished", "1 thought parked for later"]);
});

test("a gap of weeks changes nothing but the counts: no streak, no missed days", () => {
  const lines = weeklyLines({ moments: [{ id: 1, kind: "done", date: ago(60) }] }, NOW);
  assert.deepEqual(lines, ["A quiet week. One small step is a fine place to start, whenever you like."]);
});

test("weekly lines are fixed text from the student's own week", () => {
  const data = {
    moments: [{ id: 1, kind: "done", date: ago(1) }, { id: 2, kind: "drifted", date: ago(2) }, { id: 3, kind: "done", date: ago(3) }],
    helps: [
      { id: 1, answer: "yes", timer: 12, date: ago(1) },
      { id: 2, answer: "bit", timer: 12, date: ago(2) },
      { id: 3, answer: "yes", timer: 0, date: ago(2) },
      { id: 4, answer: "yes", timer: 25, date: ago(30) },
    ],
    parked: [{ id: 1, text: "song", date: ago(1) }],
    recall: [{ id: 1, answer: "x", date: ago(1) }],
  };
  assert.deepEqual(weeklyLines(data, NOW), [
    "You finished 3 steps.",
    "1 step started big and got smaller. That counts too.",
    "Working with a 12-minute countdown helped 2 times.",
    "You set 1 thought aside to come back to.",
    "You wrote down 1 thing you learned, in your own words.",
  ]);
});

test("only 'no' marks give one neutral line; ties pick the shorter length", () => {
  const no = weeklyLines({ helps: [{ id: 1, answer: "no", timer: 12, date: ago(1) }] }, NOW);
  assert.deepEqual(no, ["Some ways of working did not help. That is useful to know."]);
  const tie = weeklyLines({ helps: [{ id: 1, answer: "yes", timer: 25, date: ago(1) }, { id: 2, answer: "yes", timer: 12, date: ago(1) }] }, NOW);
  assert.deepEqual(tie, ["Working with a 12-minute countdown helped once."]);
});

test("no wording says miss, late, behind, streak, grade or score as a judgement", () => {
  const data = {
    moments: [{ id: 1, kind: "drifted", date: ago(1) }],
    helps: [{ id: 1, answer: "no", timer: 0, date: ago(1) }],
    parked: [{ id: 1, text: "a", date: ago(1) }],
    recall: [{ id: 1, answer: "a", date: ago(1) }],
  };
  const all = [...weeklyLines(data, NOW), ...weeklyLines({}, NOW), ...doingLines(data, NOW), helpLine({ answer: "no", timer: 0 })].join(" ");
  assert.doesNotMatch(all, /\b(missed|late|behind|streak|failed|only|grade[sd]?|score)\b/i);
});
