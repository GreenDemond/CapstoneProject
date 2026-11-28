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
import { el, button } from "../ui/dom.js";

const view = document.getElementById("steps-view");
const editor = document.getElementById("steps-editor");
const openButton = document.getElementById("change-steps");

let draft = [];
let dismissed = new Set(); // step words whose "split it?" question the student said no to
let onDone = null;
let getSteps = null;
let status = "";
let focusTarget = null; // a selector to focus after the next redraw

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

function rowFor(index) {
  const n = index + 1;
  const row = el("li", undefined, { class: "editor-row" });
  const input = el("input", undefined, { type: "text", "aria-label": `Step ${n}`, maxlength: String(MAX_STEP_LENGTH) });
  input.value = draft[index];
  const noteHolder = el("p", undefined, { class: "editor-note" });
  input.addEventListener("input", () => {
    draft = setStepText(draft, index, input.value);
    fillNote(noteHolder, index);
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

function render() {
  editor.replaceChildren();
  editor.append(el("h3", "Change my steps", { tabindex: "-1", id: "editor-heading" }));
  editor.append(el("p", "Change the words, move a step, split it in two, or add your own. Nothing is saved until you press Start.", { class: "hint" }));
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
  view.hidden = false;
  draft = [];
  if (wasOpen) {
    openButton.focus();
  }
}

function openEditor() {
  draft = getSteps().slice();
  dismissed = new Set();
  status = "";
  focusTarget = "#editor-heading";
  view.hidden = true;
  editor.hidden = false;
  render();
}

// getStepList returns the steps now on screen; done receives the cleaned edited list.
export function initStepsEditor(getStepList, done) {
  getSteps = getStepList;
  onDone = done;
  openButton.addEventListener("click", openEditor);
}
