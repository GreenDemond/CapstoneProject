// The Settings screens: AI helpers list, the add flow, and Manage (design/settings-ux.md v2).
// All text from services or students is shown with textContent. The key lives in one variable
// (draftKey) during setup, never in a form, a stored list, a message, or the log.
import { loadAiSettings, saveAiSettings } from "./storage.js";
import { keyStoreAvailable, saveKey, hasKey, deleteKey, readKey } from "./keystore.js";
import { addService, removeService, inUseHelper, isReady, modelsAddress, readModelIds, hostOf } from "./logic/ai-services.js";
import { checkKey, keyHint, maskedKey } from "./logic/ai-key.js";
import {
  helperStatus,
  choiceAfterRemove,
  pathFor,
  stepTitle,
  checkService,
  orderModels,
  filterModels,
  defaultModel,
  renameService,
  updateService,
  canSaveAnyway,
  stepToFix,
  setupMessage,
  isOpenRouter,
  SHORT_LIST,
  SEARCH_AFTER,
} from "./logic/settings-flow.js";
import { testService, listModels } from "./ai-direct.js";

let aiSettings = loadAiSettings();
const listeners = [];

export function getAiSettings() {
  return aiSettings;
}

export function onAiChange(fn) {
  listeners.push(fn);
}

function notify() {
  for (const fn of listeners) {
    fn();
  }
}

function persist(next = aiSettings) {
  return saveAiSettings(next);
}

export function setChosenHelper(id) {
  aiSettings = { ...aiSettings, chosenId: id };
  persist();
  notify();
}

// ---------- small DOM helpers (text only, never HTML) ----------

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (name === "class") {
      node.className = value;
    } else if (name === "text") {
      node.textContent = value;
    } else if (name.startsWith("on")) {
      node.addEventListener(name.slice(2), value);
    } else if (value === true) {
      node.setAttribute(name, "");
    } else if (value !== false && value != null) {
      node.setAttribute(name, value);
    }
  }
  node.append(...children.flat().filter((child) => child != null));
  return node;
}

function button(text, onClick, { primary = false, label = null, id = null } = {}) {
  return el("button", { type: "button", class: primary ? "primary" : "", text, onclick: onClick, "aria-label": label, id });
}

// ---------- module state ----------

let screen = null;
let pasteScreen = null;
let openButton = null;
let views = {};
let keyStatesPromise = Promise.resolve();

let flow = null; // the add/finish/replace/change flow in progress
let draftKey = null; // the key typed during setup, in memory only
let controller = null; // cancels a request in flight
let token = 0; // bumped on every step change or cancel, so a late reply is ignored
let committing = false;
let busy = false;
let msgEl = null; // the one live message area of the current step
let manage = { id: null, mode: null, message: "" };
let slowTimer = null;

function show(name) {
  for (const [key, node] of Object.entries(views)) {
    node.hidden = key !== name;
  }
}

function setMessage(text) {
  if (msgEl) {
    msgEl.textContent = text;
  }
}

function service(id) {
  return aiSettings.services.find((item) => item.id === id) ?? null;
}

function abortRequest() {
  controller?.abort();
  controller = null;
  clearTimeout(slowTimer);
  slowTimer = null;
}

function dropKey() {
  draftKey = null;
}

// Which saved helpers have a key in the encrypted store. Checked on each load.
async function loadKeyStates() {
  const available = keyStoreAvailable();
  const services = await Promise.all(
    aiSettings.services.map(async (item) => ({ ...item, keyReady: available ? await hasKey(item.id) : false })),
  );
  aiSettings = { ...aiSettings, services };
  notify();
}

// ---------- Screen A: the list ----------

