import { test, expect } from "@playwright/test";
import { openScreen } from "./helpers/nav.js";

// Course memory (design/course-memory.md): the student's own steps for a class are offered next time.

const GUARD = 450; // the work screen ignores a second tap within 400 ms

async function stored(page, name) {
  return page.evaluate((section) => {
    const raw = globalThis.localStorage.getItem("focusapp.v1");
    return raw ? JSON.parse(raw)[section] ?? null : null;
  }, name);
}

async function finishOneStep(page, classLabel, step) {
  await page.getByLabel("Class (optional)").fill(classLabel);
  await page.getByRole("button", { name: "I'll write my steps" }).click();
  await page.getByLabel("Step 1", { exact: true }).fill(step);
  await page.getByRole("button", { name: "Done writing" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page.waitForTimeout(GUARD);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByRole("heading", { name: "All your steps are done." })).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
}

test("finishing a class assignment keeps the steps, and typing the class offers them as editable steps", async ({ page }) => {
  await page.goto("/");
  await finishOneStep(page, "History", "Read chapter four");
  expect((await stored(page, "courses"))[0]).toMatchObject({ label: "History", steps: ["Read chapter four"] });
  await expect(page.locator("#course-offer")).toBeHidden();
  await page.getByLabel("Class (optional)").fill("  history");
  await expect(page.getByText("You have steps from last time for History.")).toBeVisible();
  await page.getByRole("button", { name: "Use my History steps from last time" }).click();
  await expect(page.getByLabel("Step 1", { exact: true })).toHaveValue("Read chapter four");
  await page.getByLabel("Step 1", { exact: true }).fill("Read chapter five");
  await page.getByRole("button", { name: "Done writing" }).click();
  await expect(page.locator("#steps")).toContainText("Read chapter five");
});

test("awkward: another class, a cleared box and no class at all offer nothing; nothing is kept without a class", async ({ page }) => {
  await page.goto("/");
  await finishOneStep(page, "History", "Read chapter four");
  await page.getByLabel("Class (optional)").fill("Maths");
  await expect(page.locator("#course-offer")).toBeHidden();
  await page.getByLabel("Class (optional)").fill("History");
  await expect(page.locator("#course-offer")).toBeVisible();
  await page.getByLabel("Class (optional)").fill("");
  await expect(page.locator("#course-offer")).toBeHidden();
  await finishOneStep(page, "", "No class step");
  expect(await stored(page, "courses")).toHaveLength(1);
});

test("a class is listed in What the app remembers, and its Delete takes it away and stops the offer", async ({ page }) => {
  await page.goto("/");
  await finishOneStep(page, "History", "Read chapter four");
  await page.reload();
  await openScreen(page, "What the app remembers");
  await expect(page.getByRole("heading", { name: "Steps I used for a class" })).toBeVisible();
  await expect(page.locator("#looking-body")).toContainText("History: Read chapter four");
  await page.getByRole("button", { name: /^Delete: History/ }).click();
  await expect(page.getByRole("heading", { name: "Steps I used for a class" })).toHaveCount(0);
  expect(await stored(page, "courses")).toBeNull();
  await page.getByRole("tab", { name: "Today", exact: true }).click();
  await page.getByLabel("Class (optional)").fill("History");
  await expect(page.locator("#course-offer")).toBeHidden();
});
