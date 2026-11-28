// The step count the student picks (3, 5 or 8) and the good-step card words (design/step-count-w2.md).
// Pure logic: no browser APIs, so it is tested on its own.
// The count is a guide for how many steps show first, not a limit: Show more steps still adds the rest.

export const STEP_COUNTS = [3, 5, 8];
export const DEFAULT_PICKED_COUNT = 5;

// Anything that is not 3, 5 or 8 (text, a number from a damaged form, nothing) becomes 5.
export function normalizeStepCount(value) {
  const number = typeof value === "string" ? Number(value.trim()) : value;
  return STEP_COUNTS.includes(number) ? number : DEFAULT_PICKED_COUNT;
}

// Fixed words. The card never looks at what the student typed.
export const STEP_TIPS_TITLE = "What makes a step easy to start";
export const STEP_TIPS_LINES = [
  "It starts with something you do, like read, write, list or find.",
  "It's small enough to begin in about two minutes.",
  "For example: Write down what the question asks for.",
];

// Only a real true counts; a string, a number or nothing means the card is shown.
export function normalizeStepTipsHidden(value) {
  return value === true;
}
