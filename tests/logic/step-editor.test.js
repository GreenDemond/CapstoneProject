import { test } from "node:test";
import assert from "node:assert/strict";
import {
  splitParts, setStepText, moveStep, removeStep, addBlankStep, splitStepAt, joinWithNext,
  addGetReady, addPutAway, cleanSteps, isVague, noteFor, MAX_STEPS, MAX_STEP_LENGTH,
  GET_READY_STEP, PUT_AWAY_STEP, VAGUE_QUESTION, SPLIT_QUESTION,
} from "../../js/logic/step-editor.js";

test("split at a semicolon, then, and, comma, in that order of preference", () => {
  assert.deepEqual(splitParts("Read the chapter; take notes on it"), ["Read the chapter", "Take notes on it"]);
  assert.deepEqual(splitParts("Open the book, then find chapter four"), ["Open the book", "Find chapter four"]);
  assert.deepEqual(splitParts("Find three sources and take notes on each one"), ["Find three sources", "Take notes on each one"]);
  assert.deepEqual(splitParts("Gather your notes, write an outline"), ["Gather your notes", "Write an outline"]);
});

test("a break that leaves a one-word part is skipped", () => {
  assert.deepEqual(splitParts("Write the intro and conclusion"), ["Write the intro", "And conclusion"]);
  assert.deepEqual(splitParts("Read pages 3 and 4 today"), ["Read pages 3", "4 today"]);
});

test("the nearest break to the middle is used", () => {
  assert.deepEqual(
    splitParts("Do one two three four, five six; seven eight nine ten eleven twelve"),
    ["Do one two three four, five six", "Seven eight nine ten eleven twelve"],
  );
});

test("no natural break falls back to the middle, and short steps are refused", () => {
  assert.deepEqual(splitParts("Write a rough first paragraph today"), ["Write a rough", "First paragraph today"]);
  assert.equal(splitParts("Read it"), null);
  assert.equal(splitParts("Read the chapter"), null);
  assert.equal(splitParts(""), null);
  assert.equal(splitParts(undefined), null);
});

test("splitting only uses the student's own words", () => {
  const text = "Draft the opening, then pick the best quote and write why it fits";
  const parts = splitParts(text);
  const words = (t) => t.toLowerCase().replace(/[,;]/g, "").split(/\s+/).filter((w) => w !== "then");
  assert.deepEqual(words(parts.join(" ")), words(text));
});

test("editing returns new lists and ignores bad positions", () => {
  const steps = ["a b", "c d", "e f"];
  assert.deepEqual(moveStep(steps, 0, 1), ["c d", "a b", "e f"]);
  assert.deepEqual(moveStep(steps, 0, -1), steps);
  assert.deepEqual(moveStep(steps, 2, 1), steps);
  assert.deepEqual(removeStep(steps, 1), ["a b", "e f"]);
  assert.deepEqual(setStepText(steps, 5, "x"), steps);
  assert.equal(setStepText(steps, 0, "x".repeat(500))[0].length, MAX_STEP_LENGTH);
  assert.deepEqual(steps, ["a b", "c d", "e f"]);
});

test("add, split and join respect the limits", () => {
  const full = Array.from({ length: MAX_STEPS }, () => "one two three four");
  assert.equal(addBlankStep(full).length, MAX_STEPS);
  assert.equal(splitStepAt(full, 0).length, MAX_STEPS);
  assert.equal(addGetReady(full).length, MAX_STEPS);
  assert.deepEqual(splitStepAt(["Find sources and take notes"], 0), ["Find sources", "Take notes"]);
  assert.deepEqual(splitStepAt(["Read it"], 0), ["Read it"]);
});

test("join puts a semicolon between and splits back again", () => {
  const joined = joinWithNext(["Find sources.", "Take notes"], 0);
  assert.deepEqual(joined, ["Find sources; Take notes"]);
  assert.deepEqual(splitStepAt(joined, 0), ["Find sources", "Take notes"]);
  assert.deepEqual(joinWithNext(["a b"], 0), ["a b"]);
  const long = "x".repeat(150);
  assert.deepEqual(joinWithNext([long, long], 0), [long, long]);
});

test("Get ready goes first once, Put it away goes last once", () => {
  let steps = addPutAway(addGetReady(["Do the thing now"]));
  assert.equal(steps[0], GET_READY_STEP);
  assert.equal(steps[steps.length - 1], PUT_AWAY_STEP);
  steps = addPutAway(addGetReady(steps));
  assert.equal(steps.length, 3);
});

test("cleanSteps trims, drops blanks and cuts long steps", () => {
  assert.deepEqual(cleanSteps(["  a b ", "", "   ", "c d"]), ["a b", "c d"]);
  assert.deepEqual(cleanSteps([]), []);
  assert.equal(cleanSteps(["y".repeat(900)])[0].length, MAX_STEP_LENGTH);
});

test("vague steps are matched by pattern, specific ones are not", () => {
  for (const text of ["Study", "study for the test", "Do chapter 4.", "Work on the project", "finish it", "Finish the essay"]) {
    assert.equal(isVague(text), true, text);
  }
  for (const text of ["Write the first sentence of your essay", "Read chapter 4 and list three terms", "Quiz yourself on the vocabulary", "", undefined]) {
    assert.equal(isVague(text), false, String(text));
  }
});

test("notes are questions only, and a split question needs two real parts", () => {
  assert.deepEqual(noteFor("study for the test"), { kind: "vague", text: VAGUE_QUESTION });
  assert.deepEqual(noteFor("Find sources and take notes"), { kind: "split", text: SPLIT_QUESTION });
  assert.equal(noteFor("Write the intro and conclusion"), null);
  assert.equal(noteFor("Write your main answer in one sentence"), null);
  assert.equal(noteFor("   "), null);
  const long = Array.from({ length: 25 }, (_, i) => `word${i}`).join(" ");
  assert.equal(noteFor(long).kind, "split");
  assert.ok(!/wrong|bad|lazy|should/i.test(VAGUE_QUESTION + SPLIT_QUESTION));
});
