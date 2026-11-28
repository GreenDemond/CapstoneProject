import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chatAddress,
  parseAddress,
  addService,
  removeService,
  inUseHelper,
  pasteStatus,
  normalizeServices,
  MAX_SERVICES,
  reasoningFor,
  EFFORTS,
  EFFORT_IGNORED_LINE,
  MUST_THINK_LINE,
  effortRefusedLine,
  OPENROUTER_ADDRESS,
  MAX_LABEL,
  modelTaken,
  autoName,
  shortModel,
  uniqueName,
} from "../../js/logic/ai-services.js";
import { loadAiSettings, saveAiSettings, STORAGE_KEY } from "../../js/storage.js";

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
  };
}

test("http and https addresses are both accepted, and http is flagged", () => {
  assert.equal(parseAddress("https://example.com/v1").plainHttp, false);
  const plain = parseAddress("http://my-computer.example.ts.net:8080/");
  assert.equal(plain.ok, true);
  assert.equal(plain.plainHttp, true);
});

test("empty, broken, and non-web addresses are refused with a plain reason", () => {
  assert.equal(parseAddress("").ok, false);
  assert.equal(parseAddress("   ").ok, false);
  assert.equal(parseAddress("not an address").ok, false);
  assert.equal(parseAddress("ftp://example.com").ok, false);
  assert.equal(parseAddress("javascript:alert(1)").ok, false);
});

test("an address with a name and password in it is refused", () => {
  assert.equal(parseAddress("https://user:secret@example.com").ok, false);
});

test("a blank name defaults to the address's host, and a name is not required", () => {
  const { list, error } = addService([], { label: "   ", url: "http://my-computer.example.ts.net:8080" });
  assert.equal(error, null);
  assert.equal(list[0].label, "my-computer.example.ts.net");
});

test("the student types a base address, and the app adds the chat path", () => {
  assert.equal(chatAddress("http://my-computer.example.ts.net:8080"), "http://my-computer.example.ts.net:8080/v1/chat/completions");
  assert.equal(chatAddress("https://openrouter.ai/api/v1"), "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(chatAddress("https://openrouter.ai/api/v1/chat/completions"), "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(chatAddress("https://home.example.com/custom/run"), null);
  assert.equal(chatAddress("nope"), null);
});

test("an OpenRouter service defaults to openrouter/free, and another service has no default", () => {
  const openrouter = addService([], { label: "OR", url: "https://openrouter.ai/api/v1" }).list[0];
  assert.equal(openrouter.model, "openrouter/free");
  const other = addService([], { label: "Other", url: "https://other.example.com" }).list[0];
  assert.equal(other.model, "");
});

test("a model name is optional when adding; it is picked from the list later", () => {
  const { list, error } = addService([], { label: "A", url: "https://a.example.com" });
  assert.equal(error, null);
  assert.equal(list[0].model, "");
});

test("the same AI at the same address is refused, and the list limit too", () => {
  const first = addService([], { label: "A", url: OPENROUTER_ADDRESS, model: "m" }).list;
  assert.equal(addService(first, { label: "B", url: OPENROUTER_ADDRESS, model: "m" }).error, "You already have a helper for that AI at that address.");
  let list = [];
  for (let i = 0; i < MAX_SERVICES; i += 1) {
    list = addService(list, { label: `S${i}`, url: `https://s${i}.example.com`, model: "m" }).list;
  }
  assert.match(addService(list, { label: "one more", url: "https://more.example.com", model: "m" }).error, /up to 10/);
});

test("removing a service keeps the others in order", () => {
  let list = addService([], { label: "A", url: "https://a.example.com", model: "m" }).list;
  list = addService(list, { label: "B", url: "https://b.example.com", model: "m" }).list;
  const [first] = list;
  assert.deepEqual(removeService(list, first.id).map((s) => s.label), ["B"]);
});

test("the helper in use falls back to a ready one, or none, when the choice is gone", () => {
  let list = addService([], { label: "A", url: "https://a.example.com", model: "m" }).list;
  list = addService(list, { label: "B", url: "https://b.example.com", model: "m" }).list;
  assert.equal(inUseHelper(list, "missing"), null);
  assert.equal(inUseHelper([], "anything"), null);
});

test("the paste screen warns when no AI is ready, even if one is saved without a key", () => {
  const list = addService([], { label: "Home AI", url: "https://home.example.com", model: "m" }).list;
  assert.match(pasteStatus(list, null), /Home AI isn.t ready yet/);
  assert.match(pasteStatus([], null), /No AI is set up yet/);
  const ready = list.map((s) => ({ ...s, keyReady: true }));
  assert.equal(pasteStatus(ready, null), "Using: Home AI");
});

test("damaged saved entries are dropped one at a time and the rest kept", () => {
  const cleaned = normalizeServices({
    services: [
      { id: "a", label: "Good", url: "https://good.example.com", model: "m" },
      { id: "b", label: "Bad address", url: "ftp://nope", model: "m" },
      { id: "c", label: "", url: "https://blank.example.com", model: "m" },
      { id: "d", label: "No model", url: "https://nomodel.example.com" },
      "junk",
    ],
    chosenId: "a",
  });
  assert.deepEqual(cleaned.services.map((s) => s.label), ["Good", "No model"]);
  assert.equal(cleaned.services[0].model, "m");
  assert.equal(cleaned.services[1].model, "");
  assert.equal(cleaned.chosenId, "a");
  assert.deepEqual(normalizeServices("nonsense"), { services: [], chosenId: null });
});

test("saved settings keep the profile and calendar sections", () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, profile: { goals: { today: "x" } }, calendar: { items: [], counts: { "2026-11-17": 2 } } }));
  const settings = { services: [{ id: "a", label: "A", url: "https://a.example.com", model: "m", keyReady: false }], chosenId: "a" };
  assert.equal(saveAiSettings(settings, storage), true);
  const saved = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.deepEqual(saved.profile, { goals: { today: "x" } });
  assert.deepEqual(saved.calendar.counts, { "2026-11-17": 2 });
  assert.deepEqual(loadAiSettings(storage).services.map((s) => s.label), ["A"]);
});

