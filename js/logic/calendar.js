// Items the student adds, sorted by how soon they are due (design/calendar.md).
// Pure logic: no browser APIs. Times are the device's local time.
import { normalizeClassLabel } from "./class-label.js";

export const MAX_TITLE = 200;
export const MAX_NOTES = 2000;
export const MAX_LINKS = 10;
export const GROUPS = [
  { id: "urgent", label: "Urgent", hint: "Must be done within the hour" },
  { id: "significant", label: "Significant", hint: "Due by the end of today" },
  { id: "notUrgent", label: "Not urgent", hint: "Due in the next 2 days" },
  { id: "insignificant", label: "Can wait", hint: "Can wait until the end of the week" },
  { id: "later", label: "Later", hint: "More than 5 days away" },
  // Calm, neutral group for dates already gone. No urgency, no count (rule 2).
  { id: "passed", label: "Time has passed", hint: "Mark it done or delete it. No rush." },
];

export const CATEGORIES = [
  { id: "school", label: "School work" },
  { id: "personal", label: "Personal" },
  { id: "family", label: "Family" },
  { id: "friends", label: "Friends" },
  { id: "other", label: "Other" },
];
export const STATUSES = ["open", "in progress", "completed"];

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function sameLocalDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Which group an item belongs in, from its due time and the current time.
export function bucketFor(due, now) {
  const diff = due.getTime() - now.getTime();
  if (diff < 0) {
    return "passed"; // a calm group, not the urgent one
  }
  if (diff <= HOUR) {
    return "urgent";
  }
  if (sameLocalDay(due, now)) {
    return "significant";
  }
  if (diff <= 2 * DAY) {
    return "notUrgent";
  }
  if (diff <= 5 * DAY) {
    return "insignificant";
  }
  return "later";
}

// "2026-11-17" and "15:30" to a local Date, or null if either is not valid.
export function parseDue(day, time) {
  if (typeof day !== "string" || typeof time !== "string") {
    return null;
  }
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) {
    return null;
  }
  const [y, mo, d] = [Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3])];
  const [h, mi] = [Number(timeMatch[1]), Number(timeMatch[2])];
  const due = new Date(y, mo, d, h, mi);
  // Reject dates such as 2026-02-31, which the Date object would quietly change.
  if (due.getFullYear() !== y || due.getMonth() !== mo || due.getDate() !== d || h > 23 || mi > 59) {
    return null;
  }
  return due;
}

// Only web addresses that start with https:// are kept.
export function parseLinks(text) {
  const lines = String(text ?? "")
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const links = [];
  for (const line of lines) {
    let url;
    try {
      url = new URL(line);
    } catch {
      return { ok: false, reason: "Links must start with https://" };
    }
    if (url.protocol !== "https:") {
      return { ok: false, reason: "Links must start with https://" };
    }
    links.push(url.href);
  }
  if (links.length > MAX_LINKS) {
    return { ok: false, reason: `Up to ${MAX_LINKS} links for one item.` };
  }
  return { ok: true, links };
}

// Returns { ok: true, item } or { ok: false, reason }.
export function makeItem({ title, day, time, notes = "", links = "", category = "other", classLabel = "" }, id) {
  const cleaned = typeof title === "string" ? title.trim().slice(0, MAX_TITLE) : "";
  if (cleaned === "") {
    return { ok: false, reason: "Write what it is first." };
  }
  const due = parseDue(day, time);
  if (!due) {
    return { ok: false, reason: "Choose a due date and time." };
  }
  const parsedLinks = parseLinks(links);
  if (!parsedLinks.ok) {
    return parsedLinks;
  }
  return {
    ok: true,
    item: {
      id,
      title: cleaned,
      due: `${day}T${time}`,
      notes: String(notes ?? "").trim().slice(0, MAX_NOTES),
      links: parsedLinks.links,
      category: CATEGORIES.some((c) => c.id === category) ? category : "other",
      ...(normalizeClassLabel(classLabel) ? { classLabel: normalizeClassLabel(classLabel) } : {}),
      status: "open",
      completedOn: null,
    },
  };
}

