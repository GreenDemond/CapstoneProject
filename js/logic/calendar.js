// Items the student adds, sorted by how soon they are due (design/calendar.md).
// Pure logic: no browser APIs. Times are the device's local time.

export const MAX_TITLE = 200;
export const MAX_NOTES = 2000;
export const MAX_LINKS = 10;
export const GROUPS = [
  { id: "urgent", label: "Urgent", hint: "Must be done within the hour" },
  { id: "significant", label: "Significant", hint: "Due by the end of today" },
  { id: "notUrgent", label: "Not urgent", hint: "Due in the next 2 days" },
  { id: "insignificant", label: "Can wait", hint: "Can wait until the end of the week" },
  { id: "later", label: "Later", hint: "More than 5 days away" },
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
  if (diff <= HOUR) {
    return "urgent"; // includes times already passed, shown neutrally
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
export function makeItem({ title, day, time, notes = "", links = "", category = "other" }, id) {
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
      status: "open",
      completedOn: null,
    },
  };
}

// Completed items are left out of the priority groups; they show in their own list.
export function groupItems(items, now) {
  const groups = Object.fromEntries(GROUPS.map((g) => [g.id, []]));
  const open = items.filter((item) => item.status !== "completed");
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
