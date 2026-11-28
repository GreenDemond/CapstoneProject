// "My calendar": items the student adds with a due time, sorted into groups by how soon they are due,
// plus Day, Week and Month views (design/calendar.md, design/time-blocks.md). Saved only on this device.
import { loadCalendarItems, saveCalendarItems, loadCompletionCounts, saveCompletionCounts } from "../storage.js";
import { GROUPS, CATEGORIES, groupItems, makeItem, makeEvent, isEvent, removeItem, parseDue, setStatus, completedItems, bucketFor } from "../logic/calendar.js";
import { buildIcs } from "../logic/ics.js";
import { addCompletion, removeCompletion, totals } from "../logic/counter.js";
import { addDays, addMonths, splitWeek, monthGrid, itemsOnDay, eventsCovering, blockPlacement, hourLabels, mondayOf } from "../logic/views.js";
import { confetti } from "../confetti.js";
import { el, button } from "../ui/dom.js";
import { showScreen } from "../ui/screens.js";
import { dayKey } from "../ui/helpers.js";

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

const CAL_GUARD_MS = 400; // a quick second tap must not act on the item that moves up under the cursor
let celebrateText = ""; // shown once, for the render right after a confirmed Complete
let calFormOpen = false;
let calDraft = blankDraft();
let confirmDeleteId = null;
let confirmArmedAt = 0;
let lastCalAction = 0;

function blankDraft() {
  return { title: "", kind: "task", day: "", end: "", time: "", notes: "", links: "", category: "other" };
}

// The add form's current values, or null when the form is closed.
function readCalendarDraft() {
  if (!document.getElementById("cal-title")) {
    return null;
  }
  const value = (id) => document.getElementById(id).value;
  return {
    kind: value("cal-kind"),
    title: value("cal-title"),
    day: value("cal-day"),
    end: value("cal-end"),
    time: value("cal-time"),
    notes: value("cal-notes"),
    links: value("cal-links"),
    category: value("cal-category"),
  };
}

function field(label, control) {
  const wrap = el("div", undefined, { class: "field" });
  wrap.append(label, control);
  return wrap;
}

function buildCalendarForm(draft) {
  const form = el("div", undefined, { class: "calendar-form" });
  const titleBox = el("input", undefined, { type: "text", id: "cal-title", maxlength: "200" });
  titleBox.value = draft.title;
  const kindBox = el("select", undefined, { id: "cal-kind" });
  kindBox.append(el("option", "A task, due at a time", { value: "task" }), el("option", "A trip or event, over several days", { value: "event" }));
  kindBox.value = draft.kind;
  const dayBox = el("input", undefined, { type: "date", id: "cal-day" });
  dayBox.value = draft.day;
  const endBox = el("input", undefined, { type: "date", id: "cal-end" });
  endBox.value = draft.end;
  const timeBox = el("input", undefined, { type: "time", id: "cal-time" });
  timeBox.value = draft.time;
  const dayLabel = el("label", "Due date", { for: "cal-day" });
  const endLabel = el("label", "Ends on (optional)", { for: "cal-end" });
  const timeLabel = el("label", "Due time", { for: "cal-time" });
  const timeField = field(timeLabel, timeBox);
  const applyKind = () => {
    const isTrip = kindBox.value === "event";
    dayLabel.textContent = isTrip ? "From date" : "Due date";
    endLabel.textContent = isTrip ? "To date" : "Ends on (optional, for items over several days)";
    timeField.hidden = isTrip;
  };
  applyKind();
  kindBox.addEventListener("change", applyKind);
  const notesBox = el("textarea", undefined, { id: "cal-notes", rows: "8", maxlength: "2000", class: "big-notes" });
  notesBox.value = draft.notes;
  const linksBox = el("textarea", undefined, { id: "cal-links", rows: "3", placeholder: "https://" });
  linksBox.value = draft.links;
  const catBox = el("select", undefined, { id: "cal-category" });
  for (const c of CATEGORIES) {
    catBox.append(el("option", c.label, { value: c.id }));
  }
  catBox.value = draft.category;
  form.append(
    field(el("label", "What is it?", { for: "cal-title" }), titleBox),
    field(el("label", "Type", { for: "cal-kind" }), kindBox),
    field(dayLabel, dayBox),
    field(endLabel, endBox),
    timeField,
    field(el("label", "What part of life is it?", { for: "cal-category" }), catBox),
    field(el("label", "Notes (as much as you want)", { for: "cal-notes" }), notesBox),
    field(el("label", "Web links, one per line (must start with https://)", { for: "cal-links" }), linksBox),
  );
  form.append(button("Add to my calendar", () => addCalendarItem(), "primary"));
  return form;
}

