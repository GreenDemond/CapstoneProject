// Save a copy / Load a copy (design/me-export-w7.md, DECISIONS T4). Pure logic: no screen, no browser storage.
// A copy is a JSON file the student keeps. Loading one is the riskiest thing the app does, so every
// part of the file is checked, anything unknown is dropped, and a bad file changes nothing.
// AI keys and AI helper settings are never put in a copy, and a copy can never bring them in.
import { normalizeProfile } from "./profile.js";
import { normalizeWork } from "./work.js";
import { normalizeParked, normalizeRecall } from "./work-extras.js";
import { normalizeBlockAnswers } from "./block-length.js";
import { normalizeMoments, normalizeHelps } from "./looking-back.js";
import { normalizeChatSettings } from "./chat-settings.js";
import { normalizeChats } from "./chat-store.js";
import { normalizeCalendarItems, normalizeCounts, MAX_TITLE, MAX_NOTES, MAX_LINKS } from "./calendar.js";
import { plural } from "./looking-back.js";

export const FILE_APP = "focus-app-copy";
export const FILE_VERSION = 1;
export const MAX_FILE_BYTES = 2000000;
export const MAX_CALENDAR_ITEMS = 500;
export const MAX_COUNT_DAYS = 4000;
export const MAX_ID_LENGTH = 100;
export const MAX_LINK_LENGTH = 500;
export const MAX_CHAT_TITLE = 100;
const MAX_DATE_TEXT = 40;

const DATA_NAMES = ["profile", "calendar", "work", "parked", "recall", "moments", "helps", "blocks", "chat", "tips"];

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Reads only a property the object itself has, never one inherited from a prototype.
function own(object, name) {
  return isPlainObject(object) && Object.hasOwn(object, name) ? object[name] : undefined;
}

function present(value) {
  return value !== undefined && value !== null;
}

// The file name for a copy made on this day, such as focus-app-copy-2026-11-20.json.
export function backupFileName(nowIso) {
  const day = typeof nowIso === "string" && /^\d{4}-\d{2}-\d{2}/.test(nowIso) ? nowIso.slice(0, 10) : "copy";
  return `focus-app-copy-${day}.json`;
}

// Builds the object to save. `sections` holds what the app has now:
// { profile, calendarItems, counts, work, workSavedOn, parked, recall, moments, helps, blocks, chatSettings, tipsHidden, chats }.
// Chats go in only when includeChats is true. Nothing about AI helpers or keys is ever added.
export function buildBackup(sections, { includeChats = false, nowIso = new Date().toISOString() } = {}) {
  const data = {};
  if (sections.profile) data.profile = sections.profile;
  const items = sections.calendarItems ?? [];
  const counts = sections.counts ?? {};
  if (items.length > 0 || Object.keys(counts).length > 0) data.calendar = { items, counts };
  if (sections.work) {
    data.work = { ...sections.work, ...(sections.workSavedOn ? { savedOn: sections.workSavedOn } : {}) };
  }
  for (const name of ["parked", "recall", "moments", "helps", "blocks"]) {
    if ((sections[name] ?? []).length > 0) data[name] = sections[name];
  }
  const chat = sections.chatSettings;
  if (chat && (Object.keys(chat.guides ?? {}).length > 0 || Object.keys(chat.lengths ?? {}).length > 0)) {
    data.chat = { guides: chat.guides ?? {}, lengths: chat.lengths ?? {} };
  }
  if (sections.tipsHidden === true) data.tips = { stepTipsHidden: true };
  const file = { app: FILE_APP, fileVersion: FILE_VERSION, savedOn: nowIso, data };
  if (includeChats) file.chats = sections.chats ?? [];
  return file;
}

function bad(reason) {
  return { ok: false, reason };
}

const NOT_MINE = "That file is not a copy made by this app.";
const DAMAGED = "Part of that file is damaged, so none of it can be used.";

function cleanCalendar(raw) {
  if (!isPlainObject(raw)) return undefined;
  const itemsRaw = own(raw, "items");
  const countsRaw = own(raw, "counts");
  if ((present(itemsRaw) && !Array.isArray(itemsRaw)) || (present(countsRaw) && !isPlainObject(countsRaw))) {
    return undefined;
  }
  const seen = new Set();
  const items = [];
  for (const item of normalizeCalendarItems(itemsRaw ?? [])) {
    if (items.length >= MAX_CALENDAR_ITEMS) break;
    if (item.id === "" || item.id.length > MAX_ID_LENGTH || seen.has(item.id)) continue;
    seen.add(item.id);
    items.push({
      ...item,
      title: item.title.trim().slice(0, MAX_TITLE),
      notes: item.notes.slice(0, MAX_NOTES),
      links: item.links.filter((link) => link.length <= MAX_LINK_LENGTH).slice(0, MAX_LINKS),
    });
  }
  const counts = Object.fromEntries(Object.entries(normalizeCounts(countsRaw ?? {})).slice(0, MAX_COUNT_DAYS));
  return { items, counts };
}

