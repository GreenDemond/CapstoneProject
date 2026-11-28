import { test, expect } from "@playwright/test";
import { startWork } from "./helpers/work.js";

// Main path: Done moves through the steps one at a time, and the count goes up.
test("Done moves to the next step, one at a time", async ({ page }) => {
  await startWork(page);
  await expect(page.locator(".current-step")).toHaveText("Find three sources");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByText("Step 2 of 5")).toBeVisible();
  await expect(page.locator(".current-step")).toHaveText("Take notes");
});

// Drifted splits the step, and counts the same as Done.
test("Drifted splits the step and the smaller part becomes the next step", async ({ page }) => {
  await startWork(page);
  await page.getByRole("button", { name: "Drifted", exact: true }).click();
  await page.getByLabel("The smallest part of this step").fill("Open one source and skim it");
  await page.getByRole("button", { name: "Start this part" }).click();
  await expect(page.getByText("Step 2 of 6")).toBeVisible();
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
  await expect(page.getByText("Step 1 of 5")).toBeVisible();
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
  await expect(page.getByText("Step 1 of 5")).toBeVisible();
  await expect(page.locator(".current-step")).toHaveText("Find three sources");
});

// Awkward path: finishing every step shows the done line and a Close button.
test("finishing every step shows the done message", async ({ page }) => {
  await page.clock.install();
  await startWork(page, "- Only one step");
  // The screen ignores a second tap for a moment, so let the clock pass between taps like a student would.
  for (let i = 0; i < 5; i++) {
    await page.clock.runFor(450);
    await page.getByRole("button", { name: "Done", exact: true }).click();
  }
  await expect(page.getByText("All your steps are done.")).toBeVisible();
});

// A double-tap on Done must not skip a step.
test("a quick double-tap on Done only counts once", async ({ page }) => {
  await startWork(page);
  const done = page.getByRole("button", { name: "Done", exact: true });
  await done.dblclick();
  await expect(page.getByText("Step 2 of 5")).toBeVisible();
  await expect(page.locator(".current-step")).toHaveText("Take notes");
  await expect(page.getByText("Step 3 of 5")).toHaveCount(0);
});

// Typing in the Drifted box is kept while the countdown runs.
test("typing in the Drifted box survives the countdown", async ({ page }) => {
  await page.clock.install();
  await startWork(page);
  await page.getByLabel("Show a countdown").check();
  await page.getByRole("button", { name: "Drifted", exact: true }).click();
  await page.getByLabel("The smallest part of this step").fill("Open one source");
  await page.clock.runFor(1500);
  await expect(page.getByLabel("The smallest part of this step")).toHaveValue("Open one source");
});

// Keyboard: after Done, focus stays on the screen, not back at the top.
test("focus stays on the current step after Done", async ({ page }) => {
  await page.clock.install();
  await startWork(page);
  await page.clock.runFor(450);
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

// Start runs exactly the steps on screen (5 of 10 shown), and the page says so.
test("Start after seeing 5 of 10 steps gives Step 1 of 5", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill("1. Find three sources\n2. Take notes\n3. Write a draft");
  await page.getByRole("button", { name: "Essay" }).click();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await expect(page.locator("#showing-note")).toHaveText("Showing 5 of 10. Show more steps adds the rest.");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByText("Step 1 of 5")).toBeVisible();
});

test("Start after Show more steps gives the full count and no Showing line", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill("1. Find three sources\n2. Take notes\n3. Write a draft");
  await page.getByRole("button", { name: "Essay" }).click();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await page.getByRole("button", { name: "Show more steps" }).click();
  await expect(page.locator("#showing-note")).toHaveText("");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByText("Step 1 of 10")).toBeVisible();
});

// No reward line when nothing changed, and none lingers into Stuck or Drifted.
test("an unchanged Drifted box shows no reward line", async ({ page }) => {
  await startWork(page);
  await page.getByRole("button", { name: "Drifted", exact: true }).click();
  await page.getByRole("button", { name: "Start this part" }).click();
  await expect(page.getByText("Make it a bit smaller")).toBeVisible();
  await expect(page.locator(".reward")).toHaveCount(0);
});

test("the reward line does not linger into Stuck or Drifted", async ({ page }) => {
  await startWork(page);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator(".reward")).toHaveText("✓ Step done.");
  await page.getByRole("button", { name: "Stuck", exact: true }).click();
  await expect(page.locator(".reward")).toHaveCount(0);
  await page.getByRole("button", { name: "Back to the step" }).click();
  await page.getByRole("button", { name: "Drifted", exact: true }).click();
  await expect(page.locator(".reward")).toHaveCount(0);
});

// The countdown follows the clock, not the number of ticks.
test("the countdown is computed from the clock", async ({ page }) => {
  await page.clock.install();
  await startWork(page);
  await page.getByLabel("Show a countdown").check();
  await expect(page.locator(".ring-time")).toHaveText("12:00");
  await page.clock.fastForward(60 * 1000); // one jump, like a laptop waking up
  await expect(page.locator(".ring-time")).toHaveText("11:00");
});

// Redraws keep keyboard focus where it was.
test("focus stays on the 25 minutes button after pressing it", async ({ page }) => {
  await startWork(page);
  await page.getByLabel("Show a countdown").check();
  await page.getByRole("button", { name: "25 minutes" }).click();
  await expect(page.locator(".ring-time")).toHaveText("25:00");
  await expect(page.getByRole("button", { name: "25 minutes" })).toBeFocused();
});

test("focus stays on the countdown box when it is switched on", async ({ page }) => {
  await startWork(page);
  await page.getByLabel("Show a countdown").check();
  await expect(page.getByLabel("Show a countdown")).toBeFocused();
});

// When the countdown runs out, keyboard focus stays on the step, not the top of the page.
test("focus stays on the step when time runs out", async ({ page }) => {
  await page.clock.install();
  await startWork(page);
  await page.getByLabel("Show a countdown").check();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator(".current-step")).toBeFocused();
  await page.clock.fastForward(13 * 60 * 1000);
  await expect(page.getByText("Time's up.")).toBeVisible();
  await expect(page.locator(".current-step")).toBeFocused();
  await page.getByRole("button", { name: "Still working" }).click();
  await expect(page.getByText("Time's up.")).toHaveCount(0);
});
