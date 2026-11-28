import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeClassLabel, classLine, CLASS_LABEL_MAX } from "../../js/logic/class-label.js";
import {
  normalizeHandledOn, lookbackCardState, thoughtsToShow, WEEK_MS, MAX_THOUGHTS_SHOWN,
  LOOKBACK_CARD_LINE, LOOKBACK_OPEN_LABEL, LOOKBACK_LATER_LABEL, THOUGHTS_HEADING, THOUGHTS_HINT, ALL_DONE_LINE, CLOSE_APP_LINE,
} from "../../js/logic/return-visit.js";
import { normalizeWork, createWork } from "../../js/logic/work.js";
import { loadWork, saveWork, loadLookbackCardDate, saveLookbackCardDate, STORAGE_KEY } from "../../js/storage.js";
import { parseBackup, FILE_APP, FILE_VERSION } from "../../js/logic/backup.js";

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

const NOW = Date.parse("2026-12-10T12:00:00.000Z");

// ---- class label ----

test("class label: trimmed, one space between words, cut to 40", () => {
  assert.equal(normalizeClassLabel("  History  "), "History");
  assert.equal(normalizeClassLabel("AP   World\n History"), "AP World History");
  assert.equal(normalizeClassLabel("x".repeat(100)), "x".repeat(CLASS_LABEL_MAX));
  assert.equal(normalizeClassLabel("a".repeat(39) + " b"), "a".repeat(39));
});

test("class label: blank, spaces and non-text mean no label", () => {
  for (const bad of ["", "   ", "\n\t", null, undefined, 5, {}, [], true]) {
    assert.equal(normalizeClassLabel(bad), "");
    assert.equal(classLine(bad), "");
  }
});

test("class label line says Class and the student's words, unchanged", () => {
  assert.equal(classLine("History"), "Class: History");
  assert.equal(classLine("<b>Art</b>"), "Class: <b>Art</b>");
});

test("a saved assignment keeps its class label and an older one loads with none", () => {
  const storage = fakeStorage();
  const work = { ...createWork(["Read"]), classLabel: "History" };
  assert.equal(saveWork(work, "2026-12-10T10:00:00.000Z", storage), true);
  assert.equal(loadWork(storage).work.classLabel, "History");
  saveWork(createWork(["Read"]), undefined, storage);
  assert.equal("classLabel" in loadWork(storage).work, false);
});

test("a damaged class label in saved work is dropped and the steps are kept", () => {
  for (const bad of [5, null, {}, "   ", ["x"]]) {
    const work = normalizeWork({ steps: [{ id: 0, text: "Read", done: false }], nextId: 1, classLabel: bad });
    assert.equal(work.steps.length, 1);
    assert.equal("classLabel" in work, false);
  }
  const long = normalizeWork({ steps: [{ id: 0, text: "Read", done: false }], nextId: 1, classLabel: "y".repeat(500) });
  assert.equal(long.classLabel.length, CLASS_LABEL_MAX);
});

test("a saved copy keeps the class label and the check cuts a long one", () => {
  const copy = {
    app: FILE_APP,
    fileVersion: FILE_VERSION,
    data: { work: { steps: [{ id: 0, text: "Read", done: false }], nextId: 1, classLabel: "z".repeat(90), savedOn: "2026-12-10T10:00:00.000Z" } },
  };
  const parsed = parseBackup(JSON.stringify(copy));
  assert.equal(parsed.sections.work.classLabel.length, CLASS_LABEL_MAX);
  copy.data.work.classLabel = "History";
  assert.equal(parseBackup(JSON.stringify(copy)).sections.work.classLabel, "History");
});

// ---- weekly card timing ----

test("no saved date: no card, and the clock starts", () => {
  for (const none of ["", undefined, null, 5, {}, "not a date"]) {
    assert.deepEqual(lookbackCardState(none, NOW), { show: false, startClock: true });
  }
});

test("a date in the future counts as unusable, so the card never hides for ever", () => {
  const future = new Date(NOW + 3 * 86400000).toISOString();
  assert.equal(normalizeHandledOn(future, NOW), "");
  assert.deepEqual(lookbackCardState(future, NOW), { show: false, startClock: true });
});

test("the card shows at exactly seven days and not before", () => {
  const sevenAgo = new Date(NOW - WEEK_MS).toISOString();
  const justUnder = new Date(NOW - WEEK_MS + 1000).toISOString();
  assert.deepEqual(lookbackCardState(sevenAgo, NOW), { show: true, startClock: false });
  assert.deepEqual(lookbackCardState(justUnder, NOW), { show: false, startClock: false });
  assert.deepEqual(lookbackCardState(new Date(NOW).toISOString(), NOW), { show: false, startClock: false });
});

test("a long time away still gives one plain card, and the state holds no day count", () => {
  const state = lookbackCardState(new Date(NOW - 400 * 86400000).toISOString(), NOW);
  assert.deepEqual(state, { show: true, startClock: false });
});

test("the card date is saved on the device and damaged values load as none", () => {
  const storage = fakeStorage();
  const iso = new Date(NOW - 1000).toISOString();
  assert.equal(saveLookbackCardDate(iso, storage), true);
  assert.equal(loadLookbackCardDate(NOW, storage), iso);
  for (const bad of ["{", JSON.stringify({ schemaVersion: 1, lookbackCard: "x" }), JSON.stringify({ schemaVersion: 1, lookbackCard: { on: 12 } }), JSON.stringify({ schemaVersion: 1, lookbackCard: { on: "zzz" } })]) {
    assert.equal(loadLookbackCardDate(NOW, fakeStorage({ [STORAGE_KEY]: bad })), "");
  }
  assert.equal(loadLookbackCardDate(NOW, null), "");
});

test("saving the card date keeps the saved steps", () => {
  const storage = fakeStorage();
  saveWork(createWork(["Read"]), undefined, storage);
  saveLookbackCardDate(new Date(NOW).toISOString(), storage);
  assert.equal(loadWork(storage).work.steps.length, 1);
});

// ---- thoughts ----

test("thoughts: the newest few, plain text, bad items skipped", () => {
  const parked = [{ id: 5, text: "first" }, { id: 4, text: "  " }, null, { id: 3, text: 7 }, { id: 2, text: "second" }, { id: 1, text: "third" }, { id: 0, text: "fourth" }];
  const shown = thoughtsToShow(parked);
  assert.deepEqual(shown.map((t) => t.text), ["first", "second", "third"]);
  assert.equal(shown.length <= MAX_THOUGHTS_SHOWN, true);
  assert.deepEqual(thoughtsToShow(undefined), []);
  assert.deepEqual(thoughtsToShow("nope"), []);
  assert.deepEqual(thoughtsToShow([]), []);
});

// ---- words ----

test("the words never shame, count days away, or mention a diagnosis", () => {
  const words = [LOOKBACK_CARD_LINE, LOOKBACK_OPEN_LABEL, LOOKBACK_LATER_LABEL, THOUGHTS_HEADING, THOUGHTS_HINT, ALL_DONE_LINE, CLOSE_APP_LINE].join(" ");
  assert.doesNotMatch(words, /\d|missed|behind|overdue|days|late|failed|adhd|focus|attention/i);
  assert.equal(CLOSE_APP_LINE, "A good time to close the app.");
  assert.equal(LOOKBACK_CARD_LINE, "A quick look back at your week");
});
