import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { suggestKind, findRequirements, chunkQuestionSteps } from "../../js/logic/heuristics.js";

const fixtures = JSON.parse(readFileSync(new URL("../fixtures/assignments.json", import.meta.url), "utf8"));

for (const fixture of fixtures) {
  test(`suggestKind: ${fixture.name}`, () => {
    assert.equal(suggestKind(fixture.text), fixture.kind);
  });

  test(`findRequirements: ${fixture.name}`, () => {
    assert.deepEqual(findRequirements(fixture.text), fixture.requirements);
  });

  test(`chunkQuestionSteps: ${fixture.name}`, () => {
    const expected = fixture.chunks === undefined ? null : fixture.chunks;
    const steps = chunkQuestionSteps(fixture.text, expected ? expected.count : 5);
    assert.deepEqual(steps, expected ? expected.steps : null);
  });
}

test("every requirement line is an exact piece of the pasted text", () => {
  for (const fixture of fixtures) {
    for (const line of findRequirements(fixture.text)) {
      assert.ok(fixture.text.includes(line), `not verbatim in "${fixture.name}": ${line}`);
      assert.ok(line.length <= 200);
    }
  }
});

test("at most six requirement lines, no repeats", () => {
  const text = Array.from({ length: 12 }, (_, i) => `You must do part ${i + 1}.`).join(" ") + " You must do part 1.";
  const lines = findRequirements(text);
  assert.equal(lines.length, 6);
  assert.equal(new Set(lines).size, 6);
});

test("the same text twice gives the same answers", () => {
  const text = "Write an essay. Use at least 3 sources.";
  assert.deepEqual(findRequirements(text), findRequirements(text));
  assert.equal(suggestKind(text), suggestKind(text));
});

test("awkward input never throws and gives empty results", () => {
  const awkward = [undefined, null, 42, {}, [], "", "\u0000\u0001\u0002", "😀".repeat(500), "x".repeat(100000), "\n".repeat(5000), "problems 0-0", "problems 5-1", "problems 1-99999"];
  for (const input of awkward) {
    assert.doesNotThrow(() => suggestKind(input));
    assert.doesNotThrow(() => findRequirements(input));
    assert.doesNotThrow(() => chunkQuestionSteps(input, 5));
  }
  assert.equal(suggestKind(undefined), null);
  assert.deepEqual(findRequirements(null), []);
  assert.equal(chunkQuestionSteps("problems 0-0", 5), null);
  assert.equal(chunkQuestionSteps("problems 5-1", 5), null);
  assert.equal(chunkQuestionSteps("problems 1-99999", 5), null);
});

test("a single-item range is not chunked; two items give two steps at most", () => {
  assert.equal(chunkQuestionSteps("Do problem 4-4.", 5), null);
  assert.deepEqual(chunkQuestionSteps("Do problems 4-5.", 5), ["Do problem 4", "Do problem 5"]);
});

test("a step count of 3 gives at most three chunks, covering the whole range", () => {
  const steps = chunkQuestionSteps("Do problems 1-10.", 3);
  assert.deepEqual(steps, ["Do problems 1 to 4", "Do problems 5 to 8", "Do problems 9 to 10"]);
});

test("a bad step count falls back to five", () => {
  assert.equal(chunkQuestionSteps("Do problems 1-10.", 0).length, 5);
  assert.equal(chunkQuestionSteps("Do problems 1-10.", "many").length, 5);
});

test("numbers inside words and decimals do not make ranges or lines", () => {
  assert.equal(chunkQuestionSteps("Use version 2.0 of the problems sheet", 5), null);
  assert.deepEqual(findRequirements("Pi is about 3.14 and that is all."), []);
});

test("no suggestion or line ever contains an answer-like instruction beyond process words", () => {
  // The chunk steps are the only text the logic writes. They always start with "Do ".
  for (const fixture of fixtures) {
    for (const step of chunkQuestionSteps(fixture.text, 5) ?? []) {
      assert.match(step, /^Do (problems?|questions?|exercises?|numbers?|items?) \d+( to \d+)?$/);
    }
  }
});
