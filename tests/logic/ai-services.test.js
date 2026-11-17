import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseAddress,
  addService,
  removeService,
  chosenService,
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
  const plain = parseAddress("http://ai.tail6e5320.ts.net:8080/");
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

test("a service needs a name, and the name can't be only spaces", () => {
  const { error } = addService([], { label: "   ", url: OPENROUTER_ADDRESS });
  assert.ok(error);
});

test("duplicate addresses and the list limit are refused", () => {
  const first = addService([], { label: "A", url: OPENROUTER_ADDRESS }).list;
  assert.match(addService(first, { label: "B", url: OPENROUTER_ADDRESS }).error, /already saved/);
  let list = [];
  for (let i = 0; i < MAX_SERVICES; i += 1) {
    list = addService(list, { label: `S${i}`, url: `https://s${i}.example.com` }).list;
  }
  assert.match(addService(list, { label: "one more", url: "https://more.example.com" }).error, /up to 10/);
});

test("removing a service keeps the others in order", () => {
  let list = addService([], { label: "A", url: "https://a.example.com" }).list;
  list = addService(list, { label: "B", url: "https://b.example.com" }).list;
  const [first] = list;
  assert.deepEqual(removeService(list, first.id).map((s) => s.label), ["B"]);
});

test("the chosen service falls back to the first when the choice is gone", () => {
  let list = addService([], { label: "A", url: "https://a.example.com" }).list;
  list = addService(list, { label: "B", url: "https://b.example.com" }).list;
  assert.equal(chosenService(list, "missing").label, "A");
  assert.equal(chosenService([], "anything"), null);
});

test("the paste screen warns when no AI is ready, even if one is saved without a key", () => {
  const list = addService([], { label: "Home AI", url: "https://home.example.com" }).list;
  assert.match(pasteStatus(list, null), /No AI is set up yet/);
  assert.match(pasteStatus([], null), /No AI is set up yet/);
  const ready = list.map((s) => ({ ...s, keyReady: true }));
  assert.equal(pasteStatus(ready, null), "Using: Home AI");
});

test("damaged saved entries are dropped one at a time and the rest kept", () => {
  const cleaned = normalizeServices({
    services: [
      { id: "a", label: "Good", url: "https://good.example.com" },
      { id: "b", label: "Bad address", url: "ftp://nope" },
      { id: "c", label: "", url: "https://blank.example.com" },
      "junk",
    ],
    chosenId: "a",
  });
  assert.deepEqual(cleaned.services.map((s) => s.label), ["Good"]);
  assert.equal(cleaned.chosenId, "a");
  assert.deepEqual(normalizeServices("nonsense"), { services: [], chosenId: null });
});

test("saved settings keep the profile and calendar sections", () => {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, profile: { goals: { today: "x" } }, calendar: { items: [], counts: { "2026-11-17": 2 } } }));
  const settings = { services: [{ id: "a", label: "A", url: "https://a.example.com", keyReady: false }], chosenId: "a" };
  assert.equal(saveAiSettings(settings, storage), true);
  const saved = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.deepEqual(saved.profile, { goals: { today: "x" } });
  assert.deepEqual(saved.calendar.counts, { "2026-11-17": 2 });
  assert.deepEqual(loadAiSettings(storage).services.map((s) => s.label), ["A"]);
});
