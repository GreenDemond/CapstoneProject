import { test, expect } from "@playwright/test";
import { openScreen } from "./helpers/nav.js";

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

test("the old row of buttons is gone, and everything it opened is reachable from Me", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#top-nav")).toHaveCount(0);
  await expect(page.locator("#paste-screen").getByRole("button", { name: "Settings" })).toHaveCount(0);
  await openScreen(page, "My profile");
  await expect(tab(page, "Me")).toHaveAttribute("aria-selected", "true");
  await page.locator("#profile-screen").getByRole("button", { name: /^Back/ }).first().click();
  await expect(tab(page, "Today")).toHaveAttribute("aria-selected", "true");
  for (const [name, id] of [["How I like to work", "intake-screen"], ["What I did", "looking-screen"], ["Settings", "settings-screen"], ["My calendar", "calendar-screen"]]) {
    await tab(page, "Me").click();
    await page.locator("#me-screen").getByRole("button", { name, exact: true }).click();
    await expect(page.locator("#" + id)).toBeVisible();
    await tab(page, "Today").click();
  }
});

test("the bar is hidden on the work screen and back after", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill("1. Find three sources\n2. Take notes");
  await page.getByRole("button", { name: "Essay" }).click();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.locator("#tabbar")).toBeHidden();
  await page.getByRole("button", { name: "Back to home" }).click();
  await expect(page.locator("#tabbar")).toBeVisible();
});

test("the bar does not cover the last button at the bottom of the page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Suggest some to start" }).scrollIntoViewIfNeeded();
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
  await openScreen(page, "My profile");
  await page.locator("#profile-screen input, #profile-screen textarea").first().fill("something typed");
  await tab(page, "Talk").click();
  expect(await visibleScreens(page)).toEqual(["profile-screen"]);
});

test("the welcome note sits above the paste box", async ({ page }) => {
  await page.goto("/");
  const note = await page.locator("#welcome-note").boundingBox();
  const box = await page.locator("#assignment-text").boundingBox();
  const heading = await page.locator("#paste-heading").boundingBox();
  expect(note.y + note.height).toBeLessThanOrEqual(heading.y);
  expect(heading.y).toBeLessThan(box.y);
});

test("the bar never covers the Class field, even when it is focused", async ({ page }) => {
  await page.goto("/");
  await page.locator("#class-label").focus();
  const field = await page.locator("#class-label").boundingBox();
  const bar = await page.locator("#tabbar").boundingBox();
  expect(field.y + field.height).toBeLessThanOrEqual(bar.y);
  await page.evaluate(() => globalThis.scrollTo(0, globalThis.document.body.scrollHeight));
  const last = await page.locator("#ai-status").boundingBox();
  const bar2 = await page.locator("#tabbar").boundingBox();
  expect(last.y + last.height).toBeLessThanOrEqual(bar2.y);
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
