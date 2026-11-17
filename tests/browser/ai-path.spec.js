import { test, expect } from "@playwright/test";

async function pasteAndPick(page) {
  await page.getByLabel("Assignment text").fill("Write an essay about rivers.");
  await page.getByRole("button", { name: "Essay" }).click();
}

// With no key set (the normal state now), the AI button and its notice stay hidden.
test("the AI button is hidden when the AI is not set up", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#ai-box")).toBeHidden();
  await expect(page.getByRole("button", { name: "Suggest steps with AI" })).toBeHidden();
});

// With a stand-in server that says yes, the notice shows and the AI steps appear.
test("with the AI available, the privacy notice shows and AI steps appear", async ({ page }) => {
  await page.route("**/api/suggest", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { available: true } });
    } else {
      await route.fulfill({ json: { steps: ["Read the question", "Write one sentence", "Check it"] } });
    }
  });
  await page.goto("/");
  await expect(page.getByText("This text is sent to an AI service")).toBeVisible();
  await pasteAndPick(page);
  await page.getByRole("button", { name: "Suggest steps with AI" }).click();
  await expect(page.locator("#steps li").first()).toHaveText("Read the question");
  await expect(page.getByText("These steps came from an AI.")).toBeVisible();
});

// If the AI fails, the starter steps appear with one friendly line.
test("a failed AI call falls back to the starter steps", async ({ page }) => {
  await page.route("**/api/suggest", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { available: true } });
    } else {
      await route.fulfill({ status: 502, json: { error: "unavailable" } });
    }
  });
  await page.goto("/");
  await pasteAndPick(page);
  await page.getByRole("button", { name: "Suggest steps with AI" }).click();
  await expect(page.getByText("The AI couldn't help this time")).toBeVisible();
  await expect(page.locator("#steps li")).toHaveCount(5);
});

// A worrying message gets the trusted-adult line and no steps.
test("a worrying message gets the trusted-adult line", async ({ page }) => {
  await page.route("**/api/suggest", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { available: true } });
    } else {
      await route.fulfill({ json: { trustedAdult: true, steps: [] } });
    }
  });
  await page.goto("/");
  await pasteAndPick(page);
  await page.getByRole("button", { name: "Suggest steps with AI" }).click();
  await expect(page.getByText("please talk to an adult you trust")).toBeVisible();
  await expect(page.locator("#steps-screen")).toBeHidden();
});

// AI steps from the server are shown as text, never run as code.
test("AI text that looks like code is shown as text", async ({ page }) => {
  await page.route("**/api/suggest", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { available: true } });
    } else {
      await route.fulfill({ json: { steps: ['<img src=x onerror="window.hacked=1">'] } });
    }
  });
  await page.goto("/");
  await pasteAndPick(page);
  await page.getByRole("button", { name: "Suggest steps with AI" }).click();
  await expect(page.locator("#steps li").first()).toHaveText('<img src=x onerror="window.hacked=1">');
  expect(await page.evaluate(() => globalThis.hacked)).toBeUndefined();
});
