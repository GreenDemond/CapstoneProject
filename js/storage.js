// The only file that touches the browser's saved data (DECISIONS T3).
// One key, one object, with a schema number. Damaged data is kept under a backup
// key and the app starts fresh. Nothing here ever throws to the screen.
import { emptyProfile, normalizeProfile } from "./logic/profile.js";
import { normalizeServices } from "./logic/ai-services.js";
import { normalizeWork } from "./logic/work.js";
import { normalizeParked, normalizeRecall } from "./logic/work-extras.js";
import { normalizeMoments, normalizeHelps } from "./logic/looking-back.js";
import { normalizeChatSettings } from "./logic/chat-settings.js";
import { normalizeChats } from "./logic/chat-store.js";

export const STORAGE_KEY = "focusapp.v1";
export const BACKUP_KEY = "focusapp.v1.backup";
export const CHATS_KEY = "focusapp.v1.chats";
export const CHATS_BACKUP_KEY = "focusapp.v1.chats.backup";
export const SCHEMA_VERSION = 1;

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

// Reads the whole saved object. state is one of:
// "ok" (usable), "empty" (nothing saved), "damaged" (not JSON, or not an object),
// "other-version" (an object with a different or missing schemaVersion),
// "unavailable" (the browser refused the read). raw is the stored text, if any.
function readAll(storage, key = STORAGE_KEY) {
  let raw;
  try {
    raw = storage.getItem(key);
  } catch {
    return { data: null, state: "unavailable", raw: null };
  }
  if (raw === null || raw === undefined) {
    return { data: null, state: "empty", raw: null };
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { data: null, state: "damaged", raw };
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { data: null, state: "damaged", raw };
  }
  if (data.schemaVersion !== SCHEMA_VERSION) {
    return { data: null, state: "other-version", raw };
  }
  return { data, state: "ok", raw };
}

// Keeps the first unreadable copy. A later one must not overwrite it.
// Returns true when the raw text is safely in the backup (just written, or already there).
function backUpOnce(storage, raw, backupKey = BACKUP_KEY) {
  try {
    const existing = storage.getItem(backupKey);
    if (existing === null) {
      storage.setItem(backupKey, raw);
      return storage.getItem(backupKey) === raw;
    }
    return existing === raw;
  } catch {
    return false;
  }
}

// The section as saved, or undefined unless the whole store is usable.
function readSection(storage, name) {
  const { data, state } = readAll(storage);
  return state === "ok" ? data[name] : undefined;
}

// Saves one section and keeps all the others. A null value removes the section.
// Returns true only if the browser confirmed the save. Readable data from another
// version is never overwritten unless it is safely in the backup first. Unparseable
// text is overwritten even if it could not be backed up, so saving never gets stuck.
// overwriteOtherVersion (chats only) allows the same for other-version data, so a student can always save a chat.
function saveSection(name, value, storage, key = STORAGE_KEY, backupKey = BACKUP_KEY, overwriteOtherVersion = false) {
  if (!storage) {
    return false;
  }
  try {
    const { data, state, raw } = readAll(storage, key);
    if (state === "unavailable") {
      return false;
    }
    let base = { schemaVersion: SCHEMA_VERSION };
    if (state === "damaged") {
      // Unreadable text: keep the first copy as a backup, then start fresh.
      backUpOnce(storage, raw, backupKey);
    } else if (state === "other-version") {
      // Readable data this version does not understand. Only one version of the app
      // exists, so start fresh, but only once it is safely in the backup. If another
      // backup is already there, refuse rather than lose either copy.
      if (!backUpOnce(storage, raw, backupKey) && !overwriteOtherVersion) {
        return false;
      }
    } else if (state === "ok") {
      base = { ...data, schemaVersion: SCHEMA_VERSION };
    }
    delete base[name];
    const next = value === null ? base : { ...base, [name]: value };
    const text = JSON.stringify(next);
    storage.setItem(key, text);
    return storage.getItem(key) === text;
  } catch {
    return false;
  }
}

