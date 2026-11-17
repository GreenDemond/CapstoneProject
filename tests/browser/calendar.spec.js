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
