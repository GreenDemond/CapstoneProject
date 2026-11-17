import { test, expect } from "@playwright/test";

const KEY = "sk-test-settings-1234567890";

async function fillService(page, { name = "Home AI", address = "https://home.example.com/v1/chat/completions", model = "home-model", key = KEY } = {}) {
  await page.getByLabel('Name, for example "Home AI"').fill(name);
  await page.getByLabel("Address").fill(address);
  await page.getByLabel("Model name (the one your service lists)").fill(model);
  await page.getByLabel("Key (required)").fill(key);
}

// Main path: add a service with a key and model, see it listed, then remove it.
test("adding and removing an AI service, with the no-AI warning", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#ai-status")).toContainText("No AI is set up yet");

  await page.getByRole("button", { name: "Settings" }).click();
  await fillService(page);
  await page.getByRole("button", { name: "Add this AI" }).click();
  await expect(page.locator("#settings-message")).toContainText("encrypted on this device");
  await expect(page.locator("#ai-list li")).toHaveCount(1);
  await expect(page.locator("#ai-list")).toContainText("Model: home-model");

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator("#ai-status")).toContainText("Using: Home AI");

  await page.reload();
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.locator("#ai-list li")).toHaveCount(1);
  await page.getByRole("button", { name: "Remove Home AI" }).click();
  await expect(page.locator("#ai-empty")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator("#ai-status")).toContainText("No AI is set up yet");
});

// Awkward path: plain http shows a warning; a bad address, a missing model, or a missing key is refused.
test("plain http shows a warning, and missing or bad details are refused", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();

  await page.getByLabel("Address").fill("http://ai.tail6e5320.ts.net:8080/v1/chat/completions");
  await expect(page.locator("#ai-address-warning")).toContainText("not encrypted");

  await page.getByRole("button", { name: "Add this AI" }).click();
  await expect(page.locator("#settings-message")).toContainText("Paste the key first");

  await fillService(page, { address: "ftp://nope" });
  await page.getByRole("button", { name: "Add this AI" }).click();
  await expect(page.locator("#settings-message")).toContainText("http://");

  await fillService(page, { address: "http://ai.tail6e5320.ts.net:8080/v1/chat/completions", model: "" });
  await page.getByRole("button", { name: "Add this AI" }).click();
  await expect(page.locator("#settings-message")).toContainText("model name");

  await fillService(page, { model: "m", key: "" });
  await page.getByRole("button", { name: "Add this AI" }).click();
  await expect(page.locator("#settings-message")).toContainText("Paste the key first");
  await expect(page.locator("#ai-list li")).toHaveCount(0);
});