// Buttons for deleting one item: the first tap asks, the second tap deletes.
function deleteButtons(item) {
  const box = el("span", undefined, { class: "delete-box" });
  if (confirmDeleteId === item.id) {
    const yes = button("Yes, delete", () => confirmDelete(item.id), "small");
    yes.dataset.yes = item.id;
    box.append(yes, button("Keep it", () => keepItem(item.id), "small"));
  } else {
    const del = button("Delete", () => askDelete(item.id), "small");
    del.dataset.delete = item.id;
    box.append(del);
  }
  return box;
}

// opts.resetDraft: show a blank form (after Add). opts.focus: a selector to focus afterwards.
function renderCalendar(notice = "", opts = {}) {
  if (!opts.resetDraft) {
    calDraft = readCalendarDraft() ?? calDraft;
  }
  const celebrate = celebrateText;
  celebrateText = "";
  calendarBody.replaceChildren();

  calendarBody.append(button("Back to home", backFromCalendar));

  const addButton = button("Add something", () => {
    calFormOpen = !calFormOpen;
    renderCalendar("", { focus: calFormOpen ? "#cal-title" : "#cal-open" });
  });
  addButton.id = "cal-open";
  addButton.setAttribute("aria-expanded", String(calFormOpen));
  calendarBody.append(addButton);
  if (calFormOpen) {
    calendarBody.append(buildCalendarForm(calDraft));
  }
  calendarBody.append(el("p", notice, { class: "message", role: "status", id: "cal-message", tabindex: "-1" }));

  if (celebrate) {
    const line = el("p", undefined, { class: "celebrate", role: "status" });
    line.append(el("span", "✓ ", { class: "check", "aria-hidden": "true" }), celebrate);
    calendarBody.append(line);
  }
  const count = totals(completionCounts, new Date());
  if (count.all > 0) {
    const log = el("div", undefined, { class: "log", role: "status" });
    log.append(el("p", `Finished so far: today ${count.today} · this week ${count.week} · this month ${count.month} · this year ${count.year} · all time ${count.all}`));
    calendarBody.append(log);
  }

  renderViewBar();
  if (calendarItems.length === 0) {
    calendarBody.append(el("p", "Nothing planned yet. Add something when you're ready.", { class: "hint" }));
  }
  if (calView === "list") {
    renderCalendarList();
  } else {
    renderTimeView();
  }
  calendarBody.append(button("Back to home", backFromCalendar));
  if (opts.focus) {
    calendarBody.querySelector(opts.focus)?.focus();
  }
}

