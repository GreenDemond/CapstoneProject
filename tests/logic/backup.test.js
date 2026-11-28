import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildBackup, parseBackup, backupFileName, describeBackup, MAX_FILE_BYTES, FILE_APP, FILE_VERSION,
  MAX_CALENDAR_ITEMS, MAX_CHAT_TITLE,
} from "../../js/logic/backup.js";
import {
  loadForBackup, importSections, deleteAllSaved, saveProfile, saveAiSettings, loadAiSettings, saveWork, saveParked,
  saveChats, loadChats, saveBlockAnswers, loadBlockAnswers, loadProfileState, loadWork, loadParked, saveCalendarItems, loadCalendarItems, STORAGE_KEY,
} from "../../js/storage.js";
import { setGoals, emptyProfile } from "../../js/logic/profile.js";

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    key: (i) => Array.from(data.keys())[i] ?? null,
    get length() { return data.size; },
    _data: data,
  };
}

const NOW = "2026-11-20T12:00:00.000Z";
const CHAT = { id: "c1", kind: "essay", title: "Essay chat", startedOn: NOW, usedOn: NOW, items: [{ who: "you", text: "hi" }] };

function fill(storage) {
  saveProfile(setGoals(emptyProfile(), { today: "Read chapter 3" }), storage);
  saveWork({ steps: [{ id: 0, text: "Find sources", done: false }], nextId: 1, kind: "essay" }, NOW, storage);
  saveParked([{ id: 1, text: "email Sam", date: NOW }], storage);
  saveCalendarItems([{ id: "a", title: "Essay", kind: "task", due: "2026-11-25T15:30" }], storage);
  saveChats([CHAT], storage);
  saveAiSettings({ services: [{ id: "s1", label: "Mine", url: "https://example.com/v1/chat/completions", model: "m", keyHint: "abcd", checked: true }], chosenId: "s1" }, storage);
}

test("round trip: saved data comes back the same, with chats only when asked", () => {
  const a = fakeStorage();
  fill(a);
  const copy = buildBackup(loadForBackup(a), { includeChats: true, nowIso: NOW });
  const parsed = parseBackup(JSON.stringify(copy));
  assert.equal(parsed.ok, true);
  const b = fakeStorage();
  assert.equal(importSections(parsed.sections, parsed.chats, b), true);
  assert.equal(loadProfileState(b).profile.goals.today, "Read chapter 3");
  assert.equal(loadWork(b).work.steps[0].text, "Find sources");
  assert.equal(loadWork(b).work.kind, "essay");
  assert.equal(loadParked(b)[0].text, "email Sam");
  assert.equal(loadCalendarItems(b)[0].title, "Essay");
  assert.equal(loadChats(b)[0].id, "c1");

  const noChats = buildBackup(loadForBackup(a), { nowIso: NOW });
  assert.equal("chats" in noChats, false);
  assert.equal(parseBackup(JSON.stringify(noChats)).chats, undefined);
});

test("a copy never holds AI keys or AI helper settings, and loading one never brings them in", () => {
  const a = fakeStorage();
  fill(a);
  const text = JSON.stringify(buildBackup(loadForBackup(a), { includeChats: true, nowIso: NOW }));
  for (const word of ["abcd", "keyHint", "example.com", "services", "\"ai\""]) assert.equal(text.includes(word), false, word);
  const hostile = JSON.stringify({ app: FILE_APP, fileVersion: FILE_VERSION, data: { profile: emptyProfile(), ai: { services: [{ id: "x" }] }, apiKey: "sk-123" } });
  const parsed = parseBackup(hostile);
  assert.equal(parsed.ok, true);
  assert.equal("ai" in parsed.sections, false);
  assert.equal(JSON.stringify(parsed.sections).includes("sk-123"), false);
});

