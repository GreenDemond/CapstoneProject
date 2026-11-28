import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LENGTHS, offers, offeredAnswers, target, addBlockAnswer, normalizeBlockAnswers, suggestedLength, shouldAsk,
  cleanDoneWhen, setDoneWhen, MAX_DONE_WHEN_LENGTH, MAX_BLOCK_ANSWERS,
} from "../../js/logic/block-length.js";
import { createWork, normalizeWork, driftStart } from "../../js/logic/work.js";
import { splitParts } from "../../js/logic/step-editor.js";
import { saveBlockAnswers, loadBlockAnswers, STORAGE_KEY, deleteRemembered } from "../../js/storage.js";

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    _data: data,
  };
}

const NOW = Date.parse("2026-11-28T10:00:00.000Z");
const dayAgo = (n) => new Date(NOW - n * 86400000).toISOString();

function many(minutes, answer, days) {
  let items = [];
  for (const d of days) items = addBlockAnswer(items, minutes, answer, dayAgo(d));
  return items;
}

test("only the two web lengths exist, and 5 is not one of them", () => {
  assert.deepEqual(LENGTHS, [12, 25]);
});

test("Shorter is not offered at the shortest length, Longer not at the longest", () => {
  assert.deepEqual(offeredAnswers(12), ["aboutRight", "longer"]);
  assert.deepEqual(offeredAnswers(25), ["shorter", "aboutRight"]);
  assert.equal(offers("shorter", 12), false);
  assert.equal(offers("longer", 25), false);
  assert.equal(offers("longer", 7), false);
  assert.equal(offers("bogus", 12), false);
});

test("target gives the neighbouring length or null", () => {
  assert.equal(target(25, "shorter"), 12);
  assert.equal(target(12, "longer"), 25);
  assert.equal(target(12, "shorter"), null);
  assert.equal(target(12, "aboutRight"), null);
  assert.equal(target(9, "longer"), null);
});

test("adding an answer puts it first and refuses answers that are not offered or have bad dates", () => {
  let items = addBlockAnswer([], 12, "longer", dayAgo(1));
  items = addBlockAnswer(items, 25, "shorter", dayAgo(0));
  assert.equal(items[0].minutes, 25);
  assert.equal(items.length, 2);
  assert.equal(addBlockAnswer(items, 12, "shorter", dayAgo(0)), items);
  assert.equal(addBlockAnswer(items, 12, "longer", "not a date"), items);
  assert.equal(addBlockAnswer(items, 12, "longer", undefined), items);
});

test("the list is capped", () => {
  let items = [];
  for (let i = 0; i < MAX_BLOCK_ANSWERS + 10; i += 1) items = addBlockAnswer(items, 12, "aboutRight", dayAgo(0));
  assert.equal(items.length, MAX_BLOCK_ANSWERS);
});

test("three 'too short' answers at 12 point to 25", () => {
  assert.equal(suggestedLength(many(12, "longer", [1, 2, 3]), NOW), 25);
});

test("three 'too long' answers at 25 point to 12", () => {
  assert.equal(suggestedLength(many(25, "shorter", [1, 2, 3]), NOW), 12);
});

test("two answers are not enough, and one answer the other way blocks it", () => {
  assert.equal(suggestedLength(many(12, "longer", [1, 2]), NOW), null);
  let items = many(12, "longer", [1, 2, 3, 4]);
  items = addBlockAnswer(items, 12, "shorter", dayAgo(0));
  assert.equal(items.length, 4);
  // 'shorter' is not offered at 12, so it was refused: still points to 25
  assert.equal(suggestedLength(items, NOW), 25);
  // an about-right answer in the newest five does not block, but pushes one out
  const withRight = addBlockAnswer(many(12, "longer", [2, 3, 4]), 12, "aboutRight", dayAgo(1));
  assert.equal(suggestedLength(withRight, NOW), 25);
});

test("answers older than 30 days do not count", () => {
  assert.equal(suggestedLength(many(12, "longer", [31, 32, 33]), NOW), null);
  assert.equal(suggestedLength(many(12, "longer", [1, 2, 40]), NOW), null);
});

test("answers dated far in the future do not count", () => {
  assert.equal(suggestedLength(many(12, "longer", [-10, -11, -12]), NOW), null);
});

test("when two lengths point somewhere, the newest answer wins", () => {
  const a = many(12, "longer", [5, 6, 7]);
  const b = many(25, "shorter", [1, 2, 3]);
  assert.equal(suggestedLength([...a, ...b], NOW), 12);
  const c = many(25, "shorter", [8, 9, 10]);
  assert.equal(suggestedLength([...a, ...c], NOW), 25);
});

test("suggestedLength survives junk", () => {
  assert.equal(suggestedLength(null, NOW), null);
  assert.equal(suggestedLength("x", NOW), null);
  assert.equal(suggestedLength([null, 5, { minutes: 12 }], NOW), null);
  assert.equal(suggestedLength([], NOW), null);
});

