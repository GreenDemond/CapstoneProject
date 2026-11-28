// Suggestions worked out from the student's pasted text, with no AI (design/heuristics-h1.md).
// Pure logic: no browser APIs, so it is tested on its own.
//
// Rules:
// - These functions sort, copy and count the student's own words. They never write subject content.
// - They fail closed: when unsure they return null or an empty list, and the app does what it did before.
// - Requirement lines are always exact pieces of the pasted text, never rewritten or cut.
// - No regex lookbehind: older iPhones cannot parse it, and one bad pattern would stop the whole app loading.

const MAX_TEXT = 20000; // the paste screen already cuts at 6,000; this keeps the logic fast on any input
const MAX_LINE = 200;
const MAX_REQUIREMENTS = 6;
const MAX_RANGE = 200;
const DEFAULT_CHUNKS = 5;

function textOf(value) {
  return typeof value === "string" ? value.slice(0, MAX_TEXT) : "";
}

// ---------------------------------------------------------------- kind of work

const KIND_PATTERNS = {
  essay: [/\bessays?\b/i, /\bthesis\b/i, /\bparagraphs?\b/i, /\bpersuasive\b/i, /\breflection\b/i, /\bresponse paper\b/i],
  reading: [
    /\bread(?:ing)?\b[^.\n]{0,40}\b(?:chapters?|pages?|section|article|story|book|novel|poem|passage)\b/i,
    /\b(?:novel|article)\b/i,
    /\bpages?\s+\d+\s*(?:-|–|to)\s*\d+/i,
    /\breading (?:assignment|response|log)\b/i,
  ],
  "problem-set": [/\bproblem set\b/i, /\b(?:problems?|exercises?)\s*#?\d+/i, /\bworksheet\b/i, /\b(?:solve|calculate|simplify|factor)\b/i, /\bequations?\b/i],
  project: [/\bprojects?\b/i, /\b(?:poster|diorama|prototype|presentation)\b/i, /\bslides?\b/i, /\bgroup\b/i],
  "test-prep": [/\b(?:tests?|quiz(?:zes)?|exams?|midterm)\b/i, /\bstudy (?:for|guide)\b/i, /\breview for\b/i],
};

// The kind id the text clearly points at, or null. Needs one kind with strictly more hits than every other.
export function suggestKind(rawText) {
  const text = textOf(rawText);
  let best = null;
  let bestHits = 0;
  let tie = false;
  for (const [kind, patterns] of Object.entries(KIND_PATTERNS)) {
    const hits = patterns.filter((pattern) => pattern.test(text)).length;
    if (hits > bestHits) {
      best = kind;
      bestHits = hits;
      tie = false;
    } else if (hits === bestHits && hits > 0) {
      tie = true;
    }
  }
  return bestHits > 0 && !tie ? best : null;
}

// --------------------------------------------------------------- requirement lines

const CUE =
  /\b(?:must|should|needs? to|required|requirements?|include|includes|including|at least|at most|no more than|minimum|maximum|cite|citations?|sources?|due|show your work|double[- ]spaced|single[- ]spaced|MLA|APA)\b/i;
const NUMBER_AND_UNIT =
  /\b\d+(?:\s*(?:-|–|to)\s*\d+)?\s*(?:paragraphs?|pages?|words?|sources?|problems?|questions?|sentences?|slides?|minutes?|examples?|quotes?|references?)\b/i;
const LIST_MARKER = /^\s*(?:\d+[.)]|[-*•])\s+(.+?)\s*$/;

// Cuts a line into sentences at ". " "! " "? " when a capital letter, digit, quote or bracket follows.
// "e.g. a pencil" and "3.14" are not cut.
function sentencesOf(line) {
  const parts = [];
  const end = /[.!?]\s+(?=[A-Z0-9"“(])/g;
  let start = 0;
  let match = end.exec(line);
  while (match !== null) {
    parts.push(line.slice(start, match.index + 1));
    start = match.index + match[0].length;
    match = end.exec(line);
  }
  parts.push(line.slice(start));
  return parts;
}

// Up to six lines that say what the finished work must have or do, copied exactly from the text.
export function findRequirements(rawText) {
  const found = [];
  for (const rawLine of textOf(rawText).split(/\r?\n/)) {
    const marker = LIST_MARKER.exec(rawLine);
    const line = marker ? marker[1] : rawLine.trim();
    for (const sentence of sentencesOf(line)) {
      const piece = sentence.trim();
      if (piece === "" || piece.length > MAX_LINE || found.includes(piece)) {
        continue;
      }
      if (CUE.test(piece) || NUMBER_AND_UNIT.test(piece)) {
        found.push(piece);
      }
    }
  }
  return found.slice(0, MAX_REQUIREMENTS);
}

// ------------------------------------------------------------ numbered question ranges

const RANGE = /\b(questions?|problems?|exercises?|numbers?|items?)\s*#?(\d+)\s*(?:-|–|—|to|through|thru)\s*(\d+)\b/gi;
const ODD_OR_EVEN = /\b(?:odd|even)\b/i;

// Steps like "Do problems 1 to 2" for one clear range in the text, or null.
// stepCount is the most steps wanted; a bad value means five.
export function chunkQuestionSteps(rawText, stepCount = DEFAULT_CHUNKS) {
  const text = textOf(rawText);
  const ranges = new Map();
  const range = new RegExp(RANGE.source, RANGE.flags);
  let match = range.exec(text);
  while (match !== null) {
    const singular = match[1].toLowerCase().replace(/s$/, "");
    const around = text.slice(Math.max(0, match.index - 15), match.index) + " " + text.slice(match.index + match[0].length, match.index + match[0].length + 25);
    ranges.set(`${singular}:${match[2]}:${match[3]}`, { singular, start: Number(match[2]), end: Number(match[3]), odd: ODD_OR_EVEN.test(around) });
    match = range.exec(text);
  }
  if (ranges.size !== 1) {
    return null;
  }
  const { singular, start, end, odd } = [...ranges.values()][0];
  const total = end - start + 1;
  if (odd || start < 1 || total < 2 || total > MAX_RANGE) {
    return null;
  }
  const wanted = Number.isInteger(stepCount) && stepCount >= 1 ? stepCount : DEFAULT_CHUNKS;
  const size = Math.ceil(total / Math.min(wanted, total));
  const steps = [];
  for (let from = start; from <= end; from += size) {
    const to = Math.min(end, from + size - 1);
    steps.push(from === to ? `Do ${singular} ${from}` : `Do ${singular}s ${from} to ${to}`);
  }
  return steps;
}