test("loading keeps the student's own AI helpers and replaces the rest; a missing section becomes empty", () => {
  const b = fakeStorage();
  fill(b);
  const parsed = parseBackup(JSON.stringify({ app: FILE_APP, fileVersion: 1, data: { parked: [{ id: 5, text: "new thought", date: NOW }] } }));
  assert.equal(importSections(parsed.sections, parsed.chats, b), true);
  assert.equal(loadAiSettings(b).services.length, 1);
  assert.deepEqual(loadParked(b).map((p) => p.text), ["new thought"]);
  assert.equal(loadWork(b).work, null);
  assert.equal(loadCalendarItems(b).length, 0);
  assert.equal(loadChats(b).length, 1); // no chats in the copy: saved chats stay
});

test("files that are not copies change nothing and give a reason", () => {
  const bads = [
    "", "not json", "[]", "null", "42", "\"text\"", "{}",
    JSON.stringify({ app: "other", fileVersion: 1, data: {} }),
    JSON.stringify({ app: FILE_APP, data: {} }),
    JSON.stringify({ app: FILE_APP, fileVersion: "1", data: {} }),
    JSON.stringify({ app: FILE_APP, fileVersion: 0, data: {} }),
    JSON.stringify({ app: FILE_APP, fileVersion: 1 }),
    JSON.stringify({ app: FILE_APP, fileVersion: 1, data: [] }),
    JSON.stringify({ app: FILE_APP, fileVersion: 1, data: {} }),
    JSON.stringify({ app: FILE_APP, fileVersion: 1, data: { something: 1 } }),
  ];
  for (const text of bads) {
    const result = parseBackup(text);
    assert.equal(result.ok, false, text);
    assert.equal(typeof result.reason, "string");
  }
  assert.equal(parseBackup(undefined).ok, false);
  assert.equal(parseBackup(7).ok, false);
});

test("a newer version is refused with its own message", () => {
  const result = parseBackup(JSON.stringify({ app: FILE_APP, fileVersion: FILE_VERSION + 1, data: { parked: [] } }));
  assert.equal(result.ok, false);
  assert.match(result.reason, /newer version/);
});

test("a file over the size cap is refused, by text length or by reported size", () => {
  assert.equal(parseBackup("x".repeat(MAX_FILE_BYTES + 1)).ok, false);
  const small = JSON.stringify({ app: FILE_APP, fileVersion: 1, data: { parked: [] } });
  assert.equal(parseBackup(small, MAX_FILE_BYTES + 1).ok, false);
  assert.equal(parseBackup(small, 100).ok, true);
});

test("sections of the wrong type refuse the whole file", () => {
  const wrong = [
    { profile: "x" }, { profile: [] }, { profile: { goals: "no", gotInTheWay: [] } }, { calendar: [] }, { calendar: { items: "no" } },
    { calendar: { counts: [] } }, { work: "steps" }, { work: [] }, { parked: {} }, { recall: "x" }, { moments: 3 }, { helps: {} }, { chat: [] }, { tips: "yes" },
  ];
  for (const data of wrong) {
    const result = parseBackup(JSON.stringify({ app: FILE_APP, fileVersion: 1, data }));
    assert.equal(result.ok, false, JSON.stringify(data));
  }
  assert.equal(parseBackup(JSON.stringify({ app: FILE_APP, fileVersion: 1, data: { parked: [] }, chats: {} })).ok, false);
});

test("bad entries inside a good section are dropped one by one; unknown keys are dropped", () => {
  const data = {
    parked: [{ id: 1, text: "ok", date: NOW }, { id: "x", text: "bad" }, null, 5, { id: 1, text: "dup" }],
    helps: [{ id: 1, answer: "maybe" }, { id: 2, answer: "yes", timer: 25, date: NOW, extra: "x" }],
    work: { steps: [{ id: 0, text: "a", done: true, evil: 1 }, { id: 0, text: "dup" }], nextId: 0, junk: 1 },
    chat: { guides: { essay: "Be brief", nonsense: "x" }, lengths: { essay: "long", all: "huge" }, other: 1 },
    tips: { stepTipsHidden: true, other: 1 },
    mystery: { a: 1 },
  };
  const result = parseBackup(JSON.stringify({ app: FILE_APP, fileVersion: 1, data, extra: 1 }));
  assert.equal(result.ok, true);
  assert.deepEqual(result.sections.parked.map((p) => p.text), ["ok"]);
  assert.deepEqual(result.sections.helps.map((h) => h.id), [2]);
  assert.equal(result.sections.helps[0].extra, undefined);
  assert.equal(result.sections.work.steps.length, 1);
  assert.equal(result.sections.work.steps[0].evil, undefined);
  assert.equal(result.sections.work.junk, undefined);
  assert.deepEqual(result.sections.chat.guides, { essay: "Be brief" });
  assert.deepEqual(result.sections.tips, { stepTipsHidden: true });
  assert.equal("mystery" in result.sections, false);
});

