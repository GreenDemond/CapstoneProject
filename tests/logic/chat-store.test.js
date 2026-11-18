import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_CHATS, MAX_CHAT_CHARS, TRIM_NOTE, normalizeChats, titleFor, upsertChat, trimItems, deleteChat,
  sentMessages, savableItems, hasContent, dateLabel, isToday, isPlaceholderTitle,
} from "../../js/logic/chat-store.js";

const chat = (id, usedOn, items = [{ who: "you", text: "hi" }]) => ({ id, kind: "essay", title: `t-${id}`, startedOn: usedOn, usedOn, items });
const at = (day) => `2026-11-${String(day).padStart(2, "0")}T10:00:00.000Z`;

test("titleFor uses the kind label and the first 40 characters of the first saved message", () => {
  assert.equal(titleFor("essay", [{ who: "you", text: "how do I start my intro" }]), "Essay · how do I start my intro");
  const long = titleFor("reading", [{ who: "you", text: "a".repeat(60) }]);
  assert.equal(long, `Reading · ${"a".repeat(40)}…`);
});

test("titleFor skips AI and note items, collapses spaces, and falls back to Chat · kind", () => {
  assert.equal(titleFor("essay", []), "Chat · Essay");
  assert.equal(titleFor("project", [{ who: "ai", text: "hello" }, { who: "you", text: "a\n\n  b" }]), "Project · a b");
  assert.equal(titleFor("essay", [{ who: "you", text: "   " }]), "Chat · Essay");
  assert.equal(titleFor("nonsense", []), "Chat · Something else");
});

test("titleFor never uses a flagged message", () => {
  assert.equal(titleFor("essay", [{ who: "you", text: "secret", flagged: true }, { who: "you", text: "ok" }]), "Essay · ok");
  assert.equal(titleFor("essay", [{ who: "you", text: "secret", flagged: true }]), "Chat · Essay");
});

test("isPlaceholderTitle recognises the fallback only", () => {
  assert.equal(isPlaceholderTitle("Chat · Essay"), true);
  assert.equal(isPlaceholderTitle("Essay · hello"), false);
});

test("normalizeChats keeps a good chat", () => {
  const good = chat("a", at(10));
  assert.deepEqual(normalizeChats([good]), [good]);
});

test("normalizeChats survives garbage and drops bad chats one by one", () => {
  for (const raw of [null, undefined, 5, "x", {}, [null, 3, "x", []]]) {
    assert.deepEqual(normalizeChats(raw), []);
  }
  const result = normalizeChats([
    chat("ok", at(10)),
    { ...chat("noitems", at(10)), items: "x" },
    { ...chat("", at(10)) },
    { ...chat("baddate", "yesterday") },
    { ...chat(5, at(10)), id: 5 },
    chat("ok", at(11)), // duplicate id
  ]);
  assert.deepEqual(result.map((c) => c.id), ["ok"]);
});

test("normalizeChats drops bad items, fixes kind, and rebuilds a missing title", () => {
  const [c] = normalizeChats([
    {
      id: "a", kind: "weird", usedOn: at(10),
      items: [{ who: "you", text: "first" }, { who: "robot", text: "x" }, { who: "ai", text: 5 }, null, { who: "note", text: "n", extra: 1 }],
    },
  ]);
  assert.equal(c.kind, "other");
  assert.equal(c.title, "Something else · first");
  assert.equal(c.startedOn, at(10));
  assert.deepEqual(c.items, [{ who: "you", text: "first" }, { who: "note", text: "n" }]);
});

test("normalizeChats sorts newest first and keeps at most 10", () => {
  const raw = Array.from({ length: 14 }, (_, i) => chat(`c${i}`, at(i + 1)));
  const result = normalizeChats(raw);
  assert.equal(result.length, MAX_CHATS);
  assert.equal(result[0].id, "c13");
  assert.equal(result.at(-1).id, "c4");
});

test("upsertChat puts the chat first and sets usedOn to now", () => {
  const chats = [chat("a", at(10)), chat("b", at(9))];
  const next = upsertChat(chats, chat("b", at(9)), new Date("2026-11-17T12:00:00Z"));
  assert.deepEqual(next.map((c) => c.id), ["b", "a"]);
  assert.equal(next[0].usedOn, "2026-11-17T12:00:00.000Z");
  assert.equal(chats[0].id, "a"); // input unchanged
});

test("the 11th chat pushes out the least recently used one", () => {
  let chats = [];
  for (let i = 1; i <= 10; i += 1) {
    chats = upsertChat(chats, chat(`c${i}`, at(i)), new Date(`2026-11-${String(i).padStart(2, "0")}T12:00:00Z`));
  }
  assert.equal(chats.length, 10);
  chats = upsertChat(chats, chat("c11", at(11)), new Date("2026-11-11T12:00:00Z"));
  assert.equal(chats.length, 10);
  assert.equal(chats[0].id, "c11");
  assert.equal(chats.some((c) => c.id === "c1"), false);
  // using an old chat again keeps it and drops a different one
  chats = upsertChat(chats, chat("c2", at(2)), new Date("2026-11-12T12:00:00Z"));
  assert.equal(chats[0].id, "c2");
  assert.equal(chats.length, 10);
});

