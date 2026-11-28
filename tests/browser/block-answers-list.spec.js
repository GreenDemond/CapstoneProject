import { test, expect } from "@playwright/test";
import { openScreen } from "./helpers/nav.js";

// The block-length answers are listed line by line in What the app remembers (design/block-answers-list.md).

const KEY = "focusapp.v1";

async function seed(page, blocks) {
  await page.evaluate(([key, value]) => {
    globalThis.localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, blocks: value }));
  }, [KEY, blocks]);
  await page.reload();
}

async function saved(page) {
  return page.evaluate((key) => JSON.parse(globalThis.localStorage.getItem(key) || "{}").blocks ?? null, KEY);
}

const ago = (days) => new Date(Date.now() - days * 86400000).toISOString();

test("answers are listed, each Delete removes only its line, and the last delete removes the section", async ({ page }) => {
  await page.goto("/");
  await seed(page, [
    { minutes: 25, answer: "shorter", on: ago(1) },
    { minutes: 25, answer: "shorter", on: ago(2) },
    { minutes: 12, answer: "longer", on: ago(3) },
  ]);
  await openScreen(page, "What the app remembers");
  await expect(page.getByRole("heading", { name: "How long a block felt" })).toBeVisible();
  await expect(page.locator("#looking-body li", { hasText: "25 minutes felt too long" })).toHaveCount(2);
  await expect(page.locator("#looking-body li", { hasText: "12 minutes felt too short" })).toHaveCount(1);
  await page.locator("#looking-body li", { hasText: "12 minutes felt too short" }).getByRole("button", { name: /^Delete/ }).click();
  await expect(page.getByText("Deleted.")).toBeVisible();
  expect(await saved(page)).toHaveLength(2);
  await page.locator("#looking-body li", { hasText: "25 minutes felt too long" }).first().getByRole("button", { name: /^Delete/ }).click();
  expect(await saved(page)).toHaveLength(1);
  await page.locator("#looking-body li", { hasText: "25 minutes felt too long" }).getByRole("button", { name: /^Delete/ }).click();
  expect(await saved(page)).toBeNull();
  await expect(page.getByRole("heading", { name: "How long a block felt" })).toHaveCount(0);
});

test("awkward: damaged answers are skipped, and with no answers there is no list", async ({ page }) => {
  await page.goto("/");
  await seed(page, [null, { minutes: 5, answer: "shorter", on: ago(1) }, { minutes: 12, answer: "aboutRight", on: "nope" }, { minutes: 25, answer: "longer", on: ago(1) }]);
  await openScreen(page, "What the app remembers");
  await expect(page.locator("#looking-body li", { hasText: "minutes felt" })).toHaveCount(0);
  await page.getByRole("tab", { name: "Today", exact: true }).click();
  await openScreen(page, "What the app remembers");
  await expect(page.getByText("Nothing yet.")).toBeVisible();
});
