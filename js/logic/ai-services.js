// The list of AI services a student has added (design/ai-endpoints.md). No screen code here.
// Keys are not part of this list; they are stored separately, encrypted, in the next step.

export const MAX_SERVICES = 10;
export const MAX_LABEL = 60;
export const OPENROUTER_ADDRESS = "https://openrouter.ai/api/v1/chat/completions";

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
export function addService(list, { label, url }) {
  const name = typeof label === "string" ? label.trim() : "";
  if (name === "") {
    return { list, error: "Give this AI a name, so you can tell it apart." };
  }
  if (name.length > MAX_LABEL) {
    return { list, error: `Keep the name under ${MAX_LABEL} characters.` };
  }
  if (list.length >= MAX_SERVICES) {
    return { list, error: `You can save up to ${MAX_SERVICES} AI services. Remove one first.` };
  }
  if (list.some((service) => service.url === url)) {
    return { list, error: "That address is already saved." };
  }
  const service = { id: newId(list), label: name, url, keyReady: false };
  return { list: [...list, service], error: null };
}

export function removeService(list, id) {
  return list.filter((service) => service.id !== id);
}

// The service used on the paste screen. If the saved choice is gone, the first one is used.
export function chosenService(list, chosenId) {
  if (list.length === 0) {
    return null;
  }
  return list.find((service) => service.id === chosenId) ?? list[0];
}

// A service can only answer once its key is saved (keyReady). Until then it does not count.
export function usableServices(list) {
  return list.filter((service) => service.keyReady === true);
}

// The line shown on the paste screen. Only a service with a key ready counts as set up.
export function pasteStatus(list, chosenId) {
  const usable = usableServices(list);
  const service = chosenService(usable, chosenId);
  if (!service) {
    return "No AI is set up yet, so you'll get the built-in steps. You can add one in Settings.";
  }
  return `Using: ${service.label}`;
}

function newId(list) {
  const used = new Set(list.map((service) => service.id));
  let n = list.length + 1;
  while (used.has(`svc-${n}`)) {
    n += 1;
  }
  return `svc-${n}`;
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
    .map((s) => ({ id: s.id, label: s.label.trim(), url: parseAddress(s.url).url, keyReady: s.keyReady === true }));
  return {
    services,
    chosenId: typeof data.chosenId === "string" ? data.chosenId : null,
  };
}