// Checks the text of a file. Returns { ok: true, sections, chats, lines } where sections is what
// to save (a value, or null for "nothing") and chats is a list or undefined (undefined means the
// copy has no chats, so saved chats are left alone); or { ok: false, reason } and nothing else.
export function parseBackup(text, byteSize = null) {
  if (typeof text !== "string") return bad(NOT_MINE);
  if ((byteSize !== null && byteSize > MAX_FILE_BYTES) || text.length > MAX_FILE_BYTES) {
    return bad("That file is too big to be one of this app's copies.");
  }
  let file;
  try {
    file = JSON.parse(text);
  } catch {
    return bad(NOT_MINE);
  }
  if (!isPlainObject(file) || own(file, "app") !== FILE_APP) return bad(NOT_MINE);
  const version = own(file, "fileVersion");
  if (!Number.isInteger(version) || version < 1) return bad(NOT_MINE);
  if (version > FILE_VERSION) {
    return bad("That copy was made by a newer version of the app, so this version can't read it.");
  }
  const data = own(file, "data");
  if (!isPlainObject(data)) return bad(NOT_MINE);

  const sections = {};
  for (const name of DATA_NAMES) sections[name] = null;

  const profile = own(data, "profile");
  if (present(profile)) {
    const clean = normalizeProfile(profile);
    if (!clean) return bad(DAMAGED);
    sections.profile = clean;
  }

  const calendar = own(data, "calendar");
  if (present(calendar)) {
    const clean = cleanCalendar(calendar);
    if (!clean) return bad(DAMAGED);
    sections.calendar = clean.items.length > 0 || Object.keys(clean.counts).length > 0 ? clean : null;
  }

  const work = own(data, "work");
  if (present(work)) {
    if (!isPlainObject(work)) return bad(DAMAGED);
    const clean = normalizeWork(work);
    if (clean) {
      const savedOn = own(work, "savedOn");
      sections.work = {
        ...clean,
        savedOn: typeof savedOn === "string" && savedOn.length <= MAX_DATE_TEXT ? savedOn : "",
      };
    }
  }

  const lists = { parked: normalizeParked, recall: normalizeRecall, moments: normalizeMoments, helps: normalizeHelps, blocks: normalizeBlockAnswers };
  for (const [name, normalize] of Object.entries(lists)) {
    const raw = own(data, name);
    if (!present(raw)) continue;
    if (!Array.isArray(raw)) return bad(DAMAGED);
    const clean = normalize(raw);
    sections[name] = clean.length > 0 ? clean : null;
  }

  const chat = own(data, "chat");
  if (present(chat)) {
    if (!isPlainObject(chat)) return bad(DAMAGED);
    const clean = normalizeChatSettings({ guides: own(chat, "guides"), lengths: own(chat, "lengths") });
    sections.chat = Object.keys(clean.guides).length > 0 || Object.keys(clean.lengths).length > 0 ? clean : null;
  }

  const tips = own(data, "tips");
  if (present(tips)) {
    if (!isPlainObject(tips)) return bad(DAMAGED);
    sections.tips = own(tips, "stepTipsHidden") === true ? { stepTipsHidden: true } : null;
  }

  let chats;
  const chatsRaw = own(file, "chats");
  if (present(chatsRaw)) {
    if (!Array.isArray(chatsRaw)) return bad(DAMAGED);
    chats = normalizeChats(chatsRaw).map((c) => ({ ...c, title: c.title.slice(0, MAX_CHAT_TITLE) }));
  }

  const anyKnown = DATA_NAMES.some((name) => present(own(data, name))) || chats !== undefined;
  if (!anyKnown) return bad("That file has nothing from this app in it.");

  return { ok: true, sections, chats, lines: describeBackup(sections, chats) };
}

// Plain lines saying what a checked copy holds, shown before the student agrees to load it.
export function describeBackup(sections, chats) {
  const lines = [];
  if (sections.profile) lines.push("My profile");
  if (sections.calendar) {
    lines.push(plural(sections.calendar.items.length, "calendar item", "calendar items"));
  }
  if (sections.work) lines.push(plural(sections.work.steps.length, "step on my list", "steps on my list"));
  if (sections.parked) lines.push(plural(sections.parked.length, "parked thought", "parked thoughts"));
  if (sections.recall) lines.push(plural(sections.recall.length, "written answer", "written answers"));
  if (sections.moments) lines.push(plural(sections.moments.length, "finished step kept as a count", "finished steps kept as a count"));
  if (sections.helps) lines.push(plural(sections.helps.length, "did-that-help mark", "did-that-help marks"));
  if (sections.blocks) lines.push(plural(sections.blocks.length, "answer about how long a step felt", "answers about how long a step felt"));
  if (sections.chat) lines.push("My chat guides");
  if (chats !== undefined) lines.push(plural(chats.length, "saved chat", "saved chats"));
  if (lines.length === 0) lines.push("Nothing saved (it would clear what is saved here)");
  return lines;
}