test("normalizeBlockAnswers drops bad entries one by one", () => {
  const raw = [
    { minutes: 12, answer: "longer", on: dayAgo(1) },
    { minutes: 12, answer: "shorter", on: dayAgo(1) },
    { minutes: 99, answer: "longer", on: dayAgo(1) },
    { minutes: 25, answer: "shorter", on: "nope" },
    null,
    "text",
    { minutes: 25, answer: "shorter", on: dayAgo(2), extra: "x" },
  ];
  const clean = normalizeBlockAnswers(raw);
  assert.equal(clean.length, 2);
  assert.deepEqual(Object.keys(clean[1]).sort(), ["answer", "minutes", "on"]);
  assert.deepEqual(normalizeBlockAnswers("nope"), []);
  assert.deepEqual(normalizeBlockAnswers(undefined), []);
});

test("the question is only raised soon after the countdown ended", () => {
  assert.equal(shouldAsk(1000, 999), false);
  assert.equal(shouldAsk(1000, 1000), true);
  assert.equal(shouldAsk(1000, 1000 + 120000), true);
  assert.equal(shouldAsk(1000, 1000 + 120001), false);
});

test("answers save, load, and damaged storage loads as empty", () => {
  const storage = fakeStorage();
  const items = many(12, "longer", [1, 2, 3]);
  assert.equal(saveBlockAnswers(items, storage), true);
  assert.equal(loadBlockAnswers(storage).length, 3);
  storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, blocks: "garbage" }));
  assert.deepEqual(loadBlockAnswers(storage), []);
  storage.setItem(STORAGE_KEY, "{not json");
  assert.deepEqual(loadBlockAnswers(storage), []);
  assert.deepEqual(loadBlockAnswers(null), []);
});

test("deleteRemembered clears the answers too", () => {
  const storage = fakeStorage();
  saveBlockAnswers(many(12, "longer", [1, 2, 3]), storage);
  assert.equal(deleteRemembered(storage), true);
  assert.deepEqual(loadBlockAnswers(storage), []);
});

test("done-when lines are tidied and cut", () => {
  assert.equal(cleanDoneWhen("  I have\n  three   notes "), "I have three notes");
  assert.equal(cleanDoneWhen("   "), "");
  assert.equal(cleanDoneWhen(null), "");
  assert.equal(cleanDoneWhen(42), "");
  assert.equal(cleanDoneWhen("x".repeat(500)).length, MAX_DONE_WHEN_LENGTH);
});

test("setDoneWhen sets, changes and clears one step only", () => {
  const work = createWork(["a b c d", "e f g h"]);
  const set = setDoneWhen(work, 1, " page is full ");
  assert.equal(set.steps[1].doneWhen, "page is full");
  assert.equal("doneWhen" in set.steps[0], false);
  assert.equal("doneWhen" in work.steps[1], false); // input not changed
  const cleared = setDoneWhen(set, 1, "   ");
  assert.equal("doneWhen" in cleared.steps[1], false);
  const unknown = setDoneWhen(set, 77, "zzz");
  assert.deepEqual(unknown.steps, set.steps);
});

test("saved steps keep a done-when line, and tolerate a missing or damaged one", () => {
  const raw = {
    steps: [
      { id: 0, text: "one", done: false, doneWhen: "  five lines " },
      { id: 1, text: "two", done: false },
      { id: 2, text: "three", done: false, doneWhen: { bad: true } },
      { id: 3, text: "four", done: false, doneWhen: "y".repeat(400) },
    ],
    nextId: 4,
  };
  const work = normalizeWork(raw);
  assert.equal(work.steps[0].doneWhen, "five lines");
  assert.equal("doneWhen" in work.steps[1], false);
  assert.equal("doneWhen" in work.steps[2], false);
  assert.equal(work.steps[3].doneWhen.length, MAX_DONE_WHEN_LENGTH);
});

test("Drifted starts with the first part of a long step, cut like Change my steps", () => {
  const text = "Find three sources and then read the first one";
  const parts = splitParts(text);
  assert.ok(parts);
  assert.equal(driftStart(text), parts[0]);
  assert.notEqual(driftStart(text), text);
  assert.equal(driftStart("Take notes"), "Take notes");
  assert.equal(driftStart(""), "");
});

test("each saved answer has a plain line, and one can be removed by place", async () => {
  const { blockAnswerLine, removeBlockAnswerAt } = await import("../../js/logic/block-length.js");
  assert.equal(blockAnswerLine({ minutes: 25, answer: "shorter" }), "25 minutes felt too long");
  assert.equal(blockAnswerLine({ minutes: 12, answer: "longer" }), "12 minutes felt too short");
  assert.equal(blockAnswerLine({ minutes: 12, answer: "aboutRight" }), "12 minutes felt about right");
  const items = [1, 2, 3].map((n) => ({ minutes: 25, answer: "shorter", on: `2026-11-0${n}T10:00:00.000Z` }));
  assert.deepEqual(removeBlockAnswerAt(items, 1).map((i) => i.on[9]), ["1", "3"]);
  assert.equal(removeBlockAnswerAt(items, 7), items);
  assert.equal(removeBlockAnswerAt(items, -1), items);
  assert.equal(removeBlockAnswerAt(items, "1"), items);
});

test("deleting an answer changes the suggestion at once", async () => {
  const { removeBlockAnswerAt } = await import("../../js/logic/block-length.js");
  const items = many(25, "shorter", [1, 2, 3]);
  assert.equal(suggestedLength(items, NOW), 12);
  assert.equal(suggestedLength(removeBlockAnswerAt(items, 0), NOW), null);
});