test("deleteChat removes one chat and leaves the rest", () => {
  const chats = [chat("a", at(10)), chat("b", at(9))];
  assert.deepEqual(deleteChat(chats, "a").map((c) => c.id), ["b"]);
  assert.equal(deleteChat(chats, "zzz").length, 2);
});

test("trimItems leaves a short chat alone", () => {
  const items = [{ who: "you", text: "a" }, { who: "ai", text: "b" }];
  assert.deepEqual(trimItems(items), items);
  assert.deepEqual(trimItems([]), []);
});

test("a very long chat keeps the newest items and starts with the note", () => {
  const items = Array.from({ length: 30 }, (_, i) => ({ who: i % 2 ? "ai" : "you", text: `${i}`.padEnd(1500, "x") }));
  const trimmed = trimItems(items);
  assert.deepEqual(trimmed[0], { who: "note", text: TRIM_NOTE });
  const body = trimmed.slice(1);
  assert.equal(body.at(-1), items.at(-1));
  assert.ok(body.reduce((n, item) => n + item.text.length, 0) <= MAX_CHAT_CHARS);
  assert.ok(body.length >= 12); // 20000 / 1500
  assert.ok(body.length < 30);
});

test("trimming again does not stack notes, and keeps the note once something was dropped before", () => {
  const items = Array.from({ length: 30 }, () => ({ who: "you", text: "x".repeat(1500) }));
  const once = trimItems(items);
  const twice = trimItems(once);
  assert.deepEqual(twice, once);
  assert.equal(twice.filter((i) => i.who === "note").length, 1);
  const small = trimItems([{ who: "note", text: TRIM_NOTE }, { who: "you", text: "a" }]);
  assert.equal(small[0].text, TRIM_NOTE);
  assert.equal(small.length, 2);
});

test("one item bigger than the whole limit is kept cut to its last part, with the note", () => {
  const text = "a".repeat(5) + "z".repeat(MAX_CHAT_CHARS);
  const trimmed = trimItems([{ who: "ai", text }]);
  assert.deepEqual(trimmed, [{ who: "note", text: TRIM_NOTE }, { who: "ai", text: "z".repeat(MAX_CHAT_CHARS) }]);
  assert.deepEqual(trimItems(trimmed), trimmed);
  const newest = trimItems([{ who: "you", text: "old" }, { who: "ai", text: "y".repeat(MAX_CHAT_CHARS + 1) }]);
  assert.equal(newest.length, 2);
  assert.equal(newest[1].text.length, MAX_CHAT_CHARS);
});

test("sentMessages sends only you and ai items, never notes or a flagged message", () => {
  const items = [
    { who: "you", text: "one" },
    { who: "ai", text: "two" },
    { who: "note", text: "cut off" },
    { who: "you", text: "serious", flagged: true },
    { who: "note", text: "adult line" },
    { who: "you", text: "back to work" },
  ];
  assert.deepEqual(sentMessages(items), [
    { role: "user", text: "one" },
    { role: "assistant", text: "two" },
    { role: "user", text: "back to work" },
  ]);
  assert.deepEqual(sentMessages([]), []);
});

test("sentMessages joins neighbours from the same side so the sides alternate", () => {
  const items = [
    { who: "you", text: "first" },
    { who: "you", text: "second" },
    { who: "ai", text: "answer" },
    { who: "you", text: "flagged", flagged: true },
    { who: "note", text: "adult line" },
    { who: "ai", text: "more" },
  ];
  assert.deepEqual(sentMessages(items), [
    { role: "user", text: "first\n\nsecond" },
    { role: "assistant", text: "answer\n\nmore" },
  ]);
});

test("savableItems drops flagged items and the flag field; hasContent needs a real message", () => {
  const items = [{ who: "you", text: "bad", flagged: true }, { who: "note", text: "adult line" }];
  assert.deepEqual(savableItems(items), [{ who: "note", text: "adult line" }]);
  assert.equal(hasContent(items), false);
  assert.equal(hasContent([...items, { who: "ai", text: "hi" }]), true);
  assert.equal(hasContent([]), false);
});

test("dateLabel says Today, Yesterday, or a plain date, never days ago", () => {
  const now = new Date(2026, 10, 17, 15, 0); // Tue 17 Nov 2026, local
  assert.equal(dateLabel(new Date(2026, 10, 17, 1, 0).toISOString(), now), "Today");
  assert.equal(dateLabel(new Date(2026, 10, 16, 23, 0).toISOString(), now), "Yesterday");
  assert.equal(dateLabel(new Date(2026, 10, 10, 12, 0).toISOString(), now), "Tue 10 Nov");
  assert.equal(dateLabel(new Date(2025, 10, 17, 12, 0).toISOString(), now), "Mon 17 Nov 2025");
  assert.equal(dateLabel(new Date(2026, 0, 1, 12, 0).toISOString(), new Date(2026, 0, 2, 9, 0)), "Yesterday");
  assert.equal(dateLabel("nonsense", now), "");
  assert.equal(dateLabel(undefined, now), "");
});

test("isToday uses the local date", () => {
  const now = new Date(2026, 10, 17, 0, 5);
  assert.equal(isToday(new Date(2026, 10, 17, 23, 59).toISOString(), now), true);
  assert.equal(isToday(new Date(2026, 10, 16, 23, 59).toISOString(), now), false);
  assert.equal(isToday("junk", now), false);
});
