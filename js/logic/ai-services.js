// The list of AI services a student has added (design/ai-endpoints.md). No screen code here.
// Keys are not part of this list; they are stored separately, encrypted, in the next step.

export const MAX_SERVICES = 10;
export const MAX_LABEL = 60;
export const OPENROUTER_DEFAULT_MODEL = "openrouter/free";
export const OPENROUTER_ADDRESS = "https://openrouter.ai/api/v1/chat/completions";
export const MAX_MODEL = 100;

// Checks a typed address. Accepts http:// or https:// (Ben's decision, design/ai-endpoints.md).
// Returns { ok: true, url, plainHttp } or { ok: false, reason }.
export function parseAddress(text) {
  const raw = typeof text === "string" ? text.trim() : "";
  if (raw === "") {
    return { ok: false, reason: "Type the address of the AI service." };
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "That doesn't look like an address. It should start with http:// or https://." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, reason: "The address should start with http:// or https://." };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "Remove the name and password from the address." };
  }
  return { ok: true, url: url.href, plainHttp: url.protocol === "http:" };
}

export function plainHttpWarning() {
  return "This address is not encrypted. Anyone on the network path can read your key and your text. Use https if you can.";
}

// Returns { list, error }. The list keeps its order; the first service added is the default.
export function addService(list, { label, url, model = "", keyHint = "", checked = true, keyReady = false }) {
  const chat = chatAddress(url);
  if (chat === null) {
    return { list, error: "Type the address the service gives you, for example http://host:8080 or https://openrouter.ai/api/v1." };
  }
  const typedName = typeof label === "string" ? label.trim() : "";
  const name = typedName === "" ? hostLabel(chat) : typedName;
  if (name.length > MAX_LABEL) {
    return { list, error: `Keep the name under ${MAX_LABEL} characters.` };
  }
  if (list.length >= MAX_SERVICES) {
    return { list, error: `You can save up to ${MAX_SERVICES} AI services. Remove one first.` };
  }
  if (list.some((service) => service.url === chat)) {
    return { list, error: "That address is already saved." };
  }
  // OpenRouter's router over free models is the default for OpenRouter addresses. The student can change it.
  // Its providers may keep prompts, so the account settings in DECISIONS T6 still apply.
  const isOpenRouter = new URL(chat).hostname === "openrouter.ai";
  const typedModel = typeof model === "string" ? model.trim() : "";
  const modelName = typedModel === "" && isOpenRouter ? OPENROUTER_DEFAULT_MODEL : typedModel;
  if (modelName.length > MAX_MODEL) {
    return { list, error: `Keep the model name under ${MAX_MODEL} characters.` };
  }
  const service = { id: newId(), label: name, url: chat, model: modelName, keyHint, keyReady, checked };
  return { list: [...list, service], error: null };
}

export function removeService(list, id) {
  return list.filter((service) => service.id !== id);
}

// The service used on the paste screen. If the saved choice is gone, the first one is used.
// The helper in use: the one the student chose, or else the first ready one that passed its check,
// or none. A helper saved with "Save it anyway" is never put in use by itself.
export function inUseHelper(list, chosenId) {
  return list.find((service) => service.id === chosenId) ?? list.find((service) => isReady(service) && service.checked !== false) ?? null;
}

// A service can only answer once its key is saved (keyReady). Until then it does not count.
export function usableServices(list) {
  return list.filter((service) => service.keyReady === true && service.model !== "");
}

// The line shown on the paste screen. The chosen helper is used, or the app says why it cannot be.
// It never quietly switches to another helper.
export function pasteStatus(list, chosenId) {
  if (list.length === 0) {
    return "No AI is set up yet, so you'll get the built-in steps. You can add one in Settings.";
  }
  const chosen = inUseHelper(list, chosenId);
  if (chosen && isReady(chosen)) {
    return `Using: ${chosen.label}`;
  }
  const unready = chosen ?? list.find((service) => !isReady(service));
  if (unready && !isReady(unready)) {
    return `${unready.label} isn't ready yet (it needs a key and an AI picked), so the built-in steps are used. Finish it in Settings, or choose another AI helper.`;
  }
  return "No AI helper is in use. Choose one in Settings.";
}

