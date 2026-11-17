// Running count of finished items, by day (design/calendar.md). Only completions
// are counted. Nothing here counts what was missed, and nothing compares students.
// Counts are kept per day, so deleting an item does not change them.

function pad(n) {
  return String(n).padStart(2, "0");
}

export function todayKey(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addCompletion(counts, day) {
  return { ...counts, [day]: (counts[day] ?? 0) + 1 };
}

// Takes one completion back out. Never goes below zero.
export function removeCompletion(counts, day) {
  if (!day || !counts[day]) {
    return counts;
  }
  const next = { ...counts, [day]: counts[day] - 1 };
  if (next[day] === 0) {
    delete next[day];
  }
  return next;
}

// Totals for today, this week (from Monday), this month, this year, and all time.
export function totals(counts, now = new Date()) {
  const today = todayKey(now);
  const monthPrefix = today.slice(0, 7);
  const yearPrefix = today.slice(0, 4);
  const day = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  const mondayKey = todayKey(monday);

  const result = { today: 0, week: 0, month: 0, year: 0, all: 0 };
  for (const [key, n] of Object.entries(counts)) {
    if (typeof n !== "number" || n <= 0) {
      continue;
    }
    result.all += n;
    if (key.slice(0, 4) === yearPrefix) result.year += n;
    if (key.slice(0, 7) === monthPrefix) result.month += n;
    if (key >= mondayKey && key <= today) result.week += n;
    if (key === today) result.today += n;
  }
  return result;
}