async function renderList(message = "", focusSelector = null) {
  show("list");
  const root = views.list;
  root.replaceChildren(el("p", { class: "hint", text: "Checking saved keys…" }));
  await keyStatesPromise;
  root.replaceChildren();

  const heading = el("h3", { id: "helpers-heading", tabindex: "-1", text: "AI helpers" });
  root.append(
    el("p", {}, button("Back", closeSettings, { id: "settings-back" })),
    heading,
    el("p", { class: "hint", text: "An AI helper can suggest steps for your assignment. It's optional. Without one, you still get the built-in steps." }),
  );

  const inUse = inUseHelper(aiSettings.services, aiSettings.chosenId);
  const cards = el("ul", { class: "helper-cards" });
  for (const item of aiSettings.services) {
    const status = helperStatus(item);
    const using = inUse?.id === item.id && isReady(item);
    const actions = el("div", { class: "actions" });
    if (status.action === "finish") {
      actions.append(button("Finish setup", () => startFlow("finish", item), { label: `Finish setting up ${item.label}` }));
    } else if (status.action === "check") {
      actions.append(button("Check it", () => startFlow("finish", item), { label: `Check ${item.label}` }));
    }
    if (isReady(item) && !using) {
      actions.append(button("Use this one", () => useHelper(item), { label: `Use ${item.label}` }));
    }
    actions.append(button("Manage", () => openManage(item.id), { label: `Manage ${item.label}`, id: `manage-${item.id}` }));
    cards.append(
      el(
        "li",
        { class: "helper-card", "data-id": item.id },
        el("strong", { text: item.label }),
        el("p", { class: "status" }, el("span", { "aria-hidden": "true", text: `${status.icon} ` }), `${status.word}${using ? " · In use" : ""}`),
        actions,
      ),
    );
  }
  root.append(cards);
  root.append(el("p", {}, button("Add an AI helper", () => startFlow("add", null), { primary: true, id: "add-helper" })));
  const live = el("p", { class: "setup-message", role: "status", "aria-live": "polite" });
  root.append(live);
  live.textContent = message;

  const target = focusSelector ? root.querySelector(focusSelector) : null;
  (target ?? heading).focus();
}

function useHelper(item) {
  setChosenHelper(item.id);
  renderList(`Using ${item.label}.`, `#manage-${item.id}`);
}

export function openSettingsScreen() {
  pasteScreen.hidden = true;
  screen.hidden = false;
  renderList();
}

function closeSettings() {
  endFlow();
  screen.hidden = true;
  pasteScreen.hidden = false;
  openButton.focus();
}

// ---------- the add flow ----------

function startFlow(mode, item) {
  endFlow();
  const path = pathFor(mode, item);
  flow = {
    mode,
    serviceId: item?.id ?? null,
    provider: item ? (isOpenRouter(item.url) ? "openrouter" : "other") : null,
    url: item?.url ?? null,
    address: "",
    model: item?.model ?? "",
    label: item?.label ?? "",
    keyHint: item?.keyHint ?? "",
    path,
    step: null,
    models: null,
    pick: "",
    lastKind: null,
  };
  goStep(path[0]);
}

function endFlow() {
  abortRequest();
  dropKey();
  flow = null;
  token += 1;
  committing = false;
  busy = false;
  msgEl = null;
}

function cancelFlow() {
  const wasManage = flow && (flow.mode === "replaceKey" || flow.mode === "changeAi");
  const id = flow?.serviceId;
  endFlow();
  if (wasManage) {
    openManage(id);
  } else {
    renderList("", "#add-helper");
  }
}

function goStep(step) {
  abortRequest();
  token += 1;
  busy = false;
  flow.step = step;
  if (step === "service") {
    renderServiceStep();
  } else if (step === "key") {
    renderKeyStep();
  } else if (step === "pick") {
    renderPickStep();
  } else {
    renderCheckStep();
  }
}

function nextStep() {
  const index = flow.path.indexOf(flow.step);
  if (index + 1 < flow.path.length) {
    goStep(flow.path[index + 1]);
  }
}

function backStep() {
  const index = flow.path.indexOf(flow.step);
  if (index > 0) {
    goStep(flow.path[index - 1]);
  } else {
    cancelFlow();
  }
}

// One step's frame: heading, the fields, the buttons, then the one message area under them.
function frame(introText) {
  show("add");
  const root = views.add;
  root.replaceChildren();
  const heading = el("h3", { tabindex: "-1", id: "flow-heading", text: `${stepTitle(flow.mode, flow.path, flow.step)}: ${stepName(flow.step)}` });
  const body = el("div", { class: "step-body" });
  const actions = el("div", { class: "actions" });
  const live = el("p", { class: "setup-message", role: "status", "aria-live": "polite" });
  root.append(heading);
  if (introText) {
    root.append(el("p", { class: "hint", text: introText }));
  }
  root.append(body, actions, live);
  msgEl = live;
  return { heading, body, actions };
}

function stepName(step) {
  return { service: "Which service?", key: "Paste your key", pick: "Pick an AI", check: "Checking it works" }[step];
}