// Completed items are left out of the priority groups; they show in their own list.
export function groupItems(items, now) {
  const groups = Object.fromEntries(GROUPS.map((g) => [g.id, []]));
  const open = items.filter((item) => item.status !== "completed" && !isEvent(item));
  const sorted = [...open].sort((a, b) => a.due.localeCompare(b.due));
  for (const item of sorted) {
    const due = parseDue(item.due.slice(0, 10), item.due.slice(11, 16));
    if (!due) {
      continue;
    }
    groups[bucketFor(due, now)].push(item);
  }
  return groups;
}

export function removeItem(items, id) {
  return items.filter((item) => item.id !== id);
}

// Sets an item's status. Completing it records the day it was finished.
export function setStatus(items, id, status, today) {
  if (!STATUSES.includes(status)) {
    return items;
  }
  return items.map((item) => {
    if (item.id !== id) {
      return item;
    }
    if (status === "completed") {
      return { ...item, status, completedOn: today };
    }
    return { ...item, status, completedOn: null };
  });
}

// Monday 00:00 of the week containing `now`.
function weekStart(now) {
  const day = (now.getDay() + 6) % 7; // Monday = 0
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
}

// How many items were finished since Monday this week. Never negative, never compared with others.
export function finishedThisWeek(items, now) {
  const start = weekStart(now);
  return items.filter((item) => {
    if (item.status !== "completed" || typeof item.completedOn !== "string") {
      return false;
    }
    const [y, m, d] = item.completedOn.split("-").map(Number);
    const when = new Date(y, m - 1, d);
    return when >= start && when <= now;
  }).length;
}

export function completedItems(items) {
  return items
    .filter((item) => item.status === "completed")
    .sort((a, b) => (b.completedOn ?? "").localeCompare(a.completedOn ?? ""));
}

// An event covers a range of days (for example a trip). Times are not needed.
export function parseDay(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text ?? ""));
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const date = new Date(y, mo, d);
  return date.getFullYear() === y && date.getMonth() === mo && date.getDate() === d ? text : null;
}

// Returns { ok: true, item } or { ok: false, reason }.
export function makeEvent({ title, start, end, notes = "", links = "", category = "other", classLabel = "" }, id) {
  const cleaned = typeof title === "string" ? title.trim().slice(0, MAX_TITLE) : "";
  if (cleaned === "") {
    return { ok: false, reason: "Write what it is first." };
  }
  const from = parseDay(start);
  const to = parseDay(end);
  if (!from || !to) {
    return { ok: false, reason: "Choose a from date and a to date." };
  }
  if (to < from) {
    return { ok: false, reason: "The to date is before the from date." };
  }
  const parsedLinks = parseLinks(links);
  if (!parsedLinks.ok) {
    return parsedLinks;
  }
  return {
    ok: true,
    item: {
      id,
      kind: "event",
      title: cleaned,
      start: from,
      end: to,
      notes: String(notes ?? "").trim().slice(0, MAX_NOTES),
      links: parsedLinks.links,
      category: CATEGORIES.some((c) => c.id === category) ? category : "other",
      ...(normalizeClassLabel(classLabel) ? { classLabel: normalizeClassLabel(classLabel) } : {}),
      status: "open",
      completedOn: null,
    },
  };
}

export function isEvent(item) {
  return item.kind === "event";
}

// Priority groups are for tasks only. Events are listed by their dates.
export function taskGroupsSource(items) {
  return items.filter((item) => !isEvent(item));
}

// Checks calendar items read back from the device (or from a copy a student loads). Items with the
// wrong shape are dropped one by one; the rest are rebuilt with only the known fields.
export function normalizeCalendarItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }
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
      ...(normalizeClassLabel(item.classLabel) ? { classLabel: normalizeClassLabel(item.classLabel) } : {}),
      status: ["open", "in progress", "completed"].includes(item.status) ? item.status : "open",
      completedOn: typeof item.completedOn === "string" ? item.completedOn : null,
    }));
}

// Finished-item counts by day: only real days with a whole number above zero are kept.
export function normalizeCounts(counts) {
  if (!counts || typeof counts !== "object") {
    return {};
  }
  return Object.fromEntries(
    Object.entries(counts).filter(([day, n]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isInteger(n) && n > 0),
  );
}