export function isReady(service) {
  return service.keyReady === true && service.model !== "";
}

// Ids never repeat, so an old encrypted key can never attach to a new helper at another address.
function newId() {
  const random = globalThis.crypto?.randomUUID?.();
  return random ? `svc-${random}` : `svc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Keeps only saved entries with the expected shape. Damaged entries are dropped one by one.
export function normalizeServices(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.services)) {
    return { services: [], chosenId: null };
  }
  const services = data.services
    .filter((s) => s && typeof s.id === "string" && typeof s.label === "string" && typeof s.url === "string")
    .filter((s) => s.label.trim() !== "" && s.label.length <= MAX_LABEL)
    .filter((s) => parseAddress(s.url).ok)
    .slice(0, MAX_SERVICES)
    .map((s) => ({
      id: s.id,
      label: s.label.trim(),
      url: parseAddress(s.url).url,
      // A service saved before model names existed is kept, with no model: it is not ready until one is typed.
      model: typeof s.model === "string" ? s.model.trim().slice(0, MAX_MODEL) : "",
      // Only the last four characters of a key are kept here. Whether a key is ready is
      // checked against the encrypted store on each load, not trusted from this list.
      keyHint: typeof s.keyHint === "string" ? s.keyHint.slice(0, 4) : "",
      keyReady: false,
      // Only a helper saved with "Save it anyway" is marked as not checked; older saved helpers count as checked.
      checked: s.checked !== false,
    }));
  return {
    services,
    chosenId: typeof data.chosenId === "string" ? data.chosenId : null,
  };
}

// The model list sits beside the chat address: the same base, with /models in place of
// /chat/completions. OpenAI's standard is GET {base}/models, and OpenRouter's is
// https://openrouter.ai/api/v1/models for https://openrouter.ai/api/v1/chat/completions.
// Only a standard chat address is changed; any other returns null, and the app does not guess.
export function modelsAddress(chatUrl) {
  let url;
  try {
    url = new URL(chatUrl);
  } catch {
    return null;
  }
  const suffix = "/chat/completions";
  if (!url.pathname.endsWith(suffix)) {
    return null;
  }
  url.pathname = url.pathname.slice(0, -suffix.length) + "/models";
  url.search = "";
  url.hash = "";
  return url.href;
}

// Reads the ids from a standard model-list reply ({ object: "list", data: [{ id }] }).
// The names come from the service, so only plain names are kept (letters, digits and . _ : / ~ -).
const PLAIN_MODEL_ID = /^[A-Za-z0-9._:/~-]{1,100}$/;
export function readModelIds(data) {
  const list = Array.isArray(data?.data) ? data.data : [];
  return list
    .map((item) => (typeof item === "string" ? item : item?.id))
    .filter((id) => typeof id === "string" && PLAIN_MODEL_ID.test(id.trim()))
    .map((id) => id.trim())
    .slice(0, 1000);
}

// The student types only the base address the service gives. The app adds the chat path:
//   http://host:8080            -> http://host:8080/v1/chat/completions   (standard OpenAI layout)
//   https://openrouter.ai/api/v1 -> https://openrouter.ai/api/v1/chat/completions
// A full chat address (ending in /chat/completions) is kept as typed. Any other path gives null,
// and the app asks the student for the address the service gives instead of guessing.
export function chatAddress(typed) {
  const parsed = parseAddress(typed);
  if (!parsed.ok) {
    return null;
  }
  const url = new URL(parsed.url);
  const path = url.pathname.replace(/\/+$/, "");
  const suffix = "/chat/completions";
  if (path.endsWith(suffix)) {
    return url.href;
  }
  if (path === "" || path === "/v1" || path.endsWith("/api/v1") || path === "/api/v1") {
    url.pathname = (path === "" ? "/v1" : path) + suffix;
    url.search = "";
    url.hash = "";
    return url.href;
  }
  return null;
}

export function hostLabel(chatUrl) {
  try {
    return new URL(chatUrl).hostname;
  } catch {
    return "AI service";
  }
}

export function hostOf(chatUrl) {
  try {
    return new URL(chatUrl).hostname;
  } catch {
    return "";
  }
}
