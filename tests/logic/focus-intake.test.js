import { test } from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS, cardLines, isComplete, NOT_SURE, NOT_SURE_TEXT } from "../../js/logic/focus-intake.js";

const ALL_QUIET = { sound: "quiet", block: "short", pull: "phone", restart: "small-step" };

test("there are exactly four questions, and each offers Not sure", () => {
  assert.equal(QUESTIONS.length, 4);
  for (const question of QUESTIONS) {
    assert.ok(
      question.options.some((option) => option.value === NOT_SURE),
      `${question.id} has a Not sure option`,
    );
  }
});

test("the card shows the student's own picks, in question order", () => {
  const lines = cardLines(ALL_QUIET);
  assert.deepEqual(
    lines.map((line) => line.value),
    ["Quiet", "Short (about 12 minutes)", "Phone", "A very small first step"],
  );
});

test("Not sure shows as Not sure yet, on every question", () => {
  const lines = cardLines({ sound: NOT_SURE, block: NOT_SURE, pull: NOT_SURE, restart: NOT_SURE });
  assert.equal(lines.length, 4);
  assert.ok(lines.every((line) => line.value === NOT_SURE_TEXT));
});

test("unanswered questions are left off the card, and an empty card is fine", () => {
  assert.deepEqual(cardLines({}), []);
  assert.equal(cardLines({ sound: "hiss" }).length, 1);
});

test("an answer that is not one of the options is ignored, not shown", () => {
  assert.deepEqual(cardLines({ sound: "loud-as-possible" }), []);
});

test("the card never mentions flow, focus state, or a diagnosis", () => {
  const text = cardLines({ sound: "hiss", block: "long", pull: "other", restart: "notes" })
    .map((line) => `${line.label} ${line.value}`)
    .join(" ")
    .toLowerCase();
  for (const word of ["flow", "adhd", "diagnos", "treat", "improve"]) {
    assert.equal(text.includes(word), false, word);
  }
});

test("isComplete needs an answer, Not sure included, for all four questions", () => {
  assert.equal(isComplete({}), false);
  assert.equal(isComplete({ ...ALL_QUIET, restart: NOT_SURE }), true);
  assert.equal(isComplete({ sound: "quiet", block: "short", pull: "phone" }), false);
});
