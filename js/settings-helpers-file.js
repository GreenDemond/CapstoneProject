// The "Move your helpers" part of the AI helpers list (design/ai-helpers-file.md).
// Save: makes a file of the helpers, with or without locked keys. Load: previews a file, then adds
// the helpers only after "Yes". Text from a file is only ever shown with textContent (T11).
// A passphrase lives in an input box and in one local variable; it is never stored, logged or shown.
import { el, button, announce } from "./ui/dom.js";
import { keyStoreAvailable, readKey, saveKey, deleteKey } from "./keystore.js";
import { keyHint } from "./logic/ai-key.js";
import { plainHttpWarning } from "./logic/ai-services.js";
import { encryptKeys, decryptKeys } from "./logic/helpers-crypto.js";
import {
  MAX_FILE_BYTES,
  MIN_PASSPHRASE,
  TOO_BIG,
  WRONG_PASSPHRASE,
  helpersFileName,
  buildHelpersFile,
  keysByRef,
  checkPassphrase,
  parseHelpersFile,
  planLoad,
} from "./logic/ai-helpers-file.js";

const WARN_LINE = "These helpers send what you type to the address shown. Only load a file you made yourself.";
const DELAY_AFTER = 3; // wrong passphrases before a short wait
const DELAY_MS = 5000;

// What the section is doing. `parsed` holds a checked file (no plain keys); nothing is saved until Yes.
let state = freshState();
let host = null; // the container drawn into
let ctx = null; // { getSettings, commitSettings, done }
let working = false;
let waitTimer = null;

function freshState() {
  return { view: "home", withKeys: false, parsed: null, status: "", wrong: 0, locked: false };
}

// Called when Settings is left, the page hides, or the list is drawn again.
export function resetHelpersFile() {
  clearTimeout(waitTimer);
  waitTimer = null;
  working = false;
  state = freshState();
}

// Called when the tab is hidden: forget anything typed, keep the rest of the step.
export function clearTypedPassphrases() {
  for (const id of ["hf-pass", "hf-pass2", "hf-open-pass"]) {
    const box = document.getElementById(id);
    if (box) {
      box.value = "";
    }
  }
}

export function renderMoveSection(container, context) {
  resetHelpersFile();
  host = container;
  ctx = context;
  draw();
}

function draw(focusSelector = null) {
  host.replaceChildren();
  const status = el("p", "", { class: "setup-message", role: "status", "aria-live": "polite", id: "hf-status" });
  host.append(el("h4", "Move your helpers", { id: "hf-heading", tabindex: "-1" }));
  if (state.view === "home") {
    drawHome();
  } else if (state.view === "save") {
    drawSave();
  } else if (state.view === "choose") {
    drawChoose();
  } else if (state.view === "preview") {
    drawPreview();
  } else {
    drawPassphrase();
  }
  host.append(status);
  announce(status, state.status);
  state.status = "";
  const target = focusSelector ? host.querySelector(focusSelector) : null;
  target?.focus();
}

function drawHome() {
  host.append(
    el("p", "Keep your helpers in a file, then bring them back in another browser or after a clean-up. Keys are left out unless you lock them with a passphrase.", { class: "hint" }),
    el("div", "", { class: "actions" }),
  );
  const actions = host.lastChild;
  const services = ctx.getSettings().services;
  const save = button("Save my AI helpers", () => go("save", "#hf-without"), "");
  save.id = "hf-save";
  save.disabled = services.length === 0;
  const load = button("Load AI helpers", () => go("choose", "#hf-file"), "");
  load.id = "hf-load";
  actions.append(save, load);
}

function go(view, focus) {
  state.view = view;
  state.status = "";
  draw(focus);
}

function backHome(message = "", focus = "#hf-load") {
  clearTimeout(waitTimer);
  state = freshState();
  state.status = message;
  draw(focus);
}

