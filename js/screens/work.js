// The work screen: one step at a time (design/work-screen.md). Steps and progress are saved on the
// device after every change (design/home-screen.md).
import { normalizeClassLabel, classLine } from "../logic/class-label.js";
import { createWork, currentIndex, doneCount, allDone, applyChoice, driftStart, hintAt, ringFraction, formatTime, secondsUntil, STUCK_HINTS } from "../logic/work.js";
import { asksRecall, addParked, addRecall, removeItem, showAskPerson, buildQuestion, hasOwnWords, MAX_PARKED_LENGTH, MAX_RECALL_LENGTH, MAX_ASK_LENGTH } from "../logic/work-extras.js";
import {
  LENGTHS, BLOCK_QUESTION, BLOCK_LABELS, BLOCK_SKIP, BLOCK_NOTED, BLOCK_SAVE_FAILED, learnedLine, offeredAnswers, addBlockAnswer, suggestedLength, shouldAsk,
  MAX_DONE_WHEN_LENGTH, DONE_WHEN_LABEL, DONE_WHEN_ADD, DONE_WHEN_CHANGE, DONE_WHEN_PROMPT, DONE_WHEN_SAVE, DONE_WHEN_CLEAR, setDoneWhen,
} from "../logic/block-length.js";
import { listLabel } from "../logic/home.js";
import { addMoment, addHelp } from "../logic/looking-back.js";
import { saveWork, loadBlockAnswers, saveBlockAnswers, loadParked, saveParked, loadRecall, saveRecall, loadMoments, saveMoments, loadHelps, saveHelps } from "../storage.js";
import { confetti } from "../confetti.js";
import { el, button, announce } from "../ui/dom.js";
import { showScreen, setStepsPreviewOpen } from "../ui/screens.js";
import { LOOKUP_ENABLED } from "../lookup-config.js";
import { openLookup } from "./lookup.js";
import { openChatAboutStep, chatReady } from "./chat.js";
import { TALK_ABOUT_BUTTON } from "../logic/chat-steps.js";

let onClose = () => {}; // set by initWork: runs after the work screen closes
let getClassLabel = () => ""; // set by initWork: the optional class name typed on the paste screen
let getChosenKind = () => null; // set by initWork: the kind picked on the home screen

const workBody = document.getElementById("work-body");
const workHeading = document.getElementById("work-heading");

const TIMER_CHOICES = LENGTHS;
const ADVANCE_GUARD_MS = 400;
let work = null;
let mode = "steps"; // "steps", "stuck", "drifting", "recall", "done"
// Work screen extras (design/work-extras-w4.md). The Ask a person boxes live in memory only.
let askOn = null; // null until the Stuck sheet opens, then the step text the student may edit
let askTried = "";
let askDontGet = "";
let parked = [];
let recalls = [];
let parkOpen = false;
let parkText = "";
let parkNote = "";
let recallStepId = null;
let recallText = "";
let recallNote = "";
// "Did that help?" after a finished step (design/looking-back-w6.md). Optional, in memory until tapped.
let helpCard = null; // null, or { timer } for the step just finished
let helpNote = "";
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
// "Did that time feel about right?" after a countdown ends (design/during-a-step-w12.md).
let blockAnswers = [];
let askBlock = null; // null, or the length of the countdown that just ended
let blockNote = "";
let pendingLength = null; // the length the answers point to, used when the next step starts
let doneWhenOpen = false;
let doneWhenText = "";

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
  askBlock = null;
  blockNote = "";
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
      // One quiet question, only soon after the countdown ended. Nothing waits on it.
      if (shouldAsk(endMs, Date.now())) {
        askBlock = timerMinutes;
        blockNote = "";
      }
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
const workClass = document.getElementById("work-class");
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
  const label = normalizeClassLabel(getClassLabel());
  work = existing ?? { ...createWork(texts), ...(getChosenKind() ? { kind: getChosenKind() } : {}), ...(label ? { classLabel: label } : {}) };
  workClass.textContent = classLine(work.classLabel);
  workClass.hidden = workClass.textContent === "";
  persistWork();
  parked = loadParked();
  recalls = loadRecall();
  parkOpen = false;
  parkText = "";
  parkNote = "";
  helpCard = null;
  helpNote = "";
  resetAsk();
  blockAnswers = loadBlockAnswers();
  askBlock = null;
  blockNote = "";
  pendingLength = null;
  doneWhenOpen = false;
  doneWhenText = "";
  const learned = suggestedLength(blockAnswers, Date.now());
  if (learned !== null) {
    timerMinutes = learned;
  }
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

