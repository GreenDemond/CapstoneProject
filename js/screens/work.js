// The work screen: one step at a time (design/work-screen.md). Steps and progress are saved on the
// device after every change (design/home-screen.md).
import { createWork, currentIndex, doneCount, allDone, applyChoice, hintAt, ringFraction, formatTime, secondsUntil } from "../logic/work.js";
import { listLabel } from "../logic/home.js";
import { saveWork } from "../storage.js";
import { confetti } from "../confetti.js";
import { el, button, announce } from "../ui/dom.js";
import { showScreen, setStepsPreviewOpen } from "../ui/screens.js";

let onClose = () => {}; // set by initWork: runs after the work screen closes
let getChosenKind = () => null; // set by initWork: the kind picked on the home screen

const workBody = document.getElementById("work-body");
const workHeading = document.getElementById("work-heading");

const TIMER_CHOICES = [12, 25];
const ADVANCE_GUARD_MS = 400;
let work = null;
let mode = "steps"; // "steps", "stuck", "drifting", "done"
let hintsShown = 0;
let workNote = "";
let driftNote = "";
let lastAdvance = 0;
let timerOn = false;
let timerMinutes = 12;
let secondsLeft = 0;
let endMs = 0; // when the countdown ends, by the clock
let timeUp = false;
let tick = null;

function stopTimer() {
  if (tick !== null) {
    clearInterval(tick);
    tick = null;
  }
}

// Once a second, only the ring and its time change. The rest of the screen is not
// redrawn, so typing and keyboard focus are not disturbed.
function updateRing() {
  const ring = workBody.querySelector(".ring");
  if (!ring) {
    return;
  }
  ring.querySelector(".ring-time").textContent = formatTime(secondsLeft);
  const circumference = 2 * Math.PI * 44;
  ring
    .querySelector(".ring-arc")
    .setAttribute("stroke-dashoffset", String(circumference * (1 - ringFraction(secondsLeft, timerMinutes * 60))));
}

function startTimer() {
  stopTimer();
  timeUp = false;
  if (!timerOn) {
    return;
  }
  endMs = Date.now() + timerMinutes * 60000;
  secondsLeft = secondsUntil(endMs, Date.now());
  tick = setInterval(() => {
    // Read the clock each time, so a sleeping laptop or a slow tab does not stretch it.
    secondsLeft = secondsUntil(endMs, Date.now());
    if (secondsLeft <= 0) {
      stopTimer();
      timeUp = true;
      // Only redraw the step view. If a box or a hint is open, the line waits
      // until the student returns to the step, so their words are not lost.
      if (mode === "steps") {
        renderWork(false);
      }
      return;
    }
    updateRing();
  }, 1000);
}

function ringSvg(fraction) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("width", "120");
  svg.setAttribute("height", "120");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const track = document.createElementNS(ns, "circle");
  track.setAttribute("cx", "50");
  track.setAttribute("cy", "50");
  track.setAttribute("r", "44");
  track.setAttribute("class", "ring-track");
  const arc = document.createElementNS(ns, "circle");
  arc.setAttribute("cx", "50");
  arc.setAttribute("cy", "50");
  arc.setAttribute("r", "44");
  arc.setAttribute("class", "ring-arc");
  const circumference = 2 * Math.PI * 44;
  arc.setAttribute("stroke-dasharray", String(circumference));
  arc.setAttribute("stroke-dashoffset", String(circumference * (1 - fraction)));
  svg.append(track, arc);
  return svg;
}

const workSavedLine = document.getElementById("work-saved");
let workListOpen = false;

// Steps are saved after every change, so a refresh or a week away loses nothing.
// The line on screen says "saved" only when the browser confirmed it.
function persistWork() {
  const saved = saveWork(work);
  workSavedLine.textContent = saved
    ? "Your steps are saved on this device."
    : "Your steps could not be saved here, so they will be lost if you close this page.";
}

export function stepListNode(steps) {
  const next = currentIndex(steps);
  const list = el("ol", undefined, { class: "steps" });
  steps.steps.forEach((step, i) => list.append(el("li", listLabel(step, i === next))));
  return list;
}

