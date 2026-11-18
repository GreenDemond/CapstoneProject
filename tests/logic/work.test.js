import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createWork,
  normalizeWork,
  currentIndex,
  doneCount,
  allDone,
  applyChoice,
  hintAt,
  STUCK_HINTS,
  ringFraction,
  formatTime,
} from "../../js/logic/work.js";

const TEXTS = ["Find sources", "Take notes", "Write draft"];

test("Done marks the current step and moves on, one step at a time", () => {
  let work = createWork(TEXTS);
  work = applyChoice(work, "done");
  assert.equal(doneCount(work), 1);
  assert.equal(work.steps[currentIndex(work)].text, "Take notes");
});

test("Still working and Stuck change nothing", () => {
  const work = createWork(TEXTS);
  assert.equal(applyChoice(work, "still"), work);
  assert.equal(applyChoice(work, "stuck"), work);
});

test("Drifted counts the same as Done, and adds the student's smaller step", () => {
  const before = createWork(TEXTS);
  const after = applyChoice(before, "drifted", "Open one source and skim it");
  assert.equal(doneCount(after), doneCount(applyChoice(before, "done")));
  assert.equal(after.steps[1].text, "Open one source and skim it");
  assert.equal(after.steps[1].done, false);
  assert.equal(after.steps.length, 4);
});

test("Drifted with a blank box, or the same words, keeps the step whole", () => {
  const work = createWork(TEXTS);
  assert.equal(applyChoice(work, "drifted", "   "), work);
  assert.equal(applyChoice(work, "drifted", "Find sources"), work);
});

test("Later moves the step to the end, with no credit", () => {
  const work = applyChoice(createWork(TEXTS), "later");
  assert.deepEqual(
    work.steps.map((s) => s.text),
    ["Take notes", "Write draft", "Find sources"],
  );
  assert.equal(doneCount(work), 0);
});

test("Later does nothing when no other step is left", () => {
  let work = createWork(["Only one"]);
  assert.equal(applyChoice(work, "later"), work);
});

test("all steps done is reported, and nothing more is offered", () => {
  let work = createWork(TEXTS);
  for (let i = 0; i < 3; i++) {
    work = applyChoice(work, "done");
  }
  assert.equal(allDone(work), true);
  assert.equal(applyChoice(work, "done"), work);
});

test("hints run out after the last one, and never give an answer", () => {
  assert.equal(hintAt(0), STUCK_HINTS[0]);
  assert.equal(hintAt(STUCK_HINTS.length), null);
  for (const hint of STUCK_HINTS) {
    assert.equal(/answer is|the solution/i.test(hint), false);
  }
});

test("the countdown ring and the time text stay in range", () => {
  assert.equal(ringFraction(720, 720), 1);
  assert.equal(ringFraction(-5, 720), 0);
  assert.equal(ringFraction(10, 0), 0);
  assert.equal(formatTime(725), "12:05");
  assert.equal(formatTime(-3), "0:00");
});

import { secondsUntil } from "../../js/logic/work.js";
test("secondsUntil reads the clock and never goes below zero", () => {
  assert.equal(secondsUntil(60000, 0), 60);
  assert.equal(secondsUntil(60000, 59500), 1); // part of a second still counts as a second
  assert.equal(secondsUntil(60000, 60000), 0);
  assert.equal(secondsUntil(60000, 900000), 0); // a laptop that slept past the end
});

test("the kind of work survives a drifted step and is checked when read back", () => {
  const work = { ...createWork(["Find sources", "Write"]), kind: "essay" };
  assert.equal(applyChoice(work, "drifted", "Open one source").kind, "essay");
  assert.equal(applyChoice(work, "done").kind, "essay");
  assert.equal(normalizeWork({ ...work, kind: "essay" }).kind, "essay");
  assert.equal("kind" in normalizeWork({ ...work, kind: "nope" }), false);
});
