import { test, expect } from "@playwright/test";
import { dayFromNow, openForm } from "./helpers/calendar.js";
import { openScreen } from "./helpers/nav.js";

// A class on calendar items (design/calendar-class.md).

async function openCalendar(page) {
  await page.goto("/");
  await openScreen(page, "My calendar");
  await openForm(page);
}

test("an item with a class shows it in the list and keeps it after a reload", async ({ page }) => {
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("Read chapter 5");
  await page.getByLabel("Due date").fill(dayFromNow(3));
  await page.getByLabel("Due time").fill("12:00");
  await page.locator("#cal-class").fill("  History ");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await expect(page.getByText("Added.")).toBeVisible();
  const row = page.locator("li[data-id]", { hasText: "Read chapter 5" });
  await expect(row).toContainText("Class: History");
  await page.reload();
  await openScreen(page, "My calendar");
  await expect(page.locator("li[data-id]", { hasText: "Read chapter 5" })).toContainText("Class: History");
});

test("awkward: no class, spaces only, and tag-like text show plainly", async ({ page }) => {
  await openCalendar(page);
  await page.getByLabel("What is it?").fill("No class one");
  await page.getByLabel("Due date").fill(dayFromNow(3));
  await page.getByLabel("Due time").fill("12:00");
  await page.locator("#cal-class").fill("   ");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  await expect(page.locator("li[data-id]", { hasText: "No class one" })).not.toContainText("Class:");
  await openForm(page);
  await page.getByLabel("What is it?").fill("Tagged");
  await page.getByLabel("Type").selectOption("event");
  await page.getByLabel("From date").fill(dayFromNow(3));
  await page.getByLabel("To date").fill(dayFromNow(4));
  await page.locator("#cal-class").fill("<b>Art</b>");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  const trip = page.locator("li[data-id]", { hasText: "Tagged" });
  await expect(trip).toContainText("Class: <b>Art</b>");
  await expect(trip.locator("b")).toHaveCount(0);
});
