// The steps editor on the steps preview (design/steps-editor-w1.md). The student changes the words,
// moves, splits, joins, adds and removes steps before pressing Start. Nothing is saved until Start.
// Student text is only ever put on screen with textContent or an input's value (DECISIONS T11).
import {
  MAX_STEPS,
  MAX_STEP_LENGTH,
  setStepText,
  moveStep,
  removeStep,
  addBlankStep,
  splitStepAt,
  joinWithNext,
  addGetReady,
  addPutAway,
  hasGetReady,
  hasPutAway,
  cleanSteps,
  noteFor,
} from "../logic/step-editor.js";
import { STEP_TIPS_TITLE, STEP_TIPS_LINES } from "../logic/step-count.js";
import { loadStepTipsHidden, saveStepTipsHidden } from "../storage.js";
import { el, button } from "../ui/dom.js";
import { fillCheck } from "./step-check.js";
import { checkSteps } from "../logic/step-check.js";

const view = document.getElementById("steps-view");
const editor = document.getElementById("steps-editor");
const openButton = document.getElementById("change-steps");

let draft = [];
let dismissed = new Set(); // step words whose "split it?" question the student said no to
let onDone = null;
let getSteps = null;
let getRequirements = () => [];
let checkHolder = null; // the live "does each line have a step" box, redrawn as the steps change
let status = "";
let focusTarget = null; // a selector to focus after the next redraw
let tipsOpen = false; // the good-step card is folded each time the editor opens
let tipsHidden = false;

function fillNote(holder, index) {
  holder.replaceChildren();
  const note = noteFor(draft[index]);
  if (note === null || (note.kind === "split" && dismissed.has(draft[index]))) {
    return;
  }
  holder.append(el("span", note.text), " ");
  if (note.kind === "split") {
    holder.append(
      button(`Keep step ${index + 1} as one`, () => {
        dismissed.add(draft[index]);
        fillNote(holder, index);
      }, "small"),
    );
  }
}

// True when the assignment gave lines worth checking, so the heading is worth showing.
function checkNumbers() {
  return checkSteps(getRequirements(), ["x"]) !== null;
}

function refreshCheck() {
  if (checkHolder !== null) {
    fillCheck(checkHolder, getRequirements(), cleanSteps(draft));
  }
}

function rowFor(index) {
  const n = index + 1;
  const row = el("li", undefined, { class: "editor-row" });
  const input = el("input", undefined, { type: "text", "aria-label": `Step ${n}`, maxlength: String(MAX_STEP_LENGTH) });
  input.value = draft[index];
  const noteHolder = el("p", undefined, { class: "editor-note" });
  input.addEventListener("input", () => {
    draft = setStepText(draft, index, input.value);
    fillNote(noteHolder, index);
    refreshCheck();
  });
  const actions = el("div", undefined, { class: "editor-actions" });
  const act = (label, name, change) =>
    actions.append(
      button(label, () => {
        draft = change(draft, index);
        focusTarget = `[data-name="${name}-${Math.min(index, draft.length - 1) + 1}"]`;
        status = "";
        render();
      }, "small"),
    );
  if (index > 0) {
    act(`Move step ${n} up`, "up", (steps, i) => moveStep(steps, i, -1));
    actions.lastChild.dataset.name = `up-${n}`;
  }
  if (index < draft.length - 1) {
    act(`Move step ${n} down`, "down", (steps, i) => moveStep(steps, i, 1));
    actions.lastChild.dataset.name = `down-${n}`;
  }
  act(`Split step ${n}`, "split", splitStepAt);
  actions.lastChild.dataset.name = `split-${n}`;
  if (index < draft.length - 1) {
    act(`Join step ${n} with the next`, "join", joinWithNext);
    actions.lastChild.dataset.name = `join-${n}`;
  }
  act(`Remove step ${n}`, "remove", removeStep);
  actions.lastChild.dataset.name = `remove-${n}`;
  input.dataset.name = `text-${n}`;
  fillNote(noteHolder, index);
  row.append(input, noteHolder, actions);
  return row;
}

