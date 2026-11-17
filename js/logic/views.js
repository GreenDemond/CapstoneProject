// Calendar layout: which items fall on which day, and where each block sits on a
// time grid (design/time-blocks.md). Read-only: nothing here moves an item.
import { parseDue } from "./calendar.js";

export const GRID_START_HOUR = 7;
export const GRID_END_HOUR = 22;
export const DEFAULT_LENGTH_MINUTES = 30;

function pad(n) {
  return String(n).padStart(2, "0");
}

export function dayKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

export function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

// Monday of the week containing `date`.
export function mondayOf(date) {
  return addDays(date, -((date.getDay() + 6) % 7));
}

// Monday to Sunday, seven dates.
export function weekDates(date) {
  const monday = mondayOf(date);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// Weekday calendar (Mon to Fri) and weekend calendar (Sat and Sun) for the week.
export function splitWeek(date) {
  const days = weekDates(date);
  return { weekdays: days.slice(0, 5), weekend: days.slice(5) };
}

// Weeks for a month grid, starting Monday. Null marks days outside the month.
export function monthGrid(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(new Date(date.getFullYear(), date.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// Items on one day, in time order. A task appears on the day it is due. An event
// appears on every day from its start to its end, so a trip shows on each day.
export function itemsOnDay(items, date) {
  const key = dayKey(date);
  return items
    .filter((item) => {
      if (item.kind === "event") return item.start <= key && key <= item.end;
      return item.due.slice(0, 10) === key;
    })
    .sort((a, b) => (a.kind === "event" ? "" : (a.due ?? "")).localeCompare(b.kind === "event" ? "" : (b.due ?? "")));
}

// Events that cover the day (for the band above the day grid).
export function eventsCovering(items, date) {
  const key = dayKey(date);
  return items.filter((item) => item.kind === "event" && item.start <= key && key <= item.end);
}

// Where a block sits on the grid, as percentages of the grid height.
// Returns null if the block starts outside the grid hours.
export function blockPlacement(item, lengthMinutes = DEFAULT_LENGTH_MINUTES) {
  const due = parseDue(item.due.slice(0, 10), item.due.slice(11, 16));
  if (!due) return null;
  const startMinutes = due.getHours() * 60 + due.getMinutes();
  const gridStart = GRID_START_HOUR * 60;
  const gridLength = (GRID_END_HOUR - GRID_START_HOUR) * 60;
  if (startMinutes < gridStart || startMinutes >= gridStart + gridLength) return null;
  const top = ((startMinutes - gridStart) / gridLength) * 100;
  const height = Math.min(lengthMinutes, gridStart + gridLength - startMinutes) / gridLength * 100;
  return { top, height };
}

export function hourLabels() {
  return Array.from({ length: GRID_END_HOUR - GRID_START_HOUR + 1 }, (_, i) => GRID_START_HOUR + i);
}