function option(id, title, hint, checked) {
  const row = el("div", "", { class: "choice" });
  const input = el("input", "", { type: "radio", name: "hf-kind", id });
  input.checked = checked;
  const label = el("label", "", { for: id });
  label.append(el("strong", title), el("span", ` ${hint}`, { class: "hint" }));
  row.append(input, label);
  return row;
}

// ---------- Save ----------

function drawSave() {
  const choices = el("fieldset", "", { class: "choices" });
  choices.append(
    el("legend", "What goes in the file?", { class: "visually-hidden" }),
    option("hf-without", "Without keys (safest)", "Addresses, names, AIs and thinking effort only.", !state.withKeys),
    option("hf-with", "With keys, locked with a passphrase", "Keys saved on this device are locked in the file.", state.withKeys),
  );
  const passRow = el("div", "", { id: "hf-pass-row" });
  passRow.hidden = !state.withKeys;
  const pass = el("input", "", { id: "hf-pass", type: "password", autocomplete: "new-password", spellcheck: "false", autocapitalize: "off", "data-1p-ignore": "true", "data-lpignore": "true", "data-bwignore": "true" });
  const pass2 = el("input", "", { id: "hf-pass2", type: "password", autocomplete: "new-password", spellcheck: "false", autocapitalize: "off", "data-1p-ignore": "true", "data-lpignore": "true", "data-bwignore": "true" });
  passRow.append(
    el("p", "Pick a passphrase you will remember. It can't be recovered.", { class: "hint" }),
    el("p", `Use at least ${MIN_PASSPHRASE} characters, such as a few words in a row. Anyone who gets the file can keep guessing, so a short or common phrase is not safe.`, { class: "hint" }),
    el("label", "Passphrase", { for: "hf-pass" }),
    pass,
    el("label", "Type it again", { for: "hf-pass2" }),
    pass2,
  );
  const sync = () => {
    passRow.hidden = !host.querySelector("#hf-with").checked;
  };
  choices.querySelectorAll("input").forEach((box) => box.addEventListener("change", sync));
  const make = button("Make the file", () => makeFile(pass, pass2), "primary");
  make.id = "hf-make";
  const cancel = button("Cancel", () => backHome("", "#hf-save"), "");
  cancel.id = "hf-cancel";
  host.append(choices, passRow, el("div", "", { class: "actions" }));
  host.lastChild.append(make, cancel);
}

async function makeFile(pass, pass2) {
  if (working) {
    return;
  }
  const withKeys = host.querySelector("#hf-with").checked;
  state.withKeys = withKeys;
  let passphrase = null;
  if (withKeys) {
    const checked = checkPassphrase(pass.value, pass2.value);
    if (!checked.ok) {
      announce(host.querySelector("#hf-status"), checked.reason);
      pass.focus();
      return;
    }
    passphrase = checked.passphrase;
  }
  working = true;
  host.querySelectorAll("button").forEach((b) => (b.disabled = true));
  let plainKeys = null;
  try {
    const services = ctx.getSettings().services;
    let block = null;
    let count = 0;
    if (withKeys && keyStoreAvailable()) {
      const byId = new Map();
      for (const item of services) {
        if (item.keyReady) {
          const key = await readKey(item.id);
          if (key !== null) {
            byId.set(item.id, key);
          }
        }
      }
      plainKeys = keysByRef(services, byId);
      count = plainKeys.size;
      if (count > 0) {
        block = await encryptKeys(globalThis.crypto.subtle, (bytes) => globalThis.crypto.getRandomValues(bytes), passphrase, plainKeys);
      }
    }
    const file = buildHelpersFile(services, { keysBlock: block, nowIso: new Date().toISOString() });
    const name = helpersFileName(file.savedOn);
    download(file, name);
    const what = `${services.length} ${services.length === 1 ? "helper" : "helpers"}`;
    let line;
    if (block) {
      line = `Saved ${what} and ${count} locked ${count === 1 ? "key" : "keys"} in ${name}. Look in your Downloads folder. You need the passphrase to use the keys.`;
    } else if (withKeys) {
      line = `Saved ${what} in ${name}. No helper has a key saved on this device, so the file has no keys. Look in your Downloads folder.`;
    } else {
      line = `Saved ${what} in ${name}, without keys. Look in your Downloads folder.`;
    }
    state = freshState();
    state.status = line;
  } catch {
    state.status = "That didn't work. Nothing was changed. Try again.";
    state.view = "home";
  }
  // Nothing sensitive stays around: boxes are rebuilt, the key map is dropped.
  plainKeys?.clear();
  working = false;
  draw("#hf-save");
}

