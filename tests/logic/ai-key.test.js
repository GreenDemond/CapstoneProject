import { test } from "node:test";
import assert from "node:assert/strict";
import { checkKey, keyHint, maskedKey, MAX_KEY_LENGTH } from "../../js/logic/ai-key.js";

test("a normal key is accepted and trimmed", () => {
  assert.deepEqual(checkKey("  sk-or-abcdef1234567890  "), { ok: true, key: "sk-or-abcdef1234567890" });
});

test("empty, spaced, short, and very long keys are refused with a plain reason", () => {
  assert.equal(checkKey("").ok, false);
  assert.equal(checkKey("   ").ok, false);
  assert.match(checkKey("sk or key 123").reason, /no spaces/);
  assert.match(checkKey("short").reason, /too short/);
  assert.match(checkKey("x".repeat(MAX_KEY_LENGTH + 1)).reason, /too long/);
});

test("only the last four characters are shown", () => {
  assert.equal(keyHint("sk-or-abcdef1234567890"), "7890");
  assert.equal(maskedKey("7890"), "••••7890");
});

test("a short key shows no hint, so half of it is never revealed", () => {
  assert.equal(keyHint("abcd1234"), "");
  assert.equal(keyHint("abcdefghijklmno"), "");
  assert.equal(keyHint("abcdefghijklmnop"), "mnop");
  assert.equal(maskedKey(keyHint("abcd1234")), "••••");
});
