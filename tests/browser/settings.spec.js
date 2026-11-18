import { test, expect } from "@playwright/test";
import { HOST, KEY, standIn, openSettings, setUpOther, addOther, nextButton, pageTop } from "./helpers/ai.js";

// Main path: add a service end to end, see it Ready and In use, and the paste screen follows.
test("adding an AI helper end to end makes it Ready and In use", async ({ page }) => {
  await standIn(page);
  await page.goto("/");
  await expect(page.locator("#ai-status")).toContainText("No AI is set up yet");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByText("Without one, you still get the built-in steps.")).toBeVisible();

  await addOther(page);
  const card = page.locator(".helper-card");
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("ai.example.test");
  await expect(card).toContainText("Ready · In use");
  await expect(page.getByText("is ready and in use.")).toBeVisible();

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator("#ai-status")).toContainText("Using: ai.example.test");

  await page.reload();
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.locator(".helper-card")).toContainText("Ready · In use");
});

// Awkward paths: bad details are refused at step 1 and 2 with the plain message, before anything is sent.
test("bad addresses, duplicates, and an empty key are refused in plain words", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await page.getByRole("button", { name: "Add an AI helper" }).click();

  await nextButton(page).click();
  await expect(page.getByRole("status").last()).toContainText("Pick one first");

  await page.getByLabel(/^Another service/).check();
  await page.getByLabel("Its web address").fill("nope");
  await nextButton(page).click();
  await expect(page.getByRole("status").last()).toContainText("doesn't look like a web address");

  await page.getByLabel("Its web address").fill("https://x.example.com/custom/run");
  await nextButton(page).click();
  await expect(page.getByRole("status").last()).toContainText("address the service gives you");

  await page.getByLabel("Its web address").fill("https://openrouter.evil.example");
  await nextButton(page).click();
  await expect(page.getByRole("status").last()).toContainText("isn't OpenRouter's address");

  await page.getByLabel("Its web address").fill(HOST);
  await nextButton(page).click();
  await nextButton(page).click();
  await expect(page.getByRole("status").last()).toContainText("Paste your key first");
});

test("a second helper at the same address is allowed; the same AI there is refused", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await addOther(page);
  await page.getByRole("button", { name: "Add an AI helper" }).click();
  await page.getByLabel(/^Another service/).check();
  await page.getByLabel("Its web address").fill(HOST);
  await nextButton(page).click();
  await expect(page.getByLabel("Your key")).toBeVisible();
  await page.getByLabel("Your key").fill(KEY);
  await nextButton(page).click();
  await page.getByLabel("Pick an AI").selectOption("small-model");
  await nextButton(page).click();
  await expect(page.getByRole("status").last()).toContainText("You already have a helper for that AI at that address.");
});

// Plain http shows its note while typing, and the space is reserved so Next does not move.
test("a plain http address shows a note without moving the Next button", async ({ page }) => {
  await openSettings(page);
  await page.getByRole("button", { name: "Add an AI helper" }).click();
  await page.getByLabel(/^Another service/).check();
  const before = await pageTop(nextButton(page));
  await page.getByLabel("Its web address").fill("http://my-computer:8080");
  await expect(page.locator("#http-note")).toContainText("isn't encrypted");
  expect(await pageTop(nextButton(page))).toBe(before);
});

// Cancel at every step saves nothing, and a reload mid-setup leaves nothing behind.
test("cancelling at any step saves nothing, and a reload mid-setup starts again", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await page.getByRole("button", { name: "Add an AI helper" }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("button", { name: "Add an AI helper" })).toBeFocused();

  await page.getByRole("button", { name: "Add an AI helper" }).click();
  await page.getByLabel(/^Another service/).check();
  await page.getByLabel("Its web address").fill(HOST);
  await nextButton(page).click();
  await page.getByLabel("Your key").fill(KEY);
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator(".helper-card")).toHaveCount(0);

  await setUpOther(page);
  await page.reload();
  const stored = await page.evaluate(() => localStorage.getItem("focusapp.v1"));
  expect(stored ?? "").not.toContain(KEY);
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.locator(".helper-card")).toHaveCount(0);
});
