import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanPastedText, limitPaste, MAX_PASTE_LENGTH } from "../../js/logic/clean-text.js";

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

test("limitPaste keeps short text as it is", () => {
  assert.deepEqual(limitPaste("  Read chapter 3  "), { text: "Read chapter 3", truncated: false });
});

test("limitPaste cuts text over 6,000 characters and says so", () => {
  const result = limitPaste("x".repeat(6500));
  assert.equal(result.text.length, MAX_PASTE_LENGTH);
  assert.equal(result.truncated, true);
});