function resetAsk() {
  askOn = null;
  askTried = "";
  askDontGet = "";
}

function closeWork() {
  stopTimer();
  helpCard = null;
  helpNote = "";
  const finished = Boolean(work && allDone(work));
  if (finished) {
    saveWork(null); // finished: nothing left to pick up
  }
  work = null;
  workBody.replaceChildren();
  showScreen("home");
  onClose(finished);
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
  doneWhenOpen = false;
  if (choice !== "still") {
    resetAsk(); // a different step needs its own question
  }
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
    helpCard = null;
    helpNote = "";
  }
  if (choice === "done" || choice === "drifted") {
    // Both count as a finished step, the same. If this cannot be saved, the step is still finished.
    saveMoments(addMoment(loadMoments(), choice, new Date().toISOString()));
    helpCard = { timer: timerOn ? timerMinutes : 0 };
  }
  if (choice !== "still") {
    lastAdvance = now;
  }
  if (choice === "done" || choice === "drifted") confetti();
  if (allDone(work)) {
    stopTimer();
    mode = "done";
  } else if (currentStepId() !== beforeId) {
    if (pendingLength !== null) {
      timerMinutes = pendingLength; // what the student's answers pointed to
      pendingLength = null;
    }
    startTimer(); // a new step starts a new countdown
  }
  // After a reading or study step, one optional question in the student's own words.
  if (choice === "done" && asksRecall(work.kind)) {
    recallStepId = beforeId;
    recallText = "";
    recallNote = "";
    mode = "recall";
  }
  renderWork();
}

function finishRecall(save) {
  if (save) {
    const next = addRecall(recalls, recallText, recallStepId, new Date().toISOString());
    if (next === recalls) {
      recallNote = "Write a few words, or tap Skip.";
      renderWork();
      workBody.querySelector("#recall-text")?.focus();
      return;
    }
    if (!saveRecall(next)) {
      recallNote = "That could not be saved here. Tap Skip to go on.";
      renderWork();
      workBody.querySelector("#recall-text")?.focus();
      return;
    }
    recalls = next;
  }
  recallText = "";
  recallNote = "";
  workNote = "";
  mode = allDone(work) ? "done" : "steps";
  renderWork();
}

function answerHelp(answer) {
  if (!helpCard) {
    return;
  }
  if (answer === null) {
    helpCard = null;
    helpNote = "";
  } else if (saveHelps(addHelp(loadHelps(), answer, helpCard.timer, new Date().toISOString()))) {
    helpCard = null;
    helpNote = "Noted.";
  } else {
    helpNote = "That could not be saved here. You can tap Not now.";
  }
  renderWork(false);
}

// One quiet question. Nothing waits on it, and Not now costs nothing.
function helpSection() {
  if (!helpCard) {
    return helpNote ? el("p", helpNote, { class: "hint", role: "status" }) : null;
  }
  const wrap = el("div", undefined, { class: "help-card", role: "group", "aria-label": "Did that help?" });
  wrap.append(el("p", "Did that way of working help?"));
  wrap.append(
    button("It helped", () => answerHelp("yes")),
    button("A bit", () => answerHelp("bit")),
    button("Not really", () => answerHelp("no")),
    button("Not now", () => answerHelp(null)),
  );
  if (helpNote) {
    wrap.append(el("p", helpNote, { class: "hint", role: "status" }));
  }
  return wrap;
}