// Returns { profile, status }. status is one of:
// "ok" (loaded), "new" (nothing saved yet), "recovered" (damaged, another version,
// or a profile of the wrong shape: a copy is kept in the backup if it is free),
// "unavailable" (the browser will not store anything).
export function loadProfileState(storage = defaultStorage()) {
  if (!storage) {
    return { profile: emptyProfile(), status: "unavailable" };
  }
  const { data, state, raw } = readAll(storage);
  if (state === "unavailable") {
    return { profile: emptyProfile(), status: "unavailable" };
  }
  if (state === "empty") {
    return { profile: emptyProfile(), status: "new" };
  }
  if (state === "ok" && data.profile === undefined) {
    // Other sections are saved but no profile yet: nothing is damaged.
    return { profile: emptyProfile(), status: "new" };
  }
  if (state === "ok") {
    try {
      const profile = normalizeProfile(data.profile);
      if (profile) {
        return { profile, status: "ok" };
      }
    } catch {
      // Fall through to the recovery path below.
    }
  }
  // Damaged, from another version, or the wrong shape. Keep a copy; never write the main key.
  backUpOnce(storage, raw);
  return { profile: emptyProfile(), status: "recovered" };
}

// Returns true only if the browser confirmed the save. Other sections already in
// the saved object (for example, progress saved later) are kept as they are.
export function saveProfile(profile, storage = defaultStorage()) {
  return saveSection("profile", profile, storage);
}

// Calendar items live in their own section of the same object. Saving them keeps
// the profile and anything else already saved.
export function loadCalendarItems(storage = defaultStorage()) {
  if (!storage) {
    return [];
  }
  try {
    const items = readSection(storage, "calendar")?.items;
    if (!Array.isArray(items)) {
      return [];
    }
    // Keep only items that have the expected shape; drop the rest one by one.
    return items
      .filter((item) => {
        if (!item || typeof item.id !== "string" || typeof item.title !== "string") return false;
        if (item.kind === "event") {
          return /^\d{4}-\d{2}-\d{2}$/.test(item.start ?? "") && /^\d{4}-\d{2}-\d{2}$/.test(item.end ?? "");
        }
        return typeof item.due === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(item.due);
      })
      .map((item) => ({
        id: item.id,
        title: item.title,
        kind: item.kind === "event" ? "event" : "task",
        ...(item.kind === "event" ? { start: item.start, end: item.end } : { due: item.due }),
        notes: typeof item.notes === "string" ? item.notes : "",
        links: Array.isArray(item.links)
          ? item.links.filter((link) => typeof link === "string" && link.startsWith("https://"))
          : [],
        category: ["school", "personal", "family", "friends", "other"].includes(item.category) ? item.category : "other",
        status: ["open", "in progress", "completed"].includes(item.status) ? item.status : "open",
        completedOn: typeof item.completedOn === "string" ? item.completedOn : null,
      }));
  } catch {
    return [];
  }
}

export function saveCalendarItems(items, storage = defaultStorage()) {
  const keptCounts = readSection(storage ?? null, "calendar")?.counts ?? {};
  return saveSection("calendar", { items, counts: keptCounts }, storage);
}