import { modelsAddress, readModelIds } from "../../js/logic/ai-services.js";

test("the model list address follows the standard for OpenRouter and an OpenAI-style service", () => {
  assert.equal(modelsAddress("https://openrouter.ai/api/v1/chat/completions"), "https://openrouter.ai/api/v1/models");
  assert.equal(modelsAddress("http://my-computer.example.ts.net:8080/v1/chat/completions"), "http://my-computer.example.ts.net:8080/v1/models");
});

test("a chat address that is not the standard form gives no guessed list address", () => {
  assert.equal(modelsAddress("https://home.example.com/custom/run"), null);
  assert.equal(modelsAddress("not a url"), null);
});

test("model ids are read from the standard list reply, and damaged items are skipped", () => {
  assert.deepEqual(readModelIds({ object: "list", data: [{ id: "a" }, { id: "" }, "b", null, { id: 5 }] }), ["a", "b"]);
  assert.deepEqual(readModelIds({}), []);
});

test("several helpers can share an address when their AIs differ; the model name is case-sensitive", () => {
  let list = addService([], { url: OPENROUTER_ADDRESS, model: "openai/gpt-oss-20b:free" }).list;
  const second = addService(list, { url: OPENROUTER_ADDRESS, model: "anthropic/claude-x" });
  assert.equal(second.error, null);
  assert.equal(addService(second.list, { url: OPENROUTER_ADDRESS, model: "Anthropic/claude-x" }).error, null);
  assert.match(addService(second.list, { url: OPENROUTER_ADDRESS, model: "anthropic/claude-x" }).error, /already have a helper for that AI/);
  // Another address with the same model is fine.
  assert.equal(addService(second.list, { url: "https://other.example.com", model: "anthropic/claude-x" }).error, null);
});

test("modelTaken ignores the helper being changed", () => {
  const list = addService([], { url: OPENROUTER_ADDRESS, model: "m" }).list;
  assert.equal(modelTaken(list, OPENROUTER_ADDRESS, "m"), true);
  assert.equal(modelTaken(list, OPENROUTER_ADDRESS, "m", list[0].id), false);
});

