import { test, expect } from "@playwright/test";
import { KEY, standIn, openSettings, addOther } from "./helpers/ai.js";

const TEXT = "Write an essay about rivers and what they carry.";

async function pasteAndPick(page) {
  await page.getByLabel("Assignment text").fill(TEXT);
  await page.getByRole("button", { name: "Essay" }).click();
}

// Main path: Suggest steps shows steps labelled as from an AI, with the host, and the key only goes in the header.
test("Suggest steps shows steps labelled as AI with the host, and the key stays in the header", async ({ page }) => {
  const seen = await standIn(page, { content: "Read two sources about rivers\nWrite a plan with three points\nWrite the first paragraph" });
  await openSettings(page);
  await addOther(page);
  await page.getByRole("button", { name: "Back" }).click();
  await pasteAndPick(page);
  await expect(page.locator("#ai-privacy")).toContainText("the AI service ai.example.test (ai.example.test)");
  await page.getByRole("button", { name: "Suggest steps with AI" }).click();
  await expect(page.locator("#message")).toContainText("Suggested by an AI (ai.example.test, ai.example.test)");
  await expect(page.locator("#steps li").first()).toHaveText("Read two sources about rivers");
  // The steps are on screen, not just somewhere below the buttons.
  await expect(page.locator("#steps li").first()).toBeInViewport();
  const last = seen.chat.at(-1);
  expect(last.auth).toBe(`Bearer ${KEY}`);
  expect(last.body).not.toContain(KEY);
  expect(last.body).toContain("rivers");
});

// Awkward path: a rejected key gives the paste-screen line and the starter steps, with no key or text on the page.
test("a rejected key on the paste screen gives one plain line and the starter steps", async ({ page }) => {
  await standIn(page, { acceptKey: KEY });
  await openSettings(page);
  await addOther(page);
  // After setup, the service stops accepting this key.
  await page.unroute(/ai\.example\.test\/v1\/chat\/completions/);
  await standIn(page, { acceptKey: "another-key" });
  await page.getByRole("button", { name: "Back" }).click();
  await pasteAndPick(page);
  await page.getByRole("button", { name: "Suggest steps with AI" }).click();
  await expect(page.locator("#message")).toContainText("didn't accept the key");
  await expect(page.locator("#steps li")).not.toHaveCount(0);
  const html = await page.content();
  expect(html).not.toContain(KEY);
});

// A double click on Suggest sends one request.
test("a double click on Suggest sends one request", async ({ page }) => {
  const seen = await standIn(page, { content: "One step\nTwo step" });
  await openSettings(page);
  await addOther(page);
  await page.getByRole("button", { name: "Back" }).click();
  await pasteAndPick(page);
  const before = seen.chat.length;
  await page.getByRole("button", { name: "Suggest steps with AI" }).dblclick();
  await expect(page.locator("#message")).toContainText("Suggested by an AI");
  expect(seen.chat.length - before).toBe(1);
});

test("the Suggest button is hidden with no ready helper", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Suggest steps with AI" })).toBeHidden();
});