// Saves one item as a small .ics file. It stays on this device until the student opens it in a calendar app.
function downloadIcs(item) {
  const made = buildIcs(item, new Date());
  if (!made.ok) {
    renderCalendar(made.reason, { focus: "#cal-message" });
    return;
  }
  try {
    const blob = new Blob([made.text], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = made.fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    renderCalendar(`Saved ${made.fileName}. Open it from your Downloads and your phone's calendar app will offer to add it.`, { focus: "#cal-message" });
  } catch {
    renderCalendar("That didn't work. Nothing was changed. Try again.", { focus: "#cal-message" });
  }
}

function icsButton(item) {
  const b = button("Add to my phone's calendar", () => downloadIcs(item), "small");
  b.dataset.ics = item.id;
  return b;
}

function renderCalendarList() {
  if (calendarItems.length > 0) {
    calendarBody.append(el("p", "Add to my phone's calendar saves a small file. Open it on your phone and your calendar app adds the item.", { class: "hint", id: "cal-ics-hint" }));
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
      const row = el("li", undefined, { tabindex: "-1", "data-id": item.id });
      row.append(el("span", `${item.title}, ${dueText(item.due)}`), " ");
      row.append(el("span", ` · ${categoryLabel(item.category)} · ${statusLabel(item.status)}`, { class: "tag" }));
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
      const actions = el("div", undefined, { class: "row-actions" });
      actions.append(...statusButtons(item), icsButton(item), deleteButtons(item));
      row.append(actions);
      list.append(row);
    }
    calendarBody.append(list);
  }

  const trips = calendarItems.filter((item) => isEvent(item));
  if (trips.length > 0) {
    calendarBody.append(el("h3", "Trips and events", { tabindex: "-1" }));
    const tripList = el("ul", undefined, { class: "cal-list" });
    for (const trip of trips) {
      const row = el("li", undefined, { tabindex: "-1", "data-id": trip.id });
      row.append(el("span", `${trip.title}, ${trip.start} to ${trip.end}`), " ");
      const actions = el("div", undefined, { class: "row-actions" });
      actions.append(icsButton(trip), deleteButtons(trip));
      row.append(actions);
      tripList.append(row);
    }
    calendarBody.append(tripList);
  }

  const done = completedItems(calendarItems);
  if (done.length > 0) {
    calendarBody.append(el("h3", "Completed", { tabindex: "-1" }));
    const list = el("ul", undefined, { class: "cal-list completed" });
    for (const item of done) {
      const row = el("li", undefined, { tabindex: "-1", "data-id": item.id });
      row.append(el("span", `${item.title}, finished ${item.completedOn}`), " ");
      const actions = el("div", undefined, { class: "row-actions" });
      actions.append(button("Reopen", () => changeStatus(item.id, "open"), "small"), deleteButtons(item));
      row.append(actions);
      list.append(row);
    }
    calendarBody.append(list);
  }
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

// Counts are saved first. If the items then fail to save, the counts are put back, so the
// two never disagree. A reward shows only when both saved.
function changeStatus(id, status) {
  const now = Date.now();
  // Only a repeat tap on the same item is ignored; a quick tap on another item goes through.
  // One guard for every item: after a tap the list redraws and the next item can slide under
  // the pointer, so a quick second tap anywhere is ignored rather than acting on the wrong item.
  if (now - lastCalAction < CAL_GUARD_MS) {
    return;
  }
  const item = calendarItems.find((i) => i.id === id);
  if (!item) {
    return;
  }
  const next = setStatus(calendarItems, id, status, todayIso());
  const nextCounts =
    status === "completed"
      ? addCompletion(completionCounts, todayIso())
      : item.status === "completed"
        ? removeCompletion(completionCounts, item.completedOn)
        : completionCounts;
  const countsChanged = nextCounts !== completionCounts;
  confirmDeleteId = null;
  if (countsChanged && !saveCompletionCounts(nextCounts)) {
    renderCalendar("Couldn't save in this browser.");
    return;
  }
  if (!saveCalendarItems(next)) {
    if (countsChanged) {
      saveCompletionCounts(completionCounts);
    }
    renderCalendar("Couldn't save in this browser.");
    return;
  }
  calendarItems = next;
  completionCounts = nextCounts;
  lastCalAction = now;
  celebrateText = status === "completed" ? "Fire it Up" : "";
  if (status === "completed") confetti();
  renderCalendar();
  // The pressed button was rebuilt, so put focus back on the item's row (or the message if the row moved off screen).
  const row = calendarBody.querySelector(`li[data-id="${id}"]`);
  (row ?? document.getElementById("cal-message"))?.focus();
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
  const draft = readCalendarDraft();
  // A trip, or a task with an "Ends on" date, becomes a spanning item drawn as a bar.
  const spans = draft.kind === "event" || (draft.kind === "task" && draft.end !== "");
  const result = spans
    ? makeEvent({ title: draft.title, start: draft.day, end: draft.end, notes: draft.notes, links: draft.links, category: draft.category }, calendarId())
    : makeItem(draft, calendarId());
  if (!result.ok) {
    renderCalendar(result.reason);
    return;
  }
  const next = [...calendarItems, result.item];
  if (!saveCalendarItems(next)) {
    renderCalendar("Couldn't save in this browser.");
    return;
  }
  calendarItems = next;
  calDraft = blankDraft();
  calFormOpen = false;
  confirmDeleteId = null;
  renderCalendar("Added.", { resetDraft: true });
  (calendarBody.querySelector(`[data-id="${result.item.id}"]`) ?? document.getElementById("cal-message")).focus();
}

// Delete asks first. The Yes button ignores a tap that comes straight after the first one.
function askDelete(id) {
  confirmDeleteId = id;
  confirmArmedAt = Date.now();
  renderCalendar("", { focus: `[data-yes="${id}"]` });
}

function keepItem(id) {
  confirmDeleteId = null;
  renderCalendar("", { focus: `[data-delete="${id}"]` });
}

function confirmDelete(id) {
  if (confirmDeleteId !== id || Date.now() - confirmArmedAt < CAL_GUARD_MS) {
    return;
  }
  confirmDeleteId = null;
  const next = removeItem(calendarItems, id);
  if (!saveCalendarItems(next)) {
    renderCalendar("Couldn't save in this browser.");
    return;
  }
  calendarItems = next;
  renderCalendar();
  calendarScreen.querySelector("h2").focus();
}

function openCalendarScreen() {
  showScreen("calendar");
  confirmDeleteId = null;
  celebrateText = "";
  renderCalendar();
  calendarScreen.querySelector("h2").focus();
}

function backFromCalendar() {
  showScreen("home");
  openCalendar.focus();
}

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
    const b = button(view.label, () => { calView = view.id; confirmDeleteId = null; renderCalendar(); }, "kind");
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
  const due = parseDue(item.due.slice(0, 10), item.due.slice(11, 16));
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
    const grid = el("div", undefined, { class: "day-grid", role: "group", "aria-label": "Day timeline" });
    for (const hour of hourLabels()) {
      const label = el("div", `${hour}:00`, { class: "hour" });
      label.style.top = `${((hour - 7) / 15) * 100}%`; // set here: the page's security rules block a style attribute
      grid.append(label);
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
    calendarBody.append(button("Print or save as PDF", () => printDay(), "small"));
    if (outside.length) {
      calendarBody.append(el("p", "Outside 7 am to 10 pm:", { class: "hint" }));
      for (const item of outside) calendarBody.append(blockFor(item, now));
    }
    return;
  }

  if (calView === "week") {
    const { weekdays, weekend } = splitWeek(calAnchor);
    const weekDaysAll = [...weekdays, ...weekend];
    const strip = el("div", undefined, { class: "bar-strip", role: "group", "aria-label": "Spanning items" });
    for (const bar of spanBarsFor(weekDaysAll)) strip.append(bar);
    if (strip.childElementCount > 0) calendarBody.append(strip);
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
  const grid = el("div", undefined, { class: "month-grid", role: "group", "aria-label": "Month" });
  for (const name of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
    grid.append(el("div", name, { class: "month-head" }));
  }
  for (const week of monthGrid(calAnchor)) {
    const real = week.filter(Boolean);
    if (real.length > 0) {
      const strip = el("div", undefined, { class: "bar-strip month-bars" });
      for (const bar of spanBarsFor(week.map((d) => d ?? real[0]))) strip.append(bar);
      if (strip.childElementCount > 0) grid.append(strip);
    }
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

// Print or save the day as a PDF, with a tick box for each item (design/calendar.md).
// Uses the browser's own print window. Nothing is uploaded.
function printDay() {
  const area = document.getElementById("print-area");
  area.replaceChildren();
  const heading = el("h1", calAnchor.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  area.append(heading);
  for (const trip of eventsCovering(calendarItems, calAnchor)) {
    area.append(el("p", `Trip or event: ${trip.title} (${trip.start} to ${trip.end})`));
  }
  const items = itemsOnDay(calendarItems, calAnchor).filter((i) => !isEvent(i));
  if (items.length === 0) {
    area.append(el("p", "Nothing planned for this day."));
  }
  const list = el("ul", undefined, { class: "print-list" });
  for (const item of items) {
    const row = el("li");
    const box = el("input", undefined, { type: "checkbox", "aria-label": `Done: ${item.title}` });
    row.append(box, " ", el("span", `${item.due.slice(11, 16)}  ${item.title}`));
    if (item.notes) {
      row.append(el("p", item.notes, { class: "print-notes" }));
    }
    list.append(row);
  }
  area.append(list);
  area.hidden = false;
  window.print();
  area.hidden = true;
  area.replaceChildren();
}

// Bars for spanning items across a row of seven days (Monday first).
// Each bar sits in a grid strip, from its first day to its last day within the row.
function spanBarsFor(days) {
  const first = dayKey(days[0]);
  const last = dayKey(days[days.length - 1]);
  const bars = [];
  const lanes = []; // each lane is a list of [from, to] column ranges already used
  for (const item of calendarItems.filter(isEvent)) {
    if (item.end < first || item.start > last) continue;
    const startIndex = Math.max(0, days.findIndex((d) => dayKey(d) >= item.start));
    let endIndex = days.length - 1;
    for (let i = days.length - 1; i >= 0; i--) {
      if (dayKey(days[i]) <= item.end) { endIndex = i; break; }
    }
    // Stack overlapping bars vertically: take the first lane with no clash.
    let lane = lanes.findIndex((used) => used.every(([a, b]) => endIndex < a || startIndex > b));
    if (lane === -1) {
      lanes.push([]);
      lane = lanes.length - 1;
    }
    lanes[lane].push([startIndex, endIndex]);
    const bar = el("button", undefined, { type: "button", class: "span-bar", "data-group": "event" });
    bar.style.gridColumn = `${startIndex + 1} / ${endIndex + 2}`;
    bar.style.gridRow = String(lane + 1);
    bar.textContent = `${item.title} (to ${item.end})`;
    bar.addEventListener("click", () => { calAnchor = new Date(item.start + "T12:00"); calView = "day"; renderCalendar(); });
    bars.push(bar);
  }
  return bars;
}

export function initCalendar() {
  openCalendar.addEventListener("click", openCalendarScreen);
}