function navButtons(actions, { nextLabel = "Next", onNext, allowBack = true } = {}) {
  if (onNext) {
    actions.append(button(nextLabel, onNext, { primary: true, id: "flow-next" }));
  }
  if (allowBack && flow.path.indexOf(flow.step) > 0) {
    actions.append(button("Back", backStep, { id: "flow-back" }));
  }
  actions.append(button("Cancel", cancelFlow, { id: "flow-cancel" }));
}

const TRUST_LINE = "Only use a key and address from your own account or a parent's. Whoever runs the address can read what you send.";

// Step 1: which service
function renderServiceStep() {
  const { heading, body, actions } = frame("");
  const radios = el(
    "fieldset",
    { class: "choices" },
    el("legend", { class: "visually-hidden", text: "Which service?" }),
    radioOption("service-openrouter", "OpenRouter", "A popular service with many AIs. You need a key. An adult may need to make the account.", flow.provider === "openrouter"),
    radioOption("service-other", "Another service", "An AI on a computer or service you already have.", flow.provider === "other"),
  );
  const addressInput = el("input", { id: "flow-address", type: "text", autocomplete: "off", spellcheck: "false", value: flow.address });
  const addressRow = el(
    "div",
    { id: "address-row" },
    el("label", { for: "flow-address", text: "Its web address" }),
    el("p", { class: "hint", text: "It looks like http://my-computer:8080 or https://example.com." }),
    addressInput,
    el("p", { id: "http-note", class: "hint reserved" }),
  );
  addressRow.hidden = flow.provider !== "other";
  body.append(radios, addressRow, el("p", { class: "hint", text: TRUST_LINE }));

  const syncRows = () => {
    const other = body.querySelector("#service-other").checked;
    addressRow.hidden = !other;
  };
  body.querySelectorAll("input[type=radio]").forEach((radio) => radio.addEventListener("change", syncRows));
  addressInput.addEventListener("input", () => {
    flow.address = addressInput.value;
    const plain = /^http:\/\//i.test(addressInput.value.trim());
    addressRow.querySelector("#http-note").textContent = plain
      ? "This address isn't encrypted. Your key and text can be read on the way. Use https if you can."
      : "";
  });

  navButtons(actions, {
    onNext: () => {
      const provider = body.querySelector("#service-openrouter").checked ? "openrouter" : body.querySelector("#service-other").checked ? "other" : null;
      if (!provider) {
        setMessage("Pick one first.");
        return;
      }
      const result = checkService(provider, addressInput.value, aiSettings.services, flow.serviceId);
      if (!result.ok) {
        setMessage(setupMessage(result.kind));
        addressInput.focus();
        return;
      }
      flow.provider = provider;
      flow.url = result.url;
      flow.label = provider === "openrouter" ? "OpenRouter" : hostOf(result.url);
      nextStep();
    },
  });
  heading.focus();
}

function radioOption(id, title, hint, checked) {
  return el(
    "div",
    { class: "choice" },
    el("input", { type: "radio", name: "service", id, checked }),
    el("label", { for: id }, el("strong", { text: title }), el("span", { class: "hint", text: ` ${hint}` })),
  );
}

