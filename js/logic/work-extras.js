// Work screen extras (design/work-extras-w4.md). Pure logic: no browser APIs.
// Parked thoughts, recall answers (the student's own words, never graded) and the
// "Ask a person" question. Nothing here writes subject content for the student.

export const MAX_PARKED = 50;
export const MAX_PARKED_LENGTH = 300;
export const MAX_RECALL = 200;
export const MAX_RECALL_LENGTH = 500;
export const MAX_ASK_LENGTH = 300;
export const HINTS_BEFORE_ASKING = 2;

// Kinds of work that end a step with the recall question (research item D10/P9: reading and studying).
const RECALL_KINDS = ["reading", "test-prep"];

export function asksRecall(kind) {
  return RECALL_KINDS.includes(kind);
}

function cleanText(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : "";
}

// Next free id: one more than the highest, so a removed item's id is not reused in a list.
function nextId(items) {
  return items.reduce((high, item) => Math.max(high, item.id), 0) + 1;
}

// Returns a new list with the thought first, or the same list when the words are blank.
export function addParked(items, text, nowIso) {
  const clean = cleanText(text, MAX_PARKED_LENGTH);
  if (clean === "") {
    return items;
  }
  return [{ id: nextId(items), text: clean, date: cleanDate(nowIso) }, ...items].slice(0, MAX_PARKED);
}

export function removeItem(items, id) {
  return items.filter((item) => item.id !== id);
}

export function addRecall(items, text, stepId, nowIso) {
  const clean = cleanText(text, MAX_RECALL_LENGTH);
  if (clean === "") {
    return items;
  }
  const entry = { id: nextId(items), answer: clean, date: cleanDate(nowIso) };
  if (Number.isInteger(stepId)) {
    entry.stepId = stepId;
  }
  return [entry, ...items].slice(0, MAX_RECALL);
}

// Checks a list read back from the device. Bad items are dropped one by one.
export function normalizeParked(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set();
  const items = [];
  for (const item of raw.slice(0, MAX_PARKED)) {
    if (!item || typeof item !== "object" || !Number.isInteger(item.id) || item.id < 1 || seen.has(item.id)) continue;
    const text = cleanText(item.text, MAX_PARKED_LENGTH);
    if (text === "") continue;
    seen.add(item.id);
    items.push({ id: item.id, text, date: cleanDate(item.date) });
  }
  return items;
}

export function normalizeRecall(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set();
  const items = [];
  for (const item of raw.slice(0, MAX_RECALL)) {
    if (!item || typeof item !== "object" || !Number.isInteger(item.id) || item.id < 1 || seen.has(item.id)) continue;
    const answer = cleanText(item.answer, MAX_RECALL_LENGTH);
    if (answer === "") continue;
    seen.add(item.id);
    const entry = { id: item.id, answer, date: cleanDate(item.date) };
    if (Number.isInteger(item.stepId)) {
      entry.stepId = item.stepId;
    }
    items.push(entry);
  }
  return items;
}

// "Ask a person" shows after two hints, or after the last hint if there are fewer left.
export function showAskPerson(hintsShown, totalHints) {
  return hintsShown >= HINTS_BEFORE_ASKING || (hintsShown > 0 && hintsShown >= totalHints);
}

// The three boxes as one short message the student can paste or show. Returns "" when all
// three are blank, so there is nothing to copy. Only the student's own words are used.
export function buildQuestion({ on = "", tried = "", dontGet = "" } = {}) {
  const lines = [
    ["I'm on:", on],
    ["I tried:", tried],
    ["I don't get:", dontGet],
  ]
    .map(([label, value]) => [label, cleanText(value, MAX_ASK_LENGTH)])
    .filter(([, value]) => value !== "");
  return lines.map(([label, value]) => `${label} ${value}`).join("\n");
}

// Whether the student wrote anything of their own (the "I'm on" box starts with the step text).
export function hasOwnWords({ tried = "", dontGet = "" } = {}) {
  return cleanText(tried, MAX_ASK_LENGTH) !== "" || cleanText(dontGet, MAX_ASK_LENGTH) !== "";
}
