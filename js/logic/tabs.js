// The four tabs (design/tabs-w3.md). Pure: which tab a screen belongs to, and whether the bar shows.
export const TABS = [
  { id: "today", label: "Today", screen: "home" },
  { id: "talk", label: "Talk", screen: "chat" },
  { id: "plan", label: "Plan", screen: "calendar" },
  { id: "me", label: "Me", screen: "me" },
];

// Screens reached from the Me screen count as Me.
const UNDER_ME = ["me", "profile", "intake", "looking", "lookup", "settings"];

// The tab id that is selected for a screen, or null (for example on the work screen).
export function tabForScreen(screenName) {
  if (typeof screenName !== "string") return null;
  const found = TABS.find((tab) => tab.screen === screenName);
  if (found) return found.id;
  return UNDER_ME.includes(screenName) ? "me" : null;
}

// The bar is hidden on the work screen so one step is the only thing on screen. Anything unknown shows it.
export function tabBarVisible(screenName) {
  return screenName !== "work";
}

// The screen a tab opens.
export function screenForTab(tabId) {
  const found = TABS.find((tab) => tab.id === tabId);
  return found ? found.screen : null;
}

export const WELCOME_LINE = "Welcome. Paste an assignment above to begin, or use the tabs at the bottom.";
export const WELCOME_HIDE = "Hide this note";

// Which button leaves the screen the student is on. `buttons` is the visible buttons of that screen, as
// [{ text }]. The one called "Back to home" wins; inside a sub-view the first button starting with "Back"
// steps out one level. Returns { index, home } or null when there is nothing to press.
export function chooseBack(buttons) {
  if (!Array.isArray(buttons)) return null;
  const texts = buttons.map((b) => (b && typeof b.text === "string" ? b.text.trim() : ""));
  const home = texts.indexOf("Back to home");
  if (home >= 0) return { index: home, home: true };
  const back = texts.findIndex((t) => t === "Back" || t.startsWith("Back "));
  return back >= 0 ? { index: back, home: false } : null;
}