function download(file, name) {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ---------- Load ----------

function drawChoose() {
  const input = el("input", "", { type: "file", id: "hf-file", accept: ".json,application/json" });
  input.addEventListener("change", () => chooseFile(input));
  host.append(
    el("p", "Choose an AI helpers file you saved before. It is checked first, and nothing changes until you agree.", { class: "hint" }),
    el("label", "Choose an AI helpers file", { for: "hf-file" }),
    input,
  );
  const cancel = button("Cancel", () => backHome("", "#hf-load"), "");
  cancel.id = "hf-cancel";
  host.append(el("div", "", { class: "actions" }));
  host.lastChild.append(cancel);
}

function readText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function chooseFile(input) {
  const file = input.files?.[0];
  if (!file) {
    return;
  }
  let result;
  if (file.size > MAX_FILE_BYTES) {
    result = { ok: false, reason: TOO_BIG };
  } else {
    try {
      result = parseHelpersFile(await readText(file));
    } catch {
      result = { ok: false, reason: "That file couldn't be read. Nothing was changed." };
    }
  }
  if (!result.ok) {
    state.status = result.reason;
    draw("#hf-file");
    return;
  }
  state.parsed = result;
  state.view = "preview";
  state.wrong = 0;
  draw("#hf-preview-heading");
}

function drawPreview() {
  const plan = planLoad(ctx.getSettings().services, state.parsed.helpers);
  host.append(el("p", WARN_LINE, { class: "message", id: "hf-warning" }));
  if (plan.toAdd.length > 0) {
    host.append(el("p", "These helpers will be added:", { id: "hf-preview-heading", tabindex: "-1" }));
    const list = el("ul", "", { class: "looking-list", id: "hf-preview" });
    for (const { service } of plan.toAdd) {
      const item = el("li", "");
      item.append(el("strong", service.label), ` · ${service.model || "no AI picked yet"} · ${service.url}`);
      if (/^http:/i.test(service.url)) {
        item.append(el("span", ` ${plainHttpWarning()}`, { class: "hint" }));
      }
      list.append(item);
    }
    host.append(list);
  } else {
    host.append(el("p", "There is nothing new to add. You already have these.", { id: "hf-preview-heading", tabindex: "-1" }));
  }
  if (plan.skipped.length > 0) {
    const list = el("ul", "", { class: "looking-list", id: "hf-skipped" });
    for (const { label, reason } of plan.skipped) {
      list.append(el("li", `Skipped, you already have it or it can't be added: ${label}. ${reason}`));
    }
    host.append(list);
  }
  if (state.parsed.dropped > 0) {
    host.append(el("p", `${state.parsed.dropped} damaged ${state.parsed.dropped === 1 ? "entry was" : "entries were"} left out.`, { class: "hint" }));
  }
  if (state.parsed.keys && plan.toAdd.length > 0) {
    host.append(el("p", "This file has locked keys. You will be asked for its passphrase.", { class: "hint" }));
  } else if (plan.toAdd.length > 0) {
    host.append(el("p", "This file has no keys. Add a key to each helper afterwards with Finish setup.", { class: "hint" }));
  }
  const actions = el("div", "", { class: "actions" });
  if (plan.toAdd.length > 0) {
    const yes = button("Yes, add these helpers", onYes, "primary");
    yes.id = "hf-yes";
    actions.append(yes);
  }
  const no = button(plan.toAdd.length > 0 ? "No, keep what I have" : "OK", () => backHome("Nothing was changed.", "#hf-load"), "");
  no.id = "hf-no";
  actions.append(no);
  host.append(actions);
}

function onYes() {
  if (working) {
    return;
  }
  if (state.parsed.keys && keyStoreAvailable()) {
    state.view = "passphrase";
    draw("#hf-open-pass");
    return;
  }
  const missing = state.parsed.keys && !keyStoreAvailable() ? " Keys can't be saved in this browser, so they were left out." : "";
  finish(new Map(), missing);
}

function drawPassphrase() {
  const box = el("input", "", { id: "hf-open-pass", type: "password", autocomplete: "off", spellcheck: "false", autocapitalize: "off", "data-1p-ignore": "true", "data-lpignore": "true", "data-bwignore": "true" });
  const open = button("Open the keys and add the helpers", () => openKeys(box), "primary");
  open.id = "hf-open";
  open.disabled = state.locked;
  box.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      open.click();
    }
  });
  const without = button("Add the helpers without their keys", () => finish(new Map(), ""), "");
  without.id = "hf-without-keys";
  const cancel = button("No, keep what I have", () => backHome("Nothing was changed.", "#hf-load"), "");
  cancel.id = "hf-no";
  host.append(el("label", "Passphrase for the keys", { for: "hf-open-pass" }), box, el("div", "", { class: "actions" }));
  host.lastChild.append(open, without, cancel);
}

