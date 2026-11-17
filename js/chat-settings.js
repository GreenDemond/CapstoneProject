// The "How the AI talks" screens inside Settings (design/ai-chat.md): a short list (All kinds, then
// the six kinds), one screen per row to read and change the guide and reply length, and a short
// question-by-question helper that drafts a guide. Text is shown with textContent only.
// Nothing is saved until Save, and "saved" is shown only when the browser confirmed it.
import { loadChatSettings, saveChatSettings } from "./storage.js";
import { LENGTHS, MAX_GUIDE } from "./logic/chat.js";
import {
  IDS, ALL, labelFor, rowState, guideFor, lengthFor, setFor, clearFor, SETUP_QUESTIONS, guideFromAnswers,
} from "./logic/chat-settings.js";

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (name === "class") node.className = value;
    else if (name === "text") node.textContent = value;
    else if (name.startsWith("on")) node.addEventListener(name.slice(2), value);
    else if (value != null && value !== false) node.setAttribute(name, value === true ? "" : value);
  }
  node.append(...children.flat().filter((child) => child != null));
  return node;
}

function button(text, onClick, { primary = false, label = null, id = null } = {}) {
  return el("button", { type: "button", class: primary ? "primary" : "", text, onclick: onClick, "aria-label": label, id });
}

const RULES_LINE = "The app always adds its own rules: hints, not answers. Your guide changes how the AI talks, not those rules. An AI can still get it wrong. If it gives you a finished answer, don't copy it.";

let root = null;
let leave = null;
let settings = loadChatSettings();

export function renderTalkSettings(rootNode, onBack) {
  root = rootNode;
  leave = onBack;
  settings = loadChatSettings();
  showList();
}

function showList(message = "", focusId = null) {
  root.replaceChildren();
  const heading = el("h3", { tabindex: "-1", id: "talk-heading", text: "How the AI talks" });
  const rows = el("ul", { class: "helper-cards" });
  for (const id of IDS) {
    rows.append(
      el(
        "li",
        { class: "helper-card" },
        el("strong", { text: labelFor(id) }),
        el("p", { class: "status", text: rowState(settings, id) }),
        el("div", { class: "actions" }, button("Change", () => showEdit(id), { label: `Change ${labelFor(id)}`, id: `talk-${id}` })),
      ),
    );
  }
  root.append(
    el("p", {}, button("Back", leave, { id: "talk-back" })),
    heading,
    el("p", { class: "hint", text: "This guide shapes how the AI talks with you in Talk it through. Each kind of work can have its own. A kind without one uses All kinds, then the built-in guide." }),
    el("p", { class: "hint", text: RULES_LINE }),
    rows,
    el("p", { class: "setup-message", role: "status", "aria-live": "polite", text: message }),
  );
  (focusId ? root.querySelector(`#${focusId}`) : null)?.focus();
  if (!focusId) heading.focus();
}

// draft: { text, length, dirty }
function showEdit(id, draft = null, message = "") {
  const current = draft ?? { text: guideFor(settings, id), length: lengthFor(settings, id), dirty: false };
  root.replaceChildren();
  const heading = el("h3", { tabindex: "-1", id: "talk-edit-heading", text: `${labelFor(id)}: how the AI talks` });
  const box = el("textarea", { id: "guide-text", rows: "6", maxlength: String(MAX_GUIDE), "aria-describedby": "guide-count" });
  box.value = current.text;
  const count = el("p", { class: "hint", id: "guide-count", text: `${current.text.length} of ${MAX_GUIDE} characters` });
  const live = el("p", { class: "setup-message", role: "status", "aria-live": "polite", text: message });

  const lengthGroup = el("fieldset", { class: "kinds" }, el("legend", { text: "Reply length" }));
  const choices = el("div", { class: "kind-buttons" });
  const pickLength = (value) => {
    current.length = value;
    current.dirty = true;
    for (const b of choices.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.value === value));
  };
  for (const [value, info] of Object.entries(LENGTHS)) {
    const b = button(info.label, () => pickLength(value));
    b.className = "kind";
    b.dataset.value = value;
    b.setAttribute("aria-pressed", String(value === current.length));
    choices.append(b);
  }
  lengthGroup.append(choices);

  box.addEventListener("input", () => {
    current.text = box.value;
    current.dirty = true;
    count.textContent = `${box.value.length} of ${MAX_GUIDE} characters`;
  });

  const save = () => {
    const next = setFor(settings, id, box.value, current.length);
    if (saveChatSettings(next)) {
      settings = next;
      current.dirty = false;
      showEdit(id, { text: guideFor(settings, id), length: lengthFor(settings, id), dirty: false }, "Saved on this device.");
    } else {
      live.textContent = "Couldn't save here. Your changes are still on this screen.";
    }
  };
  const useDefault = () => {
    const next = clearFor(settings, id);
    if (saveChatSettings(next)) {
      settings = next;
      showEdit(id, null, id === ALL ? "Using the built-in guide." : "Using the default for this kind.");
    } else {
      live.textContent = "Couldn't save here.";
    }
  };
  let warned = false;
  const back = () => {
    if (current.dirty && !warned) {
      warned = true;
      live.textContent = "You have changes that aren't saved. Press Save first, or press Back again to leave.";
      return;
    }
    showList("", `talk-${id}`);
  };

  root.append(
    el("p", {}, button("Back", back, { id: "talk-edit-back" })),
    heading,
    el("p", { class: "hint", text: "This is the text the AI will use, so nothing is hidden. Change it however works for you." }),
    el("p", { class: "hint", text: RULES_LINE }),
    el("label", { for: "guide-text", class: "visually-hidden", text: "Your guide for the AI" }),
    box,
    count,
    lengthGroup,
    el(
      "div",
      { class: "kind-buttons" },
      button("Save", save, { primary: true, id: "guide-save" }),
      button("Help me write it", () => showSetup(id, 0, {}, current), { id: "guide-help" }),
      button("Use the default", useDefault, { id: "guide-default" }),
    ),
    live,
  );
  if (message) live.textContent = message;
  heading.focus();
}

// One question at a time. At the end, the drafted guide fills the editor, unsaved, for the student to read and change.
function showSetup(id, index, answers, current) {
  root.replaceChildren();
  const question = SETUP_QUESTIONS[index];
  const heading = el("h3", { tabindex: "-1", text: question.text });
  const options = el("div", { class: "kind-buttons" });
  question.options.forEach((option, i) => {
    options.append(
      button(option.label, () => {
        const next = { ...answers, [question.id]: i };
        if (index + 1 < SETUP_QUESTIONS.length) {
          showSetup(id, index + 1, next, current);
          return;
        }
        const draft = guideFromAnswers(next);
        showEdit(id, { text: draft.text, length: draft.length, dirty: true }, "Here's a first draft. Read it, change anything, then press Save.");
      }),
    );
  });
  root.append(
    el("p", {}, button("Back", () => (index === 0 ? showEdit(id, current) : showSetup(id, index - 1, answers, current)))),
    el("p", { class: "hint", text: `Question ${index + 1} of ${SETUP_QUESTIONS.length}. You can change the draft afterwards.` }),
    heading,
    options,
  );
  heading.focus();
}
