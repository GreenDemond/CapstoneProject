import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCourses, recordCourse, courseFor, removeCourse, classKey, courseLine, offerLine, offerButton,
  MAX_COURSES, MAX_COURSE_STEPS,
} from "../../js/logic/courses.js";
import { loadCourses, saveCourses, deleteRemembered, STORAGE_KEY } from "../../js/storage.js";

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

test("recording a class keeps its steps, newest first", () => {
  let items = recordCourse([], "History", ["Read the chapter", "Write notes"], NOW);
  items = recordCourse(items, "Maths", ["Do problem 1"], NOW);
  assert.deepEqual(items.map((i) => i.label), ["Maths", "History"]);
  assert.deepEqual(items[1].steps, ["Read the chapter", "Write notes"]);
});

test("a second finish for the same class (any capitals or spaces) replaces the first", () => {
  let items = recordCourse([], "History", ["Old step"], NOW);
  items = recordCourse(items, "  history ", ["New step"], NOW);
  assert.equal(items.length, 1);
  assert.deepEqual(items[0].steps, ["New step"]);
  assert.equal(classKey("  HISTORY "), "history");
});

test("a blank class or no usable steps changes nothing", () => {
  const items = recordCourse([], "History", ["A"], NOW);
  assert.equal(recordCourse(items, "   ", ["B"], NOW), items);
  assert.equal(recordCourse(items, "Maths", ["", "   "], NOW), items);
  assert.equal(recordCourse(items, "Maths", "not a list", NOW), items);
});

test("steps are cut to 8, each to 200 characters, blanks dropped", () => {
  const steps = Array.from({ length: 12 }, (_, i) => `Step ${i}`);
  assert.equal(recordCourse([], "A", steps, NOW)[0].steps.length, MAX_COURSE_STEPS);
  assert.equal(recordCourse([], "A", ["x".repeat(500)], NOW)[0].steps[0].length, 200);
});

test("only the newest 20 classes are kept", () => {
  let items = [];
  for (let i = 0; i < MAX_COURSES + 3; i += 1) items = recordCourse(items, `Class ${i}`, ["s"], NOW);
  assert.equal(items.length, MAX_COURSES);
  assert.equal(items[0].label, `Class ${MAX_COURSES + 2}`);
});

test("courseFor finds a class ignoring capitals, and null for blank or unknown", () => {
  const items = recordCourse([], "History", ["A"], NOW);
  assert.equal(courseFor(items, "HISTORY").label, "History");
  assert.equal(courseFor(items, "Maths"), null);
  assert.equal(courseFor(items, ""), null);
  assert.equal(courseFor(items, 5), null);
});

test("removeCourse takes out one class only", () => {
  let items = recordCourse([], "History", ["A"], NOW);
  items = recordCourse(items, "Maths", ["B"], NOW);
  assert.deepEqual(removeCourse(items, "history").map((i) => i.label), ["Maths"]);
});

test("normalizeCourses drops damaged entries one by one and repeated classes", () => {
  const out = normalizeCourses([
    null, 7, { label: "", steps: ["a"] }, { label: "A", steps: [] }, { label: "A", steps: [1, "ok"], on: "nope" },
    { label: "a", steps: ["dup"] }, { label: "B", steps: ["fine"], on: NOW },
  ]);
  assert.deepEqual(out, [{ label: "A", steps: ["ok"], on: "" }, { label: "B", steps: ["fine"], on: NOW }]);
  assert.deepEqual(normalizeCourses("junk"), []);
});

test("wording", () => {
  assert.equal(offerLine("History"), "You have steps from last time for History.");
  assert.equal(offerButton("History"), "Use my History steps from last time");
  assert.equal(courseLine({ label: "History", steps: ["A", "B"] }), "History: A / B");
});

test("storage: saved, loaded, damaged data is empty, deleteRemembered clears it", () => {
  const storage = fakeStorage();
  assert.equal(saveCourses(recordCourse([], "History", ["A"], NOW), storage), true);
  assert.equal(loadCourses(storage).length, 1);
  assert.equal(deleteRemembered(storage), true);
  assert.deepEqual(loadCourses(storage), []);
  const damaged = fakeStorage({ [STORAGE_KEY]: "{bad" });
  assert.deepEqual(loadCourses(damaged), []);
  assert.deepEqual(loadCourses(null), []);
});
