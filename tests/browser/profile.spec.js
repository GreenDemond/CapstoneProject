import { test, expect } from "@playwright/test";

// Main path: write goals and a note, save, reload, and find them again.
test("goals and a note are still there after saving and reloading", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "My profile" }).click();
  await page.getByLabel("Today").fill("Finish the reading");
  await page.getByLabel("Note").fill("The phone buzzed and I checked it for 20 minutes");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.locator("ul.notes")).toContainText("The phone buzzed");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved on this device.")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "My profile" }).click();
  await expect(page.getByLabel("Today")).toHaveValue("Finish the reading");
  await expect(page.locator("ul.notes")).toContainText("The phone buzzed");
});

// Awkward path 1: a damaged saved copy is kept, and the page starts fresh with a plain line.
test("damaged saved data is kept as a backup and the page starts fresh", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("focusapp.v1", "{broken"));
  await page.reload();
  await page.getByRole("button", { name: "My profile" }).click();
  await expect(page.getByText("so we started fresh. A copy was kept.")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("focusapp.v1.backup"))).toBe("{broken");
});

// Awkward path 2: leaving with unsaved words asks first; a second Back leaves.
test("going back with unsaved changes warns once, then leaves", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "My profile" }).click();
  await page.getByLabel("This year").fill("Pass chemistry");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByText("You have changes that aren't saved.")).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.locator("#paste-screen")).toBeVisible();
});

// Awkward path 3: clearing asks first, and then empties the profile.
test("Clear my profile asks first, then empties it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "My profile" }).click();
  await page.getByLabel("Today").fill("Something to clear");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("button", { name: "Clear my profile" }).click();
  await expect(page.getByText("This can't be undone.")).toBeVisible();
  await page.getByRole("button", { name: "Yes, clear everything" }).click();
  await expect(page.getByText("Your profile is cleared.")).toBeVisible();
  await expect(page.getByLabel("Today")).toHaveValue("");
});
