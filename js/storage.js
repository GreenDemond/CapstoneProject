// The only file that touches the browser's saved data (DECISIONS T3).
// One key, one object, with a schema number. Damaged data is kept under a backup
// key and the app starts fresh. Nothing here ever throws to the screen.
import { emptyProfile, normalizeProfile } from "./logic/profile.js";
import { normalizeServices } from "./logic/ai-services.js";
import { normalizeWork } from "./logic/work.js";
import { normalizeChatSettings } from "./logic/chat-settings.js";

export const STORAGE_KEY = "focusapp.v1";
export const BACKUP_KEY = "focusapp.v1.backup";
export const SCHEMA_VERSION = 1;

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

// Returns { profile, status }. status is one of:
// "ok" (loaded), "new" (nothing saved yet), "recovered" (damaged data, backed up),
// "unavailable" (the browser will not store anything).
export function loadProfileState(storage = defaultStorage()) {
  if (!storage) {
    return { profile: emptyProfile(), status: "unavailable" };
  }
  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { profile: emptyProfile(), status: "unavailable" };
  }
  if (raw === null) {
    return { profile: emptyProfile(), status: "new" };
  }
  try {
    const data = JSON.parse(raw);
    if (data && data.schemaVersion === SCHEMA_VERSION) {
      const profile = normalizeProfile(data.profile);
      if (profile) {
        return { profile, status: "ok" };
      }
    }
  } catch {
    // Fall through to the recovery path below.
  }
  // Keep the first damaged copy. A second damage must not overwrite it.
  try {
    if (storage.getItem(BACKUP_KEY) === null) {
      storage.setItem(BACKUP_KEY, raw);
    }
  } catch {
    // If the backup cannot be written, the app still starts fresh.
  }
  return { profile: emptyProfile(), status: "recovered" };
}

// Returns true only if the browser confirmed the save. Other sections already in
// the saved object (for example, progress saved later) are kept as they are.
export function saveProfile(profile, storage = defaultStorage()) {
  if (!storage) {
    return false;
  }
  try {
    let existing = {};
    const raw = storage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.schemaVersion === SCHEMA_VERSION) {
        existing = parsed;
      }
    }
    const data = { ...existing, schemaVersion: SCHEMA_VERSION, profile };
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return storage.getItem(STORAGE_KEY) === JSON.stringify(data);
  } catch {
    return false;
  }
}

// Calendar items live in their own section of the same object. Saving them keeps
// the profile and anything else already saved.
export function loadCalendarItems(storage = defaultStorage()) {
  if (!storage) {
    return [];
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const data = JSON.parse(raw);
    const items = data?.calendar?.items;
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
  if (!storage) {
    return false;
  }
  try {
    let existing = {};
    const raw = storage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.schemaVersion === SCHEMA_VERSION) {
        existing = parsed;
      }
    }
    const keptCounts = existing.calendar?.counts ?? {};
    const data = { ...existing, schemaVersion: SCHEMA_VERSION, calendar: { items, counts: keptCounts } };
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return storage.getItem(STORAGE_KEY) === JSON.stringify(data);
  } catch {
    return false;
  }
}

// Finished-item counts by day. Kept beside the items, and not changed when items are deleted.
export function loadCompletionCounts(storage = defaultStorage()) {
  if (!storage) {
    return {};
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const counts = raw === null ? {} : JSON.parse(raw)?.calendar?.counts;
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
  if (!storage) {
    return false;
  }
  try {
    let existing = {};
    const raw = storage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.schemaVersion === SCHEMA_VERSION) {
        existing = parsed;
      }
    }
    const items = existing.calendar?.items ?? [];
    const data = { ...existing, schemaVersion: SCHEMA_VERSION, calendar: { items, counts } };
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return storage.getItem(STORAGE_KEY) === JSON.stringify(data);
  } catch {
    return false;
  }
}

// The AI services a student added (addresses and names only; keys are stored separately).
// Kept in their own section, so saving them keeps everything else.
export function loadAiSettings(storage = defaultStorage()) {
  if (!storage) {
    return { services: [], chosenId: null };
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return normalizeServices(raw === null ? null : JSON.parse(raw)?.ai);
  } catch {
    return { services: [], chosenId: null };
  }
}

export function saveAiSettings(settings, storage = defaultStorage()) {
  if (!storage) {
    return false;
  }
  try {
    let existing = {};
    const raw = storage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.schemaVersion === SCHEMA_VERSION) {
        existing = parsed;
      }
    }
    const data = { ...existing, schemaVersion: SCHEMA_VERSION, ai: { services: settings.services, chosenId: settings.chosenId } };
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return storage.getItem(STORAGE_KEY) === JSON.stringify(data);
  } catch {
    return false;
  }
}

// The student's steps and progress, in their own section. Pass null to clear them.
// Returns { work, savedOn } (work is null when nothing usable is saved).
export function loadWork(storage = defaultStorage()) {
  if (!storage) {
    return { work: null, savedOn: null };
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    const section = raw === null ? null : JSON.parse(raw)?.work;
    const work = normalizeWork(section);
    return { work, savedOn: work && typeof section.savedOn === "string" ? section.savedOn : null };
  } catch {
    return { work: null, savedOn: null };
  }
}

export function saveWork(work, savedOn = new Date().toISOString(), storage = defaultStorage()) {
  if (!storage) {
    return false;
  }
  try {
    let existing = {};
    const raw = storage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.schemaVersion === SCHEMA_VERSION) {
        existing = parsed;
      }
    }
    const rest = { ...existing };
    delete rest.work;
    const data = work === null
      ? { ...rest, schemaVersion: SCHEMA_VERSION }
      : { ...rest, schemaVersion: SCHEMA_VERSION, work: { steps: work.steps, nextId: work.nextId, savedOn } };
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return storage.getItem(STORAGE_KEY) === JSON.stringify(data);
  } catch {
    return false;
  }
}

// The student's own chat guides and reply lengths, in their own section. Damaged entries are dropped one by one.
export function loadChatSettings(storage = defaultStorage()) {
  if (!storage) {
    return normalizeChatSettings(null);
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return normalizeChatSettings(raw === null ? null : JSON.parse(raw)?.chat);
  } catch {
    return normalizeChatSettings(null);
  }
}

export function saveChatSettings(settings, storage = defaultStorage()) {
  if (!storage) {
    return false;
  }
  try {
    let existing = {};
    const raw = storage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.schemaVersion === SCHEMA_VERSION) {
        existing = parsed;
      }
    }
    const data = { ...existing, schemaVersion: SCHEMA_VERSION, chat: { guides: settings.guides, lengths: settings.lengths } };
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return storage.getItem(STORAGE_KEY) === JSON.stringify(data);
  } catch {
    return false;
  }
}
