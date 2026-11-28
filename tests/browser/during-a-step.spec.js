import { test, expect } from "@playwright/test";
import { startWork } from "./helpers/work.js";

// W12 (design/during-a-step-w12.md): Done when: line, "Did that time feel about right?", Drifted split.

const KEY = "focusapp.v1";

async function seedBlocks(page, blocks) {
  await page.addInitScript(
    ([key, value]) => {
      if (!globalThis.localStorage.getItem(key)) {
        globalThis.localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, blocks: value }));
      }
    },
    [KEY, blocks],
  );
}

async function savedBlocks(page) {
  return page.evaluate((key) => JSON.parse(globalThis.localStorage.getItem(key) || "{}").blocks || [], KEY);
}

test("a Done when: line can be written, shows under the step, and is kept", async ({ page }) => {
  await startWork(page);
  await page.getByRole("button", { name: "Say when this is finished" }).click();
  await page.getByLabel("How will I know it's done?").fill("  I have three links  ");
  await page.getByRole("button", { name: "Save that line" }).click();
  await expect(page.getByText("Done when: I have three links")).toBeVisible();
  const saved = await page.evaluate((key) => JSON.parse(globalThis.localStorage.getItem(key)).work.steps[0].doneWhen, KEY);
  expect(saved).toBe("I have three links");
  await page.getByRole("button", { name: "Change that line" }).click();
  await page.getByRole("button", { name: "Clear that line" }).click();
  await expect(page.getByText("Done when:")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Say when this is finished" })).toBeVisible();
});

test("an empty Done when: line saves nothing, and the step still works", async ({ page }) => {
  await startWork(page);
  await page.getByRole("button", { name: "Say when this is finished" }).click();
  await page.getByLabel("How will I know it's done?").fill("   ");
  await page.getByRole("button", { name: "Save that line" }).click();
  await expect(page.getByText("Done when:")).toHaveCount(0);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByText("Step 2 of 5")).toBeVisible();
});

test("the question after a countdown offers the right answers and saves one", async ({ page }) => {
  await page.clock.install();
  await startWork(page);
  await page.getByLabel("Show a countdown").check();
  await page.clock.fastForward(12 * 60 * 1000 + 5000);
  await expect(page.getByText("Did that time feel about right?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Shorter" })).toHaveCount(0); // not offered at 12
  await expect(page.getByRole("button", { name: "About right" })).toBeVisible();
  await page.getByRole("button", { name: "Longer" }).click();
  await expect(page.getByText("Noted.")).toBeVisible();
  await expect(page.getByText("Did that time feel about right?")).toHaveCount(0);
  const blocks = await savedBlocks(page);
  expect(blocks).toHaveLength(1);
  expect(blocks[0].minutes).toBe(12);
  expect(blocks[0].answer).toBe("longer");
});

test("Skip closes the question and saves nothing", async ({ page }) => {
  await page.clock.install();
  await startWork(page);
  await page.getByLabel("Show a countdown").check();
  await page.clock.fastForward(12 * 60 * 1000 + 5000);
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByText("Did that time feel about right?")).toHaveCount(0);
  expect(await savedBlocks(page)).toHaveLength(0);
  await page.getByRole("button", { name: "Done", exact: true }).click(); // never blocks the step
  await expect(page.getByText("Step 2 of 5")).toBeVisible();
});

test("a countdown that ended long ago does not raise the question", async ({ page }) => {
  await page.clock.install();
  await startWork(page);
  await page.getByLabel("Show a countdown").check();
  await page.clock.fastForward(30 * 60 * 1000);
  await expect(page.getByText("Time's up.")).toBeVisible();
  await expect(page.getByText("Did that time feel about right?")).toHaveCount(0);
});

test("answers that point to a length start the next countdown there", async ({ page }) => {
  const day = 86400000;
  const answers = [1, 2, 3].map((n) => ({ minutes: 12, answer: "longer", on: new Date(Date.now() - n * day).toISOString() }));
  await seedBlocks(page, answers);
  await startWork(page);
  await page.getByLabel("Show a countdown").check();
  await expect(page.locator(".ring-time")).toHaveText("25:00");
  await expect(page.getByText("Your answers so far point to 25 minutes.")).toBeVisible();
  await page.getByRole("button", { name: "12 minutes" }).click(); // the student can still choose
  await expect(page.locator(".ring-time")).toHaveText("12:00");
});

test("damaged saved answers do not stop the work screen", async ({ page }) => {
  await seedBlocks(page, "not a list");
  await startWork(page);
  await page.getByLabel("Show a countdown").check();
  await expect(page.locator(".ring-time")).toHaveText("12:00");
  await expect(page.getByText("Your answers so far point to")).toHaveCount(0);
});

test("Drifted starts with the first part of a long step", async ({ page }) => {
  await startWork(page, "1. Find three sources and then read the first one\n2. Take notes");
  await page.getByRole("button", { name: "Drifted", exact: true }).click();
  await expect(page.getByLabel("The smallest part of this step")).toHaveValue("Find three sources");
  await page.getByRole("button", { name: "Start this part" }).click();
  await expect(page.locator(".current-step")).toHaveText("Find three sources");
});
