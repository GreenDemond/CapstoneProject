import { test } from "node:test";
import assert from "node:assert/strict";
import { ownStart, ownMissing, NEED_ONE_STEP } from "../../js/logic/own-steps.js";
import { MAX_PASTE_LENGTH } from "../../js/logic/clean-text.js";

test("ownStart with no text still gives one empty box", () => {
  assert.deepEqual(ownStart(""), { text: "", truncated: false, draft: [""] });
  assert.deepEqual(ownStart("   \n\n  "), { text: "", truncated: false, draft: [""] });
});

test("ownStart keeps the assignment text, tidied", () => {
  const out = ownStart("  Read ch 2  \r\n\r\n\r\n\r\nDue Friday ");
  assert.equal(out.text, "Read ch 2\n\nDue Friday");
  assert.equal(out.truncated, false);
});

test("ownStart cuts very long text and says so", () => {
  const out = ownStart("a".repeat(MAX_PASTE_LENGTH + 500));
  assert.equal(out.text.length, MAX_PASTE_LENGTH);
  assert.equal(out.truncated, true);
});

test("ownStart survives damaged input", () => {
  for (const bad of [undefined, null, 42, {}, []]) {
    assert.deepEqual(ownStart(bad), { text: "", truncated: false, draft: [""] });
  }
});

test("ownStart gives a new draft each time", () => {
  const a = ownStart("x");
  a.draft.push("changed");
  assert.deepEqual(ownStart("x").draft, [""]);
});

test("ownMissing asks for one step when there is none", () => {
  assert.equal(ownMissing([]), NEED_ONE_STEP);
  assert.equal(ownMissing([""]), NEED_ONE_STEP);
  assert.equal(ownMissing(["  ", "\t"]), NEED_ONE_STEP);
  assert.equal(ownMissing(undefined), NEED_ONE_STEP);
  assert.equal(ownMissing(null), NEED_ONE_STEP);
});

test("ownMissing lets one tiny step through", () => {
  assert.equal(ownMissing(["Open the doc"]), null);
  assert.equal(ownMissing(["", "x"]), null);
});

test("ownMissing is fine with a very long step", () => {
  assert.equal(ownMissing(["w ".repeat(5000)]), null);
});
