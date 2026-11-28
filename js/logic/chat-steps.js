// Talking about a step, and turning an AI reply that is a list into steps (design/talk-about-step-w14.md).
// Pure logic: no screen, no network. A port of the iPhone app's StepList.extract and ProcessStep.isProcess.
// Nothing here writes a step for the student: it only offers lines that look like things the student does,
// and the student edits and approves them in the steps editor.

export const TALK_ABOUT_BUTTON = "Talk about this step";
export const TALKING_ABOUT = "Talking about";
export const TALK_CLEAR = "Clear";
export const TALK_USE_STEPS = "Use these as my steps";
export const TALK_BACK_TO_STEP = "Back to my step";
export const STEP_SENT_LINE = "This step is sent along with your messages.";
export const EDITOR_BUSY_LINE = "You're already writing steps on the home screen. Finish or leave those first, then try again.";

export const MAX_OFFERED = 12; // most steps offered from one reply
export const MAX_OFFERED_LENGTH = 200; // the editor's step limit
export const MAX_ABOUT_SHOWN = 120; // characters of the step shown in the "Talking about" line
export const MAX_ABOUT_SENT = 200; // characters of the step sent to the AI
const MAX_WORDS = 20;

const VERBS = new Set([
  "read", "reread", "write", "rewrite", "list", "make", "find", "check", "look", "try", "open",
  "plan", "pick", "choose", "decide", "set", "ask", "note", "jot", "do", "take", "start", "begin",
  "gather", "collect", "skim", "scan", "highlight", "underline", "circle", "mark", "copy",
  "sketch", "outline", "draft", "brainstorm", "revise", "edit", "proofread", "review", "quiz",
  "schedule", "think", "say", "talk", "discuss", "show", "compare", "define", "solve", "work",
  "count", "sort", "group", "tell", "save", "close", "put", "get", "pack", "clear", "break",
  "split", "divide", "practice", "test", "time", "rest", "stretch", "drink", "move", "stand",
  "return", "label", "number", "match", "connect", "add", "cross", "rank", "prioritize",
  "prioritise", "select", "identify", "summarize", "summarise", "restate", "paraphrase", "use",
  "keep", "stop", "go", "turn", "join", "fix", "finish", "remind", "pause", "spend", "give",
  "send", "share", "build", "create", "name", "mention", "record", "sit",
  "locate", "explore", "research", "investigate", "weigh", "rehearse", "organize", "organise",
  "answer",
]);

// Wording that looks like finished work rather than a step.
const FINISHED_PHRASES = [
  /\bhere(?:'s| is| are)\s+(?:your|the|my|a|an)\s+(?:finished|final|complete|full|sample|example|rewritten|polished)?\s*(?:essay|answers?|solutions?|paragraphs?|summary|response|draft|version|report|conclusion|introduction)\b/i,
  /\bthe\s+(?:correct\s+|final\s+)?answer\s+is\b/i,
  /^\s*(?:final\s+answer|answer|solution|essay)\s*:/i,
  /\bin\s+conclusion,/i,
  /\btherefore,?\s+the\s+answer\b/i,
  /\bhere\s+(?:it\s+is|you\s+go)\s*:/i,
];

const WORKED_RESULT = /(?:=\s*-?\d|\bequals\s+-?\d|\banswer\s+is\b|\bresult\s+is\b|\b[a-z]\s+is\s+-?\d)/i;
const LONG_QUOTE = /["\u201c][^"\u201d]{25,}["\u201d]/;
const COLON_SENTENCE = /:\s*\S.{40,}/;
const LIST_LINE = /^(?:\d{1,2}[.)]|[-\u2022*])\s+(.+)$/;

// True for a short line that starts with a doing word and holds no answer content.
export function isProcessStep(step, limit = MAX_OFFERED_LENGTH) {
  const text = typeof step === "string" ? step.trim() : "";
  if (text === "" || text.length > limit) return false;
  const words = text.split(/\s+/);
  if (words.length > MAX_WORDS) return false;
  const first = words[0].toLowerCase().replace(/[^a-z\u00e0-\u00ff]/g, "");
  if (!VERBS.has(first)) return false;
  if (FINISHED_PHRASES.some((pattern) => pattern.test(text))) return false;
  if (LONG_QUOTE.test(text) || COLON_SENTENCE.test(text)) return false;
  return !WORKED_RESULT.test(text);
}

// The list lines of a reply, with the number or bullet and bold marks taken off, each cut to the limit.
// Fewer than two list lines means it is not a list: nothing is returned.
export function listLines(reply, limit = MAX_OFFERED_LENGTH) {
  if (typeof reply !== "string") return [];
  const lines = [];
  for (const raw of reply.split("\n")) {
    const match = LIST_LINE.exec(raw.trim());
    if (!match) continue;
    const step = match[1].replace(/\*\*/g, "").trim().slice(0, limit).trim();
    if (step !== "") lines.push(step);
  }
  return lines.length >= 2 ? lines : [];
}

// The steps to offer from an AI reply: list lines that are things to do, at most MAX_OFFERED.
// Two or more must pass, else nothing is offered.
export function offeredSteps(reply) {
  const kept = listLines(reply).filter((line) => isProcessStep(line));
  return kept.length >= 2 ? kept.slice(0, MAX_OFFERED) : [];
}

// The step as shown in "Talking about: ...": one line, cut with an ellipsis. Null when there is no step.
export function aboutLine(step) {
  const text = cleanStep(step, MAX_ABOUT_SHOWN + 1);
  if (text === "") return null;
  const shown = text.length > MAX_ABOUT_SHOWN ? `${text.slice(0, MAX_ABOUT_SHOWN).trimEnd()}\u2026` : text;
  return `${TALKING_ABOUT}: ${shown}`;
}

// Whitespace made single spaces, cut to a length. Used for the step kept with an open chat.
export function cleanStep(step, max = MAX_ABOUT_SENT) {
  return typeof step === "string" ? step.replace(/\s+/g, " ").trim().slice(0, max).trim() : "";
}

// The newest reply is the one offered: the last item that is a message, and only when it is an AI reply.
// items: a chat's items. Returns the steps, or [] when the last message is not a normal AI reply.
export function stepsFromChat(items) {
  if (!Array.isArray(items)) return [];
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const item = items[i];
    if (item?.who === "sources") continue;
    return item?.who === "ai" ? offeredSteps(item.text) : [];
  }
  return [];
}
