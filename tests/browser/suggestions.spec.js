import { test, expect } from "@playwright/test";

const ESSAY = "Write a five paragraph essay about the causes of the American Revolution. Include a clear thesis. Use at least 3 sources. Due Friday.";
const WORKSHEET = "Math worksheet: do problems 1-10. Show your work for each one.";

// Main path: the app suggests a kind, the student taps it, and the lines the assignment
// says are shown, in the student's own words, on the steps screen.
test("a kind is suggested, tapping Use this picks it, and the assignment's own lines are shown", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#kind-suggestion")).toBeHidden();

  await page.getByLabel("Assignment text").fill(ESSAY);
  await expect(page.locator("#kind-suggestion")).toBeVisible();
  await expect(page.locator("#kind-suggestion-text")).toHaveText("Looks like: Essay.");
  // Nothing is picked until the student taps.
  await expect(page.getByRole("button", { name: "Essay", exact: true })).toHaveAttribute("aria-pressed", "false");

  await page.getByRole("button", { name: "Use this" }).click();
  await expect(page.getByRole("button", { name: "Essay", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#kind-suggestion")).toBeHidden();
  await expect(page.getByRole("button", { name: "Essay", exact: true })).toBeFocused();

  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await expect(page.getByRole("heading", { name: "What your assignment says" })).toBeVisible();
  await expect(page.getByText("Copied from what you pasted. Does each one have a step?")).toBeVisible();
  await expect(page.locator("#requirements-list li")).toHaveText(["Include a clear thesis.", "Use at least 3 sources.", "Due Friday."]);
});

// The student's own choice wins: picking a kind first means no suggestion is ever shown.
test("picking a kind first hides the suggestion, and it stays hidden while typing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Project", exact: true }).click();
  await page.getByLabel("Assignment text").fill(ESSAY);
  await expect(page.locator("#kind-suggestion")).toBeHidden();
});

// A range of questions becomes chunks of steps.
test("a range of problems becomes chunks, and the requirement line is shown", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill(WORKSHEET);
  await page.getByRole("button", { name: "Use this" }).click();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await expect(page.locator("#steps li")).toHaveText(["Do problems 1 to 2", "Do problems 3 to 4", "Do problems 5 to 6", "Do problems 7 to 8", "Do problems 9 to 10"]);
  await expect(page.locator("#requirements-list li")).toHaveText(["Show your work for each one."]);
});

// Awkward path 1: nonsense and an empty box give no suggestion and no box.
test("nonsense or nothing pasted gives no suggestion and no requirements box", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill("asdf qwer zxcv");
  await expect(page.locator("#kind-suggestion")).toBeHidden();
  await page.getByRole("button", { name: "Something else" }).click();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await expect(page.locator("#steps li").first()).toBeVisible();
  await expect(page.locator("#requirements")).toBeHidden();
});

// Awkward path 2: the suggestion follows the text, and clearing the text removes it.
test("the suggestion goes away when the text is cleared", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill(ESSAY);
  await expect(page.locator("#kind-suggestion")).toBeVisible();
  await page.getByLabel("Assignment text").fill("");
  await expect(page.locator("#kind-suggestion")).toBeHidden();
});

// Awkward path 3: the student's text is shown as text, never as page code (DECISIONS T11).
test("a requirement line containing HTML is shown as plain text", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill("You must include <b>bold</b> and <img src=x onerror=window.hacked=1> words.");
  await page.getByRole("button", { name: "Something else" }).click();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await expect(page.locator("#requirements-list li")).toHaveText("You must include <b>bold</b> and <img src=x onerror=window.hacked=1> words.");
  await expect(page.locator("#requirements-list b, #requirements-list img")).toHaveCount(0);
  expect(await page.evaluate(() => globalThis.hacked)).toBeUndefined();
});

// Awkward path 4: a paste that is too long, and a paste with the box full of requirements.
test("a very long paste does not freeze or break the suggestion", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill(`${ESSAY} ${"You must try. ".repeat(3000)}`);
  await expect(page.locator("#kind-suggestion")).toBeVisible();
  await page.getByRole("button", { name: "Use this" }).click();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  expect(await page.locator("#requirements-list li").count()).toBeLessThanOrEqual(6);
});
