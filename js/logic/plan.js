// What the Plan tab shows besides the calendar (design/plan-tab-w13.md). Pure logic: no browser APIs.
// The same things the iPhone Plan tab lists: every step of the current assignment, and the thoughts and
// recall answers the student saved. Nothing here counts, scores or compares.

export const STEPS_HEADING = "All my steps";
export const STEPS_EMPTY = "No steps yet.";
export const STEPS_MAKE = "Make some steps";
export const STEP_DONE_MARK = "done";
export const THOUGHTS_HEADING = "Saved thoughts";
export const THOUGHT_TAKE_OUT = "Take this out";
export const THOUGHT_ASK = "Take this one out?";
export const THOUGHT_YES = "Yes, take it out";
export const THOUGHT_NO = "No, leave it";

const MAX_STEPS_SHOWN = 100;

// The steps to list, in order, as plain text with a done flag. A damaged or missing work gives [].
export function planSteps(work) {
  if (!work || !Array.isArray(work.steps)) {
    return [];
  }
  return work.steps
    .filter((step) => step && typeof step.text === "string" && step.text.trim() !== "")
    .slice(0, MAX_STEPS_SHOWN)
    .map((step) => ({ text: step.text.trim(), done: step.done === true }));
}

function dateMs(value) {
  const ms = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isNaN(ms) ? 0 : ms;
}

// Parked thoughts and recall answers in one list, newest first. Each has a key ("p3" or "r3") because the
// two lists number their items separately. Items that are not usable are skipped.
export function savedThoughts(parked, recall) {
  const rows = [];
  if (Array.isArray(parked)) {
    for (const item of parked) {
      if (item && Number.isInteger(item.id) && typeof item.text === "string" && item.text.trim() !== "") {
        rows.push({ key: `p${item.id}`, kind: "parked", id: item.id, text: item.text, date: typeof item.date === "string" ? item.date : "" });
      }
    }
  }
  if (Array.isArray(recall)) {
    for (const item of recall) {
      if (item && Number.isInteger(item.id) && typeof item.answer === "string" && item.answer.trim() !== "") {
        rows.push({ key: `r${item.id}`, kind: "recall", id: item.id, text: item.answer, date: typeof item.date === "string" ? item.date : "" });
      }
    }
  }
  // Array.prototype.sort is stable, so equal dates keep parked before recall.
  return rows.sort((a, b) => dateMs(b.date) - dateMs(a.date));
}
