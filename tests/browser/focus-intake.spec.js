import { test, expect } from "@playwright/test";

// Main path: four taps, the first-guess card shows the picks, and Change works.
test("four taps make a first-guess card, and Change goes back to the card", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "How I like to work" }).click();
  await page.getByRole("button", { name: "Start" }).click();

  await page.getByRole("button", { name: "Quiet", exact: true }).click();
  await page.getByRole("button", { name: "Short (about 12 minutes)" }).click();
  await page.getByRole("button", { name: "Phone", exact: true }).click();
  await page.getByRole("button", { name: "A very small first step" }).click();

  await expect(page.getByRole("heading", { name: "My first guess" })).toBeVisible();
  const card = page.locator("ul.card");
  await expect(card.locator("li")).toHaveCount(4);
  await expect(card).toContainText("Sound: Quiet");
  await expect(card).toContainText("Work block to try first: Short (about 12 minutes)");
  await expect(card).toContainText("What pulls me away: Phone");
  await expect(card).toContainText("When I come back: A very small first step");
  await expect(page.getByText("This is only a first guess.")).toBeVisible();

  await card.locator("li").first().getByRole("button", { name: "Change" }).click();
  await page.getByRole("button", { name: "A steady background hiss, like a fan" }).click();
  await expect(page.getByRole("heading", { name: "My first guess" })).toBeVisible();
  await expect(card).toContainText("Sound: A steady hiss, like a fan");
  await expect(card.locator("li")).toHaveCount(4);
});

// Awkward path: Not sure on every question shows "Not sure yet", not a failure.
test("Not sure on every question shows Not sure yet on the card", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "How I like to work" }).click();
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: "Not sure", exact: true }).click();
  await page.getByRole("button", { name: "Not sure", exact: true }).click();
  await page.getByRole("button", { name: "Not sure", exact: true }).click();
  await page.getByRole("button", { name: "Not sure", exact: true }).click();
  await expect(page.locator("ul.card li")).toHaveCount(4);
  await expect(page.locator("ul.card")).toContainText("Not sure yet");
});

// Awkward path: Back on a question goes to the one before, and Close clears everything.
test("Back returns to the earlier question, and Close leaves nothing behind", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "How I like to work" }).click();
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: "Quiet", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sound or quiet?" })).toBeVisible();

  await page.getByRole("button", { name: "Back to home" }).first().click();
  await expect(page.locator("#intake-screen")).toBeHidden();
  await expect(page.locator("#paste-screen")).toBeVisible();
  await page.getByRole("button", { name: "How I like to work" }).click();
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
});
