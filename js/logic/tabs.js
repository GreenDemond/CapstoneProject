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
