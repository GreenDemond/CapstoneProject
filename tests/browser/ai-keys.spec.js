import { test, expect } from "@playwright/test";

const SECRET = "sk-test-keys-abcdef1234567890";

async function fillService(page, key) {
  await page.getByLabel('Name, for example "Home AI"').fill("Home AI");
  await page.getByLabel("Address").fill("https://home.example.com/v1/chat/completions");
  await page.getByLabel("Model name (the one your service lists)").fill("home-model");
  await page.getByLabel("Key (required)").fill(key);
}

// Main path: a key is saved encrypted, shown masked, kept after reload, and kept out of shared settings.
test("a key is saved encrypted, shown masked, and kept after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await fillService(page, SECRET);
  await page.getByRole("button", { name: "Add this AI" }).click();
  await expect(page.locator("#ai-list")).toContainText("Key saved: ••••7890");
  await expect(page.locator("#ai-list")).not.toContainText(SECRET);

  const shared = await page.evaluate(() => localStorage.getItem("focusapp.v1"));
  expect(shared).not.toContain(SECRET);

  await page.reload();
  await expect(page.locator("#ai-status")).toContainText("Using: Home AI");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.locator("#ai-list")).toContainText("Key saved: ••••7890");
});

// Awkward path: a key with a space is refused; Forget removes the key; a new key can be saved after.
test("a bad key is refused, Forget removes it, and a new key can be saved", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await fillService(page, "has a space in it");
  await page.getByRole("button", { name: "Add this AI" }).click();
  await expect(page.locator("#settings-message")).toContainText("no spaces");
  await expect(page.locator("#ai-list li")).toHaveCount(0);

  await fillService(page, SECRET);
  await page.getByRole("button", { name: "Add this AI" }).click();
  await expect(page.locator("#ai-list")).toContainText("Key saved: ••••7890");

  await page.getByRole("button", { name: /Forget the key for Home AI/ }).click();
  await expect(page.locator("#ai-list")).toContainText("No key yet");
  await page.getByLabel("Key", { exact: true }).fill(SECRET);
  await page.getByRole("button", { name: "Save key" }).click();
  await expect(page.locator("#ai-list")).toContainText("Key saved: ••••7890");
});
