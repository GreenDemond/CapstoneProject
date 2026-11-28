// "What I did" and "What the app remembers" (design/looking-back-w6.md). One screen, two views.
// It only reads what the student saved and lets them delete it. Student text goes on screen as text.
import { doingLines, weeklyLines, helpLine, shortDate, removeById, plural } from "../logic/looking-back.js";
import { removeItem } from "../logic/work-extras.js";
import {
  loadMoments, saveMoments, loadHelps, saveHelps, loadParked, saveParked, loadRecall, saveRecall, deleteRemembered,
} from "../storage.js";
import { profileNotes, deleteProfileNote } from "./profile.js";
import { el, button, announce } from "../ui/dom.js";
import { showScreen } from "../ui/screens.js";

const body = document.getElementById("looking-body");
const heading = document.getElementById("looking-heading");
const openButton = document.getElementById("open-looking");

let view = "overview"; // "overview" or "remembers"
let confirmAll = false;
let statusText = "";

function readAll() {
  return { moments: loadMoments(), helps: loadHelps(), parked: loadParked(), recall: loadRecall() };
}

function lineList(lines) {
  const list = el("ul", undefined, { class: "looking-list" });
  for (const line of lines) list.append(el("li", line));
  return list;
}

function renderOverview() {
  heading.textContent = "What I did";
  const data = readAll();
  const nowMs = Date.now();
  body.append(button("Back to home", leave));

  body.append(el("h3", "The last 30 days"));
  const lines = doingLines(data, nowMs, 30);
  if (lines.length === 0) {
    body.append(el("p", "Nothing yet. After you work on a step, you'll see it here.", { class: "hint" }));
  } else {
    body.append(lineList(lines));
  }

  body.append(el("h3", "Your week"));
  body.append(lineList(weeklyLines(data, nowMs)));
  body.append(el("p", "This is only what you did. It is not a grade, and days away are not counted.", { class: "hint" }));

  body.append(button("What the app remembers", () => show("remembers")));
}

// A group of saved lines. Each line has its own Delete.
function group(title, items, makeText, onDelete) {
  if (items.length === 0) {
    return;
  }
  body.append(el("h4", title));
  const list = el("ul", undefined, { class: "looking-list" });
  for (const item of items) {
    const li = el("li");
    li.append(el("span", makeText(item)), " ");
    const text = makeText(item);
    const remove = button("Delete", () => onDelete(item), "small");
    remove.setAttribute("aria-label", `Delete: ${text.length > 40 ? `${text.slice(0, 40)}...` : text}`);
    li.append(remove);
    list.append(li);
  }
  body.append(list);
}

function withDate(text, iso) {
  const day = shortDate(iso);
  return day ? `${text} (${day})` : text;
}

// Saves a smaller list and redraws. If the browser did not confirm, the line stays and says so.
function afterDelete(saved) {
  statusText = saved ? "Deleted." : "That didn't delete. Try again.";
  renderRemembers();
  focusIntro();
}

function renderRemembers() {
  body.replaceChildren();
  heading.textContent = "What the app remembers";
  const data = readAll();
  const notes = profileNotes();
  body.append(button("Back to What I did", () => show("overview")));
  const intro = el("p", "This is everything the app has saved about you, on this device only. Delete anything you like.", { class: "hint", id: "remembers-intro", tabindex: "-1" });
  body.append(intro);
  const status = el("p", undefined, { class: "message", role: "status", id: "looking-status" });
  body.append(status);
  announce(status, statusText);

  const empty = data.parked.length + data.recall.length + data.helps.length + data.moments.length + notes.length === 0;
  if (empty) {
    body.append(el("p", "Nothing yet. As you use the app, the things you save will show up here.", { class: "hint" }));
  }

  group("Thoughts I parked", data.parked, (p) => withDate(p.text, p.date), (p) => afterDelete(saveParked(removeItem(data.parked, p.id))));
  group("What I wrote after reading or studying", data.recall, (r) => withDate(r.answer, r.date), (r) => afterDelete(saveRecall(removeItem(data.recall, r.id))));
  group("Did that help?", data.helps, (h) => withDate(helpLine(h), h.date), (h) => afterDelete(saveHelps(removeById(data.helps, h.id))));
  group("Notes from My profile", notes, (n) => n.text, (n) => afterDelete(deleteProfileNote(n.id)));

  if (data.moments.length > 0) {
    body.append(el("h4", "Steps I finished"));
    const li = el("li");
    const text = `${plural(data.moments.length, "finished step", "finished steps")} kept as a count`;
    li.append(el("span", text), " ");
    const remove = button("Delete", () => afterDelete(saveMoments([])), "small");
    remove.setAttribute("aria-label", "Delete: the count of steps I finished");
    li.append(remove);
    const list = el("ul", undefined, { class: "looking-list" });
    list.append(li);
    body.append(list);
  }

  if (!empty) {
    body.append(el("p", "My goals are kept in My profile, where you can change or clear them.", { class: "hint" }));
    if (confirmAll) {
      body.append(el("p", "Delete all of this? It can't be undone."));
      body.append(button("Yes, delete it all", deleteEverything));
      body.append(button("No, keep it", () => { confirmAll = false; renderRemembers(); focusIntro(); }));
    } else {
      body.append(button("Delete all of this", () => { confirmAll = true; statusText = ""; renderRemembers(); }));
    }
  }
  body.append(button("Back to What I did", () => show("overview")));
}

function focusIntro() {
  document.getElementById("remembers-intro")?.focus();
}

function deleteEverything() {
  const savedLists = deleteRemembered();
  let savedNotes = true;
  for (const note of profileNotes()) {
    savedNotes = deleteProfileNote(note.id) && savedNotes;
  }
  confirmAll = false;
  statusText = savedLists && savedNotes ? "Everything is deleted." : "Some of it didn't delete. Try again.";
  renderRemembers();
  focusIntro();
}

function show(next) {
  view = next;
  confirmAll = false;
  statusText = "";
  render();
  heading.focus();
}

function render() {
  body.replaceChildren();
  if (view === "remembers") {
    renderRemembers();
  } else {
    renderOverview();
  }
}

function leave() {
  showScreen("home");
  openButton.focus();
}

function openLooking() {
  view = "overview";
  confirmAll = false;
  statusText = "";
  showScreen("looking");
  render();
  heading.focus();
}

export function initLooking() {
  openButton.addEventListener("click", openLooking);
}
