import { test, expect } from "@playwright/test";

async function startWork(page, text = "1. Find three sources\n2. Take notes\n3. Write a draft") {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill(text);
  await page.getByRole("button", { name: "Essay" }).click();
  await page.getByRole("button", { name: "Show my steps" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
}

// Main path: Done moves through the steps one at a time, and the count goes up.
test("Done moves to the next step, one at a time", async ({ page }) => {
  await startWork(page);
  await expect(page.locator(".current-step")).toHaveText("Find three sources");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByText("Step 2 of 10")).toBeVisible();
  await expect(page.locator(".current-step")).toHaveText("Take notes");
});

// Drifted splits the step, and counts the same as Done.
test("Drifted splits the step and the smaller part becomes the next step", async ({ page }) => {
  await startWork(page);
  await page.getByRole("button", { name: "Drifted", exact: true }).click();
  await page.getByLabel("The smallest part of this step").fill("Open one source and skim it");
  await page.getByRole("button", { name: "Start this part" }).click();
  await expect(page.getByText("Step 2 of 11")).toBeVisible();
  await expect(page.locator(".current-step")).toHaveText("Open one source and skim it");
});

// Stuck gives one hint at a time, never an answer, and the last hint says it is the last.
test("Stuck gives hints one at a time", async ({ page }) => {
  await startWork(page);
  await page.getByRole("button", { name: "Stuck", exact: true }).click();
  await expect(page.getByText("Re-read the instructions")).toBeVisible();
  await page.getByRole("button", { name: "Another hint" }).click();
  await expect(page.getByText("Write down what you already know")).toBeVisible();
  await expect(page.locator(".current-step")).toHaveText("Find three sources");
});

// Later moves the step to the end, with no credit; Still working shows a gentle line.
test("Later moves the step to the end and Still working stays put", async ({ page }) => {
  await startWork(page);
  await page.getByRole("button", { name: "Still working" }).click();
  await expect(page.getByText("Keep going.")).toBeVisible();
  await page.getByRole("button", { name: "Later" }).click();
  await expect(page.locator(".current-step")).toHaveText("Take notes");
  await expect(page.getByText("Step 1 of 10")).toBeVisible();
});

// Countdown: turned on, shows a time, and turns off cleanly.
test("the countdown can be shown and hidden", async ({ page }) => {
  await startWork(page);
  await page.getByLabel("Show a countdown").check();
  await expect(page.locator(".ring-time")).toHaveText("12:00");
  await page.getByLabel("Show a countdown").uncheck();
  await expect(page.locator(".ring")).toHaveCount(0);
});

// Awkward path: an empty Drifted box keeps the step whole.
test("an empty Drifted box keeps the step whole and changes nothing", async ({ page }) => {
  await startWork(page);
  await page.getByRole("button", { name: "Drifted", exact: true }).click();
  await page.getByLabel("The smallest part of this step").fill("   ");
  await page.getByRole("button", { name: "Start this part" }).click();
  await expect(page.getByText("Step 1 of 10")).toBeVisible();
  await expect(page.locator(".current-step")).toHaveText("Find three sources");
});

// Awkward path: finishing every step shows the done line and a Close button.
test("finishing every step shows the done message", async ({ page }) => {
  await startWork(page, "- Only one step");
  // The screen ignores a second tap for a moment, so wait between taps like a student would.
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(450);
    await page.getByRole("button", { name: "Done", exact: true }).click();
  }
  await expect(page.getByText("All your steps are done.")).toBeVisible();
});

// A double-tap on Done must not skip a step.
test("a quick double-tap on Done only counts once", async ({ page }) => {
  await startWork(page);
  const done = page.getByRole("button", { name: "Done", exact: true });
  await done.click();
  await done.click({ force: true }).catch(() => {});
  await expect(page.getByText("Step 2 of 10")).toBeVisible();
  await expect(page.locator(".current-step")).toHaveText("Take notes");
});

// Typing in the Drifted box is kept while the countdown runs.
test("typing in the Drifted box survives the countdown", async ({ page }) => {
  await startWork(page);
  await page.getByLabel("Show a countdown").check();
  await page.getByRole("button", { name: "Drifted", exact: true }).click();
  await page.getByLabel("The smallest part of this step").fill("Open one source");
  await page.waitForTimeout(1500);
  await expect(page.getByLabel("The smallest part of this step")).toHaveValue("Open one source");
});

// Keyboard: after Done, focus stays on the screen, not back at the top.
test("focus stays on the current step after Done", async ({ page }) => {
  await startWork(page);
  await page.waitForTimeout(450);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator(".current-step")).toBeFocused();
});

// Drifted is rewarded in the same kind of words as Done.
test("Drifted gets a check and the same kind of encouragement as Done", async ({ page }) => {
  await startWork(page);
  await page.getByRole("button", { name: "Drifted", exact: true }).click();
  await page.getByLabel("The smallest part of this step").fill("Open one source");
  await page.getByRole("button", { name: "Start this part" }).click();
  await expect(page.locator("p.reward")).toContainText("That counts too.");
});
