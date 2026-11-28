import { test } from "node:test";
import assert from "node:assert/strict";
import {
  asksRecall, addParked, addRecall, removeItem, normalizeParked, normalizeRecall,
  showAskPerson, buildQuestion, hasOwnWords, MAX_PARKED, MAX_PARKED_LENGTH, MAX_RECALL,
} from "../../js/logic/work-extras.js";
import { saveParked, loadParked, saveRecall, loadRecall, STORAGE_KEY, BACKUP_KEY } from "../../js/storage.js";

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    _data: data,
  };
}

const NOW = "2026-11-28T10:00:00.000Z";

test("recall is asked after reading and studying only", () => {
  assert.equal(asksRecall("reading"), true);
  assert.equal(asksRecall("test-prep"), true);
  assert.equal(asksRecall("essay"), false);
  assert.equal(asksRecall(undefined), false);
  assert.equal(asksRecall(null), false);
});

test("a parked thought goes first; blank and spaces-only are ignored", () => {
  let items = addParked([], "  look up that song ", NOW);
  assert.equal(items.length, 1);
  assert.equal(items[0].text, "look up that song");
  items = addParked(items, "ask mum about Friday", NOW);
  assert.equal(items[0].text, "ask mum about Friday");
  assert.notEqual(items[0].id, items[1].id);
  const same = addParked(items, "   ", NOW);
  assert.equal(same, items);
});

test("parked thoughts are capped in length and count", () => {
  const long = addParked([], "x".repeat(MAX_PARKED_LENGTH + 50), NOW);
  assert.equal(long[0].text.length, MAX_PARKED_LENGTH);
  let items = [];
  for (let i = 0; i < MAX_PARKED + 5; i += 1) items = addParked(items, `t${i}`, NOW);
  assert.equal(items.length, MAX_PARKED);
  assert.equal(items[0].text, `t${MAX_PARKED + 4}`);
});

test("removing one parked thought keeps the rest", () => {
  const items = addParked(addParked([], "a", NOW), "b", NOW);
  const left = removeItem(items, items[0].id);
  assert.deepEqual(left.map((i) => i.text), ["a"]);
  assert.deepEqual(removeItem(items, 999), items);
});

test("a recall answer is the student's own words, with the step id when known", () => {
  const items = addRecall([], " the water cycle ", 3, NOW);
  assert.equal(items[0].answer, "the water cycle");
  assert.equal(items[0].stepId, 3);
  assert.equal("stepId" in addRecall([], "x", undefined, NOW)[0], false);
  assert.equal(addRecall(items, "", 3, NOW), items);
  let many = [];
  for (let i = 0; i < MAX_RECALL + 3; i += 1) many = addRecall(many, `a${i}`, 1, NOW);
  assert.equal(many.length, MAX_RECALL);
});

test("damaged saved lists drop bad items one by one", () => {
  assert.deepEqual(normalizeParked(null), []);
  assert.deepEqual(normalizeParked("nope"), []);
  assert.deepEqual(normalizeParked({ a: 1 }), []);
  const good = { id: 2, text: "keep me", date: NOW };
  const out = normalizeParked([null, 5, { id: "x", text: "a" }, { id: 1, text: "" }, { id: 1, text: 7 }, good, { ...good, text: "dup" }, { id: 3, text: "no date", date: "garbage" }]);
  assert.deepEqual(out.map((i) => i.text), ["keep me", "no date"]);
  assert.equal(out[1].date, "");
  assert.deepEqual(normalizeRecall([{ id: 1, answer: "ok", stepId: "bad" }, { id: 2 }, undefined]), [{ id: 1, answer: "ok", date: "" }]);
});

test("Ask a person shows after two hints, or after the last hint", () => {
  assert.equal(showAskPerson(0, 5), false);
  assert.equal(showAskPerson(1, 5), false);
  assert.equal(showAskPerson(2, 5), true);
  assert.equal(showAskPerson(1, 1), true);
  assert.equal(showAskPerson(0, 0), false);
});

test("the question uses only the student's words and is empty when all boxes are blank", () => {
  assert.equal(buildQuestion({}), "");
  assert.equal(buildQuestion({ on: "  ", tried: "", dontGet: "\n" }), "");
  assert.equal(buildQuestion({ on: "Read ch 3", tried: "", dontGet: "the second part" }), "I'm on: Read ch 3\nI don't get: the second part");
  assert.equal(buildQuestion({ on: "a", tried: "b", dontGet: "c" }), "I'm on: a\nI tried: b\nI don't get: c");
  assert.equal(hasOwnWords({ tried: "", dontGet: "" }), false);
  assert.equal(hasOwnWords({ tried: "x" }), true);
});

test("parked thoughts and recall answers save, reload, and survive damaged data", () => {
  const storage = fakeStorage();
  const parked = addParked([], "song", NOW);
  assert.equal(saveParked(parked, storage), true);
  assert.deepEqual(loadParked(storage), parked);
  const recall = addRecall([], "mitosis", 1, NOW);
  assert.equal(saveRecall(recall, storage), true);
  assert.deepEqual(loadRecall(storage), recall);
  assert.deepEqual(loadParked(storage), parked); // the other section is kept
  const damaged = fakeStorage({ [STORAGE_KEY]: "{oops" });
  assert.deepEqual(loadParked(damaged), []);
  assert.deepEqual(loadRecall(damaged), []);
  assert.equal(saveParked(parked, damaged), true);
  assert.equal(damaged._data.get(BACKUP_KEY), "{oops");
  const junk = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ schemaVersion: 1, parked: "string", recall: [1, null] }) });
  assert.deepEqual(loadParked(junk), []);
  assert.deepEqual(loadRecall(junk), []);
  assert.deepEqual(loadParked(null), []);
  assert.equal(saveParked([], storage), true);
  assert.deepEqual(loadParked(storage), []);
});
