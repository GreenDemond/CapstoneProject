// How long a work block feels (design/during-a-step-w12.md). Pure logic: no browser APIs.
// Ported from the iPhone app's BlockLength. The student answers "Did that time feel about right?"
// after a countdown ends. Only the answers are kept, only on this device, and the suggestion is
// worked out from them each time, so deleting an answer changes it at once. Nothing is written by an AI.

export const LENGTHS = [12, 25]; // the countdown choices on the work screen, shortest first
export const ANSWERS = ["shorter", "aboutRight", "longer"];
export const MAX_BLOCK_ANSWERS = 50;
export const WINDOW = 5; // the newest answers for one length that count
export const DAYS = 30; // and how far back they count
export const NEEDED = 3; // at least this many point the same way, and none the other way
export const FRESH_MS = 120000; // the question is only raised this soon after the countdown ends
const DAY_MS = 86400000;

export const BLOCK_QUESTION = "Did that time feel about right?";
export const BLOCK_LABELS = { shorter: "Shorter", aboutRight: "About right", longer: "Longer" };
export const BLOCK_SKIP = "Skip";
export const BLOCK_NOTED = "Noted.";
export const BLOCK_SAVE_FAILED = "That could not be saved here. You can tap Skip.";

export function learnedLine(minutes) {
  return `Your answers so far point to ${minutes} minutes.`;
}

// Shorter is not offered at the shortest length and Longer not at the longest: they could change nothing.
export function offers(answer, minutes) {
  if (!LENGTHS.includes(minutes) || !ANSWERS.includes(answer)) {
    return false;
  }
  if (answer === "shorter") return minutes !== LENGTHS[0];
  if (answer === "longer") return minutes !== LENGTHS[LENGTHS.length - 1];
  return true;
}

export function offeredAnswers(minutes) {
  return ANSWERS.filter((answer) => offers(answer, minutes));
}

// The next shorter or longer length, or null at either end and for "about right".
export function target(minutes, answer) {
  const index = LENGTHS.indexOf(minutes);
  if (index === -1) return null;
  if (answer === "shorter") return index > 0 ? LENGTHS[index - 1] : null;
  if (answer === "longer") return index < LENGTHS.length - 1 ? LENGTHS[index + 1] : null;
  return null;
}

function cleanDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : "";
}

// Adds one answer, newest first. An answer that is not offered, or a bad date, changes nothing.
export function addBlockAnswer(items, minutes, answer, nowIso) {
  const on = cleanDate(nowIso);
  if (!offers(answer, minutes) || on === "") {
    return items;
  }
  return [{ minutes, answer, on }, ...items].slice(0, MAX_BLOCK_ANSWERS);
}

// Checks answers read back from the device. Bad entries are dropped one by one.
export function normalizeBlockAnswers(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  const items = [];
  for (const item of raw.slice(0, MAX_BLOCK_ANSWERS)) {
    if (!item || typeof item !== "object") continue;
    if (!offers(item.answer, item.minutes)) continue;
    const on = cleanDate(item.on);
    if (on === "") continue;
    items.push({ minutes: item.minutes, answer: item.answer, on });
  }
  return items;
}

// The length the answers point to, or null. For one length: at least three of its newest five answers
// from the last 30 days point the same way, and none the other way. If two lengths each point
// somewhere, the one with the newest answer wins.
export function suggestedLength(items, nowMs) {
  const oldest = nowMs - DAYS * DAY_MS;
  const usable = normalizeBlockAnswers(items)
    .map((item) => ({ ...item, at: Date.parse(item.on) }))
    .filter((item) => item.at >= oldest && item.at <= nowMs + DAY_MS);
  let best = null;
  for (const length of LENGTHS) {
    const recent = usable
      .filter((item) => item.minutes === length)
      .sort((a, b) => b.at - a.at)
      .slice(0, WINDOW);
    const tooLong = recent.filter((item) => item.answer === "shorter").length;
    const tooShort = recent.filter((item) => item.answer === "longer").length;
    let pick = null;
    if (tooLong >= NEEDED && tooShort === 0) pick = target(length, "shorter");
    if (tooShort >= NEEDED && tooLong === 0) pick = target(length, "longer");
    if (pick !== null && (best === null || recent[0].at > best.newest)) {
      best = { pick, newest: recent[0].at };
    }
  }
  return best === null ? null : best.pick;
}

// Whether to raise the question: the countdown has ended, and not long ago.
export function shouldAsk(endMs, nowMs) {
  return nowMs >= endMs && nowMs - endMs <= FRESH_MS;
}

// ---- the optional "Done when:" line on a step ----

export const MAX_DONE_WHEN_LENGTH = 100;
export const DONE_WHEN_LABEL = "Done when:";
export const DONE_WHEN_ADD = "Say when this is finished";
export const DONE_WHEN_CHANGE = "Change that line";
export const DONE_WHEN_PROMPT = "How will I know it's done?";
export const DONE_WHEN_SAVE = "Save that line";
export const DONE_WHEN_CLEAR = "Clear that line";

// One line, no stray spaces, cut to the limit. Anything that is not text becomes "".
export function cleanDoneWhen(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_DONE_WHEN_LENGTH).trim();
}

// Sets (or, with a blank, clears) the line on one step. Returns a new work object; other steps untouched.
export function setDoneWhen(work, stepId, text) {
  const line = cleanDoneWhen(text);
  const steps = work.steps.map((step) => {
    if (step.id !== stepId) return step;
    const copy = { ...step };
    delete copy.doneWhen;
    return line === "" ? copy : { ...copy, doneWhen: line };
  });
  return { ...work, steps };
}
