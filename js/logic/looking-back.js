// Looking back (design/looking-back-w6.md). Pure logic: no browser APIs.
// Counts of what the student really did, "did that help" marks, and fixed weekly lines picked from
// the student's own data. Nothing here scores, ranks, grades, or counts a day missed. Finished by
// Done and finished by Drifted count the same. Nothing is written by an AI.

export const MAX_MOMENTS = 400;
export const MAX_HELPS = 100;
export const DAY_MS = 86400000;
export const HELP_ANSWERS = ["yes", "bit", "no"];
export const TIMER_MINUTES = [0, 12, 25]; // 0 means no countdown

function cleanDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : "";
}

function nextId(items) {
  return items.reduce((high, item) => Math.max(high, item.id), 0) + 1;
}

// ---- Moments: one entry each time a step was finished ----

// kind is "done" or "drifted". Anything else changes nothing. Newest first, cut to the cap.
export function addMoment(items, kind, nowIso) {
  if (kind !== "done" && kind !== "drifted") {
    return items;
  }
  return [{ id: nextId(items), kind, date: cleanDate(nowIso) }, ...items].slice(0, MAX_MOMENTS);
}

export function normalizeMoments(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set();
  const items = [];
  for (const item of raw.slice(0, MAX_MOMENTS)) {
    if (!item || typeof item !== "object" || !Number.isInteger(item.id) || item.id < 1 || seen.has(item.id)) continue;
    if (item.kind !== "done" && item.kind !== "drifted") continue;
    const date = cleanDate(item.date);
    if (date === "") continue; // an entry with no date cannot be counted in any week
    seen.add(item.id);
    items.push({ id: item.id, kind: item.kind, date });
  }
  return items;
}

// ---- Did that help: one tap marks ----

export function addHelp(items, answer, timerMinutes, nowIso) {
  if (!HELP_ANSWERS.includes(answer)) {
    return items;
  }
  const timer = TIMER_MINUTES.includes(timerMinutes) ? timerMinutes : 0;
  return [{ id: nextId(items), answer, timer, date: cleanDate(nowIso) }, ...items].slice(0, MAX_HELPS);
}

export function normalizeHelps(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set();
  const items = [];
  for (const item of raw.slice(0, MAX_HELPS)) {
    if (!item || typeof item !== "object" || !Number.isInteger(item.id) || item.id < 1 || seen.has(item.id)) continue;
    if (!HELP_ANSWERS.includes(item.answer)) continue;
    items.push({
      id: item.id,
      answer: item.answer,
      timer: TIMER_MINUTES.includes(item.timer) ? item.timer : 0,
      date: cleanDate(item.date),
    });
    seen.add(item.id);
  }
  return items;
}

export function removeById(items, id) {
  return items.filter((item) => item.id !== id);
}

// ---- Words ----

export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

function timerWords(minutes) {
  return minutes === 0 ? "no countdown" : `a ${minutes}-minute countdown`;
}

// One line for a saved mark, as shown in What the app remembers. Plain, never a score.
export function helpLine(help) {
  const way = help.timer === 0 ? "Working with no countdown" : `Working with a ${help.timer}-minute countdown`;
  const result = { yes: "helped", bit: "helped a bit", no: "did not help" }[help.answer];
  return `${way}: ${result}`;
}

// A short date for a line, like "Nov 20". Empty when there is no date.
export function shortDate(iso) {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    return "";
  }
  const date = new Date(ms);
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()]} ${date.getDate()}`;
}

// ---- Counts ----

function withinDays(iso, nowMs, days) {
  const ms = Date.parse(iso);
  return !Number.isNaN(ms) && ms <= nowMs && nowMs - ms < days * DAY_MS;
}

// Plain counts for the last `days` days. Finished steps count Done and Drifted together:
// both are a step finished, so honesty earns the same as "done".
export function countsFor({ moments = [], parked = [], recall = [], helps = [] }, nowMs, days) {
  const inWindow = (item) => withinDays(item.date, nowMs, days);
  const mine = moments.filter(inWindow);
  return {
    finished: mine.length,
    madeSmaller: mine.filter((m) => m.kind === "drifted").length,
    parked: parked.filter(inWindow).length,
    recall: recall.filter(inWindow).length,
    helps: helps.filter(inWindow),
  };
}

// The lines for "What I did": plain counts, nothing against a target. Zero lines are left out.
export function doingLines(data, nowMs, days = 30) {
  const c = countsFor(data, nowMs, days);
  const lines = [];
  if (c.finished > 0) lines.push(`${plural(c.finished, "step", "steps")} finished`);
  if (c.madeSmaller > 0) lines.push(`${plural(c.madeSmaller, "step", "steps")} made smaller, then finished`);
  if (c.parked > 0) lines.push(`${plural(c.parked, "thought", "thoughts")} parked for later`);
  if (c.recall > 0) lines.push(`${plural(c.recall, "thing", "things")} you wrote down after reading or studying`);
  return lines;
}

// The weekly look-back. Fixed lines only, chosen from the student's own last seven days.
// Every line states something that happened; none says what should have happened.
export function weeklyLines(data, nowMs) {
  const c = countsFor(data, nowMs, 7);
  const lines = [];
  if (c.finished > 0) {
    lines.push(`You finished ${plural(c.finished, "step", "steps")}.`);
  }
  if (c.madeSmaller > 0) {
    lines.push(`${plural(c.madeSmaller, "step", "steps")} started big and got smaller. That counts too.`);
  }
  const helped = c.helps.filter((h) => h.answer === "yes" || h.answer === "bit");
  if (helped.length > 0) {
    const tally = new Map();
    for (const h of helped) tally.set(h.timer, (tally.get(h.timer) ?? 0) + 1);
    // Most often helpful way; a tie goes to the smaller length so the pick does not change between draws.
    const [timer, n] = [...tally.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
    lines.push(`Working with ${timerWords(timer)} helped ${n === 1 ? "once" : `${n} times`}.`);
  } else if (c.helps.length > 0) {
    lines.push("Some ways of working did not help. That is useful to know.");
  }
  if (c.parked > 0) {
    lines.push(`You set ${plural(c.parked, "thought", "thoughts")} aside to come back to.`);
  }
  if (c.recall > 0) {
    lines.push(`You wrote down ${plural(c.recall, "thing", "things")} you learned, in your own words.`);
  }
  if (lines.length === 0) {
    lines.push("A quiet week. One small step is a fine place to start, whenever you like.");
  }
  return lines;
}
