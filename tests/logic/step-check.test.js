import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkSteps, keyWords, MAX_LINES } from "../../js/logic/step-check.js";

const fixtures = JSON.parse(readFileSync(new URL("../fixtures/step-checks.json", import.meta.url), "utf8"));

for (const fixture of fixtures) {
  test(`checkSteps: ${fixture.name}`, () => {
    const result = checkSteps(fixture.lines, fixture.steps);
    if (fixture.open === null) {
      assert.equal(result, null);
    } else {
      assert.deepEqual(result.open, fixture.open);
      assert.equal(result.checked, fixture.lines.length);
      assert.equal(result.covered, fixture.lines.length - fixture.open.length);
    }
  });
}

test("key words drop stop words, short words and repeats; plurals are folded", () => {
  assert.deepEqual(keyWords("Include a graph of your data, data and sources"), ["graph", "data", "source"]);
  assert.deepEqual(keyWords("at least 3 sources"), ["3", "source"]);
});

test("a number must match whole: 5 does not cover 500", () => {
  assert.deepEqual(checkSteps(["Write 500 words"], ["Write 5 things"]).open, ["Write 500 words"]);
});

test("odd input fails closed and nothing is changed", () => {
  assert.equal(checkSteps(null, null), null);
  assert.equal(checkSteps(["", "   "], ["x"]), null);
  const steps = ["Find sources"];
  const lines = ["Use at least 3 sources."];
  checkSteps(lines, steps);
  assert.deepEqual(steps, ["Find sources"]);
  assert.deepEqual(lines, ["Use at least 3 sources."]);
  assert.deepEqual(checkSteps(lines, [null, 5, undefined]).open, lines);
  assert.deepEqual(checkSteps(lines, []).open, lines);
});

test("at most six lines are looked at", () => {
  const lines = Array.from({ length: 9 }, (_, i) => `Include topic${i} material`);
  assert.equal(checkSteps(lines, []).checked, MAX_LINES);
});

test("very long input does not break", () => {
  const long = "sources ".repeat(5000);
  assert.deepEqual(checkSteps(["Use sources"], [long]).open, []);
});
