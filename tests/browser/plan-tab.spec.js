import { test, expect } from "@playwright/test";

// Slice W13 (design/plan-tab-w13.md): steps and saved thoughts on the Plan tab, tabs that leave a sub-view,
// and Load a copy not bringing the welcome note back. No AI is used anywhere here.
// These tests were written but NOT run when the slice was built (Chrome could not start in that sandbox).

const tab = (page, name) => page.getByRole("tab", { name, exact: true });

// Writes sections into the saved data, then reloads so the app reads them.
async function seed(page, sections) {
  await page.evaluate((data) => {
    const raw = globalThis.localStorage.getItem("focusapp.v1");
    const all = raw ? JSON.parse(raw) : { schemaVersion: 1 };
    Object.assign(all, data);
    globalThis.localStorage.setItem("focusapp.v1", JSON.stringify(all));
  }, sections);
  await page.reload();
}

const WORK = { steps: [{ id: 0, text: "Find three sources", done: true }, { id: 1, text: "Write the opening", done: false }], nextId: 2, savedOn: "2026-11-20T10:00:00.000Z" };

test("Plan tab lists all steps with done marked, plus saved thoughts and recall answers", async ({ page }) => {
  await page.goto("/");
  await seed(page, {
    work: WORK,
    parked: [{ id: 1, text: "email Sam about the trip", date: "2026-11-18T10:00:00.000Z" }],
    recall: [{ id: 1, answer: "Plants make food from light", date: "2026-11-19T10:00:00.000Z" }],
  });
  await tab(page, "Plan").click();
  const box = page.locator("#plan-extras");
  await expect(box.getByRole("heading", { name: "All my steps" })).toBeVisible();
  await expect(box.locator(".plan-steps li")).toHaveCount(2);
  await expect(box.locator(".plan-steps li").first()).toContainText("Find three sources");
  await expect(box.locator(".plan-steps li").first()).toContainText("(done)");
  await expect(box.locator(".plan-steps li").nth(1)).not.toContainText("(done)");
  await expect(box.getByRole("heading", { name: "Saved thoughts" })).toBeVisible();
  const rows = box.locator("#plan-thoughts li");
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText("Plants make food from light");
  await expect(rows.nth(1)).toContainText("email Sam about the trip");
});

test("a saved thought is taken out only after a second tap, and leaving it keeps it", async ({ page }) => {
  await page.goto("/");
  await seed(page, { parked: [{ id: 1, text: "email Sam", date: "2026-11-18T10:00:00.000Z" }] });
  await tab(page, "Plan").click();
  const row = page.locator("#plan-thoughts li").first();
  await row.getByRole("button", { name: "Take this out" }).click();
  await expect(row).toContainText("Take this one out?");
  await row.getByRole("button", { name: "No, leave it" }).click();
  await expect(page.locator("#plan-thoughts li")).toHaveCount(1);
  await page.locator("#plan-thoughts li").first().getByRole("button", { name: "Take this out" }).click();
  await page.locator("#plan-thoughts li").first().getByRole("button", { name: "Yes, take it out" }).click();
  await expect(page.locator("#plan-thoughts")).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(globalThis.localStorage.getItem("focusapp.v1")).parked ?? null);
  expect(saved).toBeNull();
  await tab(page, "Today").click();
  await expect(page.locator("#thoughts")).toBeHidden();
});

test("Awkward: nothing saved shows 'No steps yet.' and a way to make some; damaged data does not break the tab", async ({ page }) => {
  await page.goto("/");
  await tab(page, "Plan").click();
  await expect(page.getByText("No steps yet.")).toBeVisible();
  await page.getByRole("button", { name: "Make some steps" }).click();
  await expect(page.locator("#paste-screen")).toBeVisible();
  await seed(page, { work: "junk", parked: [null, 5, { id: "a" }], recall: "nope" });
  await tab(page, "Plan").click();
  await expect(page.getByText("No steps yet.")).toBeVisible();
  await expect(page.locator("#plan-thoughts")).toHaveCount(0);
});

test("a tab press while What the app remembers is open leaves it and opens the tab", async ({ page }) => {
  await page.goto("/");
  await tab(page, "Me").click();
  await page.getByRole("button", { name: "What the app remembers" }).click();
  await expect(page.locator("#looking-screen")).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to What I did" }).first()).toBeVisible();
  await tab(page, "Talk").click();
  await expect(page.locator("#chat-screen")).toBeVisible();
  await expect(page.locator("#looking-screen")).toBeHidden();
  await expect(tab(page, "Talk")).toHaveAttribute("aria-selected", "true");
});

test("a tab press from a sub-view reaches every tab", async ({ page }) => {
  await page.goto("/");
  await tab(page, "Me").click();
  await page.getByRole("button", { name: "What the app remembers" }).click();
  await tab(page, "Plan").click();
  await expect(page.locator("#calendar-screen")).toBeVisible();
  await tab(page, "Me").click();
  await page.getByRole("button", { name: "What the app remembers" }).click();
  await tab(page, "Today").click();
  await expect(page.locator("#paste-screen")).toBeVisible();
});

test("Awkward: the profile still asks before a tab press throws away unsaved changes", async ({ page }) => {
  await page.goto("/");
  await tab(page, "Me").click();
  await page.getByRole("button", { name: "My profile" }).click();
  await expect(page.locator("#profile-screen")).toBeVisible();
  await page.locator("#profile-screen textarea").first().fill("something I typed");
  await tab(page, "Talk").click();
  await expect(page.locator("#profile-screen")).toBeVisible();
});

test("Load a copy does not bring the welcome note back", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#welcome-note")).toBeVisible();
  await page.getByRole("button", { name: "Hide this note" }).click();
  await tab(page, "Me").click();
  const copy = { app: "focus-app-copy", fileVersion: 1, data: { parked: [{ id: 7, text: "different", date: "2026-11-20T10:00:00.000Z" }] } };
  await page.locator("#me-file").setInputFiles({ name: "copy.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(copy)) });
  await page.getByRole("button", { name: "Yes, replace what is saved" }).click();
  await expect(page.locator("#me-status")).toContainText("Your copy is loaded");
  await tab(page, "Today").click();
  await expect(page.locator("#welcome-note")).toBeHidden();
});

test("Awkward: Load a copy on a device that never hid the note also keeps it away", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#welcome-note")).toBeVisible();
  await tab(page, "Me").click();
  const copy = { app: "focus-app-copy", fileVersion: 1, data: { parked: [{ id: 7, text: "different", date: "2026-11-20T10:00:00.000Z" }] } };
  await page.locator("#me-file").setInputFiles({ name: "copy.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(copy)) });
  await page.getByRole("button", { name: "Yes, replace what is saved" }).click();
  await expect(page.locator("#me-status")).toContainText("Your copy is loaded");
  await tab(page, "Today").click();
  await expect(page.locator("#welcome-note")).toBeHidden();
});