// Step 2: the key. The box is not in a form, and it is emptied and removed when the step ends.
function renderKeyStep() {
  const { heading, body, actions } = frame("A key is like a password. It lets this app use an AI account. Keep it private.");
  const host = hostOf(flow.url);
  body.append(el("p", { class: "hint", text: "Whoever made this key should set a spending limit on it." }));
  if (/^http:/i.test(flow.url)) {
    body.append(el("p", { class: "hint", text: "This address isn't encrypted. Your key can be read on the way." }));
  }

  if (!keyStoreAvailable()) {
    body.append(el("p", { class: "message", text: setupMessage("noStorage") }));
    actions.append(button("Cancel", cancelFlow, { id: "flow-cancel" }));
    heading.focus();
    return;
  }

  let keyInput = null;
  if (draftKey !== null) {
    body.append(
      el("p", { id: "key-entered", text: `Key entered: ${maskedKey(keyHint(draftKey))}` }),
      button("Paste a different key", () => {
        dropKey();
        renderKeyStep();
      }),
    );
  } else {
    keyInput = el("input", {
      id: "flow-key",
      type: "password",
      autocomplete: "off",
      spellcheck: "false",
      autocapitalize: "off",
      autocorrect: "off",
      "data-1p-ignore": "true",
      "data-lpignore": "true",
      "data-bwignore": "true",
    });
    const reveal = el("button", {
      type: "button",
      id: "flow-key-show",
      "aria-pressed": "false",
      text: "Show",
      onclick: () => {
        const showing = keyInput.type === "text";
        keyInput.type = showing ? "password" : "text";
        reveal.setAttribute("aria-pressed", String(!showing));
        reveal.textContent = showing ? "Show" : "Hide";
      },
    });
    body.append(el("label", { for: "flow-key", text: "Your key" }), el("div", { class: "key-row" }, keyInput, reveal));
  }
  body.append(
    el("details", {}, el("summary", { text: "Where do I get a key?" }), el("p", { class: "hint", text: "Ask the adult who manages the AI account. Or make one at openrouter.ai, which needs an adult." })),
    el(
      "details",
      {},
      el("summary", { text: "Tips for whoever manages the account" }),
      el("p", { class: "hint", text: "Don't save a key on a shared computer. In the AI account, turn off any setting that lets providers keep or train on text." }),
    ),
    el("p", { class: "hint", text: TRUST_LINE }),
  );

  const next = flow.path[flow.path.indexOf("key") + 1];
  const nextLabel = next === "pick" && flow.provider !== "openrouter" ? `Next (sends your key to ${host} to look up its AIs)` : next === "check" ? `Next (checks the key with ${host})` : "Next";
  navButtons(actions, {
    nextLabel,
    onNext: () => {
      if (draftKey === null) {
        const checked = checkKey(keyInput.value);
        if (!checked.ok) {
          setMessage(checked.reason === "Paste the key first." ? setupMessage("emptyKey") : checked.reason);
          keyInput.focus();
          return;
        }
        draftKey = checked.key;
        keyInput.value = "";
      }
      flow.keyHint = keyHint(draftKey);
      nextStep();
    },
  });
  heading.focus();
}

// Step 3: pick an AI. The list is looked up by itself; typing a name is always possible.
function renderPickStep() {
  const { heading, body, actions } = frame("");
  const status = el("p", { class: "hint", id: "list-status", text: "Looking up the list…" });
  const stop = button("Stop", () => abortRequest(), { id: "list-stop" });
  const choices = el("div", { class: "choices", id: "ai-choices" });
  const freeNote = el("p", { class: "hint reserved", id: "free-note" });
  const typed = el("input", { id: "flow-typed", type: "text", maxlength: "100", autocomplete: "off", spellcheck: "false", value: "" });
  const typedBox = el(
    "details",
    { id: "typed-box" },
    el("summary", { text: "I know the name already" }),
    el("label", { for: "flow-typed", text: "The AI's name" }),
    typed,
  );
  body.append(status, stop, choices, freeNote, typedBox);

  if (flow.mode === "changeAi" && flow.model) {
    typed.value = flow.model;
    typedBox.open = true;
  }
  flow.pick = flow.pick || "";

  const showFreeNote = () => {
    const chosen = typed.value.trim() || flow.pick;
    freeNote.textContent = isOpenRouter(flow.url) && (chosen === "openrouter/free" || chosen.endsWith(":free"))
      ? "Free AIs may keep or learn from what you send, unless you turned that off in your OpenRouter account. Pick a paid one for private work."
      : "";
  };
  typed.addEventListener("input", showFreeNote);

  navButtons(actions, {
    onNext: () => {
      const name = typed.value.trim() || flow.pick;
      if (name === "") {
        setMessage(setupMessage("noModel"));
        return;
      }
      flow.model = name.slice(0, 100);
      nextStep();
    },
  });
  heading.focus();

  const mine = token;
  controller = new AbortController();
  (async () => {
    // OpenRouter's list is public, so its key is not sent. Other services get the key they were given.
    let key = null;
    if (flow.provider !== "openrouter") {
      key = draftKey ?? (flow.serviceId ? await readKey(flow.serviceId) : null);
    }
    const result = await listModels(key, modelsAddress(flow.url), readModelIds, controller?.signal);
    if (mine !== token) {
      return;
    }
    stop.hidden = true;
    if (result.error) {
      status.textContent = "";
      setMessage(result.aborted ? setupMessage("stopped") : setupMessage(result.kind === "key" ? "key" : "listFailed"));
      typedBox.open = true;
      return;
    }
    flow.models = result.models;
    status.textContent = "";
    const preselected = defaultModel(flow.url, result.models, flow.model);
    flow.pick = flow.pick || preselected;
    // Picking from the list clears a typed name, so the choice made last is the one used.
    drawChoices(choices, orderModels(result.models, preselected), () => {
      typed.value = "";
      showFreeNote();
    });
    showFreeNote();
  })();
}

