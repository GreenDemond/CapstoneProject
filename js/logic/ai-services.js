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
  if (list.length >= MAX_SERVICES) {
    return { list, error: `You can save up to ${MAX_SERVICES} AI services. Remove one first.` };
  }
  // OpenRouter's router over free models is the default for OpenRouter addresses. The student can change it.
  // Its providers may keep prompts, so the account settings in DECISIONS T6 still apply.
  const isOpenRouter = new URL(chat).hostname === "openrouter.ai";
  const typedModel = typeof model === "string" ? model.trim() : "";
  const modelName = typedModel === "" && isOpenRouter ? OPENROUTER_DEFAULT_MODEL : typedModel;
  if (modelName.length > MAX_MODEL) {
    return { list, error: `Keep the model name under ${MAX_MODEL} characters.` };
  }
  // Several helpers can share an address (for example two OpenRouter helpers with different AIs),
  // but not the same AI at the same address.
  if (modelTaken(list, chat, modelName)) {
    return { list, error: DUPLICATE_HELPER };
  }
  const typedName = typeof label === "string" ? label.trim() : "";
  if (typedName.length > MAX_LABEL) {
    return { list, error: `Keep the name under ${MAX_LABEL} characters.` };
  }
  if (typedName !== "" && nameTaken(list, typedName)) {
    return { list, error: NAME_TAKEN };
  }
  const name = typedName === "" ? uniqueName(list, autoName(chat, modelName)) : typedName;
  const service = { id: newId(), label: name, url: chat, model: modelName, keyHint, keyReady, checked, effort: DEFAULT_EFFORT };
  return { list: [...list, service], error: null };
}

// How hard the AI should think. Every helper has one; new helpers start on Low.
export const EFFORTS = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
export const DEFAULT_EFFORT = "low";

export const DUPLICATE_HELPER = "You already have a helper for that AI at that address.";
export const NAME_TAKEN = "You already have a helper called that. Pick another name.";

// True when another helper (not ignoreId) has the same address and the same AI (model name is case-sensitive).
export function modelTaken(list, chatUrl, model, ignoreId = null) {
  return list.some((service) => service.id !== ignoreId && service.url === chatUrl && service.model === model);
}

// True when another helper (not ignoreId) already has this name, ignoring upper and lower case.
export function nameTaken(list, name, ignoreId = null) {
  const wanted = name.trim().toLowerCase();
  return list.some((service) => service.id !== ignoreId && service.label.trim().toLowerCase() === wanted);
}

// The model name without its vendor prefix: openai/gpt-oss-20b:free -> gpt-oss-20b:free.
// OpenRouter's own router name (openrouter/free) is kept whole, because "free" alone says little.
export function shortModel(model) {
  const slash = model.indexOf("/");
  if (slash <= 0 || slash === model.length - 1 || model.startsWith("openrouter/")) {
    return model;
  }
  return model.slice(slash + 1);
}

// The name a helper gets when the student does not type one.
export function autoName(chatUrl, model) {
  const host = hostOf(chatUrl);
  const base = host === "openrouter.ai" ? "OpenRouter" : host || "AI service";
  const name = model === "" ? base : `${base} · ${shortModel(model)}`;
  return name.length > MAX_LABEL ? name.slice(0, MAX_LABEL).trimEnd() : name;
}

// Adds " (2)", " (3)" ... until no other helper has the name. The name stays within MAX_LABEL.
export function uniqueName(list, base, ignoreId = null) {
  if (!nameTaken(list, base, ignoreId)) {
    return base;
  }
  for (let n = 2; n < 1000; n += 1) {
    const suffix = ` (${n})`;
    const candidate = `${base.slice(0, MAX_LABEL - suffix.length).trimEnd()}${suffix}`;
    if (!nameTaken(list, candidate, ignoreId)) {
      return candidate;
    }
  }
  return base;
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

// Why a saved helper cannot answer yet, in plain words, or "" when it is ready.
export function needsLine(service) {
  const noKey = service.keyReady !== true;
  const noModel = typeof service.model !== "string" || service.model === "";
  if (noKey && noModel) {
    return "needs a key and an AI picked";
  }
  if (noKey) {
    return "needs a key";
  }
  return noModel ? "needs an AI picked" : "";
}

// The "Which AI helper?" menu in Talk. Every saved helper is listed; one that cannot answer yet is
// disabled and says why. selectedId is the helper in use when it is ready, else null.
// finishInSettings is true when helpers exist but none is ready.
export function talkHelperMenu(list, chosenId) {
  const entries = Array.isArray(list) ? list.filter((s) => s && typeof s.id === "string" && typeof s.label === "string") : [];
  const inUse = inUseHelper(entries, chosenId);
  const selectedId = inUse && isReady(inUse) ? inUse.id : null;
  const seen = new Map();
  const options = entries.map((service) => {
    const why = needsLine(service);
    const count = (seen.get(service.label) ?? 0) + 1;
    seen.set(service.label, count);
    const name = count > 1 ? `${service.label} (${count})` : service.label;
    return { id: service.id, label: why === "" ? name : `${name} (${why})`, disabled: why !== "", selected: service.id === selectedId };
  });
  return { options, selectedId, show: options.length > 0, finishInSettings: options.length > 0 && selectedId === null };
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
      // How hard the AI should think. An unknown or missing value becomes Low; the old on/off setting is dropped.
      effort: EFFORTS.some((e) => e.value === s.effort) ? s.effort : DEFAULT_EFFORT,
    }));
  // Damaged or hand-edited data could repeat an id, a name, or an address with the same AI. Keep the first.
  const unique = [];
  for (const s of services) {
    const clash = unique.some((u) => u.id === s.id || u.label.toLowerCase() === s.label.toLowerCase() || (u.url === s.url && u.model !== "" && u.model === s.model));
    if (!clash) {
      unique.push(s);
    }
  }
  return {
    services: unique,
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
const GOOGLE_HOST = "generativelanguage.googleapis.com";
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
  // Google's OpenAI-compatible Gemini base. This one extra path is accepted for this one host only.
  const google = url.hostname === GOOGLE_HOST && path === "/v1beta/openai";
  if (google || path === "" || path === "/v1" || path.endsWith("/api/v1") || path === "/api/v1") {
    url.pathname = (path === "" ? "/v1" : path) + suffix;
    url.search = "";
    url.hash = "";
    return url.href;
  }
  return null;
}

// The extra fields added to every request: the helper's thinking effort, always sent. OpenRouter gets its
// own field. For any other service we do not know which field it honours, so the common ones are sent;
// a service that ignores them just uses its own setting.
export function reasoningFor(service) {
  const effort = EFFORTS.some((e) => e.value === service?.effort) ? service.effort : DEFAULT_EFFORT;
  if (hostOf(service?.url ?? "") === "openrouter.ai") {
    return { reasoning: { effort } };
  }
  if (effort === "none") {
    return { reasoning: { effort }, reasoning_effort: effort, chat_template_kwargs: { enable_thinking: false } };
  }
  return { reasoning: { effort }, reasoning_effort: effort };
}

export const MUST_THINK_LINE = "This AI always thinks first, so thinking can't be turned off.";
export const EFFORT_IGNORED_LINE = "This AI doesn't take a thinking setting, so it used its own.";

// The quiet line shown when the AI refused the thinking setting.
export function effortRefusedLine(service) {
  return service?.effort === "none" ? MUST_THINK_LINE : EFFORT_IGNORED_LINE;
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
