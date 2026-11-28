import { test, expect } from "@playwright/test";

// Check my steps against the assignment, by word matching (design/check-steps-w5.md).
// These tests were written but NOT run when the slice was built (Chrome could not start in that sandbox).

const TEXT = "Write a short report on volcanoes.\nYou must include a glossary of terms.\nYou must include 2 diagrams.";
const QUESTION = "Is this covered by a step?";

async function openSteps(page, text) {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill(text);
  await page.getByRole("button", { name: "Essay", exact: true }).click();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await expect(page.locator("#steps li").first()).toBeVisible();
}

test("the check asks about lines no step covers, says it is word matching, and updates in the editor", async ({ page }) => {
  await openSteps(page, TEXT);
  await expect(page.locator("#steps-check")).toBeEmpty();
  await page.getByRole("button", { name: "Check my steps against the assignment" }).click();
  const box = page.locator("#steps-check");
  await expect(box).toContainText('The assignment says "You must include a glossary of terms."');
  await expect(box).toContainText(QUESTION);
  await expect(box).toContainText("not from understanding");
  await expect(box.getByRole("alert")).toHaveCount(0);

  await page.getByRole("button", { name: "Change my steps" }).click();
  const editorBox = page.locator("#editor-check");
  await expect(editorBox).toContainText("glossary of terms");
  await page.getByLabel("Step 1", { exact: true }).fill("Make a glossary of terms and 2 diagrams");
  await expect(editorBox).not.toContainText("glossary");
  await expect(editorBox).toContainText("Every line you checked has a step");
  // The tool never writes a step: the student's words are what was typed.
  await expect(page.getByLabel("Step 1", { exact: true })).toHaveValue("Make a glossary of terms and 2 diagrams");

  await page.getByLabel("Step 1", { exact: true }).fill("Something else");
  await expect(editorBox).toContainText("glossary of terms");
  await page.getByRole("button", { name: "Done changing" }).click();
  await expect(page.locator("#steps-check")).toBeEmpty();
});

test("no lines found: no check button and nothing said", async ({ page }) => {
  await openSteps(page, "Think about volcanoes and be ready to talk");
  await expect(page.getByRole("button", { name: "Check my steps against the assignment" })).toBeHidden();
  await page.getByRole("button", { name: "Change my steps" }).click();
  await expect(page.locator("#editor-check")).toBeEmpty();
});

test("awkward: html in a line is shown as text, double tap and a refresh are safe", async ({ page }) => {
  await openSteps(page, "You must include <b>bold</b> and <img src=x onerror=globalThis.hacked=1> words.");
  const button = page.getByRole("button", { name: "Check my steps against the assignment" });
  await button.dblclick();
  await expect(page.locator("#steps-check li")).toHaveCount(1);
  await expect(page.locator("#steps-check b, #steps-check img")).toHaveCount(0);
  expect(await page.evaluate(() => globalThis.hacked)).toBeUndefined();
  await page.reload();
  await expect(page.locator("#steps-check")).toBeEmpty();
});

test("damaged saved data does not stop the check", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => globalThis.localStorage.setItem("focusapp.v1", "{not json"));
  await openSteps(page, TEXT);
  await page.getByRole("button", { name: "Check my steps against the assignment" }).click();
  await expect(page.locator("#steps-check")).toContainText(QUESTION);
});
