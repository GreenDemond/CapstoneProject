import { test, expect } from "@playwright/test";
import { dayFromNow, openForm, addItem, deleteWithConfirm } from "./helpers/calendar.js";
import { openScreen } from "./helpers/nav.js";

async function openCalendar(page) {
  await page.goto("/");
  await openScreen(page, "My calendar");
  await openForm(page);
}

// Main path: add an item three days away, and it sits in "Can wait".
test("an item added three days away is sorted into Can wait", async ({ page }) => {
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("Read chapter 5");
  await page.getByLabel("Due date").fill(dayFromNow(3));
  await page.getByLabel("Due time").fill("12:00");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await expect(page.getByText("Added.")).toBeVisible();
  const canWait = page.locator("h3", { hasText: "Can wait" }).locator("xpath=following-sibling::ul[1]");
  await expect(canWait).toContainText("Read chapter 5");
});

// An item due in ten days goes under Later, not a wrong group.
test("an item due in ten days goes under Later", async ({ page }) => {
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("Project proposal");
  await page.getByLabel("Due date").fill(dayFromNow(10));
  await page.getByLabel("Due time").fill("09:00");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  const later = page.locator("h3", { hasText: "Later" }).locator("xpath=following-sibling::ul[1]");
  await expect(later).toContainText("Project proposal");
});

// Awkward path: missing title or date gives a plain message and adds nothing.
test("a missing title or date is explained and nothing is added", async ({ page }) => {
  await openCalendar(page);
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await expect(page.getByText("Write what it is first.")).toBeVisible();
  await page.getByLabel("What is it?").fill("Essay");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await expect(page.getByText("Choose a due date and time.")).toBeVisible();
  await expect(page.getByText("Nothing planned yet.")).toBeVisible();
});

// Saved items come back after a reload, and Delete removes one.
test("items survive a reload and can be deleted", async ({ page }) => {
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("Lab report");
  await page.getByLabel("Due date").fill(dayFromNow(4));
  await page.getByLabel("Due time").fill("10:00");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await page.reload();
  await openScreen(page, "My calendar");
  await expect(page.locator("ul.cal-list").getByText("Lab report")).toBeVisible();
  await deleteWithConfirm(page.locator("ul.cal-list li", { hasText: "Lab report" }));
  await expect(page.locator("ul.cal-list").getByText("Lab report")).toHaveCount(0);
  await expect(page.getByText("Nothing planned yet.")).toBeVisible();
});

// Notes and links: the link opens in a new tab, and a non-https link is refused.
test("notes and https links are saved, and a plain-web link is refused", async ({ page }) => {
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("Reading");
  await page.getByLabel("Due date").fill(dayFromNow(3));
  await page.getByLabel("Due time").fill("12:00");
  await page.getByLabel("Web links, one per line").fill("http://insecure.example.org");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await expect(page.getByText("Links must start with https://")).toBeVisible();

  await page.getByLabel("Web links, one per line").fill("https://example.org/chapter");
  await page.getByLabel("Notes (as much as you want)").fill("Look at the figures on page 4.");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await expect(page.locator("p.item-notes")).toHaveText("Look at the figures on page 4.");
  const link = page.locator("ul.item-links a");
  await expect(link).toHaveAttribute("href", "https://example.org/chapter");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
});

// Completion: an item moves to Completed, the weekly log counts it, and Reopen brings it back.
test("completing an item moves it to Completed and counts in the weekly log", async ({ page }) => {
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("Maths worksheet");
  await page.getByLabel("What part of life is it?").selectOption("school");
  await page.getByLabel("Due date").fill(dayFromNow(3));
  await page.getByLabel("Due time").fill("12:00");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await page.locator("ul.cal-list li", { hasText: "Maths worksheet" }).getByRole("button", { name: "Start" }).click();
  await expect(page.locator("ul.cal-list li", { hasText: "Maths worksheet" }).locator(".tag")).toContainText("In progress");
  await page.waitForTimeout(500); // taps closer than 0.4 s apart are ignored on purpose
  await page.locator("ul.cal-list li", { hasText: "Maths worksheet" }).getByRole("button", { name: "Complete" }).click();
  await expect(page.locator("ul.completed li", { hasText: "Maths worksheet" })).toBeVisible();
  await expect(page.getByText("this week 1")).toBeVisible();
  await page.waitForTimeout(500);
  await page.locator("ul.completed li", { hasText: "Maths worksheet" }).getByRole("button", { name: "Reopen" }).click();
  await expect(page.locator("ul.completed")).toHaveCount(0);
});

