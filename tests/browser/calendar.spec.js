import { test, expect } from "@playwright/test";

function dayFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function openCalendar(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "My calendar" }).click();
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
  await page.getByRole("button", { name: "My calendar" }).click();
  await expect(page.locator("ul.cal-list").getByText("Lab report")).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).first().click();
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
  await expect(page.getByText("Finished so far: today 0")).toBeVisible();
  await page.getByLabel("What is it?").fill("Maths worksheet");
  await page.getByLabel("What part of life is it?").selectOption("school");
  await page.getByLabel("Due date").fill(dayFromNow(3));
  await page.getByLabel("Due time").fill("12:00");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await page.locator("ul.cal-list li", { hasText: "Maths worksheet" }).getByRole("button", { name: "Start" }).click();
  await expect(page.locator("ul.cal-list li", { hasText: "Maths worksheet" }).locator(".tag")).toContainText("In progress");
  await page.locator("ul.cal-list li", { hasText: "Maths worksheet" }).getByRole("button", { name: "Complete" }).click();
  await expect(page.locator("ul.completed li", { hasText: "Maths worksheet" })).toBeVisible();
  await expect(page.getByText("this week 1")).toBeVisible();
  await page.locator("ul.completed li", { hasText: "Maths worksheet" }).getByRole("button", { name: "Reopen" }).click();
  await expect(page.locator("ul.completed")).toHaveCount(0);
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
  await page.getByRole("button", { name: "My calendar" }).click();
  await expect(page.getByText("all time 1")).toBeVisible();
  await page.locator("ul.completed li", { hasText: "History notes" }).getByRole("button", { name: "Delete" }).click();
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
