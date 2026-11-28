// The rules behind the AI helpers screens (design/settings-ux.md v2). No screen or network code here.
import { chatAddress, isReady, OPENROUTER_DEFAULT_MODEL, GOOGLE_DEFAULT_MODEL, GOOGLE_HOST, hostOf, nameTaken, MAX_LABEL, NAME_TAKEN } from "./ai-services.js";

export const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
export const GOOGLE_BASE = "https://generativelanguage.googleapis.com/v1beta/openai";
export const GEMINI_NAME = "Gemini";
export const GOOGLE_KEY_PAGE = "https://aistudio.google.com/apikey";

// The three steps shown on the key step for Google (design/gemini-quick-setup.md).
export const GEMINI_STEPS = [
  "Open Google AI Studio and sign in with a Google account (an adult's account).",
  "Choose Get API key, then Create API key.",
  "Copy the key and paste it below.",
];
export const GEMINI_LINK_TEXT = "Open Google AI Studio";
export const GEMINI_LINK_HINT = "This opens Google's website in a new tab.";
export const GEMINI_RENAMED = "Google may have renamed these buttons.";
export const GEMINI_PRIVACY =
  "What you type to Gemini goes to Google. Free plans may use it to improve Google's products. Don't type your name or anything private. This is for you and Ben, not for classmates. Check Google's current terms.";
export const GOOGLE_BUSY = "Gemini says you've used the free quota for now. Wait a bit and try again.";

export function isGoogle(chatUrl) {
  return hostOf(chatUrl) === GOOGLE_HOST;
}

// One status word per helper, with the action it offers. Needs a key comes first when both are missing.
export function helperStatus(service) {
  if (!service.keyReady) {
    return { word: "Needs a key", icon: "!", action: "finish" };
  }
  if (service.model === "") {
    return { word: "Needs an AI picked", icon: "!", action: "finish" };
  }
  if (service.checked === false) {
    return { word: "Not checked yet", icon: "!", action: "check" };
  }
  return { word: "Ready", icon: "✓", action: null };
}

// After removing a helper, keep the choice if it still exists; otherwise the first ready one, or none.
export function choiceAfterRemove(list, removedId, chosenId) {
  const remaining = list.filter((service) => service.id !== removedId);
  if (chosenId !== removedId && remaining.some((service) => service.id === chosenId)) {
    return chosenId;
  }
  return remaining.find((service) => isReady(service) && service.checked !== false)?.id ?? null;
}

// The steps a flow goes through, by mode. Step names: service, key, pick, check.
export function pathFor(mode, service) {
  if (mode === "replaceKey") {
    return ["key", "check"];
  }
  if (mode === "changeAi") {
    return ["pick", "check"];
  }
  if (mode === "finish" && service) {
    if (!service.keyReady) {
      return service.model === "" ? ["key", "pick", "check"] : ["key", "check"];
    }
    return service.model === "" ? ["pick", "check"] : ["check"];
  }
  return ["service", "key", "pick", "check"];
}

export function stepTitle(mode, path, step) {
  if (mode === "replaceKey") {
    return "Replace the key";
  }
  if (mode === "changeAi") {
    return "Change the AI";
  }
  if (path.length === 1) {
    return "Check it works";
  }
  return `Step ${path.indexOf(step) + 1} of ${path.length}`;
}

export function isOpenRouter(chatUrl) {
  return hostOf(chatUrl) === "openrouter.ai";
}

export function looksLikeOpenRouter(typed) {
  try {
    const host = new URL(typed.trim()).hostname;
    return host.includes("openrouter") && host !== "openrouter.ai";
  } catch {
    return false;
  }
}

