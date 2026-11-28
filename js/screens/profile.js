// "My profile": goals and "What got in the way?" notes, saved on this device only (design/profile.md).
// Nothing is shared, and nothing is judged.
import { GOAL_KEYS, MAX_TEXT, emptyProfile, setGoals, addNote, deleteNote, notesNewestFirst } from "../logic/profile.js";
import { loadProfileState, saveProfile } from "../storage.js";
import { el, button, labelled, announce } from "../ui/dom.js";
import { showScreen } from "../ui/screens.js";
import { dayKey } from "../ui/helpers.js";

const profileBody = document.getElementById("profile-body");
const openProfile = document.getElementById("open-profile");

const loaded = loadProfileState();
let profile = loaded.profile;
let loadStatus = loaded.status; // the start-up notice stops once a save works
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
  return dayKey(new Date()); // the local date, not UTC
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
function renderProfile(draft = { goals: profile.goals, noteDraft: "" }) {
  profileBody.replaceChildren();
  profileBody.append(button("Back to home", backFromProfile));

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
  noteBox.addEventListener("input", markDirty); // a note typed alone must not be lost on Back
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
  const profileStatus = el("p", undefined, { class: "message", role: "status", id: "profile-status" });
  profileBody.append(profileStatus);
  announce(profileStatus, saveMessage || (dirty ? "Not saved yet." : ""));

  if (clearAsked) {
    profileBody.append(el("p", "Clear everything in my profile? This can't be undone."));
    profileBody.append(button("Yes, clear everything", clearEverything));
    profileBody.append(button("Cancel", () => { clearAsked = false; renderProfile(typedValues()); }));
  } else {
    profileBody.append(button("Clear my profile", () => { clearAsked = true; renderProfile(typedValues()); }));
  }
  profileBody.append(button("Back to home", backFromProfile));
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
  // A note still in the box is not part of the save: say so, and keep warning on Back.
  const noteWaiting = noteDraft.trim() !== "";
  dirty = !saved || noteWaiting;
  if (saved) loadStatus = "ok";
  saveMessage = !saved
    ? "Couldn't save in this browser."
    : noteWaiting
      ? "Goals saved. Your note isn't added yet. Press Add note to keep it."
      : "Saved on this device.";
  renderProfile({ goals: profile.goals, noteDraft });
}

function clearEverything() {
  profile = emptyProfile();
  clearAsked = false;
  const saved = saveProfile(profile);
  dirty = false;
  if (saved) loadStatus = "ok";
  saveMessage = saved ? "Your profile is cleared." : "Couldn't save in this browser.";
  renderProfile();
}

function openProfileScreen() {
  showScreen("profile");
  saveMessage = "";
  leaveWarned = false;
  clearAsked = false;
  renderProfile();
  document.getElementById("profile-heading").focus();
}

function backFromProfile() {
  if (dirty && !leaveWarned) {
    leaveWarned = true;
    renderProfile(typedValues());
    const status = document.getElementById("profile-status");
    if (status) announce(status, "You have changes that aren't saved. Press Save first, or press Back to home again to leave.");
    return;
  }
  showScreen("home");
  openProfile.focus();
}
export function initProfile() {
  openProfile.addEventListener("click", openProfileScreen);
}

// For What the app remembers (design/looking-back-w6.md): the notes, and a delete that saves at once.
export function profileNotes() {
  return notesNewestFirst(profile);
}

// Returns true only if the browser confirmed the save. On failure the note stays.
export function deleteProfileNote(id) {
  const before = profile;
  profile = deleteNote(profile, id);
  if (saveProfile(profile)) {
    return true;
  }
  profile = before;
  return false;
}