test("huge strings are cut to the app's limits", () => {
  const big = "x".repeat(100000);
  const data = {
    profile: { goals: { today: big, week: "", month: "", year: "" }, gotInTheWay: [{ id: "n", text: big, savedOn: NOW }] },
    parked: [{ id: 1, text: big, date: NOW }],
    calendar: { items: [{ id: "a", title: big, kind: "task", due: "2026-11-25T15:30", notes: big, links: ["https://a.com/" + big, "https://ok.com", "http://no.com"] }], counts: {} },
  };
  const result = parseBackup(JSON.stringify({ app: FILE_APP, fileVersion: 1, data }));
  assert.equal(result.ok, true);
  assert.equal(result.sections.profile.goals.today.length, 500);
  assert.equal(result.sections.profile.gotInTheWay[0].text.length, 500);
  assert.equal(result.sections.parked[0].text.length, 300);
  const item = result.sections.calendar.items[0];
  assert.equal(item.title.length, 200);
  assert.equal(item.notes.length, 2000);
  assert.deepEqual(item.links, ["https://ok.com"]);
});

test("too many calendar items are cut, and ids repeated or too long are dropped", () => {
  const items = [];
  for (let i = 0; i < MAX_CALENDAR_ITEMS + 50; i += 1) items.push({ id: `i${i}`, title: "t", kind: "task", due: "2026-11-25T15:30" });
  items.push({ id: "x".repeat(500), title: "long id", kind: "task", due: "2026-11-25T15:30" });
  const result = parseBackup(JSON.stringify({ app: FILE_APP, fileVersion: 1, data: { calendar: { items } } }));
  assert.equal(result.sections.calendar.items.length, MAX_CALENDAR_ITEMS);
  const dup = parseBackup(JSON.stringify({ app: FILE_APP, fileVersion: 1, data: { calendar: { items: [items[0], items[0]] } } }));
  assert.equal(dup.sections.calendar.items.length, 1);
});

test("a long chat title is cut and chat items are checked", () => {
  const chats = [{ ...CHAT, title: "t".repeat(5000), items: [{ who: "hacker", text: "x" }, { who: "you", text: "ok" }, { who: "you", text: 5 }] }];
  const result = parseBackup(JSON.stringify({ app: FILE_APP, fileVersion: 1, data: {}, chats }));
  assert.equal(result.ok, true);
  assert.equal(result.chats[0].title.length, MAX_CHAT_TITLE);
  assert.equal(result.chats[0].items.length, 1);
});

test("prototype-pollution keys do nothing", () => {
  const text = `{"app":"${FILE_APP}","fileVersion":1,"__proto__":{"polluted":true},"data":{"__proto__":{"parked":[{"id":1,"text":"x"}]},"constructor":{"prototype":{"polluted":true}},"calendar":{"counts":{"__proto__":3,"2026-11-20":2},"items":[]},"parked":[{"id":1,"text":"ok","__proto__":{"polluted":true}}],"chat":{"guides":{"__proto__":"x","essay":"fine"},"lengths":{}}}}`;
  const result = parseBackup(text);
  assert.equal(result.ok, true);
  assert.equal({}.polluted, undefined);
  assert.equal(result.sections.parked[0].text, "ok");
  assert.equal(result.sections.parked[0].polluted, undefined);
  assert.deepEqual(result.sections.calendar.counts, { "2026-11-20": 2 });
  assert.deepEqual(result.sections.chat.guides, { essay: "fine" });
  // a copy with only a __proto__ data section has nothing known in it
  const only = parseBackup(`{"app":"${FILE_APP}","fileVersion":1,"data":{"__proto__":{"parked":[{"id":1,"text":"x"}]}}}`);
  assert.equal(only.ok, false);
});

