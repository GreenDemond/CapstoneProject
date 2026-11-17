// Server function for AI suggestions (DECISIONS T6, T7; design/ai-path.md). Used only for the
// parent's own key on the server (design/ai-endpoints.md, step 4). Portable: one file, standard
// Request and Response objects, the key read from the environment (OPENROUTER_API_KEY).
// Off until the parent sets the key and a model name. Nothing here logs or stores the text.
import { MAX_STEPS, MAX_STEP_LENGTH, TRUSTED_ADULT, SYSTEM_PROMPT, parseSteps, readReply, buildChatBody } from "../js/logic/ai-prompt.js";

export { MAX_STEPS, MAX_STEP_LENGTH, TRUSTED_ADULT, SYSTEM_PROMPT, parseSteps };

export const MAX_CHARS = 6000;
export const MAX_REQUESTS_PER_HOUR = 10;
export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const KIND_IDS = ["essay", "reading", "problem-set", "project", "test-prep", "other"];

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
        body: JSON.stringify(buildChatBody({ model, kind, text })),
      });
      if (!response.ok) {
        return json(502, { error: "unavailable" });
      }
      const data = await response.json();
      content = data?.choices?.[0]?.message?.content;
    } catch {
      return json(502, { error: "unavailable" });
    }

    const reply = readReply(content);
    if (reply?.trustedAdult) {
      return json(200, { trustedAdult: true, steps: [] });
    }
    if (!reply) {
      return json(502, { error: "unavailable" });
    }
    return json(200, { steps: reply.steps });
  };
}
