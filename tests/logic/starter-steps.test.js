import { test } from "node:test";
import assert from "node:assert/strict";
import {
  starterStepsFor,
  findListItems,
  KINDS,
  DEFAULT_STEP_COUNT,
  MAX_STEP_LENGTH,
  TWO_MINUTE_STEP,
  withTwoMinuteStart,
} from "../../js/logic/starter-steps.js";

test("every kind offered on screen has starter steps", () => {
  for (const kind of KINDS) {
    assert.ok(starterStepsFor(kind.id).length >= DEFAULT_STEP_COUNT, kind.id);
  }
});

test("starter steps for the kind come in order when the text has no list", () => {
  const steps = starterStepsFor("essay", "Write about the water cycle.");
  assert.equal(steps[0], "Read the instructions again and write down what the question asks");
  assert.ok(steps.length > DEFAULT_STEP_COUNT, "the full list is longer than the five shown at first");
});

test("numbered and bulleted items from the text come first", () => {
  const text = "Your task:\n1. Find three sources\n2) Take notes\n- Write a draft\nDue Friday.";
  const steps = starterStepsFor("essay", text);
  assert.deepEqual(steps.slice(0, 3), ["Find three sources", "Take notes", "Write a draft"]);
  assert.equal(steps[3], "Read the instructions again and write down what the question asks");
});

test("a pasted item that matches a starter step is not repeated", () => {
  const steps = starterStepsFor("essay", "- Read the instructions again and write down what the question asks");
  const count = steps.filter((s) => s.startsWith("Read the instructions again")).length;
  assert.equal(count, 1);
});

test("an unknown kind falls back to the general starter steps", () => {
  assert.deepEqual(starterStepsFor("not-a-kind"), starterStepsFor("other"));
});

test("very long list items are cut to the step length limit", () => {
  const long = "- " + "a".repeat(500);
  const [item] = findListItems(long);
  assert.equal(item.length, MAX_STEP_LENGTH);
});

test("non-text input gives no items and the starter steps only", () => {
  assert.deepEqual(findListItems(undefined), []);
  assert.deepEqual(starterStepsFor("reading", null), starterStepsFor("reading", ""));
});

test("lines that merely contain numbers are not treated as list items", () => {
  assert.deepEqual(findListItems("Chapter 3 is due on 12/4\nPage 10 to 20"), []);
});

test("the two-minute start goes first, and only once", () => {
  const steps = starterStepsFor("essay");
  const once = withTwoMinuteStart(steps);
  assert.equal(once[0], TWO_MINUTE_STEP);
  assert.equal(once.length, steps.length + 1);
  assert.deepEqual(withTwoMinuteStart(once), once);
});

import { showingLine } from "../../js/logic/starter-steps.js";
test("showingLine only appears when some steps are hidden", () => {
  assert.equal(showingLine(5, 12), "Showing 5 of 12. Show more steps adds the rest.");
  assert.equal(showingLine(12, 12), "");
  assert.equal(showingLine(3, 3), "");
});
