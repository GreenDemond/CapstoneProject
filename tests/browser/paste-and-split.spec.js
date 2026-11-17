import { test, expect } from "@playwright/test";

const ASSIGNMENT = [
  "Your task:",
  "1. Find three sources",
  "2) Take notes on each one",
  "- Write a draft",
  "Due Friday.",
].join("\n");

// Main path: paste, pick a kind, see the steps, ask for more, press Start.
test("paste, pick a kind, see starter steps, show more, and press Start", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill(ASSIGNMENT);
  await page.getByRole("button", { name: "Essay" }).click();
  await expect(page.getByRole("button", { name: "Essay" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Show my steps" }).click();

  const steps = page.locator("#steps li");
  await expect(steps).toHaveCount(5);
  await expect(steps.nth(0)).toHaveText("Find three sources");
  await expect(steps.nth(1)).toHaveText("Take notes on each one");
  await expect(steps.nth(2)).toHaveText("Write a draft");

  await page.getByRole("button", { name: "Show more steps" }).click();
  // Three items from the paste plus seven essay starter steps.
  await expect(steps).toHaveCount(10);
  await expect(page.getByRole("button", { name: "Show more steps" })).toBeHidden();

  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByRole("heading", { name: "Work" })).toBeVisible();
  await expect(page.getByText("Step 1 of 10")).toBeVisible();
  await expect(page.locator(".current-step")).toHaveText("Find three sources");
});

// Awkward path 1: nothing pasted. A gentle message, no steps, no red text.
test("pressing Show my steps with nothing pasted asks for text", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Essay" }).click();
  await page.getByRole("button", { name: "Show my steps" }).click();
  await expect(page.getByText("Paste something to start.")).toBeVisible();
  await expect(page.locator("#steps-screen")).toBeHidden();
});

// Awkward path 2: text pasted but no kind picked.
test("pasting without picking a kind asks the student to pick one", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill("Read chapter 4.");
  await page.getByRole("button", { name: "Show my steps" }).click();
  await expect(page.getByText("Tap the kind of work it is")).toBeVisible();
  await expect(page.locator("#steps-screen")).toBeHidden();
});

// Awkward path 3: text that looks like HTML is shown as plain text, never run.
test("pasted HTML is shown as text and does not run", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill('- <img src=x onerror="window.hacked = true"> <b>bold</b>');
  await page.getByRole("button", { name: "Reading" }).click();
  await page.getByRole("button", { name: "Show my steps" }).click();
  await expect(page.locator("#steps li").first()).toHaveText('<img src=x onerror="window.hacked = true"> <b>bold</b>');
  expect(await page.evaluate(() => globalThis.hacked)).toBeUndefined();
});

// Awkward path 4: a very long paste is cut, and the student is told.
test("a paste over 6,000 characters is cut and the student is told", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill("Read this. ".repeat(600));
  await page.getByRole("button", { name: "Problem set" }).click();
  await page.getByRole("button", { name: "Show my steps" }).click();
  await expect(page.getByText("The first 6,000 characters are kept.")).toBeVisible();
  await expect(page.locator("#steps li")).toHaveCount(5);
});