function renderRecall() {
  workHeading.textContent = "Work";
  if (workNote) {
    const noteLine = el("p", undefined, { class: "reward", role: "status" });
    workBody.append(noteLine);
    announce(noteLine, `✓ ${workNote}`);
  }
  workBody.append(el("p", "One thing you just learned?", { class: "current-step", tabindex: "-1", id: "recall-question" }));
  workBody.append(el("p", "In your own words. Nothing is graded, and you can skip.", { class: "hint" }));
  const box = el("textarea", undefined, { id: "recall-text", rows: "3", maxlength: String(MAX_RECALL_LENGTH), "aria-label": "One thing you just learned?" });
  box.value = recallText;
  box.addEventListener("input", () => { recallText = box.value; });
  workBody.append(box);
  if (recallNote) {
    workBody.append(el("p", recallNote, { class: "gentle", role: "status" }));
  }
  workBody.append(button("Save answer", () => finishRecall(true), "primary"));
  workBody.append(button("Skip", () => finishRecall(false)));
  box.focus();
}

// A box for a stray thought, so the student can set it aside and go back to the step.
function parkSection() {
  const wrap = el("div", undefined, { class: "park" });
  const toggle = button("Park a thought", () => {
    parkOpen = !parkOpen;
    parkNote = "";
    renderWork(false);
    workBody.querySelector(parkOpen ? "#park-text" : "#park-toggle")?.focus();
  });
  toggle.id = "park-toggle";
  toggle.setAttribute("aria-expanded", parkOpen ? "true" : "false");
  wrap.append(toggle);
  if (!parkOpen) {
    return wrap;
  }
  const panel = el("div", undefined, { id: "park-panel", class: "park-panel" });
  const input = el("input", undefined, { type: "text", id: "park-text", maxlength: String(MAX_PARKED_LENGTH), "aria-label": "A thought for later" });
  input.value = parkText;
  input.addEventListener("input", () => { parkText = input.value; });
  const save = () => {
    const next = addParked(parked, parkText, new Date().toISOString());
    if (next === parked) {
      parkNote = "Write a few words first.";
    } else {
      parked = next;
      parkText = "";
      parkNote = saveParked(parked) ? "Saved for later." : "That could not be saved here, so it will be lost if you close this page.";
    }
    renderWork(false);
    workBody.querySelector("#park-text")?.focus();
  };
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      save();
    }
  });
  panel.append(input, button("Save thought", save));
  if (parkNote) {
    panel.append(el("p", parkNote, { class: "hint", role: "status" }));
  }
  if (parked.length > 0) {
    const list = el("ul", undefined, { class: "parked-list" });
    parked.slice(0, 5).forEach((item, i) => {
      const li = el("li", item.text);
      const remove = button("Remove", () => {
        parked = removeItem(parked, item.id);
        saveParked(parked);
        parkNote = "";
        renderWork(false);
        workBody.querySelector("#park-text")?.focus();
      }, "small");
      remove.setAttribute("aria-label", `Remove parked thought ${i + 1}`);
      li.append(" ", remove);
      list.append(li);
    });
    panel.append(list);
  }
  wrap.append(panel);
  return wrap;
}

