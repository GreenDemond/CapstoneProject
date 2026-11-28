// The optional class name on an assignment (design/class-and-return-w11.md). Pure logic: no browser APIs.
// It is the student's own words. It is not a school, a teacher or a grade, and nothing is worked out from it.

export const CLASS_LABEL_MAX = 40;
export const CLASS_LABEL_TITLE = "Class (optional)";
export const CLASS_LABEL_HINT = "For example: History";

// Trimmed, runs of spaces and line breaks turned into one space, cut to 40 characters. Anything that is
// not text, or is blank, is no label at all (an empty string).
export function normalizeClassLabel(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/\s+/g, " ").trim().slice(0, CLASS_LABEL_MAX).trim();
}

// The line shown with an assignment, or "" when there is no label.
export function classLine(label) {
  const clean = normalizeClassLabel(label);
  return clean === "" ? "" : `Class: ${clean}`;
}
