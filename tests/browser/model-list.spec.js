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

// OpenRouter: the list is fetched without the key, openrouter/free is preselected even when the list lacks it,
// and the free-model note shows.
test("OpenRouter's list is fetched without the key, with openrouter/free preselected and a note", async ({ page }) => {
  const seen = await standIn(page, { ...OPENROUTER, models: MANY });
  await openSettings(page);
  await toPickStep(page);
  await expect(page.getByLabel("openrouter/free", { exact: true })).toBeChecked();
  await expect(page.locator("#free-note")).toContainText("Free AIs may keep or learn from what you send");
  expect(seen.models.length).toBeGreaterThan(0);
  expect(seen.models[0].auth).toBeNull();

  // More than 12 AIs: a search box appears, and only the first 6 show until "Show more".
  await expect(page.getByRole("searchbox", { name: "Search the AIs" })).toBeVisible();
  await expect(page.locator("#ai-choices .choice")).toHaveCount(6);
  await page.getByRole("searchbox", { name: "Search the AIs" }).fill("model-13");
  await expect(page.locator("#ai-choices .choice")).toHaveCount(1);
  await page.getByRole("searchbox", { name: "Search the AIs" }).fill("");
  await page.getByRole("button", { name: "Show more" }).click();
  await expect(page.locator("#ai-choices .choice")).toHaveCount(15);

  await nextButton(page).click();
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({ timeout: 15000 });
  expect(JSON.parse(seen.chat.at(-1).body).model).toBe("openrouter/free");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.locator(".helper-card")).toContainText("OpenRouter");
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
