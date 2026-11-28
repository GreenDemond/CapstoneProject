// Course memory, no AI (design/course-memory.md). Pure logic: no browser APIs.
// When a student finishes an assignment that has a class, the steps they used are kept for that class
// (the student's own words, on this device). Next time they type the same class, the app offers those
// steps as a suggestion they can change. Nothing is worked out, ranked or sent anywhere.
import { normalizeClassLabel } from "./class-label.js";
import { MAX_STEP_LENGTH } from "./step-editor.js";

export const MAX_COURSES = 20; // one entry per class
export const MAX_COURSE_STEPS = 8;
export const COURSE_HEADING = "Steps I used for a class";

function cleanDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : "";
}

// The same class however it was typed: capitals and extra spaces do not matter.
export function classKey(label) {
  return normalizeClassLabel(label).toLowerCase();
}

function cleanStepTexts(steps) {
  if (!Array.isArray(steps)) {
    return [];
  }
  return steps
    .filter((text) => typeof text === "string")
    .map((text) => text.replace(/\s+/g, " ").trim().slice(0, MAX_STEP_LENGTH).trim())
    .filter((text) => text !== "")
    .slice(0, MAX_COURSE_STEPS);
}

// Checks entries read back from the device. Bad entries are dropped one by one; one entry per class.
export function normalizeCourses(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set();
  const items = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const label = normalizeClassLabel(item.label);
    const steps = cleanStepTexts(item.steps);
    const key = classKey(label);
    if (label === "" || steps.length === 0 || seen.has(key)) continue;
    seen.add(key);
    items.push({ label, steps, on: cleanDate(item.on) });
    if (items.length === MAX_COURSES) break;
  }
  return items;
}

// Keeps these steps for the class, newest first. An older entry for the same class is replaced.
// A blank class or no usable steps changes nothing.
export function recordCourse(items, label, stepTexts, nowIso) {
  const clean = normalizeClassLabel(label);
  const steps = cleanStepTexts(stepTexts);
  if (clean === "" || steps.length === 0) {
    return items;
  }
  const key = classKey(clean);
  const others = items.filter((item) => classKey(item.label) !== key);
  return [{ label: clean, steps, on: cleanDate(nowIso) }, ...others].slice(0, MAX_COURSES);
}

// The entry for this class, or null.
export function courseFor(items, label) {
  const key = classKey(label);
  if (key === "") {
    return null;
  }
  return items.find((item) => classKey(item.label) === key) ?? null;
}

export function removeCourse(items, label) {
  const key = classKey(label);
  return items.filter((item) => classKey(item.label) !== key);
}

export function offerLine(label) {
  return `You have steps from last time for ${label}.`;
}

export function offerButton(label) {
  return `Use my ${label} steps from last time`;
}

export function courseLine(item) {
  return `${item.label}: ${item.steps.join(" / ")}`;
}
