import { test, expect } from "@playwright/test";
import { standIn, openSettings, addOther } from "./helpers/ai.js";
import { openScreen } from "./helpers/nav.js";

// The "Which AI helper?" menu in Talk (design/talk-ai-choice.md). Stand-in services only.
const A = "https://a.example.test";
const B = "https://b.example.test";

async function oneHelper(page) {
  await standIn(page, { host: A });
  await openSettings(page);
  await addOther(page, { address: A });
}

async function openTalk(page) {
  await page.getByRole("button", { name: "Back" }).click();
  await openScreen(page, "Talk it through");
  await expect(page.getByRole("heading", { name: "Talk it through" })).toBeVisible();
}

test("with one ready helper the Talk menu shows it as the chosen one", async ({ page }) => {
  await oneHelper(page);
  await openTalk(page);
  const menu = page.locator("#chat-helper");
  await expect(menu).toBeVisible();
  await expect(menu.locator("option")).toHaveCount(1);
  await expect(menu.locator("option:checked")).toHaveText("a.example.test");
  await expect(page.locator("#chat-goes-to")).toContainText("a.example.test");
});

test("a helper without an AI picked is listed but disabled, and the ready one answers", async ({ page }) => {
  await standIn(page, { host: A });
  await standIn(page, { host: B });
  await openSettings(page);
  await addOther(page, { address: A });
  await addOther(page, { address: B });
  await expect(page.locator(".helper-card")).toHaveCount(2);
  await page.evaluate(() => {
    const data = JSON.parse(globalThis.localStorage.getItem("focusapp.v1"));
    data.ai.services[0].model = "";
    data.ai.chosenId = data.ai.services[1].id;
    globalThis.localStorage.setItem("focusapp.v1", JSON.stringify(data));
  });
  await page.reload();
  await openScreen(page, "Talk it through");
  const options = page.locator("#chat-helper option");
  await expect(options).toHaveCount(2);
  await expect(options.nth(0)).toHaveText("a.example.test (needs an AI picked)");
  await expect(options.nth(0)).toBeDisabled();
  await expect(options.nth(1)).toHaveText("b.example.test");
  await expect(options.nth(1)).toBeEnabled();
  await expect(page.locator("#chat-helper option:checked")).toHaveText("b.example.test");
  await expect(page.locator("#chat-goes-to")).toContainText("b.example.test");
});

test("when no helper is ready the menu lists them with a calm line about Settings", async ({ page }) => {
  await oneHelper(page);
  await expect(page.locator(".helper-card")).toHaveCount(1);
  await page.evaluate(() => {
    const data = JSON.parse(globalThis.localStorage.getItem("focusapp.v1"));
    data.ai.services[0].model = "";
    globalThis.localStorage.setItem("focusapp.v1", JSON.stringify(data));
  });
  await page.reload();
  await openScreen(page, "Talk it through");
  await expect(page.locator("#chat-helper option")).toHaveText(["a.example.test (needs an AI picked)"]);
  await expect(page.getByText("Finish setting up a helper in Settings.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Settings" })).toBeVisible();
  await page.getByRole("button", { name: "Open Settings" }).click();
  await expect(page.getByRole("heading", { name: "Settings" }).first()).toBeVisible();
});
