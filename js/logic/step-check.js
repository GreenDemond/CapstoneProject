// Checking the student's steps against the assignment's own lines by word matching
// (design/check-steps-w5.md). Pure logic: no browser APIs.
//
// Rules:
// - It compares the student's own words. It does not understand the subject or judge the steps.
// - A line with no step that has all of its key words is returned so the app can ASK about it.
//   It is never a failure and never an error (AGENTS.md rule 2).
// - It never writes or changes a step.
// - It fails closed: no usable requirement lines gives a null result and the app says nothing.
// - No regex lookbehind: older phones cannot parse it.

export const MAX_LINES = 6;

// Common small words and instruction verbs. A line's key words are what is left after these go.
const STOP_WORDS = new Set([
  "with", "from", "your", "that", "this", "each", "must", "should", "include", "includes", "including",
  "have", "least", "about", "into", "their", "will", "what", "make", "using", "write", "word", "words",
  "find", "describe", "explain", "use", "show", "list", "provide", "cite", "answer", "does", "sure", "then",
  "than", "also", "some", "only", "more", "less", "very", "need", "needs", "least", "most", "required",
  "requirement", "requirements", "least", "there", "them", "they", "when", "where", "which", "while",
  "been", "being", "were", "your", "yours", "student", "students", "needed",
]);

// Whole words of four or more letters, or any number, lower case, with a trailing "s" taken off
// ("sources" matches "source"). Digits are kept whole: "500" and "3".
function tokens(text) {
  const found = [];
  const pieces = String(text).toLowerCase().match(/[a-z0-9]+/g);
  for (const piece of pieces === null ? [] : pieces) {
    const isNumber = /^[0-9]+$/.test(piece);
    if (!isNumber && piece.length < 4) {
      continue;
    }
    let word = piece;
    if (!isNumber && word.length > 4 && word.endsWith("s") && !word.endsWith("ss")) {
      word = word.slice(0, -1);
    }
    if (!isNumber && (STOP_WORDS.has(piece) || STOP_WORDS.has(word))) {
      continue;
    }
    found.push(word);
  }
  return found;
}

// The words a step must contain to count as covering the line (no repeats, in order).
export function keyWords(line) {
  return [...new Set(tokens(line))];
}

function stepWordSet(step) {
  return new Set(tokens(step).concat(String(step).toLowerCase().match(/[a-z0-9]+/g) || []));
}

// { checked, covered, open } for the lines and steps, or null when there is nothing to check.
// checked: number of lines that had key words; covered: how many have a step with all their key words;
// open: the lines (copied exactly) with no such step, at most MAX_LINES in all.
export function checkSteps(requirementLines, steps) {
  const lines = (Array.isArray(requirementLines) ? requirementLines : [])
    .filter((line) => typeof line === "string" && line.trim() !== "")
    .slice(0, MAX_LINES);
  const sets = (Array.isArray(steps) ? steps : []).filter((s) => typeof s === "string").map(stepWordSet);
  const open = [];
  let checked = 0;
  for (const line of lines) {
    const words = keyWords(line);
    if (words.length === 0) {
      continue;
    }
    checked += 1;
    if (!sets.some((set) => words.every((word) => set.has(word)))) {
      open.push(line);
    }
  }
  if (checked === 0) {
    return null;
  }
  return { checked, covered: checked - open.length, open };
}

export const CHECK_BASIS = "This is from matching words, not from understanding your work.";
export const CHECK_ALL_COVERED = "Every line you checked has a step with its words in it.";
export const CHECK_QUESTION = "Is this covered by a step?";