// After two hints the student can word a question for a person. The app writes nothing for them:
// the boxes hold only their own words, and nothing is sent anywhere.
function askSection(step) {
  if (askOn === null) {
    askOn = step.text;
  }
  const wrap = el("div", undefined, { class: "ask" });
  wrap.append(el("p", "Ask a person", { class: "ask-title" }));
  wrap.append(el("p", "A person can help most. Fill this in, then copy it or show it.", { class: "hint" }));
  const boxes = [
    ["ask-on", "I'm on:", () => askOn, (v) => { askOn = v; }],
    ["ask-tried", "I tried:", () => askTried, (v) => { askTried = v; }],
    ["ask-dont-get", "I don't get:", () => askDontGet, (v) => { askDontGet = v; }],
  ];
  for (const [id, label, get, set] of boxes) {
    const box = el("textarea", undefined, { id, rows: "2", maxlength: String(MAX_ASK_LENGTH), "aria-label": label });
    box.value = get();
    box.addEventListener("input", () => set(box.value));
    wrap.append(box);
  }
  const status = el("p", undefined, { class: "gentle", role: "status", id: "ask-status" });
  const copy = button("Copy my question", () => {
    const fields = { on: askOn, tried: askTried, dontGet: askDontGet };
    if (!hasOwnWords(fields)) {
      announce(status, "Write a little in I tried or I don't get first.");
      return;
    }
    const question = buildQuestion(fields);
    const showFallback = () => {
      const shown = el("textarea", undefined, { id: "ask-copy-fallback", rows: "4", readonly: "", "aria-label": "Your question, to copy" });
      shown.value = question;
      wrap.append(shown);
      shown.focus();
      shown.select();
      announce(status, "Copying did not work here. Select the text above and copy it.");
    };
    const clip = globalThis.navigator && globalThis.navigator.clipboard;
    if (clip && typeof clip.writeText === "function") {
      clip.writeText(question).then(() => announce(status, "Copied."), showFallback);
    } else {
      showFallback();
    }
  });
  wrap.append(copy, status);
  return wrap;
}

function answerBlock(answer) {
  const minutes = askBlock;
  askBlock = null;
  if (minutes !== null && answer !== null) {
    const next = addBlockAnswer(blockAnswers, minutes, answer, new Date().toISOString());
    if (next !== blockAnswers && !saveBlockAnswers(next)) {
      blockNote = BLOCK_SAVE_FAILED;
    } else {
      blockAnswers = next;
      const learned = suggestedLength(blockAnswers, Date.now());
      pendingLength = learned !== null && learned !== timerMinutes ? learned : null;
      blockNote = learned !== null ? `${BLOCK_NOTED} ${learnedLine(learned)}` : BLOCK_NOTED;
    }
  }
  renderWork(false);
}

// One quiet question when a countdown ends. Skip saves nothing. The student can ignore it and go on.
function blockSection() {
  if (askBlock !== null && !shouldAsk(endMs, Date.now())) {
    askBlock = null; // too long ago to ask now
  }
  if (askBlock === null) {
    return blockNote ? el("p", blockNote, { class: "hint", role: "status" }) : null;
  }
  const wrap = el("div", undefined, { class: "help-card", role: "group", "aria-label": BLOCK_QUESTION });
  wrap.append(el("p", BLOCK_QUESTION));
  for (const answer of offeredAnswers(askBlock)) {
    wrap.append(button(BLOCK_LABELS[answer], () => answerBlock(answer)));
  }
  wrap.append(button(BLOCK_SKIP, () => answerBlock(null)));
  return wrap;
}

// An optional line the student writes for this step: how they will know it is finished.
function doneWhenSection(step) {
  const wrap = el("div", undefined, { class: "done-when-box" });
  const stepId = step.id;
  const save = (text) => {
    work = setDoneWhen(work, stepId, text);
    persistWork();
    doneWhenOpen = false;
    renderWork(false);
    workBody.querySelector("#done-when-open")?.focus();
  };
  if (!doneWhenOpen) {
    const open = button(step.doneWhen ? DONE_WHEN_CHANGE : DONE_WHEN_ADD, () => {
      doneWhenOpen = true;
      doneWhenText = step.doneWhen ?? "";
      renderWork(false);
      workBody.querySelector("#done-when-text")?.focus();
    }, "small");
    open.id = "done-when-open";
    wrap.append(open);
    return wrap;
  }
  const input = el("input", undefined, { type: "text", id: "done-when-text", maxlength: String(MAX_DONE_WHEN_LENGTH), "aria-label": DONE_WHEN_PROMPT });
  input.value = doneWhenText;
  input.addEventListener("input", () => { doneWhenText = input.value; });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      save(doneWhenText);
    }
  });
  wrap.append(el("p", DONE_WHEN_PROMPT, { class: "hint" }), input, button(DONE_WHEN_SAVE, () => save(doneWhenText), "small"));
  if (step.doneWhen) {
    wrap.append(button(DONE_WHEN_CLEAR, () => save(""), "small"));
  }
  return wrap;
}

