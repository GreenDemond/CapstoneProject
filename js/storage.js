// The only file that touches the browser's saved data (DECISIONS T3).
// One key, one object, with a schema number. Damaged data is kept under a backup
// key and the app starts fresh. Nothing here ever throws to the screen.
import { emptyProfile, normalizeProfile } from "./logic/profile.js";

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
    return items.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.due === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(item.due),
    );
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
    const data = { ...existing, schemaVersion: SCHEMA_VERSION, calendar: { items } };
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return storage.getItem(STORAGE_KEY) === JSON.stringify(data);
  } catch {
    return false;
  }
}
