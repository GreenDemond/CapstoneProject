// The four questions of "How I like to work" and the text of the first-guess card
// (design/focus-intake.md). Pure logic: no browser APIs, so it is tested on its own.
// Every answer is the student's own pick. Nothing here predicts what will help them.

export const NOT_SURE = "unsure";
export const NOT_SURE_TEXT = "Not sure yet";

export const QUESTIONS = [
  {
    id: "sound",
    text: "Sound or quiet?",
    options: [
      { value: "quiet", label: "Quiet" },
      { value: "hiss", label: "A steady background hiss, like a fan" },
      { value: NOT_SURE, label: "Not sure" },
    ],
  },
  {
    id: "block",
    text: "Which work block would you like to try first?",
    options: [
      { value: "short", label: "Short (about 12 minutes)" },
      { value: "long", label: "Longer (about 25 minutes)" },
      { value: NOT_SURE, label: "Not sure" },
    ],
  },
  {
    id: "pull",
    text: "What usually pulls you away?",
    options: [
      { value: "phone", label: "Phone" },
      { value: "browser", label: "Browser or games" },
      { value: "thoughts", label: "My own thoughts" },
      { value: "people", label: "People nearby" },
      { value: "other", label: "Something else" },
      { value: NOT_SURE, label: "Not sure" },
    ],
  },
  {
    id: "restart",
    text: "When you come back after a break, what helps you start?",
    options: [
      { value: "small-step", label: "A very small first step" },
      { value: "notes", label: "A quick look at my notes" },
      { value: "just-start", label: "Just starting" },
      { value: NOT_SURE, label: "Not sure" },
    ],
  },
];

const CARD_LINES = {
  sound: {
    label: "Sound",
    values: {
      quiet: "Quiet",
      hiss: "A steady hiss, like a fan",
    },
  },
  block: {
    label: "Work block to try first",
    values: {
      short: "Short (about 12 minutes)",
      long: "Longer (about 25 minutes)",
    },
  },
  pull: {
    label: "What pulls me away",
    values: {
      phone: "Phone",
      browser: "Browser or games",
      thoughts: "My own thoughts",
      people: "People nearby",
      other: "Something else",
    },
  },
  restart: {
    label: "When I come back",
    values: {
      "small-step": "A very small first step",
      notes: "A quick look at my notes",
      "just-start": "Just starting",
    },
  },
};

// One line per question, in order. Each line says the student's pick, or
// "Not sure yet". Returns [{ id, label, value }]. Unanswered questions are skipped.
export function cardLines(answers) {
  const lines = [];
  for (const question of QUESTIONS) {
    const picked = answers?.[question.id];
    if (picked === undefined) {
      continue;
    }
    const spec = CARD_LINES[question.id];
    const value = picked === NOT_SURE ? NOT_SURE_TEXT : spec.values[picked];
    if (value === undefined) {
      continue;
    }
    lines.push({ id: question.id, label: spec.label, value });
  }
  return lines;
}

// True when every question has an answer (Not sure counts as an answer).
export function isComplete(answers) {
  return QUESTIONS.every((question) => answers?.[question.id] !== undefined);
}