async function openKeys(box) {
  if (working || state.locked) {
    return;
  }
  const typed = box.value;
  working = true;
  host.querySelectorAll("button").forEach((b) => (b.disabled = true));
  let result;
  try {
    result = await decryptKeys(globalThis.crypto.subtle, typed, state.parsed.keys);
  } catch {
    result = { ok: false };
  }
  working = false;
  if (!result.ok) {
    state.wrong += 1;
    state.view = "passphrase";
    state.locked = state.wrong >= DELAY_AFTER;
    state.status = state.locked ? `${WRONG_PASSPHRASE} Wait a few seconds before trying again.` : WRONG_PASSPHRASE;
    draw("#hf-open-pass");
    if (state.locked) {
      waitTimer = setTimeout(() => {
        state.locked = false;
        const open = document.getElementById("hf-open");
        if (open) {
          open.disabled = false;
        }
      }, DELAY_MS);
    }
    return;
  }
  await finish(result.keys, "");
}

// Adds the helpers. Keys first, then the list; if the list can't be saved the new keys are deleted again.
// The chosen helper and the helpers already there are never touched.
async function finish(keys, extraNote) {
  if (working) {
    return;
  }
  working = true;
  host.querySelectorAll("button").forEach((b) => (b.disabled = true));
  const settings = ctx.getSettings();
  const plan = planLoad(settings.services, state.parsed.helpers);
  const savedIds = [];
  const added = [];
  let failedKeys = 0;
  for (const { ref, service } of plan.toAdd) {
    const key = keys.get(ref);
    if (typeof key === "string" && key !== "" && (await saveKey(service.id, key))) {
      savedIds.push(service.id);
      added.push({ ...service, keyReady: true, keyHint: keyHint(key) });
    } else {
      if (typeof key === "string" && key !== "") {
        failedKeys += 1;
      }
      added.push(service);
    }
  }
  keys.clear();
  const next = { ...settings, services: [...settings.services, ...added] };
  if (!ctx.commitSettings(next)) {
    for (const id of savedIds) {
      await deleteKey(id);
    }
    working = false;
    state.status = "That didn't work. Nothing was added.";
    state.view = "preview";
    draw("#hf-preview-heading");
    return;
  }
  working = false;
  const count = added.length;
  let line = `Added ${count} ${count === 1 ? "helper" : "helpers"}.`;
  if (savedIds.length > 0) {
    line += ` ${savedIds.length} ${savedIds.length === 1 ? "key was" : "keys were"} saved.`;
  }
  if (added.length > savedIds.length) {
    line += " Add a key to the others with Finish setup.";
  }
  if (failedKeys > 0) {
    line += " Some keys couldn't be saved.";
  }
  line += extraNote;
  state = freshState();
  ctx.done(line);
}
