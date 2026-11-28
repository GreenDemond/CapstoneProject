import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildHelpersFile, parseHelpersFile, planLoad, checkPassphrase, helpersFileName, keysByRef, refFor,
  FILE_APP, FILE_VERSION, MAX_FILE_BYTES, MIN_PASSPHRASE,
} from "../../js/logic/ai-helpers-file.js";
import { encryptKeys, decryptKeys } from "../../js/logic/helpers-crypto.js";
import { MAX_SERVICES, MAX_LABEL, MAX_MODEL, addService } from "../../js/logic/ai-services.js";

const subtle = globalThis.crypto.subtle;
const rng = (bytes) => globalThis.crypto.getRandomValues(bytes);
const NOW = "2026-11-28T12:00:00.000Z";
const KEY_A = "sk-test-ABCDWXYZ";
const KEY_B = "sk-test-EFGH5678";

function svc(id, label, model, effort = "medium", url = "https://openrouter.ai/api/v1/chat/completions") {
  return { id, label, url, model, keyHint: KEY_A.slice(-4), keyReady: true, checked: true, effort };
}
const SERVICES = [svc("svc-1", "Free one", "openrouter/free"), svc("svc-2", "Home <b>AI</b>", "llama3", "high", "http://localhost:8080/v1/chat/completions")];

function parseOk(text) {
  const result = parseHelpersFile(text);
  assert.equal(result.ok, true, result.reason);
  return result;
}

test("file name uses the day", () => {
  assert.equal(helpersFileName(NOW), "focus-app-ai-helpers-2026-11-28.json");
  assert.equal(helpersFileName("nonsense"), "focus-app-ai-helpers-helpers.json");
});

test("round trip without keys", () => {
  const file = buildHelpersFile(SERVICES, { nowIso: NOW });
  assert.equal(file.app, FILE_APP);
  assert.equal(file.version, FILE_VERSION);
  assert.equal("keys" in file, false);
  const result = parseOk(JSON.stringify(file));
  assert.equal(result.keys, null);
  assert.deepEqual(result.helpers.map(({ label, url, model, effort }) => ({ label, url, model, effort })), [
    { label: "Free one", url: SERVICES[0].url, model: "openrouter/free", effort: "medium" },
    { label: "Home <b>AI</b>", url: SERVICES[1].url, model: "llama3", effort: "high" },
  ]);
});

test("a file without keys never holds a key, a hint, or an id", () => {
  const text = JSON.stringify(buildHelpersFile(SERVICES, { nowIso: NOW }));
  for (const bad of [KEY_A, "ABCDWXYZ", "WXYZ", "svc-1", "keyHint", "keyReady"]) {
    assert.ok(!text.includes(bad), bad);
  }
});

test("round trip with keys and a passphrase; a helper without a key is absent from the keys", async () => {
  const keys = keysByRef(SERVICES, new Map([["svc-2", KEY_B]]));
  assert.deepEqual([...keys], [["h2", KEY_B]]);
  const block = await encryptKeys(subtle, rng, "a long passphrase", keys, 1000);
  const text = JSON.stringify(buildHelpersFile(SERVICES, { keysBlock: block, nowIso: NOW }));
  for (const bad of [KEY_A, KEY_B, "EFGH5678", "5678"]) {
    assert.ok(!text.includes(bad), bad);
  }
  const parsed = parseOk(text);
  assert.notEqual(parsed.keys, null);
  const opened = await decryptKeys(subtle, "a long passphrase", parsed.keys);
  assert.deepEqual([...opened.keys], [["h2", KEY_B]]);
  assert.equal((await decryptKeys(subtle, "not the passphrase", parsed.keys)).ok, false);
});

