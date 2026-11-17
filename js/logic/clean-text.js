// Tidies text the student pastes in: normalizes line endings, trims each line,
// removes trailing spaces, and collapses runs of blank lines to one.
// Pure function, no browser APIs, so it can be tested on its own.

// Longest paste kept (DECISIONS T8 and the design note for paste and split).
export const MAX_PASTE_LENGTH = 6000;

// Cuts text to MAX_PASTE_LENGTH characters. Says whether anything was cut.
export function limitPaste(text) {
  const cleaned = cleanPastedText(text);
  if (cleaned.length <= MAX_PASTE_LENGTH) {
    return { text: cleaned, truncated: false };
  }
  return { text: cleaned.slice(0, MAX_PASTE_LENGTH), truncated: true };
}

export function cleanPastedText(input) {
  if (typeof input !== "string") {
    return "";
  }
  return input
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
