import { test, expect } from "@playwright/test";

// Main path: add an OpenRouter address, see the warning go away, and remove it.
test("adding and removing an AI service, with the no-AI warning", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#ai-status")).toContainText("No AI is set up yet");

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Use the OpenRouter address" }).click();
  await page.getByRole("button", { name: "Add this AI" }).click();
  await expect(page.locator("#settings-message")).toContainText("can't answer until its key is added");
  await expect(page.locator("#ai-list li")).toHaveCount(1);
  await expect(page.locator("#ai-list")).toContainText("No key yet");

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator("#ai-status")).toContainText("No AI is set up yet");

  await page.reload();
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.locator("#ai-list li")).toHaveCount(1);
  await page.getByRole("button", { name: "Remove OpenRouter" }).click();
  await expect(page.locator("#ai-empty")).toBeVisible();
});

// Awkward path: a plain http address shows the warning, and a bad address is refused.
test("plain http shows a warning and a bad address is refused", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByLabel("Name, for example \"Home AI\"").fill("Home AI");
  await page.getByLabel("Address").fill("http://ai.tail6e5320.ts.net:8080/");
  await expect(page.locator("#ai-address-warning")).toContainText("not encrypted");
  await page.getByRole("button", { name: "Add this AI" }).click();
  await expect(page.locator("#ai-list li")).toHaveCount(1);

  await page.getByLabel("Name, for example \"Home AI\"").fill("Broken");
  await page.getByLabel("Address").fill("ftp://nope");
  await page.getByRole("button", { name: "Add this AI" }).click();
  await expect(page.locator("#settings-message")).toContainText("http://");
  await expect(page.locator("#ai-list li")).toHaveCount(1);
});
