// Builds the starter steps for a pasted assignment (design/paste-and-split.md).
// Pure logic: no browser APIs, so it is tested on its own.
//
// Rules:
// - Numbered or bulleted items in the pasted text come first, in their order.
// - Then the starter steps for the kind of work the student picked fill the rest.
// - The student sees five by default; the full list is returned so the screen
//   can show more on request.
// - These are process steps only, never answers (DECISIONS P1, rule 1 in AGENTS.md).

export const DEFAULT_STEP_COUNT = 5;
export const MAX_STEP_LENGTH = 200;

export const KINDS = [
  { id: "essay", label: "Essay" },
  { id: "reading", label: "Reading" },
  { id: "problem-set", label: "Problem set" },
  { id: "project", label: "Project" },
  { id: "test-prep", label: "Studying for a test" },
  { id: "other", label: "Something else" },
];

const STARTER_STEPS = {
  essay: [
    "Read the instructions again and write down what the question asks",
    "Write your main answer in one sentence",
    "List three points that support it",
    "Write a rough first paragraph. It doesn't have to be perfect",
    "Read it once and fix one thing",
    "Check that your answer does what the question asks",
    "Write a short conclusion",
  ],
  reading: [
    "Skim the headings and the first and last paragraphs",
    "Write the question you want this reading to answer",
    "Read the first section",
    "Stop and say its main idea in your own words",
    "Write one thing you want to remember",
    "Read the next section",
    "Write down a question you still have",
  ],
  "problem-set": [
    "Read the instructions and count how many problems there are",
    "Try the first problem without notes",
    "Write down which rule or method it needs",
    "Check your notes or book for a worked example",
    "Do the rest, and mark the ones you are stuck on",
    "Check one answer by working it a second way",
    "Write down what you would ask a teacher",
  ],
  project: [
    "Write down what the finished project must include",
    "List the parts that need separate work",
    "Pick the smallest part and do it first",
    "Set a date for a first rough version",
    "Write what you will do in the next session",
    "Ask someone to look at your plan",
    "Note what could go wrong and how to handle it",
  ],
  "test-prep": [
    "Write down the topics the test covers",
    "Look at your notes for the first topic",
    "Quiz yourself on it without looking",
    "Check what you missed",
    "Schedule the next short review",
    "List the terms you could not explain",
    "Review those terms once more",
  ],
  other: [
    "Read the instructions again and write down what they ask for",
    "Do the first small part of the work",
    "Pick the next part",
    "Check your work against the instructions",
    "Note what is still left to do",
    "Write down what you are unsure about",
    "Take a short break before the next part",
  ],
};

// Lines that start with a number ("1." or "2)") or a bullet ("-", "*", "•").
const LIST_ITEM = /^\s*(?:\d+[.)]|[-*•])\s+(.+?)\s*$/;

export function findListItems(text) {
  if (typeof text !== "string") {
    return [];
  }
  const items = [];
  for (const line of text.split("\n")) {
    const match = LIST_ITEM.exec(line);
    if (match) {
      items.push(match[1].slice(0, MAX_STEP_LENGTH));
    }
  }
  return items;
}

// Returns the full list, in order: items from the pasted text, then the starter
// steps for the kind. The screen shows DEFAULT_STEP_COUNT of them at first.
export function starterStepsFor(kindId, pastedText = "") {
  const starters = STARTER_STEPS[kindId] ?? STARTER_STEPS.other;
  const steps = [...findListItems(pastedText)];
  for (const starter of starters) {
    if (!steps.includes(starter)) {
      steps.push(starter);
    }
  }
  return steps;
}

// A first step that takes two minutes, to make starting easier (design/paste-and-split.md).
export const TWO_MINUTE_STEP = "Set a timer for 2 minutes and start the first step. You can stop when the timer ends.";

// Puts the two-minute step first, once. Returns a new list.
export function withTwoMinuteStart(steps) {
  return [TWO_MINUTE_STEP, ...steps.filter((step) => step !== TWO_MINUTE_STEP)];
}