// The good-step card: fixed words, never looks at what the student typed (design/step-count-w2.md).
// It redraws only itself, so focus stays where the student was.
function fillTips(holder, focusSelector) {
  holder.replaceChildren();
  if (tipsHidden) {
    holder.append(
      button("Show step tips", () => {
        tipsHidden = false;
        tipsOpen = true;
        saveStepTipsHidden(false);
        fillTips(holder, ".step-tips-toggle");
      }, "small"),
    );
  } else {
    const toggle = button(STEP_TIPS_TITLE, () => {
      tipsOpen = !tipsOpen;
      fillTips(holder, ".step-tips-toggle");
    }, "small");
    toggle.classList.add("step-tips-toggle");
    toggle.setAttribute("aria-expanded", String(tipsOpen));
    holder.append(toggle);
    if (tipsOpen) {
      const body = el("div", undefined, { class: "step-tips-body" });
      for (const line of STEP_TIPS_LINES) {
        body.append(el("p", line));
      }
      body.append(
        button("Got it", () => {
          tipsHidden = true;
          tipsOpen = false;
          saveStepTipsHidden(true);
          fillTips(holder, "#editor-heading");
        }, "small"),
      );
      holder.append(body);
    }
  }
  if (focusSelector) {
    const target = holder.querySelector(focusSelector) || editor.querySelector(focusSelector);
    if (target) {
      target.focus();
    }
  }
}

function render() {
  editor.replaceChildren();
  editor.append(el("h3", "Change my steps", { tabindex: "-1", id: "editor-heading" }));
  editor.append(el("p", "Change the words, move a step, split it in two, or add your own. Nothing is saved until you press Start.", { class: "hint" }));
  const tips = el("div", undefined, { class: "step-tips" });
  fillTips(tips, null);
  editor.append(tips);
  const list = el("ol", undefined, { class: "editor-rows" });
  draft.forEach((_, index) => list.append(rowFor(index)));
  editor.append(list);

  const extra = el("div", undefined, { class: "editor-extra" });
  if (draft.length < MAX_STEPS) {
    extra.append(
      button("Add a step", () => {
        draft = addBlankStep(draft);
        focusTarget = `[data-name="text-${draft.length}"]`;
        status = "";
        render();
      }),
    );
  }
  if (!hasGetReady(draft) && draft.length < MAX_STEPS) {
    extra.append(
      button("Add a Get ready step", () => {
        draft = addGetReady(draft);
        focusTarget = `[data-name="text-1"]`;
        status = "";
        render();
      }),
    );
  }
  if (!hasPutAway(draft) && draft.length < MAX_STEPS) {
    extra.append(
      button("Add a Put it away step", () => {
        draft = addPutAway(draft);
        focusTarget = `[data-name="text-${draft.length}"]`;
        status = "";
        render();
      }),
    );
  }
  editor.append(extra);

  checkHolder = el("div", undefined, { class: "steps-check", id: "editor-check", role: "status", "aria-live": "polite" });
  refreshCheck();
  if (checkNumbers()) {
    editor.append(el("h4", "Lines from your assignment"));
  }
  editor.append(checkHolder);

  editor.append(el("p", status, { class: "message", role: "status", "aria-live": "polite" }));
  const finish = el("div", undefined, { class: "editor-extra" });
  finish.append(
    button("Done changing", finishEditing, "primary"),
    button("Leave my steps as they were", closeEditor),
  );
  editor.append(finish);

  if (focusTarget !== null) {
    const target = editor.querySelector(focusTarget) || editor.querySelector("#editor-heading");
    focusTarget = null;
    target.focus();
  }
}

function finishEditing() {
  const steps = cleanSteps(draft);
  if (steps.length === 0) {
    status = "Add at least one step to go on.";
    focusTarget = "#editor-heading";
    render();
    return;
  }
  closeEditor();
  onDone(steps);
}

// Shows the normal steps view again. Safe to call when the editor is not open.
export function closeEditor() {
  const wasOpen = !editor.hidden;
  editor.hidden = true;
  editor.replaceChildren();
  checkHolder = null;
  view.hidden = false;
  draft = [];
  if (wasOpen) {
    openButton.focus();
  }
}

function openEditor() {
  draft = getSteps().slice();
  dismissed = new Set();
  tipsOpen = false;
  tipsHidden = loadStepTipsHidden();
  status = "";
  focusTarget = "#editor-heading";
  view.hidden = true;
  editor.hidden = false;
  render();
}

// getStepList returns the steps now on screen; getRequirementLines the assignment's lines; done receives the cleaned edited list.
export function initStepsEditor(getStepList, getRequirementLines, done) {
  getSteps = getStepList;
  getRequirements = getRequirementLines;
  onDone = done;
  openButton.addEventListener("click", openEditor);
}