export function openWorkScreen(texts, existing = null) {
  stopTimer();
  // The kind chosen on the paste screen is kept with the steps, so the chat can pre-select it later.
  work = existing ?? { ...createWork(texts), ...(getChosenKind() ? { kind: getChosenKind() } : {}) };
  persistWork();
  workListOpen = false;
  mode = "steps";
  hintsShown = 0;
  workNote = "";
  driftNote = "";
  setStepsPreviewOpen(false);
  showScreen("work");
  startTimer();
  renderWork();
  workHeading.focus();
}

function closeWork() {
  stopTimer();
  if (work && allDone(work)) {
    saveWork(null); // finished: nothing left to pick up
  }
  work = null;
  workBody.replaceChildren();
  showScreen("home");
  onClose();
}

function currentStepId() {
  const cur = currentIndex(work);
  return cur === -1 ? null : work.steps[cur].id;
}

function choose(choice, splitText = "") {
  const now = Date.now();
  if (choice !== "still" && now - lastAdvance < ADVANCE_GUARD_MS) {
    return; // a quick second tap must not skip a step
  }
  const beforeId = currentStepId();
  const next = applyChoice(work, choice, splitText);
  mode = "steps";
  hintsShown = 0;
  driftNote = "";
  if (choice === "still") {
    timeUp = false; // the student chose to keep going, so the time's-up line goes
  }
  if (next === work && choice !== "still") {
    workNote = "";
    renderWork();
    return;
  }
  // The reward line shows only when something really changed.
  workNote = {
    still: "Keep going. Tap any button when you're ready.",
    done: "Step done.",
    drifted: "That counts too. Smaller steps count.",
  }[choice] ?? "";
  work = next;
  persistWork();
  if (choice !== "still") {
    lastAdvance = now;
  }
  if (choice === "done" || choice === "drifted") confetti();
  if (allDone(work)) {
    stopTimer();
    mode = "done";
  } else if (currentStepId() !== beforeId) {
    startTimer(); // a new step starts a new countdown
  }
  renderWork();
}