// focusStep is true when the screen opens or the student's tap replaced the step view.
// Other redraws (timer, countdown controls, step list) keep focus on the same button.
function renderWork(focusStep = true) {
  const active = document.activeElement;
  const keepId = !focusStep && workBody.contains(active) ? active.id : "";
  const keepLabel = !focusStep && workBody.contains(active) && active.tagName === "BUTTON" ? active.textContent : null;
  const hadFocus = !focusStep && workBody.contains(active);
  workBody.replaceChildren();
  if (mode === "recall") {
    renderRecall();
    return;
  }
  if (mode === "done" || allDone(work)) {
    workHeading.textContent = "All your steps are done.";
    workBody.append(button("Close", closeWork, "primary"));
    const doneHelp = helpSection();
    if (doneHelp) workBody.append(doneHelp);
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
  if (step.doneWhen && !(mode === "steps" && doneWhenOpen)) {
    workBody.append(el("p", `${DONE_WHEN_LABEL} ${step.doneWhen}`, { class: "hint done-when" }));
  }
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
    workBody.append(el("p", "Stuck is okay.", { class: "hint" }));
    if (hint === null) {
      focusTarget = el("p", "That's all the hints for now. Try the first small part, or tap Still working.", { class: "gentle", tabindex: "-1" });
    } else {
      focusTarget = el("p", hint, { class: "gentle", tabindex: "-1" });
    }
    workBody.append(focusTarget);
    if (hint !== null) {
      workBody.append(button("Another hint", () => { hintsShown += 1; renderWork(); }));
    }
    if (showAskPerson(Math.min(hintsShown + 1, STUCK_HINTS.length), STUCK_HINTS.length)) {
      workBody.append(askSection(step));
    }
    if (chatReady()) {
      const talkButton = button(TALK_ABOUT_BUTTON, () => openChatAboutStep(step.text, work.kind ?? getChosenKind(), () => workBody.querySelector("#stuck-talk")?.focus()));
      talkButton.id = "stuck-talk";
      workBody.append(talkButton);
    }
    if (LOOKUP_ENABLED) {
      const lookButton = button("Look it up", () => openLookup({
        screen: "work",
        label: "Back to the step",
        focusAfter: () => workBody.querySelector("#stuck-lookup")?.focus(),
      }));
      lookButton.id = "stuck-lookup";
      workBody.append(lookButton);
    }
    workBody.append(button("Back to the step", () => { mode = "steps"; renderWork(); }));
    focusTarget.focus();
    return;
  }

  if (mode === "drifting") {
    const box = el("textarea", undefined, { id: "split-text", rows: "2", maxlength: "500", "aria-label": "The smallest part of this step" });
    box.value = driftStart(step.text);
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

  const block = blockSection();
  if (block) workBody.append(block);
  workBody.append(doneWhenSection(step));

  const stepHelp = helpSection();
  if (stepHelp) workBody.append(stepHelp);

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
      const b = button(`${minutes} minutes`, () => { timerMinutes = minutes; pendingLength = null; startTimer(); renderWork(false); }, "kind");
      if (minutes === timerMinutes) b.setAttribute("aria-pressed", "true");
      pick.append(b);
    }
    workBody.append(pick);
    const learnedNow = suggestedLength(blockAnswers, Date.now());
    if (learnedNow !== null) {
      workBody.append(el("p", learnedLine(learnedNow), { class: "hint" }));
    }
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

  workBody.append(parkSection());

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

export function initWork({ onClose: onCloseFn, getChosenKind: getter, getClassLabel: labelGetter }) {
  onClose = onCloseFn;
  getChosenKind = getter;
  getClassLabel = labelGetter;
}
