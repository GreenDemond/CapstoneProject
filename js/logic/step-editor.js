// Changing the steps before Start (design/steps-editor-w1.md). Pure logic: no browser APIs.
//
// Rules:
// - Every function returns a new list; the one passed in is never changed.
// - Splitting only cuts the student's own words at a natural break. It never adds words,
//   except that the first letter of the second part is made a capital.
// - A split that would leave a part of fewer than two words is refused (returns null).
// - Notes about a step are questions or offers, never "this is wrong" (AGENTS.md rule 2).
// - No regex lookbehind: older phones cannot parse it, and one bad pattern stops the whole app loading.

export const MAX_STEPS = 30;
export const MAX_STEP_LENGTH = 200;
export const LONG_STEP_WORDS = 20;

export const GET_READY_STEP = "Get ready: gather what you need and clear a space to work";
export const PUT_AWAY_STEP = "Put it away: save your work and put your things away";

function wordCount(text) {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

function tidyEnds(text) {
  return text.replace(/^[\s,;]+/, "").replace(/[\s,;]+$/, "");
}

function capitalFirst(text) {
  return text === "" ? text : text.charAt(0).toUpperCase() + text.slice(1);
}

// ------------------------------------------------------------------ splitting

// Places to cut, tried in order. Each entry is [pattern, length of the part to drop].
// The first group that has a cut leaving two or more words on both sides is used.
const BREAKS = [
  /;\s*/g,
  /,?\s+and then\s+/gi,
  /,\s*then\s+/gi,
  /\s+then\s+/gi,
  /\s+and\s+/gi,
  /,\s*/g,
];

// Two parts cut at a natural break (semicolon, then, and, comma), or null when there is none.
function naturalSplit(text) {
  const total = wordCount(text);
  for (const pattern of BREAKS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let best = null;
    let match = re.exec(text);
    while (match !== null) {
      const first = tidyEnds(text.slice(0, match.index));
      const second = tidyEnds(text.slice(match.index + match[0].length));
      if (wordCount(first) >= 2 && wordCount(second) >= 2) {
        const gap = Math.abs(wordCount(first) - total / 2);
        if (best === null || gap < best.gap) {
          best = { first, second, gap };
        }
      }
      if (match[0] === "") {
        break;
      }
      match = re.exec(text);
    }
    if (best !== null) {
      return [best.first, capitalFirst(best.second)];
    }
  }
  return null;
}

// Two parts for one step, or null when it should not be split.
export function splitParts(rawText) {
  const text = typeof rawText === "string" ? rawText.trim() : "";
  if (wordCount(text) < 4) {
    return null;
  }
  const natural = naturalSplit(text);
  if (natural !== null) {
    return natural;
  }
  // No natural break: cut at the space nearest the middle, keeping two or more words on each side.
  const words = text.split(/\s+/);
  const at = Math.round(words.length / 2);
  return [words.slice(0, at).join(" "), capitalFirst(words.slice(at).join(" "))];
}

// ------------------------------------------------------------------ editing

export function setStepText(steps, index, text) {
  if (index < 0 || index >= steps.length) {
    return steps.slice();
  }
  const next = steps.slice();
  next[index] = String(text).slice(0, MAX_STEP_LENGTH);
  return next;
}

export function moveStep(steps, index, direction) {
  const target = index + direction;
  if (index < 0 || index >= steps.length || target < 0 || target >= steps.length) {
    return steps.slice();
  }
  const next = steps.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function removeStep(steps, index) {
  return steps.filter((_, i) => i !== index);
}

// A blank step at the end. Refused (same list) at the limit.
export function addBlankStep(steps) {
  return steps.length >= MAX_STEPS ? steps.slice() : [...steps, ""];
}

// Splits one step in two. Returns the same list when the step cannot be split.
export function splitStepAt(steps, index) {
  const parts = index >= 0 && index < steps.length ? splitParts(steps[index]) : null;
  if (parts === null || steps.length >= MAX_STEPS) {
    return steps.slice();
  }
  const next = steps.slice();
  next.splice(index, 1, parts[0], parts[1]);
  return next;
}

// Joins a step with the one after it, with a semicolon between. Refused when the result is too long.
export function joinWithNext(steps, index) {
  if (index < 0 || index >= steps.length - 1) {
    return steps.slice();
  }
  const first = steps[index].trim().replace(/[.;,]+$/, "");
  const joined = first === "" ? steps[index + 1] : `${first}; ${steps[index + 1].trim()}`;
  if (joined.length > MAX_STEP_LENGTH) {
    return steps.slice();
  }
  const next = steps.slice();
  next.splice(index, 2, joined);
  return next;
}

export function hasGetReady(steps) {
  return steps.includes(GET_READY_STEP);
}

export function hasPutAway(steps) {
  return steps.includes(PUT_AWAY_STEP);
}

// Get ready goes first, once. Refused at the limit.
export function addGetReady(steps) {
  return hasGetReady(steps) || steps.length >= MAX_STEPS ? steps.slice() : [GET_READY_STEP, ...steps];
}

// Put it away goes last, once. Refused at the limit.
export function addPutAway(steps) {
  return hasPutAway(steps) || steps.length >= MAX_STEPS ? steps.slice() : [...steps, PUT_AWAY_STEP];
}

// The steps to keep when the student is done: trimmed, blanks dropped, cut to the length limit.
export function cleanSteps(steps) {
  return steps
    .map((step) => String(step).trim().slice(0, MAX_STEP_LENGTH))
    .filter((step) => step !== "")
    .slice(0, MAX_STEPS);
}

// ------------------------------------------------------------------ notes

const VAGUE_EXACT = [
  "study", "do it", "do the work", "do the essay", "do the homework", "do homework", "finish", "finish it",
  "work on it", "homework", "essay", "the essay", "start", "get started", "work", "do my homework",
  "do my work", "study more", "finish up",
];

// A very general verb with a very general object: "study for the test", "do chapter 4", "work on the project".
const VAGUE_PATTERN =
  /^(?:study|review|prepare|practice|do|finish|complete|work on|start|begin)(?: for| on)?(?: the| my| a| this| that)?(?: (?:test|quiz|exam|midterm|final|homework|assignment|essay|paper|project|worksheet|reading|chapter(?: \d+)?|unit|lesson|everything|it|this|that|work|stuff))$/;

function plain(text) {
  return text.trim().toLowerCase().replace(/[.!]+$/, "").replace(/\s+/g, " ");
}

export function isVague(text) {
  const words = plain(typeof text === "string" ? text : "");
  return words !== "" && (VAGUE_EXACT.includes(words) || VAGUE_PATTERN.test(words));
}

export const VAGUE_QUESTION = "What is the first small thing you would do for this step?";
export const SPLIT_QUESTION = "This looks like more than one step. Split it?";

// One note for a step, or null. { kind: "vague" | "split", text }. Questions only.
export function noteFor(text) {
  if (typeof text !== "string" || text.trim() === "") {
    return null;
  }
  if (isVague(text)) {
    return { kind: "vague", text: VAGUE_QUESTION };
  }
  const long = wordCount(text) > LONG_STEP_WORDS && splitParts(text) !== null;
  if (long || (wordCount(text) >= 4 && naturalSplit(text.trim()) !== null)) {
    return { kind: "split", text: SPLIT_QUESTION };
  }
  return null;
}
