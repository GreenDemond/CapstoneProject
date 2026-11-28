// Builds a calendar file (.ics, RFC 5545) for one calendar item, so the student can open it in
// their phone's calendar app. Pure logic: no browser APIs, nothing is sent anywhere (design/ics-w9.md).
import { parseDue, parseDay, isEvent } from "./calendar.js";

export const TIMED_MINUTES = 30; // a timed item is a 30 minute block, since items store only a due time
const PRODID = "-//Focus Steps//Study steps web app//EN";

function pad(n, width = 2) {
  return String(n).padStart(width, "0");
}

function dateValue(d) {
  return `${pad(d.getFullYear(), 4)}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function localDateTimeValue(d) {
  return `${dateValue(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function utcStamp(d) {
  return `${pad(d.getUTCFullYear(), 4)}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

// TEXT values: backslash, semicolon, comma and line breaks are escaped; other control characters dropped.
export function escapeText(text) {
  const kept = Array.from(String(text ?? "").replace(/\r\n|\r|\n/g, "\n"))
    .filter((char) => {
      const code = char.codePointAt(0);
      return char === "\n" || (code >= 0x20 && code !== 0x7f);
    })
    .join("");
  return kept
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function utf8Length(char) {
  const code = char.codePointAt(0);
  if (code < 0x80) return 1;
  if (code < 0x800) return 2;
  if (code < 0x10000) return 3;
  return 4;
}

// Folds one content line at 75 octets. Continuation lines start with one space. Never splits a character.
export function foldLine(line) {
  const parts = [];
  let current = "";
  let used = 0;
  let limit = 75;
  for (const char of line) {
    const size = utf8Length(char);
    if (used + size > limit) {
      parts.push(current);
      current = " ";
      used = 1;
      limit = 75;
    }
    current += char;
    used += size;
  }
  parts.push(current);
  return parts.join("\r\n");
}

function fileNameFor(title) {
  const slug = String(title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return `${slug === "" ? "calendar-item" : slug}.ics`;
}

function safeIdPart(id) {
  return String(id ?? "").replace(/[^A-Za-z0-9_-]/g, "");
}

// Returns { ok: true, text, fileName } or { ok: false, reason }.
export function buildIcs(item, now = new Date()) {
  const reason = "This one has no valid date, so it cannot go to a calendar yet.";
  if (!item || typeof item !== "object" || typeof item.title !== "string" || item.title.trim() === "") {
    return { ok: false, reason };
  }
  const idPart = safeIdPart(item.id);
  if (idPart === "") {
    return { ok: false, reason };
  }
  let startLine;
  let endLine;
  if (isEvent(item)) {
    const from = parseDay(item.start);
    const to = parseDay(item.end);
    if (!from || !to || to < from) {
      return { ok: false, reason };
    }
    const [fy, fm, fd] = from.split("-").map(Number);
    const [ty, tm, td] = to.split("-").map(Number);
    startLine = `DTSTART;VALUE=DATE:${dateValue(new Date(fy, fm - 1, fd))}`;
    // The end of an all-day range is the day after the last day (RFC 5545).
    endLine = `DTEND;VALUE=DATE:${dateValue(new Date(ty, tm - 1, td + 1))}`;
  } else {
    const due = typeof item.due === "string" ? parseDue(item.due.slice(0, 10), item.due.slice(11, 16)) : null;
    if (!due) {
      return { ok: false, reason };
    }
    const end = new Date(due.getTime() + TIMED_MINUTES * 60 * 1000);
    startLine = `DTSTART:${localDateTimeValue(due)}`;
    endLine = `DTEND:${localDateTimeValue(end)}`;
  }
  const descriptionParts = [];
  if (typeof item.notes === "string" && item.notes.trim() !== "") {
    descriptionParts.push(item.notes.trim());
  }
  if (Array.isArray(item.links)) {
    for (const link of item.links) {
      if (typeof link === "string" && link.startsWith("https://")) {
        descriptionParts.push(link);
      }
    }
  }
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${idPart}@focusapp.local`,
    `DTSTAMP:${utcStamp(now)}`,
    startLine,
    endLine,
    `SUMMARY:${escapeText(item.title.trim())}`,
  ];
  if (descriptionParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeText(descriptionParts.join("\n"))}`);
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return { ok: true, text: `${lines.map(foldLine).join("\r\n")}\r\n`, fileName: fileNameFor(item.title) };
}
