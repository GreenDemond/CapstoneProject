// The home screen: the paste form, the kind buttons, the steps preview, the optional AI helper, and
// the "pick up where you left off" card (design/paste-and-split.md, design/home-screen.md, design/ai-path.md).
// The AI suggestions are hidden unless a helper is ready and the student ticks the box. Any failure falls
// back to the starter steps. Text from the student is only ever put on screen with textContent (DECISIONS T11).
import { cleanPastedText, limitPaste } from "../logic/clean-text.js";
import { KINDS, DEFAULT_STEP_COUNT, starterStepsFor, withTwoMinuteStart, showingLine } from "../logic/starter-steps.js";
import { suggestKind, findRequirements } from "../logic/heuristics.js";
import { loadWork } from "../storage.js";
import { pickupLine } from "../logic/home.js";
import { currentIndex, allDone } from "../logic/work.js";
import { inUseHelper, usableServices, pasteStatus, isReady, effortRefusedLine } from "../logic/ai-services.js";
import { readKey } from "../keystore.js";
import { askService } from "../ai-direct.js";
import { initSettings, getAiSettings, onAiChange, setChosenHelper } from "../settings.js";
import { showScreen, currentScreenName, openStepsPreview, registerOnLeaveHome } from "../ui/screens.js";
import { where } from "../ui/helpers.js";
import { openWorkScreen, stepListNode } from "./work.js";

const textBox = document.getElementById("assignment-text");
const kindButtons = document.getElementById("kind-buttons");
const showButton = document.getElementById("show-steps");
const message = document.getElementById("message");
const stepsList = document.getElementById("steps");
const showMore = document.getElementById("show-more");
const showingNote = document.getElementById("showing-note");
const startButton = document.getElementById("start");
const ready = document.getElementById("ready");

let chosenKind = null;
let allSteps = [];
let effortLineShown = false; // the thinking-setting line is shown once per visit to this screen
let suggestAbort = null; // cancels the AI request started from the home screen

for (const kind of KINDS) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "kind";
  button.dataset.kind = kind.id;
  button.setAttribute("aria-pressed", "false");
  button.textContent = kind.label;
  button.addEventListener("click", () => chooseKind(kind.id));
  kindButtons.appendChild(button);
}

function chooseKind(id) {
  chosenKind = id;
  for (const button of kindButtons.querySelectorAll("button")) {
    button.setAttribute("aria-pressed", String(button.dataset.kind === id));
  }
  message.textContent = "";
  refreshKindSuggestion();
}

// A suggested kind, worked out from the pasted words. The student must tap it; nothing is picked for them.
const kindSuggestion = document.getElementById("kind-suggestion");
const kindSuggestionText = document.getElementById("kind-suggestion-text");
const kindSuggestionUse = document.getElementById("kind-suggestion-use");
let suggestedKind = null;

function refreshKindSuggestion() {
  suggestedKind = chosenKind === null ? suggestKind(limitPaste(textBox.value).text) : null;
  kindSuggestion.hidden = suggestedKind === null;
  if (suggestedKind !== null) {
    const label = KINDS.find((kind) => kind.id === suggestedKind).label;
    kindSuggestionText.textContent = `Looks like: ${label}.`;
  }
}

textBox.addEventListener("input", refreshKindSuggestion);
kindSuggestionUse.addEventListener("click", () => {
  const id = suggestedKind;
  if (id !== null) {
    chooseKind(id);
    kindButtons.querySelector(`[data-kind="${id}"]`).focus();
  }
});

// The lines of the assignment that say what the finished work must have, copied as they were pasted.
const requirementsBox = document.getElementById("requirements");
const requirementsList = document.getElementById("requirements-list");

function showRequirements(text) {
  const lines = findRequirements(cleanPastedText(text));
  requirementsList.replaceChildren(
    ...lines.map((line) => {
      const item = document.createElement("li");
      item.textContent = line;
      return item;
    }),
  );
  requirementsBox.hidden = lines.length === 0;
}

// How many steps are on screen. Start runs exactly these.
let shownCount = DEFAULT_STEP_COUNT;

