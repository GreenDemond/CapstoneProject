import { test, expect } from "@playwright/test";

const SECRET = "sk-or-test-abcdef1234567890";

// Main path: add a service with a key, reload, and find the key saved (masked, never shown in full).
test("a key is saved encrypted, shown masked, and kept after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByLabel("Name, for example \"Home AI\"").fill("OpenRouter");
  await page.getByLabel("Address").fill("https://openrouter.ai/api/v1/chat/completions");
  await page.getByLabel("Key (optional now, you can add it later)").fill(SECRET);
  await page.getByRole("button", { name: "Add this AI" }).click();
  await expect(page.locator("#ai-list")).toContainText("Key saved: ••••7890");
  await expect(page.locator("#ai-list")).not.toContainText(SECRET);

  // The key must not be in the shared, plain settings.
  const shared = await page.evaluate(() => localStorage.getItem("focusapp.v1"));
  expect(shared).not.toContain(SECRET);

  await page.reload();
  await expect(page.locator("#ai-status")).toContainText("Using: OpenRouter");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.locator("#ai-list")).toContainText("Key saved: ••••7890");
});

// Awkward path: a key with a space is refused, a service can get its key later, and Forget removes it.
test("a bad key is refused, a key can be added later, and Forget removes it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByLabel("Name, for example \"Home AI\"").fill("Home AI");
  await page.getByLabel("Address").fill("https://home.example.com");
  await page.getByLabel("Key (optional now, you can add it later)").fill("has a space in it");
  await page.getByRole("button", { name: "Add this AI" }).click();
  await expect(page.locator("#settings-message")).toContainText("no spaces");
  await expect(page.locator("#ai-list li")).toHaveCount(0);

  await page.getByLabel("Key (optional now, you can add it later)").fill("");
  await page.getByRole("button", { name: "Add this AI" }).click();
  await expect(page.locator("#ai-list")).toContainText("No key yet");

  await page.getByLabel("Key", { exact: true }).fill(SECRET);
  await page.getByRole("button", { name: "Save key" }).click();
  await expect(page.locator("#ai-list")).toContainText("Key saved: ••••7890");

  await page.getByRole("button", { name: /Forget the key for Home AI/ }).click();
  await expect(page.locator("#ai-list")).toContainText("No key yet");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator("#ai-status")).toContainText("No AI is set up yet");
});