test("passphrase checks use plain words", () => {
  assert.equal(checkPassphrase("", "").ok, false);
  assert.equal(checkPassphrase("short", "short").ok, false);
  assert.match(checkPassphrase("short", "short").reason, new RegExp(String(MIN_PASSPHRASE)));
  assert.match(checkPassphrase("long enough pass", "long enough pasx").reason, /don't match/);
  assert.equal(checkPassphrase("x".repeat(201), "x".repeat(201)).ok, false);
  assert.deepEqual(checkPassphrase("long enough pass", "long enough pass"), { ok: true, passphrase: "long enough pass" });
  assert.equal(checkPassphrase(undefined, undefined).ok, false);
});

test("bad files are refused with 'Nothing was changed.' and no key or passphrase in the reason", () => {
  const good = buildHelpersFile(SERVICES, { nowIso: NOW });
  const cases = [
    "not json", "", "[]", "null", "5", JSON.stringify({ ...good, app: "focus-app-copy" }), JSON.stringify({ ...good, version: 2 }),
    JSON.stringify({ ...good, version: "1" }), JSON.stringify({ ...good, version: 0 }), JSON.stringify({ ...good, helpers: "x" }),
    JSON.stringify({ ...good, helpers: [] }), JSON.stringify({ ...good, helpers: [5, null, "x"] }), JSON.stringify({ ...good, keys: "locked" }),
    JSON.stringify({ ...good, keys: { kdf: "PBKDF2-SHA-256" } }), "x".repeat(MAX_FILE_BYTES + 1),
    JSON.stringify({ ...good, note: "y".repeat(MAX_FILE_BYTES) }),
  ];
  for (const text of cases) {
    const result = parseHelpersFile(text);
    assert.equal(result.ok, false, text.slice(0, 40));
    assert.match(result.reason, /Nothing was changed\.$/);
    assert.ok(!result.reason.includes(KEY_A));
  }
  assert.equal(parseHelpersFile(undefined).ok, false);
});

test("a file made by a newer version says so", () => {
  const good = buildHelpersFile(SERVICES, { nowIso: NOW });
  assert.match(parseHelpersFile(JSON.stringify({ ...good, version: 2 })).reason, /newer version/);
});

test("__proto__ and constructor keys do nothing", () => {
  const text = '{"app":"focus-app-ai-helpers","version":1,"__proto__":{"polluted":1},"constructor":{"x":1},"helpers":[{"label":"A","url":"https://openrouter.ai/api/v1","model":"m","__proto__":{"effort":"high"},"constructor":"x"}]}';
  const result = parseOk(text);
  assert.equal({}.polluted, undefined);
  assert.equal(result.helpers[0].effort, "low");
  assert.deepEqual(Object.keys(result.helpers[0]).sort(), ["effort", "label", "model", "ref", "url"]);
});

test("unknown keys are dropped and html stays plain text", () => {
  const text = JSON.stringify({ app: FILE_APP, version: 1, extra: 1, helpers: [{ label: "<img src=x onerror=alert(1)>", url: "https://openrouter.ai/api/v1", model: "m", apiKey: KEY_A, id: "svc-9", keyReady: true }] });
  const helper = parseOk(text).helpers[0];
  assert.equal(helper.label, "<img src=x onerror=alert(1)>");
  assert.deepEqual(Object.keys(helper).sort(), ["effort", "label", "model", "ref", "url"]);
  assert.ok(!JSON.stringify(helper).includes(KEY_A));
});

test("addresses: user:password, odd paths, odd schemes are dropped; base addresses get the chat path", () => {
  const entries = [
    { label: "a", url: "https://user:pass@example.com/v1", model: "m" },
    { label: "b", url: "https://example.com/admin/delete", model: "m" },
    { label: "c", url: "javascript:alert(1)", model: "m" },
    { label: "d", url: "ftp://example.com/v1", model: "m" },
    { label: "e", url: 5, model: "m" },
    { label: "f", url: "http://localhost:8080", model: "m" },
    { label: "g", url: "https://openrouter.ai/api/v1/chat/completions?x=1", model: "m" },
  ];
  const result = parseOk(JSON.stringify({ app: FILE_APP, version: 1, helpers: entries }));
  assert.equal(result.dropped, 5);
  assert.equal(result.helpers[0].url, "http://localhost:8080/v1/chat/completions");
});

test("a file where every address is bad is refused", () => {
  const result = parseHelpersFile(JSON.stringify({ app: FILE_APP, version: 1, helpers: [{ label: "a", url: "https://u:p@x.com/v1", model: "m" }] }));
  assert.equal(result.ok, false);
  assert.match(result.reason, /Nothing was changed\.$/);
});

test("long text is cut, bad effort becomes low, more than the limit is cut", () => {
  const helpers = [{ label: "L".repeat(500), url: "https://openrouter.ai/api/v1", model: "M".repeat(500), effort: "extreme" }];
  for (let i = 0; i < 20; i += 1) {
    helpers.push({ label: `h${i}`, url: "https://example.com/v1", model: `m${i}` });
  }
  const result = parseOk(JSON.stringify({ app: FILE_APP, version: 1, helpers }));
  assert.equal(result.helpers.length, MAX_SERVICES);
  assert.equal(result.helpers[0].label.length, MAX_LABEL);
  assert.equal(result.helpers[0].model.length, MAX_MODEL);
  assert.equal(result.helpers[0].effort, "low");
});

test("planLoad adds helpers like hand-made ones", () => {
  const helpers = parseOk(JSON.stringify(buildHelpersFile(SERVICES, { nowIso: NOW }))).helpers;
  const plan = planLoad([], helpers);
  assert.equal(plan.skipped.length, 0);
  assert.equal(plan.toAdd.length, 2);
  const first = plan.toAdd[0].service;
  assert.equal(first.checked, true);
  assert.equal(first.keyReady, false);
  assert.equal(first.keyHint, "");
  assert.notEqual(first.id, "svc-1");
  assert.equal(plan.toAdd[1].service.effort, "high");
  assert.equal(plan.toAdd[1].ref, "h2");
});

test("planLoad skips the same AI at the same address and the same name (any case)", () => {
  const existing = addService([], { label: "Mine", url: "https://openrouter.ai/api/v1", model: "m1" }).list;
  const helpers = parseOk(JSON.stringify({ app: FILE_APP, version: 1, helpers: [
    { label: "Other name", url: "https://openrouter.ai/api/v1", model: "m1" },
    { label: "MINE", url: "https://openrouter.ai/api/v1", model: "m2" },
    { label: "Fresh", url: "https://openrouter.ai/api/v1", model: "m3" },
    { label: "Fresh again", url: "https://openrouter.ai/api/v1", model: "m3" },
    { label: "fresh", url: "https://example.com/v1", model: "x" },
  ] })).helpers;
  const plan = planLoad(existing, helpers);
  assert.deepEqual(plan.toAdd.map((a) => a.service.label), ["Fresh"]);
  assert.equal(plan.skipped.length, 4);
});

test("planLoad respects the room left", () => {
  let existing = [];
  for (let i = 0; i < MAX_SERVICES - 1; i += 1) {
    existing = addService(existing, { label: `e${i}`, url: "https://example.com/v1", model: `m${i}` }).list;
  }
  const helpers = parseOk(JSON.stringify({ app: FILE_APP, version: 1, helpers: [
    { label: "n1", url: "https://example.com/v1", model: "n1" }, { label: "n2", url: "https://example.com/v1", model: "n2" },
  ] })).helpers;
  const plan = planLoad(existing, helpers);
  assert.equal(plan.toAdd.length, 1);
  assert.equal(plan.skipped.length, 1);
  assert.equal(plan.list.length, MAX_SERVICES);
});

test("planLoad never changes existing helpers", () => {
  const existing = Object.freeze(SERVICES.map((s) => Object.freeze({ ...s })));
  const before = JSON.stringify(existing);
  const helpers = parseOk(JSON.stringify({ app: FILE_APP, version: 1, helpers: [{ label: "Free one", url: SERVICES[0].url, model: "openrouter/free", effort: "none" }, { label: "New", url: "https://example.com/v1", model: "z" }] })).helpers;
  const plan = planLoad(existing, helpers);
  assert.equal(JSON.stringify(existing), before);
  assert.equal(plan.list[0], existing[0]);
  assert.equal(plan.list[1], existing[1]);
  assert.equal(plan.list.length, 3);
  assert.equal("chosenId" in plan, false);
});

test("refFor numbers helpers from h1", () => {
  assert.equal(refFor(0), "h1");
  assert.equal(refFor(9), "h10");
});