function renderSteps(count) {
  shownCount = count;
  stepsList.replaceChildren();
  for (const step of allSteps.slice(0, count)) {
    const item = document.createElement("li");
    item.textContent = step;
    stepsList.appendChild(item);
  }
  showMore.hidden = count >= allSteps.length;
  showingNote.textContent = showingLine(Math.min(count, allSteps.length), allSteps.length);
}

showButton.addEventListener("click", async () => {
  const { text, truncated } = limitPaste(textBox.value);
  if (text === "") {
    message.textContent = "Paste something to start.";
    return;
  }
  if (chosenKind === null) {
    message.textContent = "Tap the kind of work it is, then try again.";
    return;
  }

  if (suggesting) {
    return;
  }
  if (aiHelperToUse()) {
    suggesting = true;
    try {
      await suggestWithChosenService(text);
    } finally {
      suggesting = false;
    }
    return;
  }

  allSteps = starterStepsFor(chosenKind, cleanPastedText(text));
  ready.textContent = "";
  renderSteps(DEFAULT_STEP_COUNT);
  showRequirements(text);
  message.textContent = truncated
    ? "That's a long one. The first 6,000 characters are kept."
    : "";
  openStepsPreview();
});

document.getElementById("two-minute").addEventListener("click", () => {
  allSteps = withTwoMinuteStart(allSteps);
  renderSteps(DEFAULT_STEP_COUNT);
  stepsList.focus();
});

showMore.addEventListener("click", () => {
  renderSteps(allSteps.length);
  stepsList.focus();
});

startButton.addEventListener("click", () => {
  openWorkScreen(allSteps.slice(0, shownCount));
});
const aiBox = document.getElementById("ai-box");
// The top line must stay true: the text leaves this device only when the AI tick box is on.
const pasteHint = document.getElementById("paste-hint");
function refreshPasteHint() {
  pasteHint.textContent = aiHelperToUse()
    ? "Paste the instructions or what you have to do. This stays on your device, except when you use the AI helper below."
    : "Paste the instructions or what you have to do. This stays on your device.";
}

const aiUse = document.getElementById("ai-use");
aiUse.addEventListener("change", refreshPasteHint);
const aiUseLabel = document.getElementById("ai-use-label");

// The AI button shows only when the chosen helper is ready (it has a key and an AI picked).
const aiPrivacy = document.getElementById("ai-privacy");
const aiStatus = document.getElementById("ai-status");
const aiChoiceRow = document.getElementById("ai-choice-row");
const aiChoice = document.getElementById("ai-choice");
aiChoice.addEventListener("change", () => {
  if (aiChoice.value !== "") {
    setChosenHelper(aiChoice.value);
  }
});

function refreshAiStatus() {
  const { services, chosenId } = getAiSettings();
  aiStatus.textContent = pasteStatus(services, chosenId);
  const usable = usableServices(services);
  aiChoiceRow.hidden = usable.length === 0;
  const current = inUseHelper(services, chosenId);
  const options = usable.map((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.label;
    option.selected = item.id === current?.id;
    return option;
  });
  // If the helper in use is not ready, the menu says so instead of naming a different one.
  if (!current || !isReady(current)) {
    const none = document.createElement("option");
    none.value = "";
    none.textContent = "Choose one";
    none.selected = true;
    options.unshift(none);
  }
  aiChoice.replaceChildren(...options);
  const helperReady = current !== null && isReady(current);
  aiBox.hidden = !helperReady;
  refreshPasteHint();
  if (helperReady) {
    aiUseLabel.textContent = `Use ${current.label} to suggest steps`;
    aiPrivacy.textContent = `If this is ticked, pressing Show my steps sends this text to the AI service ${where(current)} to suggest steps. Don't paste your name or anything private.`;
  }
}

// Show my steps asks the AI helper when one is ready and the tick box is on. A second press while a
// request is running is ignored (one call at a time).
let suggesting = false;

function aiHelperToUse() {
  const { services, chosenId } = getAiSettings();
  const helper = inUseHelper(services, chosenId);
  return helper && isReady(helper) && aiUse.checked ? helper : null;
}