// After Complete the pressed button is rebuilt; keyboard focus must land on the item, not on the page body.
test("after Complete, keyboard focus stays inside the calendar", async ({ page }) => {
  await openCalendar(page);
  await addItem(page, { title: "Focus check", days: 3 });
  await page.waitForTimeout(500); // taps closer than 0.4 s apart are ignored on purpose
  await page.locator("ul.cal-list li", { hasText: "Focus check" }).getByRole("button", { name: "Complete" }).click();
  await expect(page.locator("ul.completed li", { hasText: "Focus check" })).toBeVisible();
  await expect(page.locator("#calendar-screen :focus")).toHaveCount(1);
});

// Two different items completed one after another, with no wait between them: both count.
test("a double-click on Complete completes only that item, never the one that slides up", async ({ page }) => {
  await openCalendar(page);
  await addItem(page, { title: "First quick", days: 3 });
  await addItem(page, { title: "Second quick", days: 4 });
  await page.locator("ul.cal-list li", { hasText: "First quick" }).getByRole("button", { name: "Complete" }).dblclick();
  await expect(page.locator("ul.completed li", { hasText: "First quick" })).toBeVisible();
  await expect(page.locator("ul.completed li", { hasText: "Second quick" })).toHaveCount(0);
});

// Completing an item shows "Fire it Up".
test("completing an item shows Fire it Up", async ({ page }) => {
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("Science lab");
  await page.getByLabel("Due date").fill(dayFromNow(3));
  await page.getByLabel("Due time").fill("12:00");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await page.locator("ul.cal-list li", { hasText: "Science lab" }).getByRole("button", { name: "Complete" }).click();
  await expect(page.locator("p.celebrate")).toContainText("Fire it Up");
});

// The running totals survive a reload, and deleting a finished item does not lower them.
test("running totals survive a reload and deleting a finished item", async ({ page }) => {
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("History notes");
  await page.getByLabel("Due date").fill(dayFromNow(3));
  await page.getByLabel("Due time").fill("12:00");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await page.locator("ul.cal-list li", { hasText: "History notes" }).getByRole("button", { name: "Complete" }).click();
  await page.reload();
  await openScreen(page, "My calendar");
  await expect(page.getByText("all time 1")).toBeVisible();
  await deleteWithConfirm(page.locator("ul.completed li", { hasText: "History notes" }));
  await expect(page.getByText("all time 1")).toBeVisible();
});

