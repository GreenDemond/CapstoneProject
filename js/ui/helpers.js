// Small helpers shared by more than one screen (design/review-plan-2026-11-17.md, step 12).
import { hostOf } from "../logic/ai-services.js";

// The helper's name, with its host when that is different, so it is clear where the text goes.
export function where(helper) {
  const host = hostOf(helper.url);
  return host === helper.label ? host : `${helper.label} (${host})`;
}

// The local date as YYYY-MM-DD, not UTC.
export function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
