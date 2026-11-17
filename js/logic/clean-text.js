// Tidies text the student pastes in: normalizes line endings, trims each line,
// removes trailing spaces, and collapses runs of blank lines to one.
// Pure function, no browser APIs, so it can be tested on its own.

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
