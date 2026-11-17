import { test, expect } from "@playwright/test";
import { KEY, standIn, openSettings, setUpOther, nextButton, pageTop } from "./helpers/ai.js";

const message = (page) => page.getByRole("status").last();

// A rejected key gives the plain line, never offers Save it anyway, and Go back and fix goes to the key step.
test("a rejected key gets a kind message, no Save it anyway, and a way back to the key", async ({ page }) => {
  await standIn(page, { acceptKey: "a-different-key" });
  await openSettings(page);
  await setUpOther(page);
  await expect(message(page)).toContainText("That key didn't work", { timeout: 15000 });
  await expect(page.getByRole("button", { name: "Save it anyway" })).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(KEY);
  await page.getByRole("button", { name: "Go back and fix" }).click();
  await expect(page.getByRole("heading", { name: /Paste your key/ })).toBeFocused();
  await expect(page.locator("#key-entered")).toContainText("••••7890");
  await expect(page.locator("#flow-key")).toHaveCount(0);
  await page.getByRole("button", { name: "Paste a different key" }).click();
  await expect(page.locator("#flow-key")).toHaveValue("");
});

// If the service cannot be reached, Save it anyway is offered, and the helper is saved as Not checked yet and not In use.
test("when the service can't be reached, Save it anyway keeps it as Not checked yet and never in use", async ({ page }) => {
  await standIn(page, { abortChat: true });
  await openSettings(page);
  await setUpOther(page);
  await expect(message(page)).toContainText("Couldn't reach it", { timeout: 15000 });
  await page.getByRole("button", { name: "Save it anyway" }).click();
  const card = page.locator(".helper-card");
  await expect(card).toContainText("Not checked yet");
  await expect(card).not.toContainText("In use");
  await expect(page.getByText("saved, but not checked yet")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator("#ai-status")).not.toContainText("Using:");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("button", { name: /^Use / })).toBeVisible();
});

// An empty reply is reported plainly, and Save it anyway is offered because the check could not tell.
test("an empty reply is reported, with Save it anyway offered", async ({ page }) => {
  await standIn(page, { content: "" });
  await openSettings(page);
  await setUpOther(page);
  await expect(message(page)).toContainText("reply was empty", { timeout: 15000 });
  await expect(page.getByRole("button", { name: "Save it anyway" })).toBeVisible();
});

// An address that redirects sends nothing on to the other address.
test("a redirect is not followed, so nothing reaches the second address", async ({ page }) => {
  const other = await standIn(page, { host: "https://elsewhere.example.test" });
  await standIn(page, { redirectTo: "https://elsewhere.example.test/v1/chat/completions" });
  await openSettings(page);
  await setUpOther(page);
  await expect(message(page)).toContainText("Couldn't reach it", { timeout: 15000 });
  expect(other.chat.length).toBe(0);
});

// Stop checking ends the wait at once, with the same choices as a failed check.
test("Stop checking ends the wait and offers the same choices", async ({ page }) => {
  await standIn(page, { chatDelay: 20000 });
  await openSettings(page);
  await setUpOther(page);
  await page.getByRole("button", { name: "Stop checking" }).click();
  await expect(message(page)).toContainText("Stopped");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save it anyway" })).toBeVisible();
});

// Pressing Done twice quickly saves one helper.
test("a double press on Done saves one helper", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await setUpOther(page);
  const done = page.getByRole("button", { name: "Done" });
  await expect(done).toBeVisible({ timeout: 15000 });
  await done.dblclick();
  await expect(page.locator(".helper-card")).toHaveCount(1);
});

test("a message does not move the Next button", async ({ page }) => {
  await openSettings(page);
  await page.getByRole("button", { name: "Add an AI helper" }).click();
  await page.getByLabel(/^Another service/).check();
  const before = await pageTop(nextButton(page));
  await nextButton(page).click();
  await expect(message(page)).toContainText("doesn't look like a web address");
  expect(await pageTop(nextButton(page))).toBe(before);
});