async function suggestWithChosenService(text) {
  const { services, chosenId } = getAiSettings();
  const service = inUseHelper(services, chosenId);
  const key = service && isReady(service) ? await readKey(service.id) : null;
  if (currentScreenName() !== "home") {
    return; // the student left while the key was being read: send nothing
  }
  if (!service || !key) {
    message.textContent = "No AI helper is ready. Finish one in Settings first.";
    refreshAiStatus();
    return;
  }
  showButton.disabled = true;
  message.textContent = `Asking the AI service ${service.label}...`;
  // Slower services can take a few minutes; say so, so it does not look stuck.
  const slowNote = setTimeout(() => {
    message.textContent = `Still waiting for ${service.label}. Slower AIs can take a few minutes.`;
  }, 10000);
  const abort = new AbortController();
  suggestAbort = abort;
  let result;
  try {
    result = await askService(service, key, text, chosenKind, abort.signal);
  } finally {
    clearTimeout(slowNote);
    showButton.disabled = false;
    if (suggestAbort === abort) {
      suggestAbort = null;
    }
  }
  if (abort.signal.aborted) {
    message.textContent = ""; // the student left; show nothing
    return;
  }

  if (result.trustedAdult) {
    message.textContent = "If something serious is going on, please talk to an adult you trust.";
    return;
  }
  if (result.steps) {
    allSteps = result.steps;
    message.textContent = `Suggested by an AI: ${where(service)}. Change anything you like.`;
    if (result.effortRefused && !effortLineShown) {
      effortLineShown = true;
      message.textContent += ` ${effortRefusedLine(service)}`;
    }
  } else {
    allSteps = starterStepsFor(chosenKind, cleanPastedText(text));
    message.textContent = `${result.error} Here are the starter steps instead.`;
  }
  ready.textContent = "";
  renderSteps(DEFAULT_STEP_COUNT);
  showRequirements(text);
  openStepsPreview();
}
// Home screen (design/home-screen.md): when steps are saved, the app opens on the next
// step with one main button. Otherwise it opens on the paste form, as before.
const pickup = document.getElementById("pickup");
const pickupStart = document.getElementById("pickup-start");
const pickupShow = document.getElementById("pickup-show");
const pickupList = document.getElementById("pickup-list");
const pasteForm = document.getElementById("paste-form");
const replaceNote = document.getElementById("replace-note");
let pickupWork = null;

export function refreshHome() {
  effortLineShown = false;
  const saved = loadWork();
  const live = saved.work && !allDone(saved.work) ? saved : null;
  pickupWork = live ? live.work : null;
  pickup.hidden = live === null;
  pasteForm.hidden = live !== null;
  replaceNote.hidden = live === null;
  pickupList.hidden = true;
  pickupList.replaceChildren();
  pickupShow.textContent = "Show all my steps";
  pickupShow.setAttribute("aria-expanded", "false");
  if (!live) {
    return;
  }
  document.getElementById("pickup-line").textContent = pickupLine(live.savedOn);
  document.getElementById("pickup-step").textContent = live.work.steps[currentIndex(live.work)].text;
}

pickupStart.addEventListener("click", () => {
  if (pickupWork) {
    openWorkScreen(null, pickupWork);
  }
});

pickupShow.addEventListener("click", () => {
  const opening = pickupList.hidden;
  pickupList.replaceChildren(...(opening && pickupWork ? stepListNode(pickupWork).children : []));
  pickupList.hidden = !opening;
  pickupShow.textContent = opening ? "Hide my steps" : "Show all my steps";
  pickupShow.setAttribute("aria-expanded", String(opening));
});

document.getElementById("new-assignment").addEventListener("click", () => {
  pasteForm.hidden = false;
  textBox.focus();
});

// The home screen's chosen kind of work, read by the work and chat screens.
export function getChosenKind() {
  return chosenKind;
}

// Runs when the work screen closes: shows the right home view and puts focus on its main button.
export function afterWorkClosed() {
  refreshHome();
  (pickup.hidden ? showButton : pickupStart).focus();
}

// Settings: the AI helpers screens live in js/settings.js. The paste screen follows them.
export function initHome() {
  registerOnLeaveHome(() => suggestAbort?.abort());
  initSettings({ screen: document.getElementById("settings-screen"), showScreen, openButton: document.getElementById("open-settings") });
  onAiChange(refreshAiStatus);
  refreshAiStatus();
}