// focusStep is true when the screen opens or the student's tap replaced the step view.
// Other redraws (timer, countdown controls, step list) keep focus on the same button.
function renderWork(focusStep = true) {
  const active = document.activeElement;
  const keepId = !focusStep && workBody.contains(active) ? active.id : "";
  const keepLabel = !focusStep && workBody.contains(active) && active.tagName === "BUTTON" ? active.textContent : null;
  const hadFocus = !focusStep && workBody.contains(active);
  workBody.replaceChildren();
  if (mode === "done" || allDone(work)) {
    workHeading.textContent = "All your steps are done.";
    workBody.append(button("Close", closeWork, "primary"));
    workBody.querySelector("button")?.focus();
    return;
  }
  workHeading.textContent = "Work";

  const index = currentIndex(work);
  const step = work.steps[index];
  const total = work.steps.length;
  workBody.append(el("h3", `Step ${doneCount(work) + 1} of ${total}`, { tabindex: "-1" }));
  const stepText = el("p", step.text, { class: "current-step", tabindex: "-1" });
  workBody.append(stepText);
  if (workNote) {
    const reward = workNote === "Step done." || workNote.startsWith("That counts");
    const noteLine = el("p", undefined, { class: reward ? "reward" : "gentle", role: "status" });
    workBody.append(noteLine);
    announce(noteLine, reward ? `✓ ${workNote}` : workNote);
  }
  if (timeUp && mode === "steps") {
    const timeLine = el("p", undefined, { class: "gentle", role: "status" });
    workBody.append(timeLine);
    announce(timeLine, "Time's up. Keep going, or tap Still working.");
  }

  if (mode === "stuck") {
    const hint = hintAt(hintsShown);
    let focusTarget;
    if (hint === null) {
      focusTarget = el("p", "That's all the hints for now. Try the first small part, or tap Still working.", { class: "gentle", tabindex: "-1" });
    } else {
      focusTarget = el("p", hint, { class: "gentle", tabindex: "-1" });
    }
    workBody.append(focusTarget);
    if (hint !== null) {
      workBody.append(button("Another hint", () => { hintsShown += 1; renderWork(); }));
    }
    workBody.append(button("Back to the step", () => { mode = "steps"; renderWork(); }));
    focusTarget.focus();
    return;
  }

  if (mode === "drifting") {
    const box = el("textarea", undefined, { id: "split-text", rows: "2", maxlength: "500", "aria-label": "The smallest part of this step" });
    box.value = step.text;
    workBody.append(el("p", "Start with the smallest part of this.", { class: "hint" }));
    workBody.append(box);
    if (driftNote) {
      workBody.append(el("p", driftNote, { class: "gentle" }));
    }
    workBody.append(button("Start this part", () => {
      const before = work;
      choose("drifted", box.value);
      if (work === before && mode === "steps") {
        // Nothing changed: keep the box open so the student can make it smaller.
        mode = "drifting";
        driftNote = "Make it a bit smaller, or tap Back to the step.";
        renderWork();
        workBody.querySelector("#split-text")?.focus();
      }
    }, "primary"));
    workBody.append(button("Back to the step", () => { mode = "steps"; driftNote = ""; renderWork(); }));
    box.focus();
    return;
  }

  const ring = timerOn ? el("div", undefined, { class: "ring" }) : null;
  if (ring) {
    ring.append(ringSvg(ringFraction(secondsLeft, timerMinutes * 60)), el("span", formatTime(secondsLeft), { class: "ring-time" }));
    workBody.append(ring);
  }

  const choices = el("div", undefined, { class: "kind-buttons" });
  choices.append(
    button("Done", () => choose("done"), "kind"),
    button("Still working", () => choose("still"), "kind"),
    button("Stuck", () => { mode = "stuck"; workNote = ""; renderWork(); }, "kind"),
    button("Drifted", () => { mode = "drifting"; driftNote = ""; workNote = ""; renderWork(); }, "kind"),
  );
  const othersLeft = work.steps.some((s, i) => i !== index && !s.done);
  if (othersLeft) {
    choices.append(button("Later", () => choose("later"), "kind"));
  }
  workBody.append(choices);

  const timerLabel = el("label", undefined, { class: "timer-toggle" });
  const toggle = el("input", undefined, { type: "checkbox", id: "timer-on" });
  toggle.checked = timerOn;
  toggle.addEventListener("change", () => {
    timerOn = toggle.checked;
    if (timerOn) startTimer(); else { stopTimer(); timeUp = false; }
    renderWork(false); // focus is put back on the new checkbox by id
  });
  timerLabel.append(toggle, " Show a countdown");
  workBody.append(timerLabel);

  if (timerOn) {
    const pick = el("div", undefined, { class: "kind-buttons" });
    for (const minutes of TIMER_CHOICES) {
      const b = button(`${minutes} minutes`, () => { timerMinutes = minutes; startTimer(); renderWork(false); }, "kind");
      if (minutes === timerMinutes) b.setAttribute("aria-pressed", "true");
      pick.append(b);
    }
    workBody.append(pick);
  }

  const listToggle = button(workListOpen ? "Hide my steps" : "Show all my steps", () => {
    workListOpen = !workListOpen;
    renderWork(false);
    workBody.querySelector("#work-list-toggle")?.focus();
  });
  listToggle.id = "work-list-toggle";
  workBody.append(listToggle);
  if (workListOpen) {
    workBody.append(stepListNode(work));
  }

  workBody.append(button("Back to home", closeWork));
  // Keep focus where it was; if that control is gone (or it was the step text), the step gets it,
  // so keyboard and screen-reader users are never dropped to the top of the page.
  let kept = null;
  if (keepId) {
    kept = workBody.querySelector(`#${keepId}`);
  } else if (keepLabel !== null) {
    kept = [...workBody.querySelectorAll("button")].find((b) => b.textContent === keepLabel) ?? null;
  }
  if (focusStep || (hadFocus && !kept)) {
    stepText.focus();
  } else {
    kept?.focus();
  }
}

export function initWork({ onClose: onCloseFn, getChosenKind: getter }) {
  onClose = onCloseFn;
  getChosenKind = getter;
}
