import { test } from "node:test";
import assert from "node:assert/strict";
import { buildChatBody, readReply, SYSTEM_PROMPT, TRUSTED_ADULT, MAX_STEPS, MAX_STEP_LENGTH } from "../../js/logic/ai-prompt.js";
import { plainFailure } from "../../js/ai-direct.js";

test("the request keeps the hints-only and child-safety rules, and includes the kind", () => {
  const body = buildChatBody({ model: "m", kind: "essay", text: "Write about rivers." });
  assert.equal(body.messages[0].content, SYSTEM_PROMPT);
  assert.match(SYSTEM_PROMPT, /Never give the answer/);
  assert.match(SYSTEM_PROMPT, /TRUSTED_ADULT/);
  assert.match(body.messages[1].content, /Kind of work: essay/);
  assert.equal(body.model, "m");
});

test("a reply that starts with TRUSTED_ADULT gives the trusted-adult answer", () => {
  assert.deepEqual(readReply(`${TRUSTED_ADULT}`), { trustedAdult: true });
});

test("normal replies become steps, capped in number and length", () => {
  const long = "x".repeat(500);
  const reply = readReply(["1. Read it", "- Plan it", long, "Four", "Five", "Six"].join("\n"));
  assert.equal(reply.steps.length, MAX_STEPS);
  assert.equal(reply.steps[2].length, MAX_STEP_LENGTH);
});

test("empty or non-text replies give nothing usable", () => {
  assert.equal(readReply(""), null);
  assert.equal(readReply(undefined), null);
  assert.equal(readReply(42), null);
});

test("each status code gets a plain line that names what to check", () => {
  assert.match(plainFailure(401), /accept the key/);
  assert.match(plainFailure(404), /address or the model name/);
  assert.match(plainFailure(400), /address or the model name/);
  assert.match(plainFailure(402), /busy or out of credit/);
  assert.match(plainFailure(503), /busy or out of credit/);
  assert.match(plainFailure(418), /couldn't answer/);
});