test("automatic names: OpenRouter, other hosts, vendor prefix removed, numbered when used", () => {
  assert.equal(autoName(OPENROUTER_ADDRESS, "openai/gpt-oss-20b:free"), "OpenRouter · gpt-oss-20b:free");
  assert.equal(autoName(OPENROUTER_ADDRESS, "openrouter/free"), "OpenRouter · openrouter/free");
  assert.equal(autoName("https://ai.example.test/v1/chat/completions", "small-model"), "ai.example.test · small-model");
  assert.equal(autoName("https://ai.example.test/v1/chat/completions", ""), "ai.example.test");
  assert.equal(shortModel("a/b/c"), "b/c");
  assert.equal(shortModel("plain"), "plain");
  assert.ok(autoName(OPENROUTER_ADDRESS, "v/" + "x".repeat(99)).length <= MAX_LABEL);
});

test("a blank name is made automatically and numbered when already used; a typed used name is refused", () => {
  let list = [];
  const url = "https://ai.example.test";
  list = addService(list, { url, model: "m" }).list;
  assert.equal(list[0].label, "ai.example.test · m");
  list = addService(list, { label: "ai.example.test · m (2)", url, model: "n" }).list;
  // The same host and AI over http is a different address, so its automatic name gets a number.
  const numbered = addService(list, { url: "http://ai.example.test", model: "m" });
  assert.equal(numbered.error, null);
  assert.equal(numbered.list.at(-1).label, "ai.example.test · m (3)");
  const typedDuplicate = addService(list, { label: "AI.EXAMPLE.TEST · M", url, model: "z" });
  assert.equal(typedDuplicate.error, "You already have a helper called that. Pick another name.");
  assert.equal(uniqueName(list, "ai.example.test · m"), "ai.example.test · m (3)");
  assert.equal(uniqueName(list, "fresh"), "fresh");
  assert.ok(uniqueName([{ id: "x", label: "y".repeat(60) }], "y".repeat(60)).length <= MAX_LABEL);
});

test("loading drops repeated ids, names, or the same AI at the same address, keeping the first", () => {
  const url = "https://openrouter.ai/api/v1/chat/completions";
  const { services } = normalizeServices({ services: [
    { id: "a", label: "One", url, model: "m1" },
    { id: "a", label: "Two", url, model: "m2" },
    { id: "b", label: "one", url, model: "m3" },
    { id: "c", label: "Three", url, model: "m1" },
    { id: "d", label: "Four", url, model: "m4" },
  ] });
  assert.deepEqual(services.map((s) => s.id), ["a", "d"]);
});

test("new helpers start on Low effort", () => {
  assert.equal(addService([], { label: "R", url: "https://openrouter.ai/api/v1" }).list[0].effort, "low");
  assert.equal(addService([], { label: "O", url: "https://home.example.com", model: "m" }).list[0].effort, "low");
  assert.deepEqual(EFFORTS.map((e) => e.label), ["None", "Low", "Medium", "High"]);
});

test("normalizeServices keeps a valid effort, otherwise Low, and drops the old think field", () => {
  const home = "https://home.example.com/v1/chat/completions";
  const cleaned = normalizeServices({
    services: [
      { id: "a", label: "A", url: home, model: "1", effort: "none" },
      { id: "b", label: "B", url: home, model: "2", effort: "high" },
      { id: "c", label: "C", url: home, model: "3", effort: "extreme" },
      { id: "d", label: "D", url: home, model: "4" },
      { id: "e", label: "E", url: home, model: "5", think: false },
      { id: "f", label: "F", url: home, model: "6", effort: 3 },
    ],
  });
  assert.deepEqual(cleaned.services.map((s) => s.effort), ["none", "high", "low", "low", "low", "low"]);
  assert.ok(cleaned.services.every((s) => !("think" in s)));
});

