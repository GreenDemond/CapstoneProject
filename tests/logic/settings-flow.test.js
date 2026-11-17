import { test } from "node:test";
import assert from "node:assert/strict";
import {
  helperStatus,
  choiceAfterRemove,
  pathFor,
  stepTitle,
  checkService,
  orderModels,
  defaultModel,
  renameService,
  canSaveAnyway,
  stepToFix,
  failureKindForStatus,
  setupMessage,
  looksLikeOpenRouter,
} from "../../js/logic/settings-flow.js";
import { addService, normalizeServices, readModelIds, inUseHelper } from "../../js/logic/ai-services.js";

const ready = { id: "a", label: "A", url: "https://a.example.com/v1/chat/completions", model: "m", keyReady: true, checked: true };

test("one status word per helper, with the key checked first", () => {
  assert.equal(helperStatus(ready).word, "Ready");
  assert.equal(helperStatus({ ...ready, keyReady: false, model: "" }).word, "Needs a key");
  assert.equal(helperStatus({ ...ready, model: "" }).word, "Needs an AI picked");
  assert.equal(helperStatus({ ...ready, checked: false }).word, "Not checked yet");
  assert.equal(helperStatus({ ...ready, checked: false }).action, "check");
  assert.equal(helperStatus(ready).action, null);
});

test("older saved helpers (no model, with or without a key) show the right status", () => {
  const { services } = normalizeServices({ services: [{ id: "x", label: "Old", url: "https://old.example.com/v1/chat/completions", keyHint: "1234" }] });
  assert.equal(services[0].model, "");
  assert.equal(services[0].checked, true);
  assert.equal(helperStatus(services[0]).word, "Needs a key");
  assert.equal(helperStatus({ ...services[0], keyReady: true }).word, "Needs an AI picked");
});

test("removing the helper in use picks the first ready one, or none, and never an unready one", () => {
  const unready = { ...ready, id: "b", keyReady: false };
  const list = [ready, unready, { ...ready, id: "c" }];
  assert.equal(choiceAfterRemove(list, "a", "a"), "c");
  assert.equal(choiceAfterRemove(list, "b", "a"), "a");
  assert.equal(choiceAfterRemove([ready, unready], "a", "a"), null);
});

test("the steps depend on what is missing, and single-step flows have their own titles", () => {
  assert.deepEqual(pathFor("add"), ["service", "key", "pick", "check"]);
  assert.deepEqual(pathFor("finish", { ...ready, keyReady: false, model: "" }), ["key", "pick", "check"]);
  assert.deepEqual(pathFor("finish", { ...ready, model: "" }), ["pick", "check"]);
  assert.deepEqual(pathFor("finish", { ...ready, checked: false }), ["check"]);
  assert.equal(stepTitle("add", pathFor("add"), "key"), "Step 2 of 4");
  assert.equal(stepTitle("replaceKey", pathFor("replaceKey"), "key"), "Replace the key");
  assert.equal(stepTitle("changeAi", pathFor("changeAi"), "pick"), "Change the AI");
});

test("step 1 refuses bad, duplicate, and lookalike addresses before any key is typed", () => {
  assert.equal(checkService("other", "", []).kind, "notAddress");
  assert.equal(checkService("other", "nope", []).kind, "notAddress");
  assert.equal(checkService("other", "https://x.example.com/custom/run", []).kind, "unusableAddress");
  assert.equal(checkService("other", "https://openrouter.evil.example", []).kind, "notOpenRouter");
  assert.equal(checkService("openrouter", "", [{ ...ready, url: "https://openrouter.ai/api/v1/chat/completions" }]).kind, "duplicate");
  assert.equal(checkService("other", "http://host:8080", []).url, "http://host:8080/v1/chat/completions");
  assert.equal(looksLikeOpenRouter("https://openrouter.ai"), false);
});

test("the AI pull-down starts with the preselected one, then A to Z, without repeats", () => {
  assert.deepEqual(orderModels(["b", "a", "c", "a"], "z-default"), ["z-default", "a", "b", "c"]);
  assert.deepEqual(orderModels(["b", "a"], ""), ["a", "b"]);
});

test("OpenRouter defaults to openrouter/free even if the list lacks it, and a lone AI is picked", () => {
  assert.equal(defaultModel("https://openrouter.ai/api/v1/chat/completions", ["x"], ""), "openrouter/free");
  assert.equal(defaultModel("https://h.example.com/v1/chat/completions", ["only"], ""), "only");
  assert.equal(defaultModel("https://h.example.com/v1/chat/completions", ["a", "b"], ""), "");
  assert.equal(defaultModel("https://openrouter.ai/api/v1/chat/completions", [], "mine"), "mine");
});

test("model names from a service keep only plain names", () => {
  const ids = readModelIds({ data: [{ id: "ok/model:free" }, { id: "<b>bad</b>" }, { id: "has space" }, { id: "~x/y" }, { id: "a".repeat(101) }] });
  assert.deepEqual(ids, ["ok/model:free", "~x/y"]);
});

test("rename needs a name, and Save it anyway is offered only when the check could not tell", () => {
  assert.ok(renameService([ready], "a", "  ").error);
  assert.equal(renameService([ready], "a", "New").list[0].label, "New");
  assert.equal(canSaveAnyway("network"), true);
  assert.equal(canSaveAnyway("timeout"), true);
  assert.equal(canSaveAnyway("emptyReply"), true);
  assert.equal(canSaveAnyway("key"), false);
  assert.equal(canSaveAnyway("notFound"), false);
  assert.equal(stepToFix("key"), "key");
  assert.equal(stepToFix("notFound"), "pick");
  assert.equal(stepToFix("network"), "service");
});

test("every failure has a plain message, and none blames the student or names a status code", () => {
  for (const status of [400, 401, 402, 403, 404, 429, 500, 503, 418]) {
    const message = setupMessage(failureKindForStatus(status));
    assert.ok(message.length > 10);
    assert.doesNotMatch(message, /\b(4\d\d|5\d\d)\b/);
  }
  assert.equal(failureKindForStatus(402), "credit");
});

test("helper ids never repeat, even after one is removed and another added", () => {
  let list = addService([], { label: "A", url: "https://a.example.com" }).list;
  list = addService(list, { label: "B", url: "https://b.example.com" }).list;
  const removedId = list[0].id;
  list = list.filter((s) => s.id !== removedId);
  list = addService(list, { label: "C", url: "https://c.example.com" }).list;
  assert.equal(new Set(list.map((s) => s.id)).size, list.length);
  assert.ok(!list.some((s) => s.label === "C" && s.id === removedId));
});

test("the helper in use is not switched to another unless it is gone, and saved-anyway helpers are never picked", () => {
  const unready = { ...ready, id: "u", keyReady: false };
  const unchecked = { ...ready, id: "n", checked: false };
  assert.equal(inUseHelper([unready, ready], "u").id, "u");
  assert.equal(inUseHelper([unready, ready], "gone").id, "a");
  assert.equal(inUseHelper([unready], null), null);
  assert.equal(inUseHelper([unchecked], null), null);
  assert.equal(inUseHelper([unchecked], "n").id, "n");
});
