import { test, expect } from "@playwright/test";
import { KEY, standIn, openSettings, nextButton } from "./helpers/ai.js";

const OPENROUTER = { host: "https://openrouter.ai", base: "/api/v1" };
const MANY = Array.from({ length: 14 }, (_, i) => `vendor/model-${String(i).padStart(2, "0")}`);

async function toPickStep(page) {
  await page.getByRole("button", { name: "Add an AI helper" }).click();
  await page.getByLabel(/^OpenRouter/).check();
  await nextButton(page).click();
  await page.getByLabel("Your key").fill(KEY);
  await nextButton(page).click();
}

// OpenRouter: the list is fetched without the key, and the pull-down starts on openrouter/free (even when the
// list lacks it) with the free-model note. Opening it lets you pick another, and the pick is what is used.
test("OpenRouter's pull-down starts on openrouter/free and can be changed", async ({ page }) => {
  const seen = await standIn(page, { ...OPENROUTER, models: MANY });
  await openSettings(page);
  await toPickStep(page);
  const pick = page.getByLabel("Pick an AI");
  await expect(pick).toHaveValue("openrouter/free");
  await expect(pick.locator("option")).toHaveCount(15);
  await expect(page.locator("#free-note")).toContainText("Free AIs may keep or learn from what you send");
  expect(seen.models.length).toBeGreaterThan(0);
  expect(seen.models[0].auth).toBeNull();

  // A typed free model with web search (":free:online") still gets the free-model note.
  await page.getByText("I know the name already").click();
  await page.getByLabel("The AI's name").fill("openai/gpt-oss-20b:free:online");
  await expect(page.locator("#free-note")).toContainText("Free AIs may keep or learn from what you send");
  await page.getByLabel("The AI's name").fill("");

  await pick.selectOption("vendor/model-03");
  await expect(page.locator("#free-note")).toHaveText("");
  await nextButton(page).click();
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({ timeout: 15000 });
  expect(JSON.parse(seen.chat.at(-1).body).model).toBe("vendor/model-03");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.locator(".helper-card")).toContainText("OpenRouter");
});

// Not choosing anything changes nothing: the default is what is used.
test("leaving the pull-down alone uses the default", async ({ page }) => {
  const seen = await standIn(page, { ...OPENROUTER, models: MANY });
  await openSettings(page);
  await toPickStep(page);
  await nextButton(page).click();
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({ timeout: 15000 });
  expect(JSON.parse(seen.chat.at(-1).body).model).toBe("openrouter/free");
});

// A name typed by hand overrides the list.
test("a name typed by hand overrides the list", async ({ page }) => {
  const seen = await standIn(page, { ...OPENROUTER, models: MANY });
  await openSettings(page);
  await toPickStep(page);
  await page.getByText("I know the name already").click();
  await page.getByLabel("The AI's name").fill("my/own-model");
  await nextButton(page).click();
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({ timeout: 15000 });
  expect(JSON.parse(seen.chat.at(-1).body).model).toBe("my/own-model");
});

// If the list can't be loaded, the reason shows and the typing box opens by itself.
test("a list that can't be loaded opens the typing box", async ({ page }) => {
  await page.route("https://other.example.test/v1/models*", (route) => route.abort());
  await openSettings(page);
  await page.getByRole("button", { name: "Add an AI helper" }).click();
  await page.getByLabel(/^Another service/).check();
  await page.getByLabel("Its web address").fill("https://other.example.test");
  await nextButton(page).click();
  await page.getByLabel("Your key").fill(KEY);
  await nextButton(page).click();
  await expect(page.getByRole("status").last()).toContainText("Couldn't load the list");
  await expect(page.getByLabel("The AI's name")).toBeVisible();
});