// Step 1 checks, before any key is typed. Returns { ok, url } or { ok: false, kind }.
export function checkService(provider, typedAddress) {
  const typed = provider === "openrouter" ? OPENROUTER_BASE : provider === "google" ? GOOGLE_BASE : typedAddress;
  if (provider === "other") {
    if (typeof typed !== "string" || typed.trim() === "") {
      return { ok: false, kind: "notAddress" };
    }
    if (looksLikeOpenRouter(typed)) {
      return { ok: false, kind: "notOpenRouter" };
    }
  }
  const url = chatAddress(typed);
  if (url === null) {
    return { ok: false, kind: /^https?:\/\//i.test(typed.trim()) ? "unusableAddress" : "notAddress" };
  }
  // Several helpers can share an address. Only the same AI at the same address is refused (addService, pick step).
  return { ok: true, url };
}

// What shows in the pull-down: the preselected AI first, then A to Z.
export function orderModels(ids, preselected) {
  const rest = [...new Set(ids)].filter((id) => id !== preselected).sort((a, b) => a.localeCompare(b));
  return preselected ? [preselected, ...rest] : rest;
}

export function defaultModel(chatUrl, ids, current) {
  if (current) {
    return current;
  }
  if (isOpenRouter(chatUrl)) {
    return OPENROUTER_DEFAULT_MODEL;
  }
  if (hostOf(chatUrl) === GOOGLE_HOST) {
    return GOOGLE_DEFAULT_MODEL;
  }
  return ids.length === 1 ? ids[0] : "";
}

export function renameService(list, id, label) {
  const name = typeof label === "string" ? label.trim() : "";
  if (name === "" || name.length > MAX_LABEL) {
    return { list, error: `Give it a name up to ${MAX_LABEL} characters.` };
  }
  if (nameTaken(list, name, id)) {
    return { list, error: NAME_TAKEN };
  }
  return { list: list.map((service) => (service.id === id ? { ...service, label: name } : service)), error: null };
}

export function updateService(list, id, changes) {
  return list.map((service) => (service.id === id ? { ...service, ...changes } : service));
}

// "Save it anyway" is offered only when the check could not tell whether the service works.
export function canSaveAnyway(kind) {
  return kind === "network" || kind === "timeout" || kind === "emptyReply" || kind === "stopped";
}

// Which step to go back to for each kind of failure.
export function stepToFix(kind) {
  if (kind === "key") {
    return "key";
  }
  if (kind === "notFound") {
    return "pick";
  }
  return "service";
}

export function failureKindForStatus(status) {
  if (status === 401 || status === 403) {
    return "key";
  }
  if (status === 400 || status === 404) {
    return "notFound";
  }
  if (status === 402) {
    return "credit";
  }
  if (status === 429 || status >= 500) {
    return "busy";
  }
  return "network";
}

const MESSAGES = {
  emptyKey: "Paste your key first.",
  notAddress: "That doesn't look like a web address. It should start with http:// or https://.",
  unusableAddress: "Type the address the service gives you, for example http://host:8080 or https://openrouter.ai/api/v1.",
  notOpenRouter: "That isn't OpenRouter's address. Go back and pick OpenRouter.",
  key: "That key didn't work. Check you copied all of it. A grown-up can help you get a new one.",
  notFound: "Something doesn't match. Let's check the address and the AI together.",
  credit: "This key is out of credit. Whoever manages the account can add more.",
  busy: "This AI is busy right now. Try again in a minute.",
  network: "Couldn't reach it. Check your internet. If it still fails, ask a grown-up.",
  listFailed: "Couldn't load the list. You can type the AI's name below.",
  emptyReply: "It replied, but the reply was empty. Try a different AI.",
  timeout: "It didn't answer in time. Try again, or pick a faster AI.",
  stopped: "Stopped. You can try again, go back, or save it anyway.",
  slow: "Still waiting. Slower AIs can take a few minutes.",
  noModel: "Pick an AI from the list, or type its name.",
  noStorage: "This browser can't keep a key safely (private browsing can cause this). Try a normal window.",
  keySaveFailed: "Couldn't save the key on this device, so nothing was saved.",
  listSaveFailed: "Couldn't save on this device, so nothing was saved.",
};

export function setupMessage(kind, chatUrl = null) {
  if (kind === "busy" && chatUrl && isGoogle(chatUrl)) {
    return GOOGLE_BUSY;
  }
  return MESSAGES[kind] ?? MESSAGES.network;
}
