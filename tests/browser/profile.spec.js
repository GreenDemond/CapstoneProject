import { test, expect } from "@playwright/test";
import { openScreen } from "./helpers/nav.js";

// Main path: write goals and a note, save, reload, and find them again.
test("goals and a note are still there after saving and reloading", async ({ page }) => {
  await page.goto("/");
  await openScreen(page, "My profile");
  await page.getByLabel("Today").fill("Finish the reading");
  await page.getByLabel("Note").fill("The phone buzzed and I checked it for 20 minutes");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.locator("ul.notes")).toContainText("The phone buzzed");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved on this device.")).toBeVisible();

  await page.reload();
  await openScreen(page, "My profile");
  await expect(page.getByLabel("Today")).toHaveValue("Finish the reading");
  await expect(page.locator("ul.notes")).toContainText("The phone buzzed");
});

// Awkward path 1: a damaged saved copy is kept, and the page starts fresh with a plain line.
test("damaged saved data is kept as a backup and the page starts fresh", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("focusapp.v1", "{broken"));
  await page.reload();
  await openScreen(page, "My profile");
  await expect(page.getByText("so we started fresh. A copy was kept.")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("focusapp.v1.backup"))).toBe("{broken");
});

// Awkward path 2: leaving with unsaved words asks first; a second Back leaves.
test("going back with unsaved changes warns once, then leaves", async ({ page }) => {
  await page.goto("/");
  await openScreen(page, "My profile");
  await page.getByLabel("This year").fill("Pass chemistry");
  await page.getByRole("button", { name: "Back to home" }).first().click();
  await expect(page.getByText("You have changes that aren't saved.")).toBeVisible();
  await page.getByRole("button", { name: "Back to home" }).first().click();
  await expect(page.locator("#paste-screen")).toBeVisible();
});

// Awkward path 3: clearing asks first, and then empties the profile.
test("Clear my profile asks first, then empties it", async ({ page }) => {
  await page.goto("/");
  await openScreen(page, "My profile");
  await page.getByLabel("Today").fill("Something to clear");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("button", { name: "Clear my profile" }).click();
  await expect(page.getByText("This can't be undone.")).toBeVisible();
  await page.getByRole("button", { name: "Yes, clear everything" }).click();
  await expect(page.getByText("Your profile is cleared.")).toBeVisible();
  await expect(page.getByLabel("Today")).toHaveValue("");
});

// Typed words survive Back's warning, and Save then keeps them.
test("a typed goal survives Back's warning and can then be saved", async ({ page }) => {
  await page.goto("/");
  await openScreen(page, "My profile");
  await page.getByLabel("Today").fill("Finish the lab report");
  await page.getByLabel("Note").fill("Half-written note");
  await page.getByRole("button", { name: "Back to home" }).first().click();
  await expect(page.locator("#profile-status")).toContainText("You have changes that aren't saved.");
  await expect(page.getByLabel("Today")).toHaveValue("Finish the lab report");
  await expect(page.getByLabel("Note")).toHaveValue("Half-written note");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByLabel("Today")).toHaveValue("Finish the lab report");
  await page.reload();
  await openScreen(page, "My profile");
  await expect(page.getByLabel("Today")).toHaveValue("Finish the lab report");
});

test("typed words survive Clear my profile and Cancel", async ({ page }) => {
  await page.goto("/");
  await openScreen(page, "My profile");
  await page.getByLabel("This week").fill("Read chapter 4");
  await page.getByLabel("Note").fill("Typing a note");
  await page.getByRole("button", { name: "Clear my profile" }).click();
  await expect(page.getByText("This can't be undone.")).toBeVisible();
  await expect(page.getByLabel("This week")).toHaveValue("Read chapter 4");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByLabel("This week")).toHaveValue("Read chapter 4");
  await expect(page.getByLabel("Note")).toHaveValue("Typing a note");
});

test("the Clear question is not showing after leaving and reopening", async ({ page }) => {
  await page.goto("/");
  await openScreen(page, "My profile");
  await page.getByRole("button", { name: "Clear my profile" }).click();
  await page.getByRole("button", { name: "Back to home" }).first().click();
  await openScreen(page, "My profile");
  await expect(page.getByText("This can't be undone.")).toHaveCount(0);
});

test("the start-up notice goes away after a successful save, and the warning goes on the status line", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("focusapp.v1", "{broken"));
  await page.reload();
  await openScreen(page, "My profile");
  const notice = page.getByText("so we started fresh. A copy was kept.");
  await expect(notice).toBeVisible();
  await page.getByLabel("Today").fill("x");
  await page.getByRole("button", { name: "Back to home" }).first().click();
  await expect(notice).toBeVisible(); // the warning did not overwrite the notice
  await expect(page.locator("#profile-status")).toContainText("aren't saved");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved on this device.")).toBeVisible();
  await expect(notice).toHaveCount(0);
});

// A note made late in the evening in Los Angeles gets that day, not tomorrow's (UTC).
test.describe("local date", () => {
  test.use({ timezoneId: "America/Los_Angeles" });
  test("a note written at 11pm local time gets the local date", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-11-18T07:30:00Z")); // 11:30pm on Nov 17 in Los Angeles
    await page.goto("/");
    await openScreen(page, "My profile");
    await page.getByLabel("Note").fill("Evening note");
    await page.getByRole("button", { name: "Add note" }).click();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    const stored = await page.evaluate(() => {
      const { lookbackCard, ...rest } = JSON.parse(localStorage.getItem("focusapp.v1")); // the look-back clock is a UTC time stamp, not a note date
      return { clock: lookbackCard, saved: JSON.stringify(rest) };
    });
    expect(stored.saved).toContain("2026-11-17");
    expect(stored.saved).not.toContain("2026-11-18");
  });
});

// A note typed but not added is not lost silently: Save says so and Back still warns.
test("a note typed but not added is called out on Save and Back warns", async ({ page }) => {
  await page.goto("/");
  await openScreen(page, "My profile");
  await page.getByLabel("Note").fill("Phone again");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Your note isn't added yet.")).toBeVisible();
  await page.getByRole("button", { name: "Back to home" }).first().click();
  await expect(page.getByText("You have changes that aren't saved.")).toBeVisible();
  await expect(page.getByLabel("Note")).toHaveValue("Phone again");
});
