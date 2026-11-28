// What the home screen says on a return visit (design/class-and-return-w11.md). Pure logic: no browser APIs.
// The weekly look-back card is offered at most once a week. Nothing here counts days away or says how long
// the student was gone: the only thing kept is the day the card was last dealt with.

export const WEEK_MS = 7 * 86400000;
export const MAX_THOUGHTS_SHOWN = 3;

export const LOOKBACK_CARD_LINE = "A quick look back at your week";
export const LOOKBACK_OPEN_LABEL = "Take a look";
export const LOOKBACK_LATER_LABEL = "Not now";
export const THOUGHTS_HEADING = "Thoughts you set aside";
export const THOUGHTS_HINT = "You can read or delete these in What I did.";
export const ALL_DONE_LINE = "That's today done.";
export const CLOSE_APP_LINE = "A good time to close the app.";

// A saved date read back from the device: the text if it is a real date that is not in the future, else "".
export function normalizeHandledOn(value, nowMs) {
  if (typeof value !== "string") {
    return "";
  }
  const ms = Date.parse(value);
  return Number.isNaN(ms) || ms > nowMs ? "" : value;
}

// What the card should do now. handledOn is the saved date the card was last dealt with (or anything).
// - No usable date (first visit, damaged, or a date in the future): no card, and the week starts now.
// - Seven days or more since that date: show the card.
// - Otherwise: nothing.
export function lookbackCardState(handledOn, nowMs) {
  const clean = normalizeHandledOn(handledOn, nowMs);
  if (clean === "") {
    return { show: false, startClock: true };
  }
  return { show: nowMs - Date.parse(clean) >= WEEK_MS, startClock: false };
}

// The newest parked thoughts to show on home, as plain text. Anything that is not a usable thought is skipped.
export function thoughtsToShow(parked, max = MAX_THOUGHTS_SHOWN) {
  if (!Array.isArray(parked)) {
    return [];
  }
  return parked
    .filter((item) => item && typeof item.text === "string" && item.text.trim() !== "")
    .slice(0, max)
    .map((item) => ({ id: item.id, text: item.text }));
}
