import { test, expect } from "@playwright/test";

// Slice W10 (design/own-steps-w10.md): writing my own steps is the main path, with no AI.

test("I'll write my steps is the main button, Suggest some to start is the quiet one after it", async ({ page }) => {
  await page.goto("/");
  const write = page.getByRole("button", { name: "I'll write my steps" });
  const suggest = page.getByRole("button", { name: "Suggest some to start" });
  await expect(write).toBeVisible();
  await expect(write).toHaveClass(/primary/);
  await expect(suggest).not.toHaveClass(/primary/);
  const a = await write.boundingBox();
  const b = await suggest.boundingBox();
  // On a phone the buttons stack; on a wide screen they sit side by side. Either way the main one comes first.
  expect(a.y < b.y || (a.y === b.y && a.x < b.x)).toBe(true);
});

test("writing my own steps with no text and no kind works, then Start runs them", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "I'll write my steps" }).click();
  await expect(page.getByRole("heading", { name: "Write my steps" })).toBeVisible();
  await page.getByLabel("Step 1", { exact: true }).fill("Open the document");
  await page.getByRole("button", { name: "Add a step" }).click();
  await page.getByLabel("Step 2", { exact: true }).fill("Type one sentence");
  await page.getByRole("button", { name: "Done writing" }).click();
  await expect(page.locator("#steps li")).toHaveText(["Open the document", "Type one sentence"]);
  await expect(page.getByRole("heading", { name: "Your steps" })).toBeVisible();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByText("Open the document").first()).toBeVisible();
});

test("the assignment text and its lines are shown while writing", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill("Write a short report on volcanoes.\nYou must include a glossary of terms.\nYou must include 2 diagrams.");
  await page.getByRole("button", { name: "I'll write my steps" }).click();
  await expect(page.locator(".pasted-text")).toContainText("short report on volcanoes");
  await expect(page.getByRole("heading", { name: "What your assignment says" })).toBeVisible();
  await expect(page.locator("#requirements-list li").first()).toBeVisible();
});

test("done with nothing written asks for one step, and a blank step does not count", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "I'll write my steps" }).click();
  await page.getByRole("button", { name: "Done writing" }).click();
  await expect(page.getByText("Add one step first. It can be tiny.")).toBeVisible();
  await page.getByLabel("Step 1", { exact: true }).fill("   ");
  await page.getByRole("button", { name: "Done writing" }).click();
  await expect(page.getByText("Add one step first. It can be tiny.")).toBeVisible();
  await expect(page.locator("#steps-editor")).toBeVisible();
});

test("typed steps stay as plain text, and pressing the button twice keeps what was typed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "I'll write my steps" }).click();
  await page.getByLabel("Step 1", { exact: true }).fill("<b>Just this</b>");
  await page.getByRole("button", { name: "I'll write my steps" }).click();
  await expect(page.getByLabel("Step 1", { exact: true })).toHaveValue("<b>Just this</b>");
  await page.getByRole("button", { name: "Done writing" }).click();
  await expect(page.locator("#steps li")).toHaveText(["<b>Just this</b>"]);
});

test("Back to the paste box leaves nothing behind, and a refresh mid-writing returns to the paste screen", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill("Read chapter 2");
  await page.getByRole("button", { name: "I'll write my steps" }).click();
  await page.getByLabel("Step 1", { exact: true }).fill("Open the book");
  await page.getByRole("button", { name: "Back to the paste box" }).click();
  await expect(page.locator("#steps-screen")).toBeHidden();
  await expect(page.getByLabel("Assignment text")).toHaveValue("Read chapter 2");
  await page.getByRole("button", { name: "I'll write my steps" }).click();
  await expect(page.getByLabel("Step 1", { exact: true })).toHaveValue("");
  await page.reload();
  await expect(page.getByRole("button", { name: "I'll write my steps" })).toBeVisible();
  await expect(page.locator("#steps-editor")).toBeHidden();
});

test("Suggest some to start still gives starter steps and needs the kind", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill("Read chapter 2 and answer the questions.");
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await expect(page.getByText("Tap the kind of work it is, then try again.")).toBeVisible();
  await page.getByRole("button", { name: "Reading" }).click();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await expect(page.getByRole("heading", { name: "Here's a start" })).toBeVisible();
  await expect(page.locator("#steps li").first()).toBeVisible();
});
