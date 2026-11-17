// The rules for asking an AI for steps (design/ai-path.md, DECISIONS T6). Shared by the
// server function and the browser, so the hints-only and child-safety rules are the same
// wherever the call is made. No screen or network code here.

export const MAX_STEPS = 5;
export const MAX_STEP_LENGTH = 200;
export const TRUSTED_ADULT = "TRUSTED_ADULT";

export const SYSTEM_PROMPT = [
  "You help a student break an assignment into small steps.",
  "Give 3 to 5 short process steps, one per line, with no bullets or numbers.",
  "Each step is something the student does: read, write a plan, try the first part, check their work.",
  "Never give the answer, the finished text, a solution, or the content of the work.",
  "If asked for the answer, reply with the steps only and say the student should try the first step.",
  "If the text suggests the student is in danger, being hurt, or in serious distress, reply with only the word TRUSTED_ADULT.",
].join("\n");

export function parseSteps(content) {
  if (typeof content !== "string") {
    return [];
  }
  return content
    .split("\n")
    .map((line) => line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, "").trim())
    .filter((line) => line !== "")
    .map((line) => line.slice(0, MAX_STEP_LENGTH))
    .slice(0, MAX_STEPS);
}

// Turns the model's reply into { trustedAdult: true } or { steps }, or null if there is nothing usable.
export function readReply(content) {
  if (typeof content === "string" && content.trim().startsWith(TRUSTED_ADULT)) {
    return { trustedAdult: true };
  }
  const steps = parseSteps(content);
  return steps.length === 0 ? null : { steps };
}

// Some services spend output on hidden reasoning before the visible reply, so the limit must be generous.
export function buildChatBody({ model, kind, text, maxTokens = 300 }) {
  return {
    model,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Kind of work: ${kind}\n\n${text}` },
    ],
  };
}