test("reasoningFor always sends the effort: OpenRouter one field, others by effort", () => {
  const router = "https://openrouter.ai/api/v1/chat/completions";
  const other = "https://home.example.com/v1/chat/completions";
  for (const effort of ["none", "low", "medium", "high"]) {
    assert.deepEqual(reasoningFor({ url: router, effort }), { reasoning: { effort } });
  }
  assert.deepEqual(reasoningFor({ url: other, effort: "none" }), { reasoning: { effort: "none" }, reasoning_effort: "none", chat_template_kwargs: { enable_thinking: false } });
  for (const effort of ["low", "medium", "high"]) {
    assert.deepEqual(reasoningFor({ url: other, effort }), { reasoning: { effort }, reasoning_effort: effort });
  }
  assert.deepEqual(reasoningFor({ url: "https://openrouter.ai.evil.test/v1/chat/completions", effort: "low" }), { reasoning: { effort: "low" }, reasoning_effort: "low" });
  assert.deepEqual(reasoningFor({ url: router }), { reasoning: { effort: "low" } });
});

test("the refused-setting line depends on the effort", () => {
  assert.equal(effortRefusedLine({ effort: "none" }), MUST_THINK_LINE);
  assert.equal(effortRefusedLine({ effort: "low" }), EFFORT_IGNORED_LINE);
});

// The "Which AI helper?" menu in Talk.
const svc = (id, label, extra = {}) => ({ id, label, url: "https://x.example.test/v1/chat/completions", model: "m", keyReady: true, checked: true, ...extra });

test("talkHelperMenu: no helpers means no menu", async () => {
  const { talkHelperMenu } = await import("../../js/logic/ai-services.js");
  assert.deepEqual(talkHelperMenu([], null), { options: [], selectedId: null, show: false, finishInSettings: false });
  assert.equal(talkHelperMenu(undefined, null).show, false);
});

test("talkHelperMenu: one ready helper is listed and selected", async () => {
  const { talkHelperMenu } = await import("../../js/logic/ai-services.js");
  const menu = talkHelperMenu([svc("a", "One")], null);
  assert.equal(menu.show, true);
  assert.equal(menu.selectedId, "a");
  assert.deepEqual(menu.options, [{ id: "a", label: "One", disabled: false, selected: true }]);
  assert.equal(menu.finishInSettings, false);
});

test("talkHelperMenu: unready helpers are disabled with the reason", async () => {
  const { talkHelperMenu } = await import("../../js/logic/ai-services.js");
  const menu = talkHelperMenu([svc("a", "NoKey", { keyReady: false }), svc("b", "NoAi", { model: "" }), svc("c", "Neither", { keyReady: false, model: "" }), svc("d", "Fine")], "d");
  assert.deepEqual(menu.options.map((o) => [o.label, o.disabled, o.selected]), [
    ["NoKey (needs a key)", true, false],
    ["NoAi (needs an AI picked)", true, false],
    ["Neither (needs a key and an AI picked)", true, false],
    ["Fine", false, true],
  ]);
});

test("talkHelperMenu: only unready helpers selects nothing and asks to finish in Settings", async () => {
  const { talkHelperMenu } = await import("../../js/logic/ai-services.js");
  const menu = talkHelperMenu([svc("a", "One", { keyReady: false })], "a");
  assert.equal(menu.selectedId, null);
  assert.equal(menu.finishInSettings, true);
  assert.equal(menu.options[0].selected, false);
});

test("talkHelperMenu: a chosen helper that is not ready is not replaced by another", async () => {
  const { talkHelperMenu } = await import("../../js/logic/ai-services.js");
  const menu = talkHelperMenu([svc("a", "One", { model: "" }), svc("b", "Two")], "a");
  assert.equal(menu.selectedId, null);
  assert.equal(menu.finishInSettings, true);
});

test("talkHelperMenu: duplicate labels and damaged entries do not break it", async () => {
  const { talkHelperMenu } = await import("../../js/logic/ai-services.js");
  const menu = talkHelperMenu([svc("a", "Same"), null, { label: "no id" }, svc("b", "Same"), 5], null);
  assert.deepEqual(menu.options.map((o) => o.label), ["Same", "Same (2)"]);
  assert.equal(menu.selectedId, "a");
});
