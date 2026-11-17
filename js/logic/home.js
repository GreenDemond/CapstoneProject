// What the home screen says when the app opens (design/home-screen.md). Pure logic.
// It never says how long the student was away.

function sameLocalDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function pickupLine(savedOn, now = new Date()) {
  const then = new Date(savedOn);
  if (typeof savedOn !== "string" || Number.isNaN(then.getTime()) || sameLocalDay(then, now)) {
    return "Pick up where you left off.";
  }
  return "Welcome back. Pick up where you left off.";
}

// A short label for a step in the read-only list.
export function listLabel(step, isNext) {
  if (step.done) return `✓ ${step.text}`;
  return isNext ? `${step.text} (next)` : step.text;
}
