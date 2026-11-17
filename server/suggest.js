// Server function for AI suggestions (DECISIONS T5, T6, T7; design/ai-path.md).
// Portable: one file, standard Request and Response objects, the key read from the
// environment (OPENROUTER_API_KEY). Off until the parent sets the key and a model
// name. Nothing here logs or stores the student's text.

export const MAX_CHARS = 6000;
export const MAX_REQUESTS_PER_HOUR = 10;
export const MAX_STEPS = 5;
export const MAX_STEP_LENGTH = 200;
export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const TRUSTED_ADULT = "TRUSTED_ADULT";

const KIND_IDS = ["essay", "reading", "problem-set", "project", "test-prep", "other"];

// The rules the AI must follow. They live on the server, so a student cannot change them.
export const SYSTEM_PROMPT = [
  "You help a student with ADHD break an assignment into small steps.",
  "Give 3 to 5 short process steps, one per line, with no bullets or numbers.",
  "Each step is something the student does: read, write a plan, try the first part, check their work.",
  "Never give the answer, the finished text, a solution, or the content of the work.",
  "If asked for the answer, reply with the steps only and say the student should try the first step.",
  "If the text suggests the student is in danger, being hurt, or in serious distress, reply with only the word TRUSTED_ADULT.",
].join("\n");

// In-memory request counter per visitor. Hosts that restart clear it; that is acceptable for a beta.
export function createLimiter(now = () => Date.now()) {
  const hits = new Map();
  return {
    allow(visitor) {
      const cutoff = now() - 60 * 60 * 1000;
      const recent = (hits.get(visitor) ?? []).filter((time) => time > cutoff);
      if (recent.length >= MAX_REQUESTS_PER_HOUR) {
        hits.set(visitor, recent);
        return false;
      }
      recent.push(now());
      hits.set(visitor, recent);
      return true;
    },
  };
}

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

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export function createSuggestHandler({
  apiKey,
  model,
  appOrigin,
  fetchImpl = globalThis.fetch,
  limiter = createLimiter(),
} = {}) {
  const available = Boolean(apiKey && model && appOrigin);

  return async function handle(request) {
    if (request.method === "GET") {
      return json(200, { available });
    }
    if (request.method !== "POST") {
      return json(405, { error: "method not allowed" });
    }
    if (!available) {
      return json(503, { error: "unavailable" });
    }
    if (request.headers.get("origin") !== appOrigin) {
      return json(403, { error: "forbidden" });
    }

    const visitor = request.headers.get("x-forwarded-for") ?? "unknown";
    if (!limiter.allow(visitor)) {
      return json(429, { error: "too many requests" });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json(400, { error: "bad request" });
    }
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const kind = KIND_IDS.includes(body?.kind) ? body.kind : "other";
    if (text === "") {
      return json(400, { error: "nothing to suggest from" });
    }
    if (text.length > MAX_CHARS) {
      return json(413, { error: "too long" });
    }

    let content;
    try {
      const response = await fetchImpl(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 300,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Kind of work: ${kind}\n\n${text}` },
          ],
        }),
      });
      if (!response.ok) {
        return json(502, { error: "unavailable" });
      }
      const data = await response.json();
      content = data?.choices?.[0]?.message?.content;
    } catch {
      return json(502, { error: "unavailable" });
    }

    if (typeof content === "string" && content.trim().startsWith(TRUSTED_ADULT)) {
      return json(200, { trustedAdult: true, steps: [] });
    }
    const steps = parseSteps(content);
    if (steps.length === 0) {
      return json(502, { error: "unavailable" });
    }
    return json(200, { steps });
  };
}
