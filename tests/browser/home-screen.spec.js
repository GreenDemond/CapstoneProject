import { test, expect } from "@playwright/test";
import { startWork } from "./helpers/work.js";
import { openScreen } from "./helpers/nav.js";

// Main path: do one step, refresh, and the app opens on the next step.
test("after a refresh the app opens on the next step and Start this step continues", async ({ page }) => {
  await startWork(page);
  await expect(page.getByText("Your steps are saved on this device.")).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.reload();
  await expect(page.getByText("Pick up where you left off.")).toBeVisible();
  await expect(page.locator("#pickup-step")).toHaveText("Take notes");
  await expect(page.getByRole("heading", { name: "What's the assignment?" })).toBeHidden();
  await page.getByRole("button", { name: "Start this step" }).click();
  await expect(page.getByText("Step 2 of 5")).toBeVisible();
  await expect(page.locator(".current-step")).toHaveText("Take notes");
});

// Back to home keeps the steps, and the list stays hidden until asked for.
test("Back to home keeps the steps and the list is hidden until asked for", async ({ page }) => {
  await startWork(page);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Back to home" }).click();
  await expect(page.locator("#pickup-step")).toHaveText("Take notes");
  await expect(page.locator("#pickup-list")).toBeHidden();
  await page.getByRole("button", { name: "Show all my steps" }).click();
  await expect(page.locator("#pickup-list li").first()).toHaveText("✓ Find three sources");
  await expect(page.locator("#pickup-list li").nth(1)).toHaveText("Take notes (next)");
  await page.getByRole("button", { name: "Hide my steps" }).click();
  await expect(page.locator("#pickup-list")).toBeHidden();
});

// Rule 6: Done, Drifted, and the other buttons look the same.
test("the five answer buttons share one look", async ({ page }) => {
  await startWork(page);
  const looks = [];
  for (const name of ["Done", "Still working", "Stuck", "Drifted", "Later"]) {
    looks.push(
      await page.getByRole("button", { name, exact: true }).evaluate((node) => {
        const css = node.ownerDocument.defaultView.getComputedStyle(node);
        return JSON.stringify([css.backgroundColor, css.color, css.border, node.getBoundingClientRect().height]);
      }),
    );
  }
  expect(new Set(looks).size).toBe(1);
});

// The step list is on the work screen too, but hidden at first.
test("the work screen has a Show all my steps list that starts hidden", async ({ page }) => {
  await startWork(page);
  await expect(page.locator("#work-body .steps li")).toHaveCount(0);
  await page.getByRole("button", { name: "Show all my steps" }).click();
  await expect(page.locator("#work-body .steps li").first()).toHaveText("Find three sources (next)");
  await page.getByRole("button", { name: "Hide my steps" }).click();
  await expect(page.locator("#work-body .steps li")).toHaveCount(0);
});

// Awkward path: a week away gets a warm line with no count of days.
test("after days away the line is welcome back, with no day count", async ({ page }) => {
  await startWork(page);
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("focusapp.v1"));
    data.work.savedOn = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString();
    localStorage.setItem("focusapp.v1", JSON.stringify(data));
  });
  await page.reload();
  await expect(page.getByText("Welcome back. Pick up where you left off.")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/\d+ days/);
});

// Awkward path: New assignment shows the form with the replace warning.
test("New assignment shows the form and says it replaces the saved steps", async ({ page }) => {
  await startWork(page);
  await page.getByRole("button", { name: "Back to home" }).click();
  await page.getByRole("button", { name: "New assignment" }).click();
  await expect(page.getByText("Starting new steps replaces the ones you have saved.")).toBeVisible();
  await page.getByLabel("Assignment text").fill("1. Only step");
  await page.getByRole("button", { name: "Reading" }).click();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.locator(".current-step")).toHaveText("Only step");
  await page.reload();
  await expect(page.locator("#pickup-step")).toHaveText("Only step");
});

// Awkward path: finishing every step clears them, so the next visit opens on the paste form.
test("finishing all steps and closing leaves nothing to pick up", async ({ page }) => {
  await startWork(page, "1. Only step");
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("focusapp.v1"));
    data.work.steps = [data.work.steps[0]];
    localStorage.setItem("focusapp.v1", JSON.stringify(data));
  });
  await page.reload();
  await page.getByRole("button", { name: "Start this step" }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByText("All your steps are done.")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("heading", { name: "What's the assignment?" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "What's the assignment?" })).toBeVisible();
  await expect(page.locator("#pickup")).toBeHidden();
});

// Awkward path: damaged saved steps are ignored and the app opens on the paste form.
test("damaged saved steps are ignored", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("focusapp.v1", JSON.stringify({ schemaVersion: 1, work: { steps: "broken" } })));
  await page.reload();
  await expect(page.getByRole("heading", { name: "What's the assignment?" })).toBeVisible();
});

// The other screens are still reachable from the top row, and return to the front door.
test("the top row opens a screen and Back returns to the pick-up card", async ({ page }) => {
  await startWork(page);
  await page.getByRole("button", { name: "Back to home" }).click();
  await openScreen(page, "My calendar");
  await expect(page.getByRole("heading", { name: "My calendar" })).toBeVisible();
  await page.getByRole("button", { name: "Back" }).first().click();
  await expect(page.locator("#pickup-step")).toHaveText("Find three sources");
});
