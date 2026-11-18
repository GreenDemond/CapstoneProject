// Saved chats (design/chat-history.md). Pure logic: no screen, no browser storage.
// A chat is { id, kind, title, startedOn, usedOn, items: [{ who: "you" | "ai" | "note", text }] }.
import { KINDS } from "./starter-steps.js";

export const MAX_CHATS = 10;
export const MAX_CHAT_CHARS = 20000;
export const TRIM_NOTE = "Older messages in this chat aren't kept.";
const TITLE_CHARS = 40;
const WHO = ["you", "ai", "note"];

function validDate(text) {
  return typeof text === "string" && !Number.isNaN(new Date(text).getTime());
}

function kindLabel(kind) {
  return (KINDS.find((k) => k.id === kind) ?? KINDS.find((k) => k.id === "other")).label;
}

// "Essay · first 40 characters…" from the first "you" item, else "Chat · Essay".
export function titleFor(kind, items) {
  const first = items.find((item) => item.who === "you" && item.flagged !== true);
  const words = first ? first.text.replace(/\s+/g, " ").trim() : "";
  if (words === "") {
    return `Chat · ${kindLabel(kind)}`;
  }
  const short = words.length > TITLE_CHARS ? `${words.slice(0, TITLE_CHARS).trimEnd()}…` : words;
  return `${kindLabel(kind)} · ${short}`;
}

export function isPlaceholderTitle(title) {
  return typeof title === "string" && title.startsWith("Chat · ");
}

// Checks chats read back from the device. Bad chats and items are dropped one by one.
// The result is newest first and at most MAX_CHATS long.
export function normalizeChats(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set();
  const chats = [];
  for (const chat of raw) {
    if (!chat || typeof chat !== "object" || typeof chat.id !== "string" || chat.id === "" || seen.has(chat.id)) continue;
    if (!Array.isArray(chat.items) || !validDate(chat.usedOn)) continue;
    const items = [];
    for (const item of chat.items) {
      if (!item || !WHO.includes(item.who) || typeof item.text !== "string") continue;
      items.push({ who: item.who, text: item.text.slice(0, MAX_CHAT_CHARS) });
    }
    seen.add(chat.id);
    const kind = KINDS.some((k) => k.id === chat.kind) ? chat.kind : "other";
    chats.push({
      id: chat.id,
      kind,
      title: typeof chat.title === "string" && chat.title.trim() !== "" ? chat.title : titleFor(kind, items),
      startedOn: validDate(chat.startedOn) ? chat.startedOn : chat.usedOn,
      usedOn: chat.usedOn,
      items,
    });
  }
  return newestFirst(chats).slice(0, MAX_CHATS);
}

function newestFirst(chats) {
  return chats
    .map((chat, index) => ({ chat, index }))
    .sort((a, b) => new Date(b.chat.usedOn) - new Date(a.chat.usedOn) || a.index - b.index)
    .map((entry) => entry.chat);
}

// Puts the chat at the front with usedOn = now, keeps at most MAX_CHATS (the least recently used go).
export function upsertChat(chats, chat, now = new Date()) {
  const others = chats.filter((c) => c.id !== chat.id);
  return newestFirst([{ ...chat, usedOn: now.toISOString() }, ...others]).slice(0, MAX_CHATS);
}

export function deleteChat(chats, id) {
  return chats.filter((chat) => chat.id !== id);
}

// Keeps the newest items that fit in MAX_CHAT_CHARS. When anything is dropped (now or before),
// the list starts with a note saying so. The note itself does not count toward the limit.
export function trimItems(items) {
  const hadNote = items.length > 0 && items[0].who === "note" && items[0].text === TRIM_NOTE;
  const body = hadNote ? items.slice(1) : items;
  const kept = [];
  let total = 0;
  let cut = false;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    total += body[i].text.length;
    if (total > MAX_CHAT_CHARS) {
      cut = true;
      if (kept.length === 0) {
        // Even the newest item alone is too long: keep its last part.
        kept.push({ ...body[i], text: body[i].text.slice(-MAX_CHAT_CHARS) });
      }
      break;
    }
    kept.unshift(body[i]);
  }
  return hadNote || cut || kept.length < body.length ? [{ who: "note", text: TRIM_NOTE }, ...kept] : kept;
}

// What is sent to the AI: the student's and the AI's messages only. Notes are never sent,
// and neither is a message flagged in memory (the one that made the adult line show).
// Neighbours from the same side are joined with a blank line, so the sides always alternate.
export function sentMessages(items) {
  const messages = [];
  for (const item of items) {
    if ((item.who !== "you" && item.who !== "ai") || item.flagged === true) continue;
    const role = item.who === "you" ? "user" : "assistant";
    const last = messages.at(-1);
    if (last && last.role === role) {
      last.text = `${last.text}\n\n${item.text}`;
    } else {
      messages.push({ role, text: item.text });
    }
  }
  return messages;
}

// The items that may be saved: plain copies, without anything flagged.
export function savableItems(items) {
  return items.filter((item) => item.flagged !== true).map((item) => ({ who: item.who, text: item.text }));
}

// True when the chat holds something worth saving: a message from the student or the AI.
export function hasContent(items) {
  return savableItems(items).some((item) => item.who !== "note");
}

function sameLocalDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isToday(iso, now = new Date()) {
  return validDate(iso) && sameLocalDay(new Date(iso), now);
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "Today", "Yesterday", or "Tue 17 Nov" (with the year when it is not this year). Never "days ago".
export function dateLabel(iso, now = new Date()) {
  if (!validDate(iso)) {
    return "";
  }
  const date = new Date(iso);
  if (sameLocalDay(date, now)) return "Today";
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (sameLocalDay(date, yesterday)) return "Yesterday";
  const text = `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear() ? text : `${text} ${date.getFullYear()}`;
}
