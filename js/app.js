// Screen wiring for the paste screen (design/paste-and-split.md).
// Pure logic lives in js/logic/. Text from the student is only ever put on
// screen with textContent, never as HTML (DECISIONS T11).
import { cleanPastedText, limitPaste } from "./logic/clean-text.js";
import { KINDS, DEFAULT_STEP_COUNT, starterStepsFor, withTwoMinuteStart } from "./logic/starter-steps.js";
import { QUESTIONS, cardLines } from "./logic/focus-intake.js";
import { GOAL_KEYS, MAX_TEXT, emptyProfile, setGoals, addNote, deleteNote, notesNewestFirst } from "./logic/profile.js";
import { loadProfileState, saveProfile } from "./storage.js";
import { aiAvailable, suggestWithAi } from "./ai.js";
import { GROUPS, CATEGORIES, groupItems, makeItem, makeEvent, isEvent, removeItem, parseDue, setStatus, completedItems } from "./logic/calendar.js";
import { loadCalendarItems, saveCalendarItems, loadCompletionCounts, saveCompletionCounts } from "./storage.js";
import { addCompletion, removeCompletion, totals } from "./logic/counter.js";
import { addDays, addMonths, splitWeek, monthGrid, itemsOnDay, eventsCovering, blockPlacement, hourLabels, mondayOf } from "./logic/views.js";
import { bucketFor, parseDue as parseDueCal } from "./logic/calendar.js";
import { createWork, currentIndex, doneCount, allDone, applyChoice, hintAt, ringFraction, formatTime } from "./logic/work.js";

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
  openWorkScreen(allSteps);
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

// "My profile": goals and "What got in the way?" notes, saved on this device only
// (design/profile.md). Nothing is shared, and nothing is judged.
const profileScreen = document.getElementById("profile-screen");
const profileBody = document.getElementById("profile-body");
const openProfile = document.getElementById("open-profile");

const loaded = loadProfileState();
let profile = loaded.profile;
const loadStatus = loaded.status;
let dirty = false;
let clearAsked = false;
let leaveWarned = false;
let saveMessage = "";

