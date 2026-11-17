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
  OPENROUTER_ADDRESS,
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

test("duplicate addresses and the list limit are refused", () => {
  const first = addService([], { label: "A", url: OPENROUTER_ADDRESS, model: "m" }).list;
  assert.match(addService(first, { label: "B", url: OPENROUTER_ADDRESS, model: "m" }).error, /already saved/);
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
