import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanPastedText } from "../../js/logic/clean-text.js";

test("trims lines and collapses extra blank lines", () => {
  const input = "  Read chapter 3  \r\n\r\n\r\n\r\n  Write summary   ";
  assert.equal(cleanPastedText(input), "Read chapter 3\n\nWrite summary");
});

test("empty and non-text input gives an empty string", () => {
  assert.equal(cleanPastedText(""), "");
  assert.equal(cleanPastedText("   \n  \n"), "");
  assert.equal(cleanPastedText(undefined), "");
  assert.equal(cleanPastedText(42), "");
});