// Views: the same item shows as a block in Day, in the Weekdays calendar, and in the Month grid.
test("an item shows as a block in Day, Week and Month views", async ({ page }) => {
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("Chemistry lab");
  await page.getByLabel("Due date").fill(dayFromNow(0));
  await page.getByLabel("Due time").fill("10:00");
  await page.getByRole("button", { name: "Add to my calendar" }).click();

  await page.getByRole("button", { name: "Day", exact: true }).click();
  await expect(page.locator(".day-grid .block", { hasText: "Chemistry lab" })).toBeVisible();

  await page.getByRole("button", { name: "Week", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Weekdays" })).toBeVisible();
  await expect(page.locator(".week-col .block", { hasText: "Chemistry lab" })).toHaveCount(1);

  await page.getByRole("button", { name: "Month", exact: true }).click();
  await expect(page.locator(".month-grid .mini", { hasText: "Chemistry lab" })).toBeVisible();
});

// The List view still shows the priority groups.
test("List view brings back the priority groups", async ({ page }) => {
  await openCalendar(page);
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await page.getByRole("button", { name: "List", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Urgent", exact: true })).toBeVisible();
});

// A trip covers several days: it shows on each day in Month, and in its own list.
test("a trip over several days shows on each day and in the trips list", async ({ page }) => {
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("Trip to Lisbon");
  await page.getByLabel("Type").selectOption("event");
  await page.getByLabel("From date").fill(dayFromNow(1));
  await page.getByLabel("To date").fill(dayFromNow(3));
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await expect(page.locator("ul.cal-list").getByText("Trip to Lisbon")).toBeVisible();

  await page.getByRole("button", { name: "Month", exact: true }).click();
  await expect(page.locator(".month-grid .mini", { hasText: "Trip to Lisbon" })).toHaveCount(3);
});

// A trip with an end before its start is refused.
test("a trip that ends before it starts is refused", async ({ page }) => {
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("Camp");
  await page.getByLabel("Type").selectOption("event");
  await page.getByLabel("From date").fill(dayFromNow(5));
  await page.getByLabel("To date").fill(dayFromNow(2));
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await expect(page.getByText("The to date is before the from date.")).toBeVisible();
});

// Print: the Day view builds a page with a tick box per item, then calls the browser's print.
test("the day can be printed with a tick box for each item", async ({ page }) => {
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("Biology reading");
  await page.getByLabel("Due date").fill(dayFromNow(0));
  await page.getByLabel("Due time").fill("11:00");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await page.getByRole("button", { name: "Day", exact: true }).click();
  // Capture the print page at the moment printing starts; the app clears it afterwards.
  await page.evaluate(() => {
    globalThis.print = () => {
      globalThis.printedBoxes = globalThis.document.querySelectorAll("#print-area li input[type=checkbox]").length;
      globalThis.printedText = globalThis.document.getElementById("print-area").textContent;
    };
  });
  await page.getByRole("button", { name: "Print or save as PDF" }).click();
  expect(await page.evaluate(() => globalThis.printedBoxes)).toBe(1);
  expect(await page.evaluate(() => globalThis.printedText)).toContain("Biology reading");
});

// A task that ends on a later day is drawn as one bar across those days in the Week view.
test("a task that ends later shows as one bar across the days in Week view", async ({ page }) => {
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("Science project");
  await page.getByLabel("Due date").fill(dayFromNow(0));
  await page.getByLabel("Ends on (optional").fill(dayFromNow(2));
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await expect(page.locator(".bar-strip .span-bar", { hasText: "Science project" })).toHaveCount(1);
});

// Confetti appears when a task is completed, and is removed by itself.
test("completing a task shows drawn confetti that clears itself", async ({ page }) => {
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("Music practice");
  await page.getByLabel("Due date").fill(dayFromNow(3));
  await page.getByLabel("Due time").fill("12:00");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await page.locator("ul.cal-list li", { hasText: "Music practice" }).getByRole("button", { name: "Complete" }).click();
  await expect(page.locator(".confetti-piece").first()).toBeAttached();
  await expect(page.locator(".confetti-layer")).toHaveCount(0, { timeout: 4000 });
});

// With reduced motion on, no confetti is drawn.
test("no confetti when the device asks for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("Piano");
  await page.getByLabel("Due date").fill(dayFromNow(3));
  await page.getByLabel("Due time").fill("12:00");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await page.locator("ul.cal-list li", { hasText: "Piano" }).getByRole("button", { name: "Complete" }).click();
  await expect(page.locator(".celebrate")).toBeVisible();
  await expect(page.locator(".confetti-piece")).toHaveCount(0);
});

// ---- Fixes from the 2026-11-17 review ----

test("the list comes first and the form opens with Add something", async ({ page }) => {
  await page.goto("/");
  await openScreen(page, "My calendar");
  await expect(page.getByLabel("What is it?")).toHaveCount(0);
  await page.getByRole("button", { name: "Add something" }).click();
  await expect(page.getByLabel("What is it?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to home" })).toHaveCount(2);
  await page.getByRole("button", { name: "Add something" }).click();
  await expect(page.getByLabel("What is it?")).toHaveCount(0);
});

test("after Add the form closes and the new item gets focus", async ({ page }) => {
  await page.goto("/");
  await openScreen(page, "My calendar");
  await addItem(page, { title: "Focus me" });
  await expect(page.getByLabel("What is it?")).toHaveCount(0);
  await expect(page.locator("ul.cal-list li", { hasText: "Focus me" })).toBeFocused();
});

test("what was typed in the form survives a view switch, navigation and a Complete", async ({ page }) => {
  await page.goto("/");
  await openScreen(page, "My calendar");
  await addItem(page, { title: "Existing" });
  await openForm(page);
  await page.getByLabel("What is it?").fill("Half typed");
  await page.getByLabel("Due date").fill(dayFromNow(5));
  await page.getByLabel("Due time").fill("14:30");
  await page.getByLabel("Notes (as much as you want)").fill("some notes");
  await page.getByLabel("What part of life is it?").selectOption("family");
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page.getByRole("button", { name: "List", exact: true }).click();
  await page.locator("ul.cal-list li", { hasText: "Existing" }).getByRole("button", { name: "Complete" }).click();
  await expect(page.getByLabel("What is it?")).toHaveValue("Half typed");
  await expect(page.getByLabel("Due date")).toHaveValue(dayFromNow(5));
  await expect(page.getByLabel("Due time")).toHaveValue("14:30");
  await expect(page.getByLabel("Notes (as much as you want)")).toHaveValue("some notes");
  await expect(page.getByLabel("What part of life is it?")).toHaveValue("family");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await expect(page.locator("ul.cal-list li", { hasText: "Half typed" })).toBeVisible();
  await openForm(page);
  await expect(page.getByLabel("What is it?")).toHaveValue("");
});

test("Delete needs two taps, Keep it cancels, and a double click deletes nothing else", async ({ page }) => {
  await page.goto("/");
  await openScreen(page, "My calendar");
  await addItem(page, { title: "First one", days: 3, time: "09:00" });
  await addItem(page, { title: "Second one", days: 3, time: "10:00" });
  const first = page.locator("ul.cal-list li", { hasText: "First one" });
  await first.getByRole("button", { name: "Delete" }).click();
  await expect(first.getByRole("button", { name: "Yes, delete" })).toBeVisible();
  await first.getByRole("button", { name: "Keep it" }).click();
  await expect(first).toBeVisible();
  await expect(first.getByRole("button", { name: "Delete" })).toBeVisible();
  // A fast double click: the second tap must not confirm anything.
  await first.getByRole("button", { name: "Delete" }).dblclick();
  await expect(page.locator("ul.cal-list li", { hasText: "First one" })).toHaveCount(1);
  await expect(page.locator("ul.cal-list li", { hasText: "Second one" })).toHaveCount(1);
  await page.waitForTimeout(500);
  await first.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page.locator("ul.cal-list li", { hasText: "First one" })).toHaveCount(0);
  await expect(page.locator("ul.cal-list li", { hasText: "Second one" })).toHaveCount(1);
});

test("Fire it Up shows only right after a Complete, not after a later Delete", async ({ page }) => {
  await page.goto("/");
  await openScreen(page, "My calendar");
  await addItem(page, { title: "Done soon" });
  await addItem(page, { title: "Delete me" });
  await page.locator("ul.cal-list li", { hasText: "Done soon" }).getByRole("button", { name: "Complete" }).click();
  await expect(page.locator("p.celebrate")).toBeVisible();
  await page.waitForTimeout(500);
  await deleteWithConfirm(page.locator("ul.cal-list li", { hasText: "Delete me" }));
  await expect(page.locator("ul.cal-list li", { hasText: "Delete me" })).toHaveCount(0);
  await expect(page.locator("p.celebrate")).toHaveCount(0);
});

test("a past item sits under Time has passed, not Urgent", async ({ page }) => {
  await page.goto("/");
  await openScreen(page, "My calendar");
  await addItem(page, { title: "Old task", days: -3 });
  const passed = page.locator("h3", { hasText: "Time has passed" }).locator("xpath=following-sibling::ul[1]");
  await expect(passed).toContainText("Old task");
  const urgent = page.getByRole("heading", { name: "Urgent", exact: true }).locator("xpath=following-sibling::ul[1]");
  await expect(urgent).not.toContainText("Old task");
  await expect(page.getByText("Mark it done or delete it. No rush.")).toBeVisible();
  await expect(page.getByText(/Due time has passed/)).toHaveCount(0);
});

test("zero totals are hidden until something is finished", async ({ page }) => {
  await page.goto("/");
  await openScreen(page, "My calendar");
  await expect(page.getByText("Finished so far")).toHaveCount(0);
  await addItem(page, { title: "Count me" });
  await expect(page.getByText("Finished so far")).toHaveCount(0);
  await page.locator("ul.cal-list li", { hasText: "Count me" }).getByRole("button", { name: "Complete" }).click();
  await expect(page.getByText("all time 1")).toBeVisible();
});

test("Day view hour labels are in order and no security-policy errors appear", async ({ page }) => {
  const problems = [];
  page.on("console", (msg) => {
    if (msg.text().includes("Content Security Policy")) problems.push(msg.text());
  });
  page.on("pageerror", (err) => problems.push(err.message));
  await page.goto("/");
  await openScreen(page, "My calendar");
  await addItem(page, { title: "Timed", days: 0, time: "10:00" });
  await page.getByRole("button", { name: "Day", exact: true }).click();
  const seven = await page.getByText("7:00", { exact: true }).boundingBox();
  const eight = await page.getByText("8:00", { exact: true }).boundingBox();
  expect(eight.y).toBeGreaterThan(seven.y + 5);
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await page.getByRole("button", { name: "Month", exact: true }).click();
  await page.waitForTimeout(300);
  expect(problems).toEqual([]);
});