// Finished-item counts by day. Kept beside the items, and not changed when items are deleted.
export function loadCompletionCounts(storage = defaultStorage()) {
  if (!storage) {
    return {};
  }
  try {
    const counts = readSection(storage, "calendar")?.counts;
    if (!counts || typeof counts !== "object") {
      return {};
    }
    return Object.fromEntries(
      Object.entries(counts).filter(([day, n]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isInteger(n) && n > 0),
    );
  } catch {
    return {};
  }
}

export function saveCompletionCounts(counts, storage = defaultStorage()) {
  const items = readSection(storage ?? null, "calendar")?.items ?? [];
  return saveSection("calendar", { items, counts }, storage);
}

// The AI services a student added (addresses and names only; keys are stored separately).
// Kept in their own section, so saving them keeps everything else.
export function loadAiSettings(storage = defaultStorage()) {
  if (!storage) {
    return { services: [], chosenId: null };
  }
  try {
    return normalizeServices(readSection(storage, "ai") ?? null);
  } catch {
    return { services: [], chosenId: null };
  }
}

export function saveAiSettings(settings, storage = defaultStorage()) {
  return saveSection("ai", { services: settings.services, chosenId: settings.chosenId }, storage);
}

// Screen preferences. For now only whether the good-step card is hidden for good (design/step-count-w2.md).
// Anything that is not exactly true loads as false (the card is shown).
export function loadStepTipsHidden(storage = defaultStorage()) {
  if (!storage) {
    return false;
  }
  try {
    return readSection(storage, "tips")?.stepTipsHidden === true;
  } catch {
    return false;
  }
}

export function saveStepTipsHidden(hidden, storage = defaultStorage()) {
  return saveSection("tips", hidden === true ? { stepTipsHidden: true } : null, storage);
}

// The student's steps and progress, in their own section. Pass null to clear them.
// Returns { work, savedOn } (work is null when nothing usable is saved).
export function loadWork(storage = defaultStorage()) {
  if (!storage) {
    return { work: null, savedOn: null };
  }
  try {
    const section = readSection(storage, "work") ?? null;
    const work = normalizeWork(section);
    return { work, savedOn: work && typeof section.savedOn === "string" ? section.savedOn : null };
  } catch {
    return { work: null, savedOn: null };
  }
}

export function saveWork(work, savedOn = new Date().toISOString(), storage = defaultStorage()) {
  return saveSection("work", work === null ? null : { steps: work.steps, nextId: work.nextId, savedOn, ...(work.kind ? { kind: work.kind } : {}) }, storage);
}

// Thoughts the student parked during work, and their own recall answers (design/work-extras-w4.md).
// Each loads as an empty list when nothing usable is saved. An empty list removes the section.
export function loadParked(storage = defaultStorage()) {
  if (!storage) {
    return [];
  }
  try {
    return normalizeParked(readSection(storage, "parked"));
  } catch {
    return [];
  }
}

export function saveParked(items, storage = defaultStorage()) {
  return saveSection("parked", items.length === 0 ? null : items, storage);
}

export function loadRecall(storage = defaultStorage()) {
  if (!storage) {
    return [];
  }
  try {
    return normalizeRecall(readSection(storage, "recall"));
  } catch {
    return [];
  }
}

export function saveRecall(items, storage = defaultStorage()) {
  return saveSection("recall", items.length === 0 ? null : items, storage);
}

// Looking back (design/looking-back-w6.md): one entry per finished step (kept only as counts) and the
// "did that help" marks. Each loads as an empty list when nothing usable is saved; an empty list removes the section.
export function loadMoments(storage = defaultStorage()) {
  if (!storage) {
    return [];
  }
  try {
    return normalizeMoments(readSection(storage, "moments"));
  } catch {
    return [];
  }
}

export function saveMoments(items, storage = defaultStorage()) {
  return saveSection("moments", items.length === 0 ? null : items, storage);
}

export function loadHelps(storage = defaultStorage()) {
  if (!storage) {
    return [];
  }
  try {
    return normalizeHelps(readSection(storage, "helps"));
  } catch {
    return [];
  }
}

export function saveHelps(items, storage = defaultStorage()) {
  return saveSection("helps", items.length === 0 ? null : items, storage);
}

// Delete everything the app remembers apart from the profile (the profile screen holds that):
// parked thoughts, recall answers, did-that-help marks and the finished-step counts.
// Returns true only if every section was confirmed gone.
export function deleteRemembered(storage = defaultStorage()) {
  const results = [saveParked([], storage), saveRecall([], storage), saveHelps([], storage), saveMoments([], storage)];
  return results.every(Boolean);
}

// The student's own chat guides and reply lengths, in their own section. Damaged entries are dropped one by one.
export function loadChatSettings(storage = defaultStorage()) {
  if (!storage) {
    return normalizeChatSettings(null);
  }
  try {
    return normalizeChatSettings(readSection(storage, "chat") ?? null);
  } catch {
    return normalizeChatSettings(null);
  }
}

export function saveChatSettings(settings, storage = defaultStorage()) {
  return saveSection("chat", { guides: settings.guides, lengths: settings.lengths }, storage);
}

// Saved chats live in their own key, so a full chat store can never stop the steps, profile,
// or calendar from saving (design/chat-history.md). Bad chats and items are dropped one by one.
export function loadChats(storage = defaultStorage()) {
  if (!storage) {
    return [];
  }
  try {
    const { data, state, raw } = readAll(storage, CHATS_KEY);
    if (state === "damaged" || state === "other-version") {
      backUpOnce(storage, raw, CHATS_BACKUP_KEY);
    }
    return state === "ok" ? normalizeChats(data.chats) : [];
  } catch {
    return [];
  }
}

// Returns true only if the browser confirmed the save.
export function saveChats(chats, storage = defaultStorage()) {
  return saveSection("chats", chats, storage, CHATS_KEY, CHATS_BACKUP_KEY, true);
}

// Delete all my chats: an empty list, and the backup copy goes too. Returns true only if both are confirmed.
export function deleteAllChats(storage = defaultStorage()) {
  if (!saveChats([], storage)) {
    return false;
  }
  try {
    storage.removeItem(CHATS_BACKUP_KEY);
    return storage.getItem(CHATS_BACKUP_KEY) === null;
  } catch {
    return false;
  }
}