// Draws the AI choices once. Searching and "Show more" change only this part.
function drawChoices(container, ordered, onPick) {
  container.replaceChildren();
  const search = ordered.length > SEARCH_AFTER ? el("input", { type: "search", id: "flow-search", "aria-label": "Search the AIs", placeholder: "Search the AIs", autocomplete: "off" }) : null;
  const list = el("div", { class: "choice-list", role: "radiogroup", "aria-label": "AIs" });
  const more = button("Show more", () => {
    expanded = true;
    paint();
  });
  let expanded = false;
  const paint = () => {
    const matches = filterModels(ordered, search?.value ?? "");
    const shown = expanded || search?.value ? matches : matches.slice(0, SHORT_LIST);
    list.replaceChildren(
      ...shown.map((id, index) =>
        el(
          "div",
          { class: "choice" },
          el("input", {
            type: "radio",
            name: "ai-pick",
            id: `pick-${index}`,
            value: id,
            checked: id === flow.pick,
            onchange: () => {
              flow.pick = id;
              onPick();
            },
          }),
          el("label", { for: `pick-${index}`, text: id }),
        ),
      ),
    );
    more.hidden = expanded || Boolean(search?.value) || matches.length <= SHORT_LIST;
  };
  search?.addEventListener("input", paint);
  container.append(...[search, list, more].filter(Boolean));
  paint();
}

// Step 4: check it works, by itself. Stop is always there.
async function renderCheckStep() {
  const { heading, body, actions } = frame("");
  const waiting = el("p", { id: "check-status", text: "Checking… " });
  const stop = button("Stop checking", () => abortRequest(), { id: "check-stop" });
  body.append(waiting, stop);
  heading.focus();

  const mine = token;
  controller = new AbortController();
  busy = true;
  slowTimer = setTimeout(() => {
    if (mine === token) {
      setMessage(setupMessage("slow"));
    }
  }, 10000);

  const key = draftKey ?? (flow.serviceId ? await readKey(flow.serviceId) : null);
  if (mine !== token) {
    return;
  }
  let result;
  if (!key) {
    result = { ok: false, kind: "key" };
  } else {
    result = await testService({ url: flow.url, model: flow.model }, key, controller?.signal);
  }
  if (mine !== token) {
    return;
  }
  clearTimeout(slowTimer);
  busy = false;
  stop.hidden = true;
  waiting.textContent = "";
  actions.replaceChildren();

  if (result.ok) {
    setMessage("It works. That means the service answered. It doesn't mean it keeps no data.");
    const done = button("Done", () => commit(true), { primary: true, id: "flow-done" });
    actions.append(done, button("Cancel", cancelFlow, { id: "flow-cancel" }));
    done.focus();
    return;
  }
  flow.lastKind = result.kind;
  setMessage(setupMessage(result.kind));
  const retry = button("Try again", () => goStep("check"), { primary: true, id: "flow-retry" });
  actions.append(retry);
  const fixStep = stepToFix(result.kind);
  const target = flow.path.includes(fixStep) ? fixStep : flow.path[0];
  if (flow.path.indexOf(target) < flow.path.indexOf("check")) {
    actions.append(button("Go back and fix", () => goStep(target), { id: "flow-fix" }));
  }
  if (canSaveAnyway(result.kind) && (flow.mode === "add" || flow.mode === "finish")) {
    actions.append(button("Save it anyway", () => commit(false), { id: "flow-anyway" }));
    actions.append(el("p", { class: "hint", text: "It might not work when you ask for steps. If not, you'll get the built-in steps." }));
  }
  actions.append(button("Cancel", cancelFlow, { id: "flow-cancel" }));
  retry.focus();
}

