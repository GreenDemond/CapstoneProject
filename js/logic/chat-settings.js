// The student's own guides for the chat, one for "All kinds" and one per kind of work
// (design/ai-chat.md). Pure logic. A kind uses its own guide, else the All kinds guide,
// else the built-in default. Reply length works the same way.
import { KINDS } from "./starter-steps.js";
import { DEFAULT_GUIDE, DEFAULT_LENGTH, LENGTHS, MAX_GUIDE } from "./chat.js";

export const ALL = "all";
export const IDS = [ALL, ...KINDS.map((kind) => kind.id)];

export function emptyChatSettings() {
  return { guides: {}, lengths: {} };
}

export function labelFor(id) {
  return id === ALL ? "All kinds" : (KINDS.find((kind) => kind.id === id)?.label ?? id);
}

// Keeps only known ids, text guides (cut to the limit), and known lengths. Bad entries are dropped one by one.
export function normalizeChatSettings(raw) {
  const result = emptyChatSettings();
  if (!raw || typeof raw !== "object") {
    return result;
  }
  for (const id of IDS) {
    const guide = raw.guides?.[id];
    if (typeof guide === "string" && guide.trim() !== "") {
      result.guides[id] = guide.trim().slice(0, MAX_GUIDE);
    }
    const length = raw.lengths?.[id];
    if (typeof length === "string" && Object.hasOwn(LENGTHS, length)) {
      result.lengths[id] = length;
    }
  }
  return result;
}

// What a kind falls back to when it has no guide of its own.
export function inheritedGuide(settings, id) {
  if (id !== ALL && settings.guides[ALL]) return settings.guides[ALL];
  return DEFAULT_GUIDE;
}

export function inheritedLength(settings, id) {
  if (id !== ALL && settings.lengths[ALL]) return settings.lengths[ALL];
  return DEFAULT_LENGTH;
}

export function guideFor(settings, id) {
  return settings.guides[id] || inheritedGuide(settings, id);
}

export function lengthFor(settings, id) {
  return settings.lengths[id] || inheritedLength(settings, id);
}

export function hasOwn(settings, id) {
  return Boolean(settings.guides[id]) || Boolean(settings.lengths[id]);
}

// The words on the list row.
export function rowState(settings, id) {
  if (settings.guides[id]) return "Your own guide";
  if (settings.lengths[id]) return "Your own reply length";
  if (id !== ALL && (settings.guides[ALL] || settings.lengths[ALL])) return "Using your All kinds guide";
  return "Using the default";
}

// Saves a guide and a length for one id. Words or a length that match what the id would use anyway
// are not stored, so "Using the default" stays true. Returns a new settings object.
export function setFor(settings, id, text, length) {
  const guides = { ...settings.guides };
  const lengths = { ...settings.lengths };
  const trimmed = String(text ?? "").trim().slice(0, MAX_GUIDE);
  if (trimmed === "" || trimmed === inheritedGuide(settings, id)) {
    delete guides[id];
  } else {
    guides[id] = trimmed;
  }
  if (!Object.hasOwn(LENGTHS, length) || length === inheritedLength(settings, id)) {
    delete lengths[id];
  } else {
    lengths[id] = length;
  }
  return { guides, lengths };
}

// "Use the default": clears only this id's own guide and length.
export function clearFor(settings, id) {
  const guides = { ...settings.guides };
  const lengths = { ...settings.lengths };
  delete guides[id];
  delete lengths[id];
  return { guides, lengths };
}

// The questions that draft a guide with the student. Every option is the student's own pick.
// "Not sure" uses a plain fallback. The student reads and edits the result before saving.
export const SETUP_QUESTIONS = [
  {
    id: "length",
    text: "How much should the AI say at once?",
    options: [
      { label: "Just a line or two", length: "short" },
      { label: "A short paragraph", length: "medium" },
      { label: "As much as it needs", length: "long" },
      { label: "Not sure", length: "short" },
    ],
  },
  {
    id: "tone",
    text: "How should it sound?",
    options: [
      { label: "Calm and plain", guide: "Use calm, plain words." },
      { label: "Friendly and light", guide: "Use friendly, light words." },
      { label: "Short and direct", guide: "Be direct and brief, without extra chat." },
      { label: "Not sure", guide: "Use plain words." },
    ],
  },
  {
    id: "start",
    text: "When we begin, what helps most?",
    options: [
      { label: "Ask me what I already know", guide: "Start by asking me what I already know." },
      { label: "One tiny first step to try", guide: "Start by suggesting one tiny first step I can try." },
      { label: "Ask me what feels hard", guide: "Start by asking me what feels hard about it." },
      { label: "Not sure", guide: "" },
    ],
  },
  {
    id: "stuck",
    text: "When I'm stuck, what helps most?",
    options: [
      { label: "A question that gets me thinking", guide: "When I'm stuck, ask a question that gets me thinking." },
      { label: "A smaller piece to try", guide: "When I'm stuck, point me to a smaller piece to try." },
      { label: "Where to look in my notes or book", guide: "When I'm stuck, point me to where in my notes or book to look." },
      { label: "Not sure", guide: "" },
    ],
  },
];

// answers: { length: optionIndex, tone: optionIndex, ... }. Returns { text, length }.
export function guideFromAnswers(answers) {
  const picked = (question) => question.options[answers[question.id]] ?? question.options.at(-1);
  const parts = [];
  for (const question of SETUP_QUESTIONS) {
    const option = picked(question);
    if (option.guide) {
      parts.push(option.guide);
    }
    if (question.id === "stuck") {
      parts.push("Give the smallest hint first, and a bigger one only if I ask again.");
    }
  }
  parts.push("End with one question for me.");
  return { text: parts.join(" ").slice(0, MAX_GUIDE), length: picked(SETUP_QUESTIONS[0]).length };
}
