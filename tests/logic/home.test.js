import { test } from "node:test";
import assert from "node:assert/strict";
import { pickupLine, listLabel } from "../../js/logic/home.js";
import { normalizeWork, createWork, MAX_SAVED_STEPS } from "../../js/logic/work.js";
import { loadWork, saveWork, saveProfile, loadProfileState, STORAGE_KEY } from "../../js/storage.js";
import { emptyProfile, setGoals } from "../../js/logic/profile.js";

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    _data: data,
  };
}

const NOW = new Date(2026, 10, 17, 15, 0);

test("the same day says pick up; a later day says welcome back, with no day count", () => {
  const sameDay = new Date(2026, 10, 17, 9, 0).toISOString();
  const weekAgo = new Date(2026, 10, 10, 9, 0).toISOString();
  assert.equal(pickupLine(sameDay, NOW), "Pick up where you left off.");
  assert.equal(pickupLine(weekAgo, NOW), "Welcome back. Pick up where you left off.");
  assert.ok(!/\d+ days?|missed|away/.test(pickupLine(weekAgo, NOW)));
});

test("a missing or garbled time stamp falls back to the plain line", () => {
  assert.equal(pickupLine(null, NOW), "Pick up where you left off.");
  assert.equal(pickupLine("not a date", NOW), "Pick up where you left off.");
});

test("list labels tick finished steps and mark the next one", () => {
  assert.equal(listLabel({ text: "A", done: true }, false), "✓ A");
  assert.equal(listLabel({ text: "B", done: false }, true), "B (next)");
  assert.equal(listLabel({ text: "C", done: false }, false), "C");
});

test("saved steps with bad entries keep only the good ones", () => {
  const work = normalizeWork({
    steps: [
      { id: 0, text: "Good", done: true },
      { id: 0, text: "Duplicate id", done: false },
      { id: 1, text: "   ", done: false },
      { id: "2", text: "Wrong id type", done: false },
      null,
      { id: 3, text: "Also good", done: "yes" },
    ],
    nextId: 1,
  });
  assert.deepEqual(work.steps, [
    { id: 0, text: "Good", done: true },
    { id: 3, text: "Also good", done: false },
  ]);
  assert.equal(work.nextId, 4, "next id is moved past the highest id");
});

test("nothing usable saved gives null, and non-objects do not crash", () => {
  assert.equal(normalizeWork(undefined), null);
  assert.equal(normalizeWork("text"), null);
  assert.equal(normalizeWork({ steps: "nope" }), null);
  assert.equal(normalizeWork({ steps: [] }), null);
});

test("very many or very long saved steps are cut down", () => {
  const steps = Array.from({ length: 500 }, (_, i) => ({ id: i, text: "x".repeat(900), done: false }));
  const work = normalizeWork({ steps, nextId: 500 });
  assert.equal(work.steps.length, MAX_SAVED_STEPS);
  assert.equal(work.steps[0].text.length, 500);
});

test("steps are saved, come back, and carry the time stamp", () => {
  const storage = fakeStorage();
  const work = createWork(["One", "Two"]);
  assert.equal(saveWork(work, "2026-11-10T09:00:00.000Z", storage), true);
  const loaded = loadWork(storage);
  assert.deepEqual(loaded.work.steps.map((s) => s.text), ["One", "Two"]);
  assert.equal(loaded.savedOn, "2026-11-10T09:00:00.000Z");
});

test("saving steps keeps the profile, and saving the profile keeps the steps", () => {
  const storage = fakeStorage();
  saveProfile(setGoals(emptyProfile(), { today: "Read" }), storage);
  saveWork(createWork(["One"]), undefined, storage);
  assert.equal(loadProfileState(storage).profile.goals.today, "Read");
  saveProfile(setGoals(emptyProfile(), { today: "Write" }), storage);
  assert.equal(loadWork(storage).work.steps[0].text, "One");
});

test("clearing the steps removes only the steps", () => {
  const storage = fakeStorage();
  saveProfile(setGoals(emptyProfile(), { today: "Read" }), storage);
  saveWork(createWork(["One"]), undefined, storage);
  assert.equal(saveWork(null, undefined, storage), true);
  assert.equal(loadWork(storage).work, null);
  assert.equal(loadProfileState(storage).profile.goals.today, "Read");
});

test("damaged or missing saved data gives no steps, and no storage never throws", () => {
  assert.equal(loadWork(fakeStorage({ [STORAGE_KEY]: "{broken" })).work, null);
  assert.equal(loadWork(fakeStorage()).work, null);
  assert.equal(loadWork(null).work, null);
  assert.equal(saveWork(createWork(["One"]), undefined, null), false);
});
