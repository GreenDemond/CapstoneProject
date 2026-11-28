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
  await page.getByRole("button", { name: "Back to home", exact: true }).click();
  await pasteAndPick(page);
  await expect(page.locator("#ai-privacy")).toContainText("the AI service ai.example.test to suggest steps");
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await expect(page.locator("#message")).toContainText("Suggested by an AI: ai.example.test");
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
  await page.getByRole("button", { name: "Back to home", exact: true }).click();
  await pasteAndPick(page);
  await page.getByRole("button", { name: "Suggest some to start" }).click();
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
  await page.getByRole("button", { name: "Back to home", exact: true }).click();
  await pasteAndPick(page);
  const before = seen.chat.length;
  await page.getByRole("button", { name: "Suggest some to start" }).dblclick();
  await expect(page.locator("#message")).toContainText("Suggested by an AI");
  expect(seen.chat.length - before).toBe(1);
});

// With no ready helper there is no tick box, and Suggest some to start gives the built-in steps.
test("with no ready helper, Suggest some to start gives the built-in steps and no AI box", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#ai-box")).toBeHidden();
  await pasteAndPick(page);
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await expect(page.locator("#steps li").first()).toBeVisible();
  await expect(page.locator("#message")).not.toContainText("Suggested by an AI");
});

// The notice and tick box come before the button, and unticking means nothing is sent.
test("the tick box sits above the button, and unticking sends nothing and gives built-in steps", async ({ page }) => {
  const seen = await standIn(page, { content: "AI step one\nAI step two" });
  await openSettings(page);
  await addOther(page);
  await page.getByRole("button", { name: "Back to home", exact: true }).click();
  await pasteAndPick(page);
  const box = await page.locator("#ai-use").boundingBox();
  const button = await page.getByRole("button", { name: "Suggest some to start" }).boundingBox();
  expect(box.y).toBeLessThan(button.y);
  await expect(page.locator("#ai-privacy")).toContainText("pressing Suggest some to start sends this text");
  await expect(page.locator("#ai-use")).toBeChecked();

  const before = seen.chat.length;
  await expect(page.locator("#paste-hint")).toContainText("except when you use the AI helper");
  await page.locator("#ai-use").uncheck();
  await expect(page.locator("#paste-hint")).not.toContainText("except");
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await expect(page.locator("#steps li").first()).toBeVisible();
  await expect(page.locator("#steps li").first()).not.toHaveText("AI step one");
  expect(seen.chat.length).toBe(before);

  await page.locator("#ai-use").check();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await expect(page.locator("#message")).toContainText("Suggested by an AI");
  await expect(page.locator("#steps li").first()).toHaveText("AI step one");
});
