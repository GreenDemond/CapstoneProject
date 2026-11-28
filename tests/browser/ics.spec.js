// W9: put a calendar item on my phone's calendar as a downloaded .ics file (design/ics-w9.md).
// NOTE: written without being run (Chrome aborts on launch in the author's sandbox). Run this first.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dayFromNow, openCalendar, addItem } from "./helpers/calendar.js";
import { openScreen } from "./helpers/nav.js";

async function downloadFor(page, row) {
  const waiting = page.waitForEvent("download");
  await row.getByRole("button", { name: "Add to my phone's calendar" }).click();
  const download = await waiting;
  const text = readFileSync(await download.path(), "utf8");
  return { download, text };
}

test("a timed item downloads a calendar file with its title and time", async ({ page }) => {
  await openCalendar(page);
  await addItem(page, { title: "Read chapter 5", days: 3, time: "15:30" });
  await expect(page.locator("#cal-ics-hint")).toContainText("small file");
  const row = page.locator("li[data-id]", { hasText: "Read chapter 5" });
  const { download, text } = await downloadFor(page, row);
  expect(download.suggestedFilename()).toBe("read-chapter-5.ics");
  expect(text.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
  expect(text).toContain("SUMMARY:Read chapter 5\r\n");
  expect(text).toContain(`DTSTART:${dayFromNow(3).replace(/-/g, "")}T153000\r\n`);
  expect(text).toContain("@focusapp.local\r\n");
  await expect(page.locator("#cal-message")).toContainText("Saved read-chapter-5.ics");
  // The item is still there and unchanged.
  await expect(page.locator("li[data-id]", { hasText: "Read chapter 5" })).toHaveCount(1);
});

test("a trip downloads an all-day range that ends the day after its last day", async ({ page }) => {
  await openCalendar(page);
  await page.getByRole("button", { name: "Add something" }).click();
  await page.getByLabel("What is it?").fill("Trip to Lisbon");
  await page.getByLabel("Type").selectOption("event");
  await page.getByLabel("From date").fill("2030-05-10");
  await page.getByLabel("To date").fill("2030-05-12");
  await page.getByRole("button", { name: "Add to my calendar" }).click();
  const row = page.locator("li[data-id]", { hasText: "Trip to Lisbon" });
  const { text } = await downloadFor(page, row);
  expect(text).toContain("DTSTART;VALUE=DATE:20300510\r\n");
  expect(text).toContain("DTEND;VALUE=DATE:20300513\r\n");
});

test("awkward text is escaped, and the file survives a page refresh", async ({ page }) => {
  await openCalendar(page);
  await addItem(page, { title: "Math; ch 1, 2 <b>x</b>", days: 2 });
  await page.reload();
  await openScreen(page, "My calendar");
  const row = page.locator("li[data-id]", { hasText: "Math" });
  const { text } = await downloadFor(page, row);
  expect(text).toContain("SUMMARY:Math\\; ch 1\\, 2 <b>x</b>\r\n");
});

test("a very long title is folded and nothing is sent over the network", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await openCalendar(page);
  await addItem(page, { title: "é".repeat(120), days: 2 });
  const before = requests.length;
  const row = page.locator("li[data-id]").first();
  const { text } = await downloadFor(page, row);
  for (const line of text.split("\r\n")) {
    expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
  }
  expect(text.replace(/\r\n /g, "")).toContain(`SUMMARY:${"é".repeat(120)}\r\n`);
  const after = requests.slice(before).filter((url) => !url.startsWith("blob:") && !url.startsWith("data:"));
  expect(after).toEqual([]);
});

test("a completed item has no calendar button, and the page works at keyboard only", async ({ page }) => {
  await openCalendar(page);
  await addItem(page, { title: "Done thing", days: 2 });
  const row = page.locator("li[data-id]", { hasText: "Done thing" });
  await row.getByRole("button", { name: "Add to my phone's calendar" }).focus();
  const waiting = page.waitForEvent("download");
  await page.keyboard.press("Enter");
  await waiting;
  await page.locator("li[data-id]", { hasText: "Done thing" }).getByRole("button", { name: "Complete" }).click();
  await expect(page.getByRole("button", { name: "Add to my phone's calendar" })).toHaveCount(0);
});
