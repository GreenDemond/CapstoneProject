// Save my AI helpers / Load AI helpers (design/ai-helpers-file.md). Pure logic: no screen, no storage,
// no crypto calls (those are in helpers-crypto.js). This is a separate opt-in file. The data copy
// (backup.js) never holds AI settings, and this file never holds anything else.
// Loading is strict: every part is checked, anything unknown is dropped, a bad file changes nothing,
// and loading only ever adds helpers. It never edits or removes one the student already has.
import { addService, chatAddress, EFFORTS, DEFAULT_EFFORT, MAX_SERVICES, MAX_LABEL, MAX_MODEL } from "./ai-services.js";
import { cleanKeysBlock } from "./helpers-crypto.js";

export const FILE_APP = "focus-app-ai-helpers";
export const FILE_VERSION = 1;
export const MAX_FILE_BYTES = 200000;
export const MIN_PASSPHRASE = 10;
export const MAX_PASSPHRASE = 200;
export const FILE_NOTE = "This file holds AI helper settings. If it holds keys, they are locked and need the passphrase.";

const NOTHING_CHANGED = "Nothing was changed.";
export const BAD_FILE = `That file isn't an AI helpers file. ${NOTHING_CHANGED}`;
export const TOO_BIG = `That file is too big to be an AI helpers file. ${NOTHING_CHANGED}`;
export const NEWER_FILE = `That file was made by a newer version of the app. ${NOTHING_CHANGED}`;
export const NO_HELPERS = `That file has no helpers that can be added. ${NOTHING_CHANGED}`;
export const WRONG_PASSPHRASE = "That passphrase didn't open the keys.";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Reads only a property the object itself has, never one inherited from a prototype.
function own(object, name) {
  return isPlainObject(object) && Object.hasOwn(object, name) ? object[name] : undefined;
}

// The file name for a file made on this day, such as focus-app-ai-helpers-2026-11-28.json.
export function helpersFileName(nowIso) {
  const day = typeof nowIso === "string" && /^\d{4}-\d{2}-\d{2}/.test(nowIso) ? nowIso.slice(0, 10) : "helpers";
  return `focus-app-ai-helpers-${day}.json`;
}

// The name a helper has inside a file. It is only a label to match a helper to its key.
export function refFor(index) {
  return `h${index + 1}`;
}

// Collects the keys to lock: a Map of ref -> key, only for helpers that have a key.
// `keysById` is a Map of helper id -> plain key. A helper without a key is simply left out.
export function keysByRef(services, keysById) {
  const out = new Map();
  services.slice(0, MAX_SERVICES).forEach((service, index) => {
    const key = keysById.get(service.id);
    if (typeof key === "string" && key !== "") {
      out.set(refFor(index), key);
    }
  });
  return out;
}

// Builds the object to save. Pass `keysBlock` (from encryptKeys) to include locked keys; leave it
// out for the safest file. Only label, address, model and effort are written: no id, no hint, no key.
export function buildHelpersFile(services, { keysBlock = null, nowIso = new Date().toISOString() } = {}) {
  const helpers = services.slice(0, MAX_SERVICES).map((service, index) => ({
    ref: refFor(index),
    label: service.label,
    url: service.url,
    model: service.model,
    effort: EFFORTS.some((e) => e.value === service.effort) ? service.effort : DEFAULT_EFFORT,
  }));
  const file = { app: FILE_APP, version: FILE_VERSION, note: FILE_NOTE, savedOn: nowIso.slice(0, 10), helpers };
  if (keysBlock !== null) {
    file.keys = keysBlock;
  }
  return file;
}

// Checks the passphrase typed twice when saving with keys. Returns { ok: true, passphrase } or { ok: false, reason }.
export function checkPassphrase(passphrase, again) {
  const pass = typeof passphrase === "string" ? passphrase : "";
  if (pass.trim() === "") {
    return { ok: false, reason: "Type a passphrase first." };
  }
  if (pass.length < MIN_PASSPHRASE) {
    return { ok: false, reason: `Use at least ${MIN_PASSPHRASE} characters. A few words in a row works well.` };
  }
  if (pass.length > MAX_PASSPHRASE) {
    return { ok: false, reason: `Keep the passphrase under ${MAX_PASSPHRASE} characters.` };
  }
  if (pass !== again) {
    return { ok: false, reason: "The two passphrases don't match. Type them again." };
  }
  return { ok: true, passphrase: pass };
}

