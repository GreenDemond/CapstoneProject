// Calls the AI service a student chose, straight from this page (design/ai-endpoints.md,
// step 3; parent decision 2026-11-17). Only this file sends the student's text to a service.
// Every failure returns a plain reason and a kind; nothing is thrown to the screen, and the
// key is never put in a message. Requests do not follow redirects, so an address that
// redirects cannot move the key or the text to another place.
import { buildChatBody, readReply } from "./logic/ai-prompt.js";
import { buildChatRequest, readChatReply } from "./logic/chat.js";
import { failureKindForStatus } from "./logic/settings-flow.js";

export const COULDNT_REACH = "Couldn't reach the service. Check the address and your connection. If the address is right, the service may need to allow this app (its CORS setting).";

// Slower services can take minutes. The page says it is still waiting; after this, a plain message.
export const TIMEOUT_MS = 180000;
export const MAX_TEXT = 6000;

// Turns an HTTP status into a plain line for the paste screen.
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

// One request. Returns { response } or { failed: "aborted" | "timeout" | "network" }.
// An optional signal lets the caller cancel (Cancel, Stop, leaving the screen).
async function request(url, init, signal) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error",
    });
    return { response };
  } catch {
    return { failed: signal?.aborted ? "aborted" : timedOut ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

function postJson(service, key, body, signal) {
  return request(
    service.url,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    signal,
  );
}

// Returns { steps }, { trustedAdult: true }, or { error } with a plain line (paste screen wording).
export async function askService(service, key, text, kind, signal) {
  if (text.length > MAX_TEXT) {
    return { error: "That text is too long to send. Shorten it and try again." };
  }
  const result = await postJson(service, key, buildChatBody({ model: service.model, kind, text, maxTokens: 1500 }), signal);
  if (result.failed) {
    return { error: COULDNT_REACH };
  }
  if (!result.response.ok) {
    return { error: plainFailure(result.response.status) };
  }
  let data;
  try {
    data = await result.response.json();
  } catch {
    return { error: "The service answered in a way the app doesn't understand." };
  }
  const reply = readReply(data?.choices?.[0]?.message?.content);
  if (!reply) {
    return { error: "The service didn't suggest any steps." };
  }
  return reply;
}

// One chat turn. Returns { text, cutOff }, { empty, cutOff }, { trustedAdult }, { aborted }, or { error }.
export async function askChat(service, key, { kind, guide, messages }, signal) {
  const result = await postJson(service, key, buildChatRequest({ model: service.model, kind, guide, messages }), signal);
  if (result.failed === "aborted") {
    return { aborted: true };
  }
  if (result.failed) {
    return { error: COULDNT_REACH };
  }
  if (!result.response.ok) {
    return { error: plainFailure(result.response.status) };
  }
  let data;
  try {
    data = await result.response.json();
  } catch {
    return { error: "The service answered in a way the app doesn't understand." };
  }
  return readChatReply(data);
}

// A harmless check. Returns { ok: true } or { ok: false, kind, aborted? }.
// kind: key | notFound | credit | busy | network | timeout | emptyReply (see setupMessage).
// It reads the reply, because "answered" must mean "answered with text the app can use".
export async function testService(service, key, signal) {
  const result = await postJson(
    service,
    key,
    {
      model: service.model,
      max_tokens: 1500,
      messages: [{ role: "user", content: "Reply with the word ok." }],
    },
    signal,
  );
  if (result.failed) {
    return { ok: false, kind: result.failed === "aborted" ? "stopped" : result.failed, aborted: result.failed === "aborted" };
  }
  if (!result.response.ok) {
    return { ok: false, kind: failureKindForStatus(result.response.status) };
  }
  let data;
  try {
    data = await result.response.json();
  } catch {
    return { ok: false, kind: "emptyReply" };
  }
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    return { ok: false, kind: "emptyReply" };
  }
  return { ok: true };
}

// Asks a service for its model names. The key is optional: OpenRouter's list is public, so its
// key is not sent. Returns { models } or { error, kind, aborted? }.
export async function listModels(key, modelsUrl, readIds, signal) {
  if (modelsUrl === null) {
    return { error: "The app can't find this service's model list from its address.", kind: "listFailed" };
  }
  const headers = key ? { Authorization: `Bearer ${key}` } : {};
  const result = await request(modelsUrl, { method: "GET", headers }, signal);
  if (result.failed) {
    return { error: COULDNT_REACH, kind: result.failed === "aborted" ? "stopped" : "listFailed", aborted: result.failed === "aborted" };
  }
  if (!result.response.ok) {
    return { error: plainFailure(result.response.status), kind: failureKindForStatus(result.response.status) === "key" ? "key" : "listFailed" };
  }
  let data;
  try {
    data = await result.response.json();
  } catch {
    return { error: "The model list isn't in a form the app understands.", kind: "listFailed" };
  }
  const models = readIds(data);
  if (models.length === 0) {
    return { error: "The service didn't list any models.", kind: "listFailed" };
  }
  return { models };
}
