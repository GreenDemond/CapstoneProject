// Bottom tabs and the first-visit welcome note (design/tabs-w3.md). Everything here only presses the
// buttons and calls the functions that already exist; no screen is changed. Text is set with textContent.
import { TABS, tabForScreen, tabBarVisible, screenForTab, chooseBack, WELCOME_LINE, WELCOME_HIDE } from "../logic/tabs.js";
import { loadWelcomeSeen, saveWelcomeSeen } from "../storage.js";
import { SCREENS, currentScreenName, registerOnScreenChange } from "../ui/screens.js";

const OPEN_BUTTON = { chat: "open-chat", calendar: "open-calendar", me: "open-me" };

function tabButtons() {
  return Array.from(document.querySelectorAll("#tabbar [role=tab]"));
}

function paint(screenName) {
  const bar = document.getElementById("tabbar");
  const visible = tabBarVisible(screenName);
  bar.hidden = !visible;
  document.body.classList.toggle("has-tabs", visible);
  const selected = tabForScreen(screenName);
  for (const tab of tabButtons()) {
    tab.setAttribute("aria-selected", tab.dataset.tab === selected ? "true" : "false");
  }
}

// Leaves the screen the student is on by pressing that screen's own Back button, so its own checks run
// (for example the profile's unsaved-changes warning). Inside a sub-view (for example What the app remembers)
// "Back..." steps out one level at a time until a "Back to home" is there. Stops if "Back to home" leaves
// the screen where it is (the screen is asking something first), or after a few steps.
function backToHome() {
  for (let tries = 0; tries < 8; tries += 1) {
    const name = currentScreenName();
    if (name === "home") return true;
    const section = SCREENS[name];
    if (!section) return false;
    const visible = Array.from(section.querySelectorAll("button")).filter((b) => !b.closest("[hidden]"));
    const choice = chooseBack(visible.map((b) => ({ text: b.textContent })));
    if (!choice) return false;
    visible[choice.index].click();
    if (choice.home && currentScreenName() === name) return false;
  }
  return currentScreenName() === "home";
}

function pressTab(tabId) {
  const target = screenForTab(tabId);
  if (!target || currentScreenName() === target) return;
  if (!backToHome()) return;
  const buttonId = OPEN_BUTTON[target];
  if (buttonId) document.getElementById(buttonId).click();
}

function moveFocus(from, step) {
  const tabs = tabButtons();
  const index = tabs.indexOf(from);
  if (index < 0) return;
  tabs[(index + step + tabs.length) % tabs.length].focus();
}

function buildBar() {
  const bar = document.getElementById("tabbar");
  for (const tab of TABS) {
    const node = document.createElement("button");
    node.type = "button";
    node.setAttribute("role", "tab");
    node.setAttribute("aria-selected", "false");
    node.dataset.tab = tab.id;
    node.id = "tab-" + tab.id;
    node.textContent = tab.label;
    node.addEventListener("click", () => pressTab(tab.id));
    node.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveFocus(node, 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveFocus(node, -1);
      }
    });
    bar.append(node);
  }
}

// A calm one-line note at the end of the home screen, on the first visit only. Never a page or a popup.
function initWelcome() {
  const note = document.getElementById("welcome-note");
  if (loadWelcomeSeen()) return;
  document.getElementById("welcome-line").textContent = WELCOME_LINE;
  const hide = document.getElementById("welcome-hide");
  hide.textContent = WELCOME_HIDE;
  hide.addEventListener("click", () => {
    saveWelcomeSeen();
    note.hidden = true;
  });
  note.hidden = false;
}

export function initTabs() {
  buildBar();
  registerOnScreenChange(paint);
  paint(currentScreenName());
  initWelcome();
}
