// Calls the AI service a student chose, straight from this page (design/ai-endpoints.md,
// step 3; parent decision 2026-11-17). Only this file sends the student's text to a service.
// Every failure returns a plain reason; nothing is thrown to the screen, and the key is never
// put in a message.
import { buildChatBody, readReply } from "./logic/ai-prompt.js";

const TIMEOUT_MS = 20000;

// Turns an HTTP status into a plain line the student can act on.
export function plainFailure(status) {
  if (status === 401 || status === 403) {
    return "The service didn't accept the key. Check it in Settings.";
  }
  if (status === 400 || status === 404) {
    return "The service didn't accept the address or the model name. Check both in Settings.";
  }
  if (status === 402 || status === 429 || status >= 500) {
    return "The service is busy or out of credit right now. Try again later.";
  }
  return "The service couldn't answer. Try again later.";
}

export const MAX_TEXT = 6000;

async function post(service, key, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(service.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// Returns { steps }, { trustedAdult: true }, or { error } with a plain line.
export async function askService(service, key, text, kind) {
  if (text.length > MAX_TEXT) {
    return { error: "That text is too long to send. Shorten it and try again." };
  }
  let response;
  try {
    response = await post(service, key, buildChatBody({ model: service.model, kind, text }));
  } catch {
    return { error: "Couldn't reach the service. Check the address and your connection. (Some services must be set up to allow this app.)" };
  }
  if (!response.ok) {
    return { error: plainFailure(response.status) };
  }
  let data;
  try {
    data = await response.json();
  } catch {
    return { error: "The service answered in a way the app doesn't understand." };
  }
  const reply = readReply(data?.choices?.[0]?.message?.content);
  if (!reply) {
    return { error: "The service didn't suggest any steps." };
  }
  return reply;
}

// A harmless check: sends one short line and reports whether the service answered.
export async function testService(service, key) {
  let response;
  try {
    response = await post(service, key, {
      model: service.model,
      max_tokens: 5,
      messages: [{ role: "user", content: "Reply with the word ok." }],
    });
  } catch {
    return { ok: false, message: "Couldn't reach the service. Check the address and your connection." };
  }
  if (!response.ok) {
    return { ok: false, message: plainFailure(response.status) };
  }
  return { ok: true, message: "Connected. This AI can answer." };
}