// Saves, in this order: the key, then the list. If the list fails, the new key is deleted again.
async function commit(checked) {
  if (committing) {
    return;
  }
  committing = true;
  document.querySelectorAll("#helpers-add button").forEach((b) => (b.disabled = true));
  const mode = flow.mode;
  let id = flow.serviceId;
  let candidate;

  if (mode === "add") {
    const added = addService(aiSettings.services, {
      label: flow.label,
      url: flow.url,
      model: flow.model,
      keyHint: flow.keyHint,
      checked,
      keyReady: true,
    });
    if (added.error) {
      setMessage(added.error);
      return failCommit();
    }
    id = added.list[added.list.length - 1].id;
    candidate = { services: added.list, chosenId: aiSettings.chosenId };
  } else {
    const changes = { model: flow.model, checked, keyReady: true };
    if (draftKey !== null) {
      changes.keyHint = flow.keyHint;
    }
    candidate = { services: updateService(aiSettings.services, id, changes), chosenId: aiSettings.chosenId };
  }

  if (draftKey !== null && !(await saveKey(id, draftKey))) {
    setMessage(setupMessage("keySaveFailed"));
    return failCommit();
  }
  // A helper that was checked and is the first ready one is put in use by itself.
  const current = inUseHelper(candidate.services.filter((item) => item.id !== id), candidate.chosenId);
  if (checked && (!current || !isReady(current))) {
    candidate.chosenId = id;
  }
  if (!persist(candidate)) {
    if (mode === "add" && draftKey !== null) {
      await deleteKey(id);
    }
    setMessage(setupMessage("listSaveFailed"));
    return failCommit();
  }
  aiSettings = candidate;
  const saved = service(id);
  endFlow();
  notify();
  if (mode === "add" || mode === "finish") {
    const using = inUseHelper(aiSettings.services, aiSettings.chosenId)?.id === id;
    renderList(
      checked ? `${saved.label} is ready${using ? " and in use" : ""}.` : `${saved.label} is saved, but not checked yet.`,
      `#manage-${id}`,
    );
  } else {
    manage = { id, mode: null, message: "Saved." };
    renderManage();
  }
}

function failCommit() {
  committing = false;
  document.querySelectorAll("#helpers-add button").forEach((b) => (b.disabled = false));
}

// ---------- Screen C: Manage ----------

function openManage(id) {
  manage = { id, mode: null, message: "" };
  renderManage();
}

function renderManage(focusSelector = null) {
  const item = service(manage.id);
  if (!item) {
    renderList();
    return;
  }
  show("manage");
  const root = views.manage;
  root.replaceChildren();
  const heading = el("h3", { id: "manage-heading", tabindex: "-1", text: `Manage ${item.label}` });
  const live = el("p", { class: "setup-message", role: "status", "aria-live": "polite" });
  msgEl = live;
  root.append(el("p", {}, button("Back", () => renderList("", `#manage-${item.id}`), { id: "manage-back" })), heading);

  const row = (label, value, ...controls) =>
    el("div", { class: "manage-row" }, el("p", {}, el("strong", { text: `${label}: ` }), value), el("div", { class: "actions" }, ...controls));

  // Name
  if (manage.mode === "rename") {
    const input = el("input", { id: "rename-input", type: "text", maxlength: "60", autocomplete: "off", value: item.label });
    root.append(
      el(
        "div",
        { class: "manage-row" },
        el("label", { for: "rename-input", text: "Name" }),
        input,
        el(
          "div",
          { class: "actions" },
          button("Save name", () => {
            const result = renameService(aiSettings.services, item.id, input.value);
            if (result.error) {
              setMessage(result.error);
              return;
            }
            aiSettings = { ...aiSettings, services: result.list };
            persist();
            notify();
            manage = { id: item.id, mode: null, message: "Saved." };
            renderManage("#rename-open");
          }, { primary: true }),
          button("Cancel", () => {
            manage.mode = null;
            renderManage("#rename-open");
          }),
        ),
      ),
    );
  } else {
    root.append(row("Name", item.label, button("Rename", () => { manage.mode = "rename"; renderManage("#rename-input"); }, { id: "rename-open", label: `Rename ${item.label}` })));
  }

  root.append(el("p", { class: "hint", text: `Where: ${item.url}` }));
  if (/^http:/i.test(item.url)) {
    root.append(el("p", { class: "hint", text: "This address isn't encrypted. Your key and text can be read on the way." }));
  }

  const status = helperStatus(item);
  if (!item.keyReady) {
    root.append(row("Key", "none", button("Finish setup", () => startFlow("finish", item))));
  } else {
    root.append(
      row(
        "AI",
        item.model || "none picked yet",
        button("Change the AI", () => startFlow("changeAi", item), { id: "change-ai", label: `Change the AI for ${item.label}` }),
      ),
    );
    if (manage.mode === "forget") {
      root.append(confirmRow(`Forget the key for ${item.label}? You'll need to paste it again. Ask whoever gave it to you if you don't have it.`, "Yes, forget it", async () => {
        await deleteKey(item.id);
        aiSettings = { ...aiSettings, services: updateService(aiSettings.services, item.id, { keyReady: false, keyHint: "" }) };
        persist();
        notify();
        manage = { id: item.id, mode: null, message: `Forgot the key for ${item.label}.` };
        renderManage("#manage-back");
      }));
    } else {
      root.append(
        row(
          "Key",
          maskedKey(item.keyHint || "••••"),
          button("Replace key", () => startFlow(item.model === "" ? "finish" : "replaceKey", item), { id: "replace-key", label: `Replace the key for ${item.label}` }),
          button("Forget key", () => { manage.mode = "forget"; renderManage("#confirm-yes"); }, { id: "forget-key", label: `Forget the key for ${item.label}` }),
        ),
      );
    }
    if (item.model !== "" && status.action !== "finish") {
      root.append(el("div", { class: "actions" }, button("Test it again", () => testAgain(item), { id: "test-again", label: `Test ${item.label} again` })));
    }
  }

  if (manage.mode === "remove") {
    root.append(confirmRow(`Remove ${item.label}? You can add it again later.`, "Yes, remove", async () => {
      await deleteKey(item.id);
      const chosenId = choiceAfterRemove(aiSettings.services, item.id, aiSettings.chosenId);
      aiSettings = { services: removeService(aiSettings.services, item.id), chosenId };
      persist();
      notify();
      manage = { id: null, mode: null, message: "" };
      renderList(`Removed ${item.label}.`, "#add-helper");
    }));
  } else {
    root.append(el("div", { class: "actions" }, button("Remove this helper", () => { manage.mode = "remove"; renderManage("#confirm-yes"); }, { id: "remove-helper", label: `Remove ${item.label}` })));
  }
  root.append(live);
  live.textContent = manage.message;
  manage.message = "";
  (focusSelector ? root.querySelector(focusSelector) : heading)?.focus();
}

