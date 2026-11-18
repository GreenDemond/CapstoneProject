// Which screen is showing (design/review-plan-2026-11-17.md, step 12; moved out of js/app.js).
// This file imports nothing from the screen files, so they can all import it without loops.
const stepsScreen = document.getElementById("steps-screen");

// One place decides which screen is showing. Home is the paste screen, plus the steps preview
// below it when the student has one open.
export const SCREENS = {
  home: document.getElementById("paste-screen"),
  intake: document.getElementById("intake-screen"),
  profile: document.getElementById("profile-screen"),
  work: document.getElementById("work-screen"),
  calendar: document.getElementById("calendar-screen"),
  chat: document.getElementById("chat-screen"),
  settings: document.getElementById("settings-screen"),
};
let currentScreen = "home";
let stepsPreviewOpen = false;
let leaveHomeCallback = null; // set by the home screen: cancels its AI request when the student leaves

export function currentScreenName() {
  return currentScreen;
}

// The home screen registers one function to run whenever the student leaves home.
export function registerOnLeaveHome(callback) {
  leaveHomeCallback = callback;
}

export function setStepsPreviewOpen(open) {
  stepsPreviewOpen = open;
}

export function showScreen(name) {
  currentScreen = name;
  if (name !== "home") {
    leaveHomeCallback?.();
  }
  for (const [id, section] of Object.entries(SCREENS)) {
    section.hidden = id !== name;
  }
  stepsScreen.hidden = !(name === "home" && stepsPreviewOpen);
}

// Shows the steps preview. It appears at once on the home screen, or when the student returns home.
export function openStepsPreview() {
  stepsPreviewOpen = true;
  if (currentScreen === "home") {
    stepsScreen.hidden = false;
    stepsScreen.scrollIntoView({ block: "start" });
    document.getElementById("steps-heading").focus();
  }
}
