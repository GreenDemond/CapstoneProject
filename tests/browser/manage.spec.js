import { test, expect } from "@playwright/test";
import { KEY, standIn, openSettings, addOther, nextButton } from "./helpers/ai.js";

test("Rename, Change the AI, Test it again, and Remove with a confirmation", async ({ page }) => {
  const seen = await standIn(page);
  await openSettings(page);
  await addOther(page);
  await page.getByRole("button", { name: /^Manage/ }).click();
  await expect(page.getByRole("heading", { name: /^Manage/ })).toBeFocused();

  await page.getByRole("button", { name: /^Rename/ }).click();
  await page.getByLabel("Name", { exact: true }).fill("Home AI");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByRole("heading", { name: "Manage Home AI" })).toBeVisible();

  await page.getByRole("button", { name: /^Change the AI/ }).click();
  await expect(page.getByRole("heading", { name: "Change the AI: Pick an AI" })).toBeFocused();
  await page.getByLabel("big-model", { exact: true }).check();
  await nextButton(page).click();
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText("AI: big-model")).toBeVisible();
  expect(JSON.parse(seen.chat.at(-1).body).model).toBe("big-model");

  await page.getByRole("button", { name: /^Test .* again/ }).click();
  await expect(page.getByRole("status").last()).toContainText("It works", { timeout: 15000 });

  await page.getByRole("button", { name: /^Remove/ }).click();
  await expect(page.getByText("You can add it again later")).toBeVisible();
  await page.getByRole("button", { name: "Keep it" }).click();
  await expect(page.getByRole("heading", { name: "Manage Home AI" })).toBeVisible();
  await page.getByRole("button", { name: /^Remove/ }).click();
  await page.getByRole("button", { name: "Yes, remove" }).click();
  await expect(page.getByText("Removed Home AI.")).toBeVisible();
  await expect(page.locator(".helper-card")).toHaveCount(0);
  void KEY;
});

// Keyboard only: the whole add flow can be done without a mouse.
test("the add flow works with the keyboard alone", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await page.getByRole("button", { name: "Add an AI helper" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: /Which service/ })).toBeFocused();
  await page.getByLabel(/^Another service/).focus();
  await page.keyboard.press("Space");
  await page.getByLabel("Its web address").focus();
  await page.keyboard.type("https://ai.example.test");
  await nextButton(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: /Paste your key/ })).toBeFocused();
  await page.getByLabel("Your key").focus();
  await page.keyboard.type("keyboard-only-key-123");
  await nextButton(page).focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("small-model", { exact: true }).focus();
  await page.keyboard.press("Space");
  await nextButton(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Done" })).toBeFocused({ timeout: 15000 });
  await page.keyboard.press("Enter");
  await expect(page.locator(".helper-card")).toHaveCount(1);
});
