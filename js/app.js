// Screen wiring for the paste screen (design/paste-and-split.md).
// Pure logic lives in js/logic/. Text from the student is only ever put on
// screen with textContent, never as HTML (DECISIONS T11).
import { cleanPastedText, limitPaste } from "./logic/clean-text.js";
import { KINDS, DEFAULT_STEP_COUNT, starterStepsFor } from "./logic/starter-steps.js";
import { QUESTIONS, cardLines } from "./logic/focus-intake.js";

const textBox = document.getElementById("assignment-text");
const kindButtons = document.getElementById("kind-buttons");
const showButton = document.getElementById("show-steps");
const message = document.getElementById("message");
const stepsScreen = document.getElementById("steps-screen");
const stepsList = document.getElementById("steps");
const showMore = document.getElementById("show-more");
const startButton = document.getElementById("start");
const ready = document.getElementById("ready");

let chosenKind = null;
let allSteps = [];
let pastedText = "";

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
}

function renderSteps(count) {
  stepsList.replaceChildren();
  for (const step of allSteps.slice(0, count)) {
    const item = document.createElement("li");
    item.textContent = step;
    stepsList.appendChild(item);
  }
  showMore.hidden = count >= allSteps.length;
}

showButton.addEventListener("click", () => {
  const { text, truncated } = limitPaste(textBox.value);
  if (text === "") {
    message.textContent = "Paste something to start.";
    return;
  }
  if (chosenKind === null) {
    message.textContent = "Tap the kind of work it is, then try again.";
    return;
  }

  pastedText = cleanPastedText(text);
  allSteps = starterStepsFor(chosenKind, pastedText);
  ready.textContent = "";
  renderSteps(DEFAULT_STEP_COUNT);
  stepsScreen.hidden = false;
  message.textContent = truncated
    ? "That's a long one. The first 6,000 characters are kept."
    : "";
  stepsScreen.scrollIntoView({ block: "start" });
});

showMore.addEventListener("click", () => {
  renderSteps(allSteps.length);
  stepsList.focus();
});

startButton.addEventListener("click", () => {
  // The work screen is the next build (item 3). For now, confirm the steps are ready.
  ready.textContent = `${allSteps.length} steps ready. The work screen comes next.`;
});

// "How I like to work": four one-tap questions, then a first-guess card.
// Nothing is saved (storage comes with item 5). Closing the screen clears it.
const pasteScreen = document.getElementById("paste-screen");
const intakeScreen = document.getElementById("intake-screen");
const intakeBody = document.getElementById("intake-body");
const openIntake = document.getElementById("open-intake");

let intakeAnswers = {};
let intakeView = "start"; // "start", "card", or a question index
let changingId = null; // set while a card line's Change button is in use

function el(tag, text, attrs = {}) {
  const node = document.createElement(tag);
  if (text !== undefined) {
    node.textContent = text;
  }
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value);
  }
  return node;
}

function button(text, onClick, className = "") {
  const node = el("button", text, { type: "button" });
  if (className) {
    node.className = className;
  }
  node.addEventListener("click", onClick);
  return node;
}

function renderIntake() {
  intakeBody.replaceChildren();

  if (intakeView === "start") {
    intakeBody.append(
      el("p", "Four quick taps. They give a first guess, and you can change any line. There are no right answers.", { class: "hint" }),
      el("p", "Your answers are kept only while this page stays open.", { class: "hint" }),
      button("Start", () => showIntakeView(0), "primary"),
      button("Close", closeIntake),
    );
    return;
  }

  if (intakeView === "card") {
    intakeBody.append(el("h3", "My first guess", { tabindex: "-1" }));
    const list = el("ul", undefined, { class: "card" });
    for (const line of cardLines(intakeAnswers)) {
      const item = el("li");
      item.append(el("span", `${line.label}: ${line.value}`), " ");
      item.append(button("Change", () => changeLine(line.id), "small"));
      list.append(item);
    }
    intakeBody.append(
      list,
      el("p", "This is only a first guess. You can change any line any time.", { class: "hint" }),
      button("Close", closeIntake, "primary"),
    );
    return;
  }

  const index = intakeView;
  const question = QUESTIONS[index];
  intakeBody.append(el("h3", question.text, { tabindex: "-1" }));
  const choices = el("div", undefined, { class: "kind-buttons" });
  for (const option of question.options) {
    choices.append(
      button(option.label, () => answer(question.id, option.value), "kind"),
    );
  }
  intakeBody.append(choices);
  if (changingId !== null) {
    intakeBody.append(button("Back to my first guess", () => showIntakeView("card")));
  } else if (index > 0) {
    intakeBody.append(button("Back", () => showIntakeView(index - 1)));
  }
  intakeBody.append(button("Close", closeIntake));
}

function showIntakeView(view) {
  intakeView = view;
  renderIntake();
  intakeBody.querySelector("h3")?.focus();
}

function answer(id, value) {
  intakeAnswers[id] = value;
  if (changingId !== null) {
    changingId = null;
    showIntakeView("card");
    return;
  }
  const next = QUESTIONS.findIndex((q) => q.id === id) + 1;
  showIntakeView(next < QUESTIONS.length ? next : "card");
}

function changeLine(id) {
  changingId = id;
  showIntakeView(QUESTIONS.findIndex((q) => q.id === id));
}

function openIntakeScreen() {
  intakeAnswers = {};
  changingId = null;
  pasteScreen.hidden = true;
  stepsScreen.hidden = true;
  intakeScreen.hidden = false;
  showIntakeView("start");
  intakeScreen.scrollIntoView({ block: "start" });
}

function closeIntake() {
  intakeAnswers = {};
  changingId = null;
  intakeBody.replaceChildren();
  intakeScreen.hidden = true;
  pasteScreen.hidden = false;
  openIntake.focus();
}

openIntake.addEventListener("click", openIntakeScreen);