function cleanHelper(entry, index) {
  if (!isPlainObject(entry)) {
    return null;
  }
  const url = own(entry, "url");
  const chat = typeof url === "string" ? chatAddress(url) : null;
  if (chat === null) {
    return null;
  }
  const label = own(entry, "label");
  const model = own(entry, "model");
  const effort = own(entry, "effort");
  const ref = own(entry, "ref");
  return {
    ref: typeof ref === "string" && /^h\d{1,2}$/.test(ref) ? ref : refFor(index),
    label: typeof label === "string" ? label.trim().slice(0, MAX_LABEL).trim() : "",
    url: chat,
    model: typeof model === "string" ? model.trim().slice(0, MAX_MODEL) : "",
    effort: EFFORTS.some((e) => e.value === effort) ? effort : DEFAULT_EFFORT,
  };
}

// Reads a file's text. Returns { ok: false, reason } (reason ends "Nothing was changed.") or
// { ok: true, helpers: [{ ref, label, url, model, effort }], keys: null | { kdf, iterations, salt, iv, data }, dropped }.
// `dropped` counts entries that were damaged or had an address the app can't use.
export function parseHelpersFile(text) {
  if (typeof text !== "string" || text.length > MAX_FILE_BYTES || new Blob([text]).size > MAX_FILE_BYTES) {
    return { ok: false, reason: TOO_BIG };
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: BAD_FILE };
  }
  if (own(data, "app") !== FILE_APP) {
    return { ok: false, reason: BAD_FILE };
  }
  const version = own(data, "version");
  if (!Number.isInteger(version) || version < 1) {
    return { ok: false, reason: BAD_FILE };
  }
  if (version > FILE_VERSION) {
    return { ok: false, reason: NEWER_FILE };
  }
  const list = own(data, "helpers");
  if (!Array.isArray(list)) {
    return { ok: false, reason: BAD_FILE };
  }
  const helpers = [];
  const refs = new Set();
  let dropped = 0;
  list.slice(0, MAX_SERVICES).forEach((entry, index) => {
    const helper = cleanHelper(entry, index);
    if (helper === null || refs.has(helper.ref)) {
      dropped += 1;
      return;
    }
    refs.add(helper.ref);
    helpers.push(helper);
  });
  if (helpers.length === 0) {
    return { ok: false, reason: NO_HELPERS };
  }
  let keys = null;
  if (own(data, "keys") !== undefined) {
    keys = cleanKeysBlock(own(data, "keys"));
    if (keys === null) {
      return { ok: false, reason: BAD_FILE };
    }
  }
  return { ok: true, helpers, keys, dropped };
}

// Works out what loading would do, without doing it. `existing` is the student's current list.
// Returns { toAdd, skipped, list }:
//   toAdd:   [{ ref, service }] the new helpers, built by addService so they match hand-made ones
//            (checked, no key ready, no hint, thinking effort from the file);
//   skipped: [{ label, reason }] helpers left out (same AI at the same address, same name, or no room);
//   list:    existing helpers (the very same objects, in order) followed by the new ones.
// It never changes `existing`, and it has no say over which helper is chosen.
export function planLoad(existing, helpers) {
  let list = existing.slice();
  const toAdd = [];
  const skipped = [];
  for (const helper of helpers) {
    const result = addService(list, { label: helper.label, url: helper.url, model: helper.model });
    if (result.error !== null) {
      skipped.push({ label: helper.label || helper.model || helper.url, reason: result.error });
      continue;
    }
    const added = result.list[result.list.length - 1];
    const service = { ...added, effort: helper.effort };
    list = [...list, service];
    toAdd.push({ ref: helper.ref, service });
  }
  return { toAdd, skipped, list };
}
