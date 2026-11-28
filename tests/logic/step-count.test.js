import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STEP_COUNTS,
  DEFAULT_PICKED_COUNT,
  normalizeStepCount,
  normalizeStepTipsHidden,
  STEP_TIPS_TITLE,
  STEP_TIPS_LINES,
} from "../../js/logic/step-count.js";
import { starterStepsFor, KINDS, showingLine } from "../../js/logic/starter-steps.js";
import { loadStepTipsHidden, saveStepTipsHidden, saveWork, loadWork, saveProfile, loadProfileState, STORAGE_KEY } from "../../js/storage.js";
import { emptyProfile, setGoals } from "../../js/logic/profile.js";

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    _data: data,
  };
}

test("the choices are 3, 5 and 8, and 5 is the default", () => {
  assert.deepEqual(STEP_COUNTS, [3, 5, 8]);
  assert.equal(DEFAULT_PICKED_COUNT, 5);
});

test("normalizeStepCount keeps 3, 5, 8 (number or text) and falls back to 5 for anything else", () => {
  assert.equal(normalizeStepCount(3), 3);
  assert.equal(normalizeStepCount("8"), 8);
  assert.equal(normalizeStepCount(" 3 "), 3);
  for (const bad of [4, 0, -3, 5.5, "", "abc", null, undefined, NaN, {}, [], "3x", true]) {
    assert.equal(normalizeStepCount(bad), 5, String(bad));
  }
});

test("every kind has at least 7 starter steps: 3 and 5 are met, 8 gives what exists (the label says About)", () => {
  for (const kind of KINDS) {
    const all = starterStepsFor(kind.id, "Do the work.");
    assert.ok(all.length >= 7, kind.id);
    assert.equal(all.slice(0, 3).length, 3);
    assert.equal(all.slice(0, 5).length, 5);
    assert.equal(all.slice(0, 8).length, all.length >= 8 ? 8 : all.length);
  }
});

test("showing fewer than the total says how to get the rest; showing all says nothing", () => {
  assert.equal(showingLine(3, 7), "Showing 3 of 7. Show more steps adds the rest.");
  assert.equal(showingLine(7, 7), "");
});

test("the card words are fixed, short, and carry no shaming or medical words", () => {
  assert.equal(STEP_TIPS_TITLE, "What makes a step easy to start");
  assert.equal(STEP_TIPS_LINES.length, 3);
  const all = [STEP_TIPS_TITLE, ...STEP_TIPS_LINES].join(" ").toLowerCase();
  for (const word of ["adhd", "fail", "wrong", "missed", "lazy", "should", "must", "treat", "attention"]) {
    assert.ok(!all.includes(word), word);
  }
});

test("normalizeStepTipsHidden counts only a real true", () => {
  assert.equal(normalizeStepTipsHidden(true), true);
  for (const bad of [false, "true", 1, "yes", null, undefined, {}, []]) {
    assert.equal(normalizeStepTipsHidden(bad), false, String(bad));
  }
});

test("the card is shown at first, Got it is remembered, and showing it again is remembered", () => {
  const storage = fakeStorage();
  assert.equal(loadStepTipsHidden(storage), false);
  assert.equal(saveStepTipsHidden(true, storage), true);
  assert.equal(loadStepTipsHidden(storage), true);
  assert.equal(saveStepTipsHidden(false, storage), true);
  assert.equal(loadStepTipsHidden(storage), false);
});

test("a damaged or older tips value loads as shown, and an unreadable store does not crash", () => {
  for (const bad of ["yes", 1, null, [], { stepTipsHidden: "true" }, { stepTipsHidden: 1 }]) {
    const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ schemaVersion: 1, tips: bad }) });
    assert.equal(loadStepTipsHidden(storage), false);
  }
  const older = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ schemaVersion: 1 }) });
  assert.equal(loadStepTipsHidden(older), false);
  assert.equal(loadStepTipsHidden(fakeStorage({ [STORAGE_KEY]: "{not json" })), false);
  assert.equal(loadStepTipsHidden(null), false);
});

test("saving the tips setting keeps the other sections and they keep it", () => {
  const storage = fakeStorage();
  saveProfile(setGoals(emptyProfile(), { today: "Read" }), storage);
  saveWork({ steps: [{ id: 1, text: "A step", done: false }], nextId: 2 }, "2026-11-27T10:00:00.000Z", storage);
  saveStepTipsHidden(true, storage);
  assert.equal(loadProfileState(storage).profile.goals.today, "Read");
  assert.equal(loadWork(storage).work.nextId, 2);
  saveProfile(setGoals(emptyProfile(), { today: "Write" }), storage);
  assert.equal(loadStepTipsHidden(storage), true);
});
