import { test, expect } from "@playwright/test";
import { standIn, openSettings, addOther } from "./helpers/ai.js";

const A = "https://a.example.test";
const B = "https://b.example.test";

async function twoHelpers(page) {
  await standIn(page, { host: A });
  await standIn(page, { host: B });
  await openSettings(page);
  await addOther(page, { address: A });
  await addOther(page, { address: B });
}

// Main path: the first ready helper is in use; "Use this one" and the paste-screen menu switch it.
test("the first ready helper is in use, and Use this one and the menu switch it", async ({ page }) => {
  await twoHelpers(page);
  const cards = page.locator(".helper-card");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText("In use");
  await expect(cards.nth(1)).not.toContainText("In use");
  await page.getByRole("button", { name: "Use b.example.test" }).click();
  await expect(cards.nth(1)).toContainText("In use");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator("#ai-status")).toContainText("Using: b.example.test");
  await page.locator("#ai-choice").selectOption({ label: "a.example.test" });
  await expect(page.locator("#ai-status")).toContainText("Using: a.example.test");
  await page.reload();
  await expect(page.locator("#ai-status")).toContainText("Using: a.example.test");
});

// Removing the helper in use moves to the next ready one, never to an unready one.
test("removing the helper in use moves to the next ready one", async ({ page }) => {
  await twoHelpers(page);
  await page.getByRole("button", { name: "Manage a.example.test" }).click();
  await page.getByRole("button", { name: "Remove a.example.test" }).click();
  await page.getByRole("button", { name: "Yes, remove" }).click();
  await expect(page.getByText("Removed a.example.test.")).toBeVisible();
  await expect(page.locator(".helper-card")).toContainText("In use");
  await expect(page.getByRole("button", { name: "Add an AI helper" })).toBeFocused();
});

// Older saved data: a helper with a key but no AI picked says so, and is not replaced by another one.
test("a helper that needs an AI picked is not replaced by another, and Finish setup goes to the pick step", async ({ page }) => {
  await twoHelpers(page);
  await page.evaluate(() => {
    const data = JSON.parse(globalThis.localStorage.getItem("focusapp.v1"));
    data.ai.services[0].model = "";
    data.ai.chosenId = data.ai.services[0].id;
    globalThis.localStorage.setItem("focusapp.v1", JSON.stringify(data));
  });
  await page.reload();
  await expect(page.locator("#ai-status")).toContainText("isn't ready yet");
  await expect(page.locator("#ai-box")).toBeHidden();
  await expect(page.locator("#ai-choice")).toHaveValue("");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.locator(".helper-card").nth(0)).toContainText("Needs an AI picked");
  await page.getByRole("button", { name: /^Finish setting up/ }).click();
  await expect(page.getByRole("heading", { name: /Pick an AI/ })).toBeFocused();
});
