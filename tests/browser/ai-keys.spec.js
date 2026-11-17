import { test, expect } from "@playwright/test";
import { HOST, KEY, standIn, openSettings, addOther, nextButton } from "./helpers/ai.js";

// The key box is kept out of any form and away from password managers, and it starts empty.
test("the key box is not in a form, is set against autofill, and starts empty", async ({ page }) => {
  await openSettings(page);
  await page.getByRole("button", { name: "Add an AI helper" }).click();
  await page.getByLabel(/^Another service/).check();
  await page.getByLabel("Its web address").fill(HOST);
  await nextButton(page).click();
  const box = page.locator("#flow-key");
  await expect(box).toHaveValue("");
  await expect(box).toHaveAttribute("type", "password");
  for (const [name, value] of [["autocomplete", "off"], ["autocapitalize", "off"], ["autocorrect", "off"], ["spellcheck", "false"], ["data-1p-ignore", "true"], ["data-lpignore", "true"], ["data-bwignore", "true"]]) {
    await expect(box).toHaveAttribute(name, value);
  }
  expect(await box.evaluate((node) => node.closest("form"))).toBeNull();
  expect(await page.locator("form").count()).toBe(0);
});

// Show reveals the key, and hiding the tab puts it back to dots.
test("Show reveals the key, and hiding the tab hides it again", async ({ page }) => {
  await openSettings(page);
  await page.getByRole("button", { name: "Add an AI helper" }).click();
  await page.getByLabel(/^Another service/).check();
  await page.getByLabel("Its web address").fill(HOST);
  await nextButton(page).click();
  await page.getByLabel("Your key").fill(KEY);
  const show = page.getByRole("button", { name: "Show" });
  await show.click();
  await expect(page.locator("#flow-key")).toHaveAttribute("type", "text");
  await expect(page.locator("#flow-key-show")).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() => {
    Object.defineProperty(globalThis.document, "hidden", { value: true, configurable: true });
    globalThis.document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("#flow-key")).toHaveAttribute("type", "password");
  await expect(page.locator("#flow-key-show")).toHaveAttribute("aria-pressed", "false");
});

// The key never appears in the page text, the shared settings, or a failure message.
test("the key never appears in the page or the shared settings", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await addOther(page);
  await expect(page.locator(".helper-card")).toHaveCount(1);
  await expect(page.locator("body")).not.toContainText(KEY);
  expect(await page.content()).not.toContain(KEY);
  expect(await page.evaluate(() => localStorage.getItem("focusapp.v1"))).not.toContain(KEY);
  await page.locator(".helper-card").getByRole("button", { name: /^Manage/ }).click();
  await expect(page.locator("body")).toContainText("••••7890");
  await expect(page.locator("body")).not.toContainText(KEY);
});

// Forget key asks first, and the helper then needs a key and can be finished with a new one.
test("Forget key asks first, then Finish setup takes a new key", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await addOther(page);
  await page.getByRole("button", { name: /^Manage/ }).click();
  await page.getByRole("button", { name: /^Forget the key/ }).click();
  await expect(page.getByText("You'll need to paste it again")).toBeVisible();
  await page.getByRole("button", { name: "Keep it" }).click();
  await expect(page.getByText("Key: ••••7890")).toBeVisible();

  await page.getByRole("button", { name: /^Forget the key/ }).click();
  await page.getByRole("button", { name: "Yes, forget it" }).click();
  await expect(page.getByText("Forgot the key")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator(".helper-card")).toContainText("Needs a key");

  await page.getByRole("button", { name: /^Finish setting up/ }).click();
  await page.getByLabel("Your key").fill("another-test-key-9999");
  await nextButton(page).click();
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.locator(".helper-card")).toContainText("Ready");
});

// Replacing a key checks the new one first: a bad new key leaves the working key in place.
test("a bad replacement key is rejected and the old key stays", async ({ page }) => {
  await standIn(page, { acceptKey: KEY });
  await openSettings(page);
  await addOther(page);
  await page.getByRole("button", { name: /^Manage/ }).click();
  await page.getByRole("button", { name: /^Replace the key/ }).click();
  await page.getByLabel("Your key").fill("a-wrong-new-key-0000");
  await nextButton(page).click();
  await expect(page.getByRole("status").last()).toContainText("That key didn't work", { timeout: 15000 });
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Key: ••••7890")).toBeVisible();
  await page.getByRole("button", { name: /^Test .* again/ }).click();
  await expect(page.getByRole("status").last()).toContainText("It works", { timeout: 15000 });
});

