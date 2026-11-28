import { test, expect } from "@playwright/test";

// Slice W11 (design/class-and-return-w11.md): class name on an assignment, the weekly look-back card,
// set-aside thoughts on home, and the all-done line. No AI is used anywhere here.
// These tests were written but NOT run when the slice was built (Chrome could not start in that sandbox).

const GUARD = 450; // the work screen ignores a second tap within 400 ms
const DAY = 86400000;

async function stored(page, name) {
  return page.evaluate((section) => {
    const raw = globalThis.localStorage.getItem("focusapp.v1");
    return raw ? JSON.parse(raw)[section] ?? null : null;
  }, name);
}

// Writes one section of the saved data, then reloads so the app reads it.
async function seed(page, name, value) {
  await page.evaluate(([section, data]) => {
    const raw = globalThis.localStorage.getItem("focusapp.v1");
    const all = raw ? JSON.parse(raw) : { schemaVersion: 1 };
    all[section] = data;
    globalThis.localStorage.setItem("focusapp.v1", JSON.stringify(all));
  }, [name, value]);
  await page.reload();
}

async function writeOneStep(page, text = "Open the book", classLabel = "") {
  await page.getByLabel("Class (optional)").fill(classLabel);
  await page.getByRole("button", { name: "I'll write my steps" }).click();
  await page.getByLabel("Step 1", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Done writing" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.locator(".current-step")).toBeVisible();
}

test("the class field is on the paste screen with its hint", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Class (optional)")).toBeVisible();
  await expect(page.getByText("For example: History")).toBeVisible();
});

test("a class name stays with the assignment: work screen, saved data and the pick-up card", async ({ page }) => {
  await page.goto("/");
  await writeOneStep(page, "Open the book", "  History  ");
  await expect(page.locator("#work-class")).toHaveText("Class: History");
  expect((await stored(page, "work")).classLabel).toBe("History");
  await page.reload();
  await expect(page.locator("#pickup-class")).toHaveText("Class: History");
  await page.getByRole("button", { name: "Start this step" }).click();
  await expect(page.locator("#work-class")).toHaveText("Class: History");
});

test("no class name shows no class line, and the field is empty for the next assignment", async ({ page }) => {
  await page.goto("/");
  await writeOneStep(page, "Open the book", "   ");
  await expect(page.locator("#work-class")).toBeHidden();
  expect((await stored(page, "work")).classLabel).toBeUndefined();
  await page.getByRole("button", { name: "Back to home" }).click();
  await expect(page.locator("#pickup-class")).toBeHidden();
  await page.getByRole("button", { name: "New assignment" }).click();
  await expect(page.getByLabel("Class (optional)")).toHaveValue("");
});

test("a very long class name is cut to 40 characters and shown as plain text", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Class (optional)").fill("<b>" + "x".repeat(80));
  await expect(page.getByLabel("Class (optional)")).toHaveValue(("<b>" + "x".repeat(80)).slice(0, 40));
  await writeOneStep(page, "Open the book", "<b>" + "x".repeat(80));
  expect((await stored(page, "work")).classLabel.length).toBeLessThanOrEqual(40);
  await expect(page.locator("#work-class b")).toHaveCount(0);
});

test("when every step is done, home says so and that it is a good time to close the app", async ({ page }) => {
  await page.goto("/");
  await writeOneStep(page);
  await page.waitForTimeout(GUARD);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByRole("heading", { name: "All your steps are done." })).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.locator("#all-done-line")).toHaveText("That's today done.");
  await expect(page.getByText("A good time to close the app.")).toBeVisible();
  await expect(page.getByRole("button", { name: "I'll write my steps" })).toBeVisible();
  await page.getByLabel("Assignment text").fill("Next one");
  await page.getByRole("button", { name: "I'll write my steps" }).click();
  await expect(page.getByRole("heading", { name: "Write my steps" })).toBeVisible();
});

test("with steps still open there is no all-done line", async ({ page }) => {
  await page.goto("/");
  await writeOneStep(page);
  await page.reload();
  await expect(page.locator("#all-done")).toBeHidden();
});

test("the weekly card does not show on a first visit, and the week starts quietly", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#lookback-card")).toBeHidden();
  expect((await stored(page, "lookbackCard")).on).toBeTruthy();
});

test("after seven days the card offers a look back; Take a look opens What I did and the card waits a week", async ({ page }) => {
  await page.goto("/");
  await seed(page, "lookbackCard", { on: new Date(Date.now() - 8 * DAY).toISOString() });
  await expect(page.getByText("A quick look back at your week")).toBeVisible();
  await expect(page.locator("#lookback-card")).not.toContainText(/days|missed|behind/i);
  await page.getByRole("button", { name: "Take a look" }).click();
  await expect(page.getByRole("heading", { name: "What I did" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your week" })).toBeVisible();
  await page.locator("#looking-screen").getByRole("button", { name: "Back to home" }).click();
  await expect(page.locator("#lookback-card")).toBeHidden();
});

test("Not now hides the card, and it stays hidden after a refresh", async ({ page }) => {
  await page.goto("/");
  await seed(page, "lookbackCard", { on: new Date(Date.now() - 9 * DAY).toISOString() });
  await expect(page.locator("#lookback-card")).toBeVisible();
  await page.getByRole("button", { name: "Not now", exact: true }).click();
  await expect(page.locator("#lookback-card")).toBeHidden();
  await page.reload();
  await expect(page.locator("#lookback-card")).toBeHidden();
  const saved = (await stored(page, "lookbackCard")).on;
  expect(Date.now() - Date.parse(saved)).toBeLessThan(DAY);
});

test("six days since the card was dealt with: no card", async ({ page }) => {
  await page.goto("/");
  await seed(page, "lookbackCard", { on: new Date(Date.now() - 6 * DAY).toISOString() });
  await expect(page.locator("#lookback-card")).toBeHidden();
});

test("damaged or future card data does not break home and shows no card", async ({ page }) => {
  await page.goto("/");
  for (const bad of ["not an object", { on: 12 }, { on: "garbage" }, { on: new Date(Date.now() + 30 * DAY).toISOString() }]) {
    await seed(page, "lookbackCard", bad);
    await expect(page.getByRole("button", { name: "I'll write my steps" })).toBeVisible();
    await expect(page.locator("#lookback-card")).toBeHidden();
  }
});

test("set-aside thoughts show on home as plain text, newest first, up to three", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#thoughts")).toBeHidden();
  await seed(page, "parked", [
    { id: 4, text: "<b>ask Sam</b>", date: "2026-12-01T10:00:00.000Z" },
    { id: 3, text: "buy glue", date: "2026-12-01T09:00:00.000Z" },
    { id: 2, text: "email coach", date: "2026-12-01T08:00:00.000Z" },
    { id: 1, text: "old one", date: "2026-12-01T07:00:00.000Z" },
  ]);
  await expect(page.getByRole("heading", { name: "Thoughts you set aside" })).toBeVisible();
  await expect(page.locator("#thoughts-list li")).toHaveText(["<b>ask Sam</b>", "buy glue", "email coach"]);
  await expect(page.locator("#thoughts-list b")).toHaveCount(0);
});

test("damaged saved thoughts do not break home", async ({ page }) => {
  await page.goto("/");
  await seed(page, "parked", "oops");
  await expect(page.locator("#thoughts")).toBeHidden();
  await expect(page.getByRole("button", { name: "I'll write my steps" })).toBeVisible();
});
