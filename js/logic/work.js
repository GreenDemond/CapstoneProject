// The work screen's rules (design/work-screen.md). Pure logic: no browser APIs.
// Done, and the first part of a Drifted step, count the same (DECISIONS P5).
// Still working and Stuck never change the steps. Later moves a step to the end.

export const STUCK_HINTS = [
  "Re-read the instructions and underline the verb.",
  "Write down what you already know about this step, in one line.",
  "Do only the first two minutes of it, then stop.",
  "Ask a teacher or classmate what part is unclear.",
  "Look at the example in your notes or book, then close it and try.",
];

export function createWork(texts) {
  return {
    steps: texts.map((text, i) => ({ id: i, text, done: false })),
    nextId: texts.length,
  };
}

// Index of the step being worked on (the first one not done), or -1 if all are done.
export function currentIndex(work) {
  return work.steps.findIndex((step) => !step.done);
}

export function doneCount(work) {
  return work.steps.filter((step) => step.done).length;
}

export function allDone(work) {
  return currentIndex(work) === -1;
}

// Applies one choice. Returns a new work object; the input is not changed.
// splitText is only used for "drifted": the student's smaller version of the step.
export function applyChoice(work, choice, splitText = "") {
  const cur = currentIndex(work);
  if (cur === -1) {
    return work;
  }
  const steps = work.steps.map((step) => ({ ...step }));

  if (choice === "done") {
    steps[cur].done = true;
    return { ...work, steps };
  }

  if (choice === "drifted") {
    const text = String(splitText).trim();
    // A blank box, or the same words, keeps the step whole. Nothing changes.
    if (text === "" || text === steps[cur].text.trim()) {
      return work;
    }
    steps[cur].done = true;
    steps.splice(cur + 1, 0, { id: work.nextId, text, done: false });
    return { steps, nextId: work.nextId + 1 };
  }

  if (choice === "later") {
    const others = steps.filter((_, i) => i !== cur);
    if (others.every((step) => step.done)) {
      return work; // nothing else left to do first
    }
    const [moved] = steps.splice(cur, 1);
    steps.push(moved);
    return { ...work, steps };
  }

  // "still" and "stuck" leave the steps as they are.
  return work;
}

// The hint for a given number of hints already shown, or null after the last one.
export function hintAt(index) {
  return index < STUCK_HINTS.length ? STUCK_HINTS[index] : null;
}

// Share of the countdown left, from 0 to 1.
export function ringFraction(secondsLeft, totalSeconds) {
  if (totalSeconds <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, secondsLeft / totalSeconds));
}

// "12:05" style. Never negative.
export function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = String(safe % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}
