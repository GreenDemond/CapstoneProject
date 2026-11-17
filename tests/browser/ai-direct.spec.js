import { test, expect } from "@playwright/test";

// Stand-in for a student's AI service. No real service or real key is used.
const ADDRESS = "https://ai.example.test/v1/chat/completions";
const KEY = "sk-test-stand-in-1234567890";
const TEXT = "Write an essay about rivers and what they carry.";

async function standIn(page, reply) {
  const seen = [];
  await page.route(`${ADDRESS}*`, async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "authorization, content-type",
          "Access-Control-Allow-Methods": "POST",
        },
      });
      return;
    }
    seen.push({ body: request.postData(), auth: request.headers().authorization });
    await route.fulfill({
      status: reply.status ?? 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      json: reply.json ?? { choices: [{ message: { content: reply.content ?? "" } }] },
    });
  });
  return seen;
}

async function addService(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByLabel('Name, for example "Home AI"').fill("Test AI");
  await page.getByLabel("Address").fill(ADDRESS);
  await page.getByLabel("Model name (the one your service lists)").fill("test-model");
  await page.getByLabel("Key (required)").fill(KEY);
  await page.getByRole("button", { name: "Add this AI" }).click();
  await expect(page.locator("#settings-message")).toContainText("encrypted on this device");
  await page.getByRole("button", { name: "Back" }).click();
}

async function pasteAndPick(page) {
  await page.getByLabel("Assignment text").fill(TEXT);
  await page.getByRole("button", { name: "Essay" }).click();
}

// Main path: Test it says connected, and Suggest shows steps labelled as from an AI.
test("a saved service answers the test and suggests steps labelled as AI", async ({ page }) => {
  const seen = await standIn(page, { content: "Read two sources about rivers\nWrite a plan with three points\nWrite the first paragraph" });
  await addService(page);
  await expect(page.locator("#ai-status")).toContainText("Using: Test AI");

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Test Test AI" }).click();
  await expect(page.locator("#settings-message")).toContainText("Connected");
  await page.getByRole("button", { name: "Back" }).click();

  await pasteAndPick(page);
  await expect(page.getByRole("button", { name: "Suggest steps with AI" })).toBeVisible();
  await expect(page.locator("#ai-privacy")).toContainText("the AI service Test AI");
  await page.getByRole("button", { name: "Suggest steps with AI" }).click();
  await expect(page.locator("#message")).toContainText("Suggested by an AI (Test AI)");
  await expect(page.locator("#steps li").first()).toHaveText("Read two sources about rivers");

  // The key goes only in the authorisation header to the service; the body has the text and no key.
  expect(seen.length).toBeGreaterThan(0);
  expect(seen.at(-1).auth).toBe(`Bearer ${KEY}`);
  expect(seen.at(-1).body).not.toContain(KEY);
});

// Awkward path: a rejected key gives its line, falls back to starter steps, and shows no key or text.
test("a rejected key gives one plain line and the starter steps, with no key or text on the page", async ({ page }) => {
  await standIn(page, { status: 401, json: { error: "invalid key " + KEY } });
  await addService(page);
  await pasteAndPick(page);
  await page.getByRole("button", { name: "Suggest steps with AI" }).click();
  await expect(page.locator("#message")).toContainText("didn't accept the key");
  await expect(page.locator("#steps li")).not.toHaveCount(0);
  const html = await page.content();
  expect(html).not.toContain(KEY);
  expect(html).not.toContain("invalid key");
});

// A double click sends one request.
test("a double click on Suggest sends one request", async ({ page }) => {
  const seen = await standIn(page, { content: "One step\nTwo step" });
  await addService(page);
  await pasteAndPick(page);
  const button = page.getByRole("button", { name: "Suggest steps with AI" });
  await button.dblclick();
  await expect(page.locator("#message")).toContainText("Suggested by an AI");
  expect(seen.length).toBe(1);
});

// The AI button stays hidden until a service with a key and model is saved.
test("the Suggest button is hidden with no ready service", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Suggest steps with AI" })).toBeHidden();
});
