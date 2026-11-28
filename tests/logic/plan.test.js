import { test } from "node:test";
import assert from "node:assert/strict";
import { planSteps, savedThoughts, STEPS_EMPTY, THOUGHT_ASK } from "../../js/logic/plan.js";
import { chooseBack } from "../../js/logic/tabs.js";
import { importSections, loadWelcomeSeen, saveWelcomeSeen, STORAGE_KEY } from "../../js/storage.js";

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

test("planSteps lists every step in order with a done flag", () => {
  const work = { steps: [{ id: 0, text: " Read ", done: true }, { id: 1, text: "Write", done: false }] };
  assert.deepEqual(planSteps(work), [{ text: "Read", done: true }, { text: "Write", done: false }]);
});

test("planSteps survives missing, damaged and odd data", () => {
  assert.deepEqual(planSteps(null), []);
  assert.deepEqual(planSteps({}), []);
  assert.deepEqual(planSteps({ steps: "no" }), []);
  assert.deepEqual(planSteps({ steps: [null, 4, { text: 5 }, { text: "  " }, { text: "ok", done: "yes" }] }), [{ text: "ok", done: false }]);
});

test("planSteps shows at most 100 steps and keeps very long text whole", () => {
  const steps = Array.from({ length: 150 }, (_, i) => ({ id: i, text: "x".repeat(2000), done: false }));
  const shown = planSteps({ steps });
  assert.equal(shown.length, 100);
  assert.equal(shown[0].text.length, 2000);
});

test("savedThoughts merges parked and recall, newest first, with separate keys", () => {
  const parked = [{ id: 1, text: "old idea", date: "2026-01-01T10:00:00Z" }, { id: 2, text: "new idea", date: "2026-03-01T10:00:00Z" }];
  const recall = [{ id: 1, answer: "middle answer", date: "2026-02-01T10:00:00Z" }];
  const rows = savedThoughts(parked, recall);
  assert.deepEqual(rows.map((r) => r.text), ["new idea", "middle answer", "old idea"]);
  assert.deepEqual(rows.map((r) => r.key), ["p2", "r1", "p1"]);
  assert.deepEqual(rows.map((r) => r.kind), ["parked", "recall", "parked"]);
});

test("savedThoughts skips unusable items and puts undated ones last", () => {
  const rows = savedThoughts(
    [{ id: 1, text: "no date", date: "" }, { id: "x", text: "bad id" }, { id: 2, text: "   " }, null, { id: 3, text: "dated", date: "2026-05-05T00:00:00Z" }],
    [{ id: 1, answer: 7 }, { id: 2, answer: "bad date", date: "nonsense" }],
  );
  assert.deepEqual(rows.map((r) => r.text), ["dated", "no date", "bad date"]);
  assert.deepEqual(savedThoughts(null, undefined), []);
  assert.deepEqual(savedThoughts("a", {}), []);
});

test("the wording lines carry no counts and no blame", () => {
  assert.equal(STEPS_EMPTY, "No steps yet.");
  assert.equal(THOUGHT_ASK, "Take this one out?");
});

test("chooseBack prefers Back to home, then the first Back, else nothing", () => {
  assert.deepEqual(chooseBack([{ text: "Save" }, { text: " Back to home " }, { text: "Back to What I did" }]), { index: 1, home: true });
  assert.deepEqual(chooseBack([{ text: "Delete all" }, { text: "Back to What I did" }]), { index: 1, home: false });
  assert.deepEqual(chooseBack([{ text: "Back" }]), { index: 0, home: false });
  assert.equal(chooseBack([{ text: "Backup" }, { text: "Save" }]), null);
  assert.equal(chooseBack([]), null);
  assert.equal(chooseBack(null), null);
  assert.equal(chooseBack([null, { text: 5 }]), null);
});

test("Load a copy leaves the welcome note hidden, whether or not it was hidden before", () => {
  const empty = fakeStorage();
  assert.equal(loadWelcomeSeen(empty), false);
  assert.equal(importSections({ profile: { goals: [] } }, undefined, empty), true);
  assert.equal(loadWelcomeSeen(empty), true);

  const hidden = fakeStorage();
  saveWelcomeSeen(hidden);
  assert.equal(importSections({}, undefined, hidden), true);
  assert.equal(loadWelcomeSeen(hidden), true);

  const damaged = fakeStorage({ [STORAGE_KEY]: "{not json" });
  assert.equal(importSections({}, undefined, damaged), true);
  assert.equal(loadWelcomeSeen(damaged), true);
});