const GOAL_LABELS = { today: "Today", week: "This week", month: "This month", year: "This year" };
const GOAL_HINTS = {
  today: "One thing you want done today.",
  week: "One thing you want done this week.",
  month: "One thing you want done this month.",
  year: "One thing you want done this year.",
};

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function newNoteId() {
  return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// Reads what is typed in the boxes, so a redraw does not lose unsaved words.
function typedValues() {
  const goals = {};
  for (const key of GOAL_KEYS) {
    const box = document.getElementById(`goal-${key}`);
    goals[key] = box ? box.value : profile.goals[key];
  }
  const noteBox = document.getElementById("note-text");
  return { goals, noteDraft: noteBox ? noteBox.value : "" };
}

function labelled(text, control, id) {
  const label = el("label", text, { for: id });
  return [label, control];
}

function renderProfile(draft = { goals: profile.goals, noteDraft: "" }) {
  profileBody.replaceChildren();

  if (loadStatus === "recovered") {
    profileBody.append(el("p", "Something in your saved data couldn't be read, so we started fresh. A copy was kept.", { class: "message" }));
  }
  if (loadStatus === "unavailable") {
    profileBody.append(el("p", "Your profile can't be saved in this browser.", { class: "message" }));
  }

  profileBody.append(el("h3", "My goals"));
  for (const key of GOAL_KEYS) {
    const box = el("textarea", undefined, { id: `goal-${key}`, rows: "2", maxlength: String(MAX_TEXT), "aria-describedby": `hint-${key}` });
    box.value = draft.goals[key] ?? "";
    box.addEventListener("input", markDirty);
    profileBody.append(...labelled(GOAL_LABELS[key], box, `goal-${key}`), el("p", GOAL_HINTS[key], { class: "hint", id: `hint-${key}` }));
  }

  profileBody.append(el("h3", "What got in the way?"));
  profileBody.append(el("p", "Write it in your own words. Nothing here is judged.", { class: "hint" }));
  profileBody.append(el("p", "If something serious is getting in the way, talk to an adult you trust.", { class: "hint" }));
  const noteBox = el("textarea", undefined, { id: "note-text", rows: "3", maxlength: String(MAX_TEXT) });
  noteBox.value = draft.noteDraft ?? "";
  profileBody.append(...labelled("Note", noteBox, "note-text"));
  profileBody.append(button("Add note", addNoteFromBox));

  const list = el("ul", undefined, { class: "notes" });
  for (const note of notesNewestFirst(profile)) {
    const item = el("li");
    item.append(el("span", note.text), " ");
    item.append(button("Delete", () => deleteOneNote(note.id), "small"));
    list.append(item);
  }
  if (profile.gotInTheWay.length === 0) {
    list.append(el("li", "No notes yet.", { class: "hint" }));
  }
  profileBody.append(list);

  profileBody.append(el("p", "Anyone using this browser can see this.", { class: "hint" }));
  profileBody.append(button("Save", saveAll, "primary"));
  profileBody.append(el("p", dirty ? "Not saved yet." : saveMessage, { class: "message", role: "status" }));

  if (clearAsked) {
    profileBody.append(el("p", "Clear everything in my profile? This can't be undone."));
    profileBody.append(button("Yes, clear everything", clearEverything));
    profileBody.append(button("Cancel", () => { clearAsked = false; renderProfile(); }));
  } else {
    profileBody.append(button("Clear my profile", () => { clearAsked = true; renderProfile(); }));
  }
  profileBody.append(button("Back", backFromProfile));
}

function markDirty() {
  dirty = true;
  saveMessage = "";
  leaveWarned = false;
}

function addNoteFromBox() {
  const { goals, noteDraft } = typedValues();
  const before = profile.gotInTheWay.length;
  profile = addNote(setGoals(profile, goals), noteDraft, todayStamp(), newNoteId());
  if (profile.gotInTheWay.length !== before) {
    markDirty();
  }
  renderProfile();
  document.getElementById("note-text")?.focus();
}

function deleteOneNote(id) {
  const { goals, noteDraft } = typedValues();
  profile = deleteNote(setGoals(profile, goals), id);
  markDirty();
  renderProfile({ goals: profile.goals, noteDraft });
}

function saveAll() {
  const { goals, noteDraft } = typedValues();
  profile = setGoals(profile, goals);
  const saved = saveProfile(profile);
  dirty = !saved;
  saveMessage = saved ? "Saved on this device." : "Couldn't save in this browser.";
  renderProfile({ goals: profile.goals, noteDraft });
}

function clearEverything() {
  profile = emptyProfile();
  clearAsked = false;
  const saved = saveProfile(profile);
  dirty = false;
  saveMessage = saved ? "Your profile is cleared." : "Couldn't save in this browser.";
  renderProfile();
}

function openProfileScreen() {
  pasteScreen.hidden = true;
  stepsScreen.hidden = true;
  intakeScreen.hidden = true;
  profileScreen.hidden = false;
  saveMessage = "";
  leaveWarned = false;
  renderProfile();
  document.getElementById("profile-heading").focus();
}

function backFromProfile() {
  if (dirty && !leaveWarned) {
    leaveWarned = true;
    renderProfile();
    profileBody.querySelector(".message")?.replaceChildren("You have changes that aren't saved. Press Save first, or press Back again to leave.");
    return;
  }
  profileScreen.hidden = true;
  pasteScreen.hidden = false;
  openProfile.focus();
}

openProfile.addEventListener("click", openProfileScreen);

// The work screen (design/work-screen.md): one step at a time. Steps live on the
// page only; a refresh starts again from the paste screen.
const workScreen = document.getElementById("work-screen");
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
  secondsLeft = timerMinutes * 60;
  tick = setInterval(() => {
    secondsLeft -= 1;
    if (secondsLeft <= 0) {
      secondsLeft = 0;
      stopTimer();
      timeUp = true;
      // Only redraw the step view. If a box or a hint is open, the line waits
      // until the student returns to the step, so their words are not lost.
      if (mode === "steps") {
        renderWork();
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

function openWorkScreen(texts) {
  stopTimer();
  work = createWork(texts);
  mode = "steps";
  hintsShown = 0;
  workNote = "";
  driftNote = "";
  pasteScreen.hidden = true;
  stepsScreen.hidden = true;
  intakeScreen.hidden = true;
  profileScreen.hidden = true;
  workScreen.hidden = false;
  startTimer();
  renderWork();
  workHeading.focus();
}

function closeWork() {
  stopTimer();
  work = null;
  workBody.replaceChildren();
  workScreen.hidden = true;
  pasteScreen.hidden = false;
  showButton.focus();
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
  workNote = {
    still: "Keep going. Tap any button when you're ready.",
    done: "Step done.",
    drifted: "That counts too. Smaller steps count.",
  }[choice] ?? "";
  driftNote = "";
  if (next === work && choice !== "still") {
    renderWork();
    return;
  }
  work = next;
  if (choice !== "still") {
    lastAdvance = now;
  }
  if (allDone(work)) {
    stopTimer();
    mode = "done";
  } else if (currentStepId() !== beforeId) {
    startTimer(); // a new step starts a new countdown
  }
  renderWork();
}

function renderWork() {
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
    workBody.append(el("p", reward ? `✓ ${workNote}` : workNote, { class: reward ? "reward" : "gentle", role: "status" }));
  }
  if (timeUp && mode === "steps") {
    workBody.append(el("p", "Time's up. Keep going, or tap Still working.", { class: "gentle", role: "status" }));
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
    button("Stuck", () => { mode = "stuck"; renderWork(); }, "kind"),
    button("Drifted", () => { mode = "drifting"; driftNote = ""; renderWork(); }, "kind"),
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
    renderWork();
    toggle.focus();
  });
  timerLabel.append(toggle, " Show a countdown");
  workBody.append(timerLabel);

  if (timerOn) {
    const pick = el("div", undefined, { class: "kind-buttons" });
    for (const minutes of TIMER_CHOICES) {
      const b = button(`${minutes} minutes`, () => { timerMinutes = minutes; startTimer(); renderWork(); }, "kind");
      if (minutes === timerMinutes) b.setAttribute("aria-pressed", "true");
      pick.append(b);
    }
    workBody.append(pick);
  }

  workBody.append(button("Leave my steps", closeWork));
  stepText.focus();
}

// AI suggestions (design/ai-path.md). Hidden unless the server says it is available,
// which needs a key set up by an adult. Any failure falls back to the starter steps.
const aiBox = document.getElementById("ai-box");
const aiButton = document.getElementById("ai-suggest");

aiAvailable().then((ok) => {
  aiBox.hidden = !ok;
});

aiButton.addEventListener("click", async () => {
  const { text } = limitPaste(textBox.value);
  if (text === "") {
    message.textContent = "Paste something to start.";
    return;
  }
  if (chosenKind === null) {
    message.textContent = "Tap the kind of work it is, then try again.";
    return;
  }
  aiButton.disabled = true;
  message.textContent = "Asking for suggestions...";
  const result = await suggestWithAi(text, chosenKind);
  aiButton.disabled = false;

  if (result?.trustedAdult) {
    message.textContent = "If something serious is going on, please talk to an adult you trust.";
    return;
  }
  if (result?.steps?.length) {
    allSteps = result.steps;
    message.textContent = "These steps came from an AI. Change anything you like.";
  } else {
    allSteps = starterStepsFor(chosenKind, cleanPastedText(text));
    message.textContent = "The AI couldn't help this time, so here are the starter steps.";
  }
  ready.textContent = "";
  renderSteps(DEFAULT_STEP_COUNT);
  stepsScreen.hidden = false;
});

// "My calendar": items the student adds with a due time, sorted into groups by how
// soon they are due (design/calendar.md). Saved only on this device.
const calendarScreen = document.getElementById("calendar-screen");
const calendarBody = document.getElementById("calendar-body");
const openCalendar = document.getElementById("open-calendar");
let calendarItems = loadCalendarItems();
let completionCounts = loadCompletionCounts();

function calendarId() {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function dueText(due) {
  const date = parseDue(due.slice(0, 10), due.slice(11, 16));
  if (!date) {
    return "";
  }
  return date.toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function renderCalendar(draft = { title: "", day: "", time: "" }, message = "") {
  calendarBody.replaceChildren();

  const form = el("div", undefined, { class: "calendar-form" });
  const titleBox = el("input", undefined, { type: "text", id: "cal-title", maxlength: "200" });
  titleBox.value = draft.title;
  const kindBox = el("select", undefined, { id: "cal-kind" });
  kindBox.append(el("option", "A task, due at a time", { value: "task" }), el("option", "A trip or event, over several days", { value: "event" }));
  kindBox.value = draft.kind ?? "task";
  const dayBox = el("input", undefined, { type: "date", id: "cal-day" });
  dayBox.value = draft.day;
  const endBox = el("input", undefined, { type: "date", id: "cal-end" });
  endBox.value = draft.end ?? "";
  const timeBox = el("input", undefined, { type: "time", id: "cal-time" });
  timeBox.value = draft.time;
  const dayLabel = el("label", kindBox.value === "event" ? "From date" : "Due date", { for: "cal-day" });
  const endLabel = el("label", "To date", { for: "cal-end" });
  const timeLabel = el("label", "Due time", { for: "cal-time" });
  const applyKind = () => {
    const isTrip = kindBox.value === "event";
    dayLabel.textContent = isTrip ? "From date" : "Due date";
    endBox.hidden = !isTrip;
    endLabel.hidden = !isTrip;
    timeBox.hidden = isTrip;
    timeLabel.hidden = isTrip;
  };
  kindBox.addEventListener("change", applyKind);
  form.append(...labelled("What is it?", titleBox, "cal-title"));
  form.append(...labelled("Type", kindBox, "cal-kind"));
  form.append(dayLabel, dayBox, endLabel, endBox, timeLabel, timeBox);
  queueMicrotask(applyKind);
  const notesBox = el("textarea", undefined, { id: "cal-notes", rows: "8", maxlength: "2000", class: "big-notes" });
  notesBox.value = draft.notes ?? "";
  const linksBox = el("textarea", undefined, { id: "cal-links", rows: "3", placeholder: "https://" });
  linksBox.value = draft.links ?? "";
  const catBox = el("select", undefined, { id: "cal-category" });
  for (const c of CATEGORIES) {
    const option = el("option", c.label, { value: c.id });
    if ((draft.category ?? "other") === c.id) option.selected = true;
    catBox.append(option);
  }
  form.append(...labelled("What part of life is it?", catBox, "cal-category"));
  form.append(...labelled("Notes (as much as you want)", notesBox, "cal-notes"));
  form.append(...labelled("Web links, one per line (must start with https://)", linksBox, "cal-links"));
  form.append(button("Add to my calendar", () => addCalendarItem(), "primary"));
  form.append(el("p", message, { class: "message", role: "status" }));
  calendarBody.append(form);

  if (celebrateText) {
    const line = el("p", undefined, { class: "celebrate", role: "status" });
    line.append(el("span", "✓ ", { class: "check", "aria-hidden": "true" }), celebrateText);
    calendarBody.append(line);
  }
  const count = totals(completionCounts, new Date());
  const log = el("div", undefined, { class: "log", role: "status" });
  log.append(el("p", `Finished so far: today ${count.today} · this week ${count.week} · this month ${count.month} · this year ${count.year} · all time ${count.all}`));
  calendarBody.append(log);

  renderViewBar();
  if (calView !== "list") {
    if (calendarItems.length === 0) {
      calendarBody.append(el("p", "Nothing planned yet. Add something when you're ready.", { class: "hint" }));
    }
    renderTimeView();
    calendarBody.append(button("Back", backFromCalendar));
    return;
  }

  if (calendarItems.length === 0) {
    calendarBody.append(el("p", "Nothing planned yet. Add something when you're ready.", { class: "hint" }));
  }

  const groups = groupItems(calendarItems, new Date());
  for (const group of GROUPS) {
    const heading = el("h3", group.label, { tabindex: "-1" });
    calendarBody.append(heading, el("p", group.hint, { class: "hint" }));
    const list = el("ul", undefined, { class: "cal-list", "data-group": group.id });
    if (groups[group.id].length === 0) {
      list.append(el("li", "Nothing here.", { class: "hint" }));
    }
    for (const item of groups[group.id]) {
      const row = el("li");
      const due = group.id === "urgent" && new Date(item.due) < new Date() ? `${dueText(item.due)} · Due time has passed` : dueText(item.due);
      row.append(el("span", `${item.title}, ${due}`), " ");
      row.append(el("span", ` · ${categoryLabel(item.category)} · ${statusLabel(item.status)}`, { class: "tag" }));
      row.append(...statusButtons(item));
      row.append(button("Delete", () => deleteCalendarItem(item.id), "small"));
      if (item.notes) {
        row.append(el("p", item.notes, { class: "item-notes" }));
      }
      if (item.links?.length) {
        const linkList = el("ul", undefined, { class: "item-links" });
        for (const link of item.links) {
          const a = el("a", link, { href: link, target: "_blank", rel: "noopener noreferrer" });
          linkList.append(el("li"));
          linkList.lastChild.append(a);
        }
        row.append(linkList);
      }
      list.append(row);
    }
    calendarBody.append(list);
  }

  const trips = calendarItems.filter((item) => isEvent(item));
  if (trips.length > 0) {
    calendarBody.append(el("h3", "Trips and events", { tabindex: "-1" }));
    const tripList = el("ul", undefined, { class: "cal-list" });
    for (const trip of trips) {
      const row = el("li");
      row.append(el("span", `${trip.title}, ${trip.start} to ${trip.end}`), " ");
      row.append(button("Delete", () => deleteCalendarItem(trip.id), "small"));
      tripList.append(row);
    }
    calendarBody.append(tripList);
  }

  const done = completedItems(calendarItems);
  if (done.length > 0) {
    calendarBody.append(el("h3", "Completed", { tabindex: "-1" }));
    const list = el("ul", undefined, { class: "cal-list completed" });
    for (const item of done) {
      const row = el("li");
      row.append(el("span", `${item.title}, finished ${item.completedOn}`), " ");
      row.append(button("Reopen", () => changeStatus(item.id, "open"), "small"));
      row.append(button("Delete", () => deleteCalendarItem(item.id), "small"));
      list.append(row);
    }
    calendarBody.append(list);
  }

  calendarBody.append(button("Back", backFromCalendar));
}

function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? "Other";
}

function statusLabel(status) {
  return { open: "Not started", "in progress": "In progress", completed: "Completed" }[status] ?? "Not started";
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

let celebrateText = "";

function changeStatus(id, status) {
  const item = calendarItems.find((i) => i.id === id);
  const next = setStatus(calendarItems, id, status, todayIso());
  const nextCounts =
    status === "completed"
      ? addCompletion(completionCounts, todayIso())
      : item?.status === "completed"
        ? removeCompletion(completionCounts, item.completedOn)
        : completionCounts;
  if (saveCalendarItems(next)) {
    calendarItems = next;
    if (saveCompletionCounts(nextCounts)) {
      completionCounts = nextCounts;
    }
  }
  celebrateText = status === "completed" ? "Fire it Up" : "";
  renderCalendar();
}

function statusButtons(item) {
  if (item.status === "completed") {
    return [];
  }
  const buttons = [];
  if (item.status === "open") {
    buttons.push(button("Start", () => changeStatus(item.id, "in progress"), "small"));
  }
  buttons.push(button("Complete", () => changeStatus(item.id, "completed"), "small"));
  return buttons;
}

function addCalendarItem() {
  const draft = {
    kind: document.getElementById("cal-kind").value,
    title: document.getElementById("cal-title").value,
    day: document.getElementById("cal-day").value,
    end: document.getElementById("cal-end").value,
    time: document.getElementById("cal-time").value,
    notes: document.getElementById("cal-notes").value,
    links: document.getElementById("cal-links").value,
    category: document.getElementById("cal-category").value,
  };
  const result = draft.kind === "event"
    ? makeEvent({ title: draft.title, start: draft.day, end: draft.end, notes: draft.notes, links: draft.links, category: draft.category }, calendarId())
    : makeItem(draft, calendarId());
  if (!result.ok) {
    renderCalendar(draft, result.reason);
    return;
  }
  const next = [...calendarItems, result.item];
  const saved = saveCalendarItems(next);
  if (!saved) {
    renderCalendar(draft, "Couldn't save in this browser.");
    return;
  }
  calendarItems = next;
  renderCalendar({ title: "", day: "", time: "", notes: "", links: "", category: "other" }, "Added.");
  document.getElementById("cal-title").focus();
}

function deleteCalendarItem(id) {
  const next = removeItem(calendarItems, id);
  if (saveCalendarItems(next)) {
    calendarItems = next;
  }
  renderCalendar();
}

function openCalendarScreen() {
  pasteScreen.hidden = true;
  stepsScreen.hidden = true;
  intakeScreen.hidden = true;
  profileScreen.hidden = true;
  workScreen.hidden = true;
  calendarScreen.hidden = false;
  renderCalendar();
  calendarScreen.querySelector("h2").focus();
}

function backFromCalendar() {
  calendarScreen.hidden = true;
  pasteScreen.hidden = false;
  openCalendar.focus();
}

openCalendar.addEventListener("click", openCalendarScreen);

// Views: List (the priority groups), Day, Week (weekdays and weekend), Month.
// Read-only in this step: blocks are shown, not moved (design/time-blocks.md).
let calView = "list";
let calAnchor = new Date();

const VIEWS = [
  { id: "list", label: "List" },
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

function renderViewBar() {
  const bar = el("div", undefined, { class: "view-bar", role: "group", "aria-label": "Calendar view" });
  for (const view of VIEWS) {
    const b = button(view.label, () => { calView = view.id; renderCalendar(); }, "kind");
    b.setAttribute("aria-pressed", String(calView === view.id));
    bar.append(b);
  }
  calendarBody.append(bar);
}

function periodLabel() {
  const d = calAnchor;
  if (calView === "day") return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  if (calView === "week") {
    const monday = mondayOf(d);
    const sunday = addDays(monday, 6);
    return `${monday.toLocaleDateString([], { day: "numeric", month: "short" })} to ${sunday.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return d.toLocaleDateString([], { month: "long", year: "numeric" });
}

function stepBy(direction) {
  if (calView === "day") calAnchor = addDays(calAnchor, direction);
  else if (calView === "week") calAnchor = addDays(calAnchor, 7 * direction);
  else calAnchor = addMonths(calAnchor, direction);
  renderCalendar();
}

function navRow() {
  const row = el("div", undefined, { class: "nav-row" });
  row.append(button("Previous", () => stepBy(-1), "small"));
  row.append(el("p", periodLabel(), { class: "period", role: "status" }));
  row.append(button("Next", () => stepBy(1), "small"));
  row.append(button("Today", () => { calAnchor = new Date(); renderCalendar(); }, "small"));
  return row;
}

function blockFor(item, now) {
  if (isEvent(item)) {
    const band = el("button", undefined, { type: "button", class: "block", "data-group": "event" });
    band.textContent = `${item.title} (to ${item.end})`;
    band.addEventListener("click", () => { calAnchor = new Date(item.start + "T12:00"); calView = "day"; renderCalendar(); });
    return band;
  }
  const due = parseDueCal(item.due.slice(0, 10), item.due.slice(11, 16));
  const group = item.status === "completed" ? "done" : due ? bucketFor(due, now) : "later";
  const time = item.due.slice(11, 16);
  const block = el("button", undefined, { type: "button", class: "block", "data-group": group });
  block.textContent = `${time} ${item.title}${item.status === "completed" ? " (finished)" : ""}`;
  block.addEventListener("click", () => { calAnchor = new Date(item.due.slice(0, 10) + "T12:00"); calView = "day"; renderCalendar(); });
  return block;
}

function renderTimeView() {
  calendarBody.append(navRow());
  const now = new Date();

  if (calView === "day") {
    for (const trip of eventsCovering(calendarItems, calAnchor)) {
      calendarBody.append(el("p", `Trip or event: ${trip.title} (${trip.start} to ${trip.end})`, { class: "event-band" }));
    }
    const grid = el("div", undefined, { class: "day-grid", "aria-label": "Day timeline" });
    for (const hour of hourLabels()) {
      grid.append(el("div", `${hour}:00`, { class: "hour", style: `top:${((hour - 7) / 15) * 100}%` }));
    }
    const outside = [];
    for (const item of itemsOnDay(calendarItems, calAnchor).filter((i) => !isEvent(i))) {
      const place = blockPlacement(item);
      if (!place) {
        outside.push(item);
        continue;
      }
      const block = blockFor(item, now);
      block.style.top = `${place.top}%`;
      block.style.height = `${place.height}%`;
      grid.append(block);
    }
    calendarBody.append(grid);
    if (outside.length) {
      calendarBody.append(el("p", "Outside 7 am to 10 pm:", { class: "hint" }));
      for (const item of outside) calendarBody.append(blockFor(item, now));
    }
    return;
  }

  if (calView === "week") {
    const { weekdays, weekend } = splitWeek(calAnchor);
    for (const [title, days] of [["Weekdays", weekdays], ["Weekend", weekend]]) {
      calendarBody.append(el("h3", title, { tabindex: "-1" }));
      const row = el("div", undefined, { class: "week-row" });
      for (const day of days) {
        const col = el("div", undefined, { class: "week-col" });
        col.append(el("p", day.toLocaleDateString([], { weekday: "short", day: "numeric" }), { class: "col-head" }));
        const items = itemsOnDay(calendarItems, day);
        if (items.length === 0) col.append(el("p", "Nothing", { class: "hint" }));
        for (const item of items) col.append(blockFor(item, now));
        row.append(col);
      }
      calendarBody.append(row);
    }
    return;
  }

  // Month
  const grid = el("div", undefined, { class: "month-grid", role: "table", "aria-label": "Month" });
  for (const name of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
    grid.append(el("div", name, { class: "month-head", role: "columnheader" }));
  }
  for (const week of monthGrid(calAnchor)) {
    for (const day of week) {
      if (!day) {
        grid.append(el("div", "", { class: "month-cell empty" }));
        continue;
      }
      const cell = el("button", undefined, { type: "button", class: "month-cell" });
      const items = itemsOnDay(calendarItems, day);
      cell.append(el("span", String(day.getDate()), { class: "day-num" }));
      for (const item of items.slice(0, 2)) cell.append(el("span", item.title, { class: "mini" }));
      if (items.length > 2) cell.append(el("span", `+${items.length - 2} more`, { class: "mini" }));
      cell.setAttribute("aria-label", `${day.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}, ${items.length} items`);
      cell.addEventListener("click", () => { calAnchor = day; calView = "day"; renderCalendar(); });
      grid.append(cell);
    }
  }
  calendarBody.append(grid);
}