test("html in text is kept as plain text (the screens show it with textContent)", () => {
  const html = "<img src=x onerror=alert(1)>";
  const result = parseBackup(JSON.stringify({ app: FILE_APP, fileVersion: 1, data: { parked: [{ id: 1, text: html, date: NOW }] } }));
  assert.equal(result.sections.parked[0].text, html);
});

test("the lines describe a copy with counts only", () => {
  const result = parseBackup(JSON.stringify({ app: FILE_APP, fileVersion: 1, data: { parked: [{ id: 1, text: "a secret", date: NOW }] }, chats: [CHAT] }));
  assert.deepEqual(result.lines, ["1 parked thought", "1 saved chat"]);
  assert.equal(result.lines.join().includes("secret"), false);
  assert.deepEqual(describeBackup({}, undefined), ["Nothing saved (it would clear what is saved here)"]);
});

test("file name uses the day", () => {
  assert.equal(backupFileName(NOW), "focus-app-copy-2026-11-20.json");
  assert.equal(backupFileName("nonsense"), "focus-app-copy-copy.json");
});

test("a load that cannot save the chats puts the old data back", () => {
  const b = fakeStorage();
  fill(b);
  const before = b.getItem(STORAGE_KEY);
  const failing = { ...b, getItem: b.getItem, key: b.key, get length() { return b.length; }, removeItem: b.removeItem, setItem: (k, v) => { if (k.endsWith(".chats")) throw new Error("full"); b.setItem(k, v); } };
  const parsed = parseBackup(JSON.stringify({ app: FILE_APP, fileVersion: 1, data: { parked: [{ id: 9, text: "x", date: NOW }] }, chats: [CHAT] }));
  assert.equal(importSections(parsed.sections, parsed.chats, failing), false);
  assert.equal(b.getItem(STORAGE_KEY), before);
});

test("loading over damaged saved text keeps a backup and works; no storage means false", () => {
  const b = fakeStorage({ [STORAGE_KEY]: "{broken" });
  const parsed = parseBackup(JSON.stringify({ app: FILE_APP, fileVersion: 1, data: { parked: [{ id: 1, text: "x", date: NOW }] } }));
  assert.equal(importSections(parsed.sections, parsed.chats, b), true);
  assert.equal(b.getItem("focusapp.v1.backup"), "{broken");
  assert.equal(importSections(parsed.sections, undefined, null), false);
});

test("delete everything removes every focusapp key, backups too, and leaves other sites' keys", () => {
  const b = fakeStorage({ other: "keep", "focusapp.v1.backup": "x" });
  fill(b);
  assert.equal(deleteAllSaved(b), true);
  assert.deepEqual(Array.from(b._data.keys()), ["other"]);
  assert.equal(deleteAllSaved(null), false);
});

test("round trip: block-length answers travel in a copy and are named in the lines", () => {
  const a = fakeStorage();
  fill(a);
  const answers = [{ minutes: 25, answer: "shorter", on: NOW }, { minutes: 12, answer: "aboutRight", on: NOW }];
  saveBlockAnswers(answers, a);
  const copy = buildBackup(loadForBackup(a), { nowIso: NOW });
  assert.deepEqual(copy.data.blocks, answers);
  const parsed = parseBackup(JSON.stringify(copy));
  assert.equal(parsed.ok, true);
  assert.ok(parsed.lines.includes("2 answers about how long a step felt"));
  const b = fakeStorage();
  assert.equal(importSections(parsed.sections, parsed.chats, b), true);
  assert.deepEqual(loadBlockAnswers(b), answers);
});

test("a copy with damaged block-length answers keeps only the good ones; a non-list is refused", () => {
  const good = { minutes: 25, answer: "shorter", on: NOW };
  const file = (blocks) => JSON.stringify({ app: FILE_APP, fileVersion: FILE_VERSION, savedOn: NOW, data: { blocks } });
  const parsed = parseBackup(file([good, { minutes: 99, answer: "shorter", on: NOW }, "x"]));
  assert.deepEqual(parsed.sections.blocks, [good]);
  assert.equal(parseBackup(file("nope")).ok, false);
});
