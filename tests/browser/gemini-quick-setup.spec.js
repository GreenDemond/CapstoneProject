import { test, expect } from "@playwright/test";
import { KEY, standIn, openSettings, nextButton, addOther } from "./helpers/ai.js";

// Google Gemini quick setup (design/gemini-quick-setup.md). Stand-in only: no real key, and the Google link is never opened.
const GOOGLE = { host: "https://generativelanguage.googleapis.com", base: "/v1beta/openai", models: ["models/gemini-a", "models/gemini-b"] };

async function chooseGemini(page) {
  await page.getByRole("button", { name: "Add an AI helper" }).click();
  await page.getByLabel(/^Google Gemini/).check();
  await expect(page.getByLabel("Its web address")).toBeHidden();
  await nextButton(page).click();
}

test("Gemini: no address to type, 3 steps with a safe link, then done with the same data as by hand", async ({ page }) => {
  const seen = await standIn(page, GOOGLE);
  await openSettings(page);
  await chooseGemini(page);

  const steps = page.locator("#gemini-steps");
  await expect(steps.locator("ol > li")).toHaveCount(3);
  await expect(steps).toContainText("Get API key");
  await expect(steps).toContainText("Google may have renamed these buttons.");
  await expect(page.locator("#gemini-privacy")).toContainText("What you type to Gemini goes to Google");
  const link = steps.getByRole("link", { name: "Open Google AI Studio" });
  await expect(link).toHaveCount(1);
  await expect(link).toHaveAttribute("href", "https://aistudio.google.com/apikey");
  await expect(link).toHaveAttribute("target", "_blank");
  expect(await link.getAttribute("rel")).toMatch(/noopener/);
  expect(await link.getAttribute("rel")).toMatch(/noreferrer/);
  await expect(page.getByRole("button", { name: /^Cancel/ })).toBeVisible();

  await page.getByLabel("Your key").fill(KEY);
  await nextButton(page).click();
  await expect(page.getByLabel("Pick an AI")).toHaveValue("models/gemini-flash-lite-latest");
  await expect(page.getByLabel("Name this helper (optional)")).toHaveValue("Gemini");
  await nextButton(page).click();
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Done" }).click();

  await expect(page.locator(".helper-card")).toContainText("Gemini");
  await expect(page.locator(".helper-card")).toContainText(/Ready/);
  expect(seen.chat.length).toBeGreaterThan(0);
  expect(seen.chat[0].auth).toBe(`Bearer ${KEY}`);
  expect(JSON.parse(seen.chat[0].body).model).toBe("models/gemini-flash-lite-latest");
  expect(await page.content()).not.toContain(KEY);
});

test("Gemini: Cancel saves nothing", async ({ page }) => {
  await standIn(page, GOOGLE);
  await openSettings(page);
  await chooseGemini(page);
  await page.getByLabel("Your key").fill(KEY);
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator(".helper-card")).toHaveCount(0);
});

test("Gemini: a wrong key gets the plain key message", async ({ page }) => {
  await standIn(page, { ...GOOGLE, acceptKey: "some-other-key" });
  await openSettings(page);
  await chooseGemini(page);
  await page.getByLabel("Your key").fill(KEY);
  await nextButton(page).click();
  await nextButton(page).click();
  await expect(page.getByText("That key didn't work.")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".helper-card")).toHaveCount(0);
});

test("Gemini: used-up quota shows the Google line", async ({ page }) => {
  await standIn(page, { ...GOOGLE, chatStatus: 429, chatBody: { error: "quota" } });
  await openSettings(page);
  await chooseGemini(page);
  await page.getByLabel("Your key").fill(KEY);
  await nextButton(page).click();
  await nextButton(page).click();
  await expect(page.getByText("Gemini says you've used the free quota for now. Wait a bit and try again.")).toBeVisible({ timeout: 15000 });
});

test("Gemini: keyboard only, all the way to Done", async ({ page }) => {
  await standIn(page, GOOGLE);
  await openSettings(page);
  await page.getByRole("button", { name: "Add an AI helper" }).focus();
  await page.keyboard.press("Enter");
  await page.getByLabel(/^Google Gemini/).focus();
  await page.keyboard.press("Space");
  await expect(page.getByLabel(/^Google Gemini/)).toBeChecked();
  await nextButton(page).focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("Your key").focus();
  await page.keyboard.type(KEY);
  await nextButton(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Pick an AI")).toBeVisible();
  await nextButton(page).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Done" })).toBeFocused({ timeout: 15000 });
  await page.keyboard.press("Enter");
  await expect(page.locator(".helper-card")).toContainText("Gemini");
});

test("Gemini: a helper already named Gemini is refused plainly", async ({ page }) => {
  await standIn(page, GOOGLE);
  await standIn(page, { host: "https://ai.example.test" });
  await openSettings(page);
  await addOther(page, { name: "Gemini" });
  await chooseGemini(page);
  await page.getByLabel("Your key").fill(KEY);
  await nextButton(page).click();
  await expect(page.getByLabel("Pick an AI")).toBeVisible();
  await nextButton(page).click();
  await expect(page.getByText("You already have a helper called that. Pick another name.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Done" })).toHaveCount(0);
});

test("Gemini: Back keeps Gemini chosen, and switching service clears the automatic name", async ({ page }) => {
  await standIn(page, GOOGLE);
  await standIn(page, { host: "https://ai.example.test" });
  await openSettings(page);
  await chooseGemini(page);
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel(/^Google Gemini/)).toBeChecked();
  await nextButton(page).click();
  await page.getByLabel("Your key").fill(KEY);
  await nextButton(page).click();
  await expect(page.getByLabel("Name this helper (optional)")).toHaveValue("Gemini");
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByLabel(/^Another service/).check();
  await page.getByLabel("Its web address").fill("https://ai.example.test");
  await nextButton(page).click();
  await expect(page.locator("#gemini-steps")).toHaveCount(0);
  await page.getByLabel("Your key").fill(KEY);
  await nextButton(page).click();
  await expect(page.getByLabel("Name this helper (optional)")).toHaveValue("");
});
