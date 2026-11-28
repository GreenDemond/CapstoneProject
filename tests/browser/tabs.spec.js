import { test, expect } from "@playwright/test";

// Bottom tabs and the welcome note (design/tabs-w3.md). Tabs have role=tab, so they are not buttons.
const tab = (page, name) => page.getByRole("tab", { name, exact: true });

async function visibleScreens(page) {
  return page.evaluate(() =>
    ["paste-screen", "chat-screen", "calendar-screen", "me-screen", "work-screen", "profile-screen"].filter(
      (id) => !globalThis.document.getElementById(id).hidden,
    ),
  );
}

test("the four tabs open Talk, Plan, Me and Today, and the selected one is marked", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("tab")).toHaveCount(4);
  await expect(tab(page, "Today")).toHaveAttribute("aria-selected", "true");
  await tab(page, "Talk").click();
  expect(await visibleScreens(page)).toEqual(["chat-screen"]);
  await expect(tab(page, "Talk")).toHaveAttribute("aria-selected", "true");
  await expect(tab(page, "Today")).toHaveAttribute("aria-selected", "false");
  await tab(page, "Plan").click();
  expect(await visibleScreens(page)).toEqual(["calendar-screen"]);
  await tab(page, "Me").click();
  expect(await visibleScreens(page)).toEqual(["me-screen"]);
  await expect(page.getByRole("heading", { name: "Me and my data", level: 2 })).toBeVisible();
  await tab(page, "Today").click();
  expect(await visibleScreens(page)).toEqual(["paste-screen"]);
});

test("the old buttons still work and the tab follows", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "My calendar", exact: true }).click();
  await expect(tab(page, "Plan")).toHaveAttribute("aria-selected", "true");
  await page.locator("#calendar-screen").getByRole("button", { name: /^Back/ }).first().click();
  await expect(tab(page, "Today")).toHaveAttribute("aria-selected", "true");
});

test("the bar is hidden on the work screen and back after", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill("1. Find three sources\n2. Take notes");
  await page.getByRole("button", { name: "Essay" }).click();
  await page.getByRole("button", { name: "Show my steps" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.locator("#tabbar")).toBeHidden();
  await page.getByRole("button", { name: "Back to home" }).click();
  await expect(page.locator("#tabbar")).toBeVisible();
});

test("the bar does not cover the last button at the bottom of the page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Show my steps" }).scrollIntoViewIfNeeded();
  await page.evaluate(() => globalThis.scrollTo(0, globalThis.document.body.scrollHeight));
  const box = await page.locator("#welcome-hide").boundingBox();
  const bar = await page.locator("#tabbar").boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(bar.y);
});

test("pressing the current tab does nothing, and the arrow keys move between tabs", async ({ page }) => {
  await page.goto("/");
  await tab(page, "Today").click();
  expect(await visibleScreens(page)).toEqual(["paste-screen"]);
  await tab(page, "Today").focus();
  await page.keyboard.press("ArrowRight");
  await expect(tab(page, "Talk")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(tab(page, "Me")).toBeFocused();
});

test("a tab will not drop unsaved profile changes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "My profile", exact: true }).click();
  await page.locator("#profile-screen input, #profile-screen textarea").first().fill("something typed");
  await tab(page, "Talk").click();
  expect(await visibleScreens(page)).toEqual(["profile-screen"]);
});

test("the welcome note shows once, can be hidden, and stays hidden after a refresh", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#welcome-note")).toBeVisible();
  await expect(page.getByRole("heading", { name: "What's the assignment?" })).toBeVisible();
  await page.getByRole("button", { name: "Hide this note" }).click();
  await expect(page.locator("#welcome-note")).toBeHidden();
  await page.reload();
  await expect(page.locator("#welcome-note")).toBeHidden();
});

test("damaged saved data still opens the app with the welcome note", async ({ page }) => {
  await page.addInitScript(() => globalThis.localStorage.setItem("focusapp.v1", "{broken"));
  await page.goto("/");
  await expect(page.locator("#welcome-note")).toBeVisible();
  await expect(tab(page, "Today")).toHaveAttribute("aria-selected", "true");
});
