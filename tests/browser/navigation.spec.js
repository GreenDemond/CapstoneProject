import { test, expect } from "@playwright/test";
import { standIn, openSettings, addOther } from "./helpers/ai.js";

const SECTIONS = ["paste-screen", "steps-screen", "intake-screen", "profile-screen", "work-screen", "calendar-screen", "chat-screen", "settings-screen"];

// The ids of the sections the student can see right now.
async function visibleScreens(page) {
  return page.evaluate(
    (ids) => ids.filter((id) => !globalThis.document.getElementById(id).hidden),
    SECTIONS,
  );
}

async function showSteps(page) {
  await page.getByRole("button", { name: "Essay" }).click();
  await page.locator("#assignment-text").fill("Write about a book.");
  await page.getByRole("button", { name: "Show my steps" }).click();
  await expect(page.locator("#steps-screen")).toBeVisible();
}

test("every top button opens exactly one screen, and Back returns home", async ({ page }) => {
  await page.goto("/");
  expect(await visibleScreens(page)).toEqual(["paste-screen"]);
  const trips = [
    ["Talk it through", "chat-screen"],
    ["My calendar", "calendar-screen"],
    ["My profile", "profile-screen"],
    ["How I like to work", "intake-screen"],
    ["Settings", "settings-screen"],
  ];
  for (const [name, id] of trips) {
    await page.getByRole("button", { name, exact: true }).click();
    expect(await visibleScreens(page)).toEqual([id]);
    await page.locator(`#${id}`).getByRole("button", { name: /^(Back|Close)/ }).first().click();
    expect(await visibleScreens(page)).toEqual(["paste-screen"]);
  }
});

test("focus moves to the steps heading after Show my steps", async ({ page }) => {
  await page.goto("/");
  await showSteps(page);
  await expect(page.locator("#steps-heading")).toBeFocused();
});

test("Settings after Show my steps hides the steps, and Back brings them back", async ({ page }) => {
  await page.goto("/");
  await showSteps(page);
  expect(await visibleScreens(page)).toEqual(["paste-screen", "steps-screen"]);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  expect(await visibleScreens(page)).toEqual(["settings-screen"]);
  await page.locator("#settings-screen").getByRole("button", { name: /^Back/ }).first().click();
  expect(await visibleScreens(page)).toEqual(["paste-screen", "steps-screen"]);
});

test("the steps preview survives a visit to the calendar", async ({ page }) => {
  await page.goto("/");
  await showSteps(page);
  const before = await page.locator("#steps li").allTextContents();
  await page.getByRole("button", { name: "My calendar", exact: true }).click();
  expect(await visibleScreens(page)).toEqual(["calendar-screen"]);
  await page.locator("#calendar-screen").getByRole("button", { name: /^Back/ }).first().click();
  expect(await visibleScreens(page)).toEqual(["paste-screen", "steps-screen"]);
  expect(await page.locator("#steps li").allTextContents()).toEqual(before);
});

test("Start closes the steps preview for good", async ({ page }) => {
  await page.goto("/");
  await showSteps(page);
  await page.locator("#start").click();
  expect(await visibleScreens(page)).toEqual(["work-screen"]);
  await page.getByRole("button", { name: "Back to home" }).click();
  expect(await visibleScreens(page)).toEqual(["paste-screen"]);
});

test("leaving while the AI is thinking shows nothing from its late reply", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await addOther(page);
  await standIn(page, { chatDelay: 1500, content: "1. Open the book\n2. Read one page" });
  await page.getByRole("button", { name: "Back" }).click();
  await showStepsNoWait(page);
  await expect(page.getByRole("button", { name: "Show my steps" })).toBeDisabled();
  await page.getByRole("button", { name: "My calendar", exact: true }).click();
  await page.waitForTimeout(2200);
  expect(await visibleScreens(page)).toEqual(["calendar-screen"]);
  await page.locator("#calendar-screen").getByRole("button", { name: /^Back/ }).first().click();
  expect(await visibleScreens(page)).toEqual(["paste-screen"]);
  await expect(page.getByRole("button", { name: "Show my steps" })).toBeEnabled();
  await expect(page.locator("#message")).toHaveText("");
});

async function showStepsNoWait(page) {
  await page.getByRole("button", { name: "Essay" }).click();
  await page.locator("#assignment-text").fill("Write about a book.");
  await page.getByRole("button", { name: "Show my steps" }).click();
}
