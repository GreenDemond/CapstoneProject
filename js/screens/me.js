// "Me and my data" (design/me-export-w7.md): links to the personal screens, Save a copy of my data,
// Load a copy, and Delete everything. Nothing leaves the device except the file the student chooses to save.
// Student text never goes on screen here; the lines shown come from counts. Everything uses textContent.
import { buildBackup, parseBackup, backupFileName, MAX_FILE_BYTES } from "../logic/backup.js";
import { loadForBackup, importSections, deleteAllSaved } from "../storage.js";
import { deleteAllKeys } from "../keystore.js";
import { openRemembers } from "./looking.js";
import { el, button, announce } from "../ui/dom.js";
import { showScreen } from "../ui/screens.js";

const body = document.getElementById("me-body");
const heading = document.getElementById("me-heading");
const openButton = document.getElementById("open-me");

const NOTICE_KEY = "focusapp-me-notice"; // sessionStorage only: says what to show after the page reloads
const NOTICES = {
  loaded: "Your copy is loaded. What was saved here has been replaced.",
  deleted: "Everything is deleted from this device.",
};

let includeChats = false;
let pending = null; // a checked copy waiting for the student's second tap: { sections, chats, lines }
let confirmDelete = false;
let busy = false;
let statusText = "";
let fileText = ""; // what is said about the file chosen last (a problem, or nothing)

function go(id) {
  document.getElementById(id).click();
}

function renderLinks() {
  body.append(button("Back to home", leave));
  body.append(el("h3", "My things"));
  const list = el("ul", undefined, { class: "me-links" });
  const links = [
    ["My profile", () => go("open-profile")],
    ["How I like to work", () => go("open-intake")],
    ["My calendar", () => go("open-calendar")],
    ["What I did", () => go("open-looking")],
    ["What the app remembers", openRemembers],
    ["Settings", () => go("open-settings")],
  ];
  for (const [text, action] of links) {
    const li = el("li");
    li.append(button(text, action));
    list.append(li);
  }
  body.append(list);
}

function renderSave() {
  body.append(el("h3", "Save a copy of my data"));
  body.append(
    el("p", "This makes a file you keep yourself, so you can put your data on another device or back it up. Nothing is sent anywhere.", { class: "hint" }),
    el("p", "AI keys are never in the copy, and neither are your AI helper settings.", { class: "hint" }),
  );
  const row = el("p");
  const box = el("input", undefined, { type: "checkbox", id: "me-include-chats" });
  box.checked = includeChats;
  box.addEventListener("change", () => { includeChats = box.checked; });
  row.append(box, " ", el("label", "Also put my saved chats in the copy", { for: "me-include-chats" }));
  body.append(row);
  body.append(button("Save a copy of my data", saveCopy));
}

function renderLoad() {
  body.append(el("h3", "Load a copy"));
  if (pending) {
    body.append(el("p", "This copy has:", { id: "me-pending", tabindex: "-1" }));
    const list = el("ul", undefined, { class: "looking-list" });
    for (const line of pending.lines) list.append(el("li", line));
    body.append(list);
    body.append(el("p", "Loading it replaces what is saved on this device. Your AI helpers and keys stay as they are."));
    if (pending.chats === undefined) {
      body.append(el("p", "This copy has no chats, so the chats you have saved here stay as they are.", { class: "hint" }));
    }
    body.append(button("Yes, replace what is saved", loadPending, "primary"));
    body.append(button("No, keep what I have", () => { pending = null; statusText = "Nothing was changed."; render(); }));
    return;
  }
  body.append(el("p", "Choose a copy you saved before. It is checked first, and nothing changes until you agree.", { class: "hint" }));
  const input = el("input", undefined, { type: "file", id: "me-file", accept: ".json,application/json" });
  input.addEventListener("change", () => chooseFile(input));
  body.append(el("label", "Choose a copy to load", { for: "me-file" }), " ", input);
  if (fileText) body.append(el("p", fileText, { class: "message", id: "me-file-problem", tabindex: "-1" }));
}

function renderDelete() {
  body.append(el("h3", "Delete everything"));
  body.append(el("p", "This removes everything the app saved on this device: your steps, profile, calendar, notes, chats, and your AI helpers and their keys. A copy file you already saved is not touched.", { class: "hint" }));
  if (confirmDelete) {
    body.append(el("p", "Delete all of it? It can't be undone."));
    body.append(button("Yes, delete everything", deleteAll));
    body.append(button("No, keep it", () => { confirmDelete = false; render(); }));
  } else {
    body.append(button("Delete everything", () => { confirmDelete = true; statusText = ""; render(); }));
  }
}

function render() {
  body.replaceChildren();
  renderLinks();
  const status = el("p", undefined, { class: "message", role: "status", id: "me-status" });
  body.append(status);
  announce(status, statusText);
  renderSave();
  renderLoad();
  renderDelete();
}

function saveCopy() {
  try {
    const copy = buildBackup(loadForBackup(), { includeChats, nowIso: new Date().toISOString() });
    const blob = new Blob([JSON.stringify(copy, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFileName(copy.savedOn);
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    statusText = `Your copy was made: ${link.download}. Look in your Downloads folder, and keep it somewhere safe.`;
  } catch {
    statusText = "That didn't work. Your data is unchanged. Try again.";
  }
  render();
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
  const file = input.files && input.files[0];
  if (!file) return;
  statusText = "";
  fileText = "";
  pending = null;
  let problem = "";
  if (file.size > MAX_FILE_BYTES) {
    problem = "That file is too big to be one of this app's copies.";
  } else {
    try {
      const result = parseBackup(await readText(file), file.size);
      if (result.ok) {
        pending = result;
      } else {
        problem = result.reason;
      }
    } catch {
      problem = "That file could not be read.";
    }
  }
  fileText = problem ? `${problem} Nothing was changed.` : "";
  render();
  (document.getElementById("me-pending") ?? document.getElementById("me-file-problem"))?.focus();
}

function loadPending() {
  if (!pending || busy) return;
  busy = true;
  const saved = importSections(pending.sections, pending.chats);
  busy = false;
  if (saved) {
    reloadWith("loaded");
    return;
  }
  pending = null;
  statusText = "That didn't save, so nothing was changed. Try again.";
  render();
}

async function deleteAll() {
  if (busy) return;
  busy = true;
  const savedGone = deleteAllSaved();
  const keysGone = await deleteAllKeys();
  busy = false;
  if (savedGone && keysGone) {
    reloadWith("deleted");
    return;
  }
  confirmDelete = false;
  statusText = "Some of it didn't delete. Try again.";
  render();
}

// The screens read saved data when the page opens, so a fresh page is the safe way to show new data.
function reloadWith(notice) {
  try {
    globalThis.sessionStorage.setItem(NOTICE_KEY, notice);
  } catch {
    // The notice is only a courtesy.
  }
  globalThis.location.reload();
}

function leave() {
  showScreen("home");
  openButton.focus();
}

function openMe(message = "") {
  includeChats = false;
  pending = null;
  confirmDelete = false;
  statusText = message;
  fileText = "";
  showScreen("me");
  render();
  heading.focus();
}

export function initMe() {
  openButton.addEventListener("click", () => openMe());
  let notice;
  try {
    notice = globalThis.sessionStorage.getItem(NOTICE_KEY);
    globalThis.sessionStorage.removeItem(NOTICE_KEY);
  } catch {
    notice = null;
  }
  if (notice && Object.hasOwn(NOTICES, notice)) {
    openMe(NOTICES[notice]);
  }
}