function confirmRow(question, yesLabel, onYes) {
  return el(
    "div",
    { class: "manage-row confirm" },
    el("p", { role: "alert", text: question }),
    el("div", { class: "actions" }, button(yesLabel, onYes, { primary: true, id: "confirm-yes" }), button("Keep it", () => {
      manage.mode = null;
      renderManage("#manage-back");
    })),
  );
}

async function testAgain(item) {
  if (busy) {
    return;
  }
  busy = true;
  setMessage("Checking… Slower AIs can take a few minutes.");
  const key = await readKey(item.id);
  const result = key ? await testService({ url: item.url, model: item.model }, key) : { ok: false, kind: "key" };
  busy = false;
  if (result.ok) {
    aiSettings = { ...aiSettings, services: updateService(aiSettings.services, item.id, { checked: true }) };
    persist();
    notify();
    manage = { id: item.id, mode: null, message: "It works." };
    renderManage("#test-again");
  } else {
    setMessage(setupMessage(result.kind));
  }
}

// ---------- start-up ----------

export function initSettings({ screen: screenEl, pasteScreen: pasteEl, openButton: openEl }) {
  screen = screenEl;
  pasteScreen = pasteEl;
  openButton = openEl;
  views = {
    list: screen.querySelector("#helpers-list"),
    add: screen.querySelector("#helpers-add"),
    manage: screen.querySelector("#helpers-manage"),
  };
  openButton.addEventListener("click", openSettingsScreen);
  keyStatesPromise = loadKeyStates();

  // Leaving the page or hiding the tab drops the key and hides a shown key.
  window.addEventListener("pagehide", () => {
    dropKey();
    abortRequest();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      const input = document.getElementById("flow-key");
      if (input) {
        input.type = "password";
        const toggle = document.getElementById("flow-key-show");
        toggle?.setAttribute("aria-pressed", "false");
        if (toggle) {
          toggle.textContent = "Show";
        }
      }
    }
  });
  // A page restored from the back/forward cache starts Settings again, with no half-finished setup.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && !screen.hidden) {
      endFlow();
      renderList();
    }
  });
}
