import { test, expect } from "@playwright/test";

// Slice W2 (design/step-count-w2.md): the step count choice and the good-step card.

async function paste(page, text, kind = "Reading") {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill(text);
  await page.getByRole("button", { name: kind }).click();
}

const LIST = "1. Find sources and take notes\n2. study for the test\n3. Write a draft\n4. Check the facts\n5. Hand it in today";

test("nothing picked gives five steps; 3 steps shows three and Show more steps adds the rest", async ({ page }) => {
  await paste(page, "Read chapter 2 and answer the questions.");
  await expect(page.getByLabel("5 steps")).toBeChecked();
  await page.getByRole("button", { name: "Show my steps" }).click();
  await expect(page.locator("#steps li")).toHaveCount(5);

  await page.getByLabel("3 steps").check();
  await page.getByRole("button", { name: "Show my steps" }).click();
  await expect(page.locator("#steps li")).toHaveCount(3);
  await expect(page.locator("#showing-note")).toHaveText("Showing 3 of 7. Show more steps adds the rest.");
  await page.getByRole("button", { name: "Show more steps" }).click();
  await expect(page.locator("#steps li")).toHaveCount(7);
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByText("Step 1 of 7")).toBeVisible();
});

test("8 steps shows eight of a longer list, and Start runs exactly the eight", async ({ page }) => {
  await paste(page, LIST);
  await page.getByLabel("8 steps").check();
  await page.getByRole("button", { name: "Show my steps" }).click();
  await expect(page.locator("#steps li")).toHaveCount(8);
  await expect(page.locator("#showing-note")).toHaveText("Showing 8 of 12. Show more steps adds the rest.");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByText("Step 1 of 8")).toBeVisible();
});

test("the two-minute start keeps the picked count", async ({ page }) => {
  await paste(page, LIST);
  await page.getByLabel("3 steps").check();
  await page.getByRole("button", { name: "Show my steps" }).click();
  await page.getByRole("button", { name: "Give me a two-minute start" }).click();
  await expect(page.locator("#steps li")).toHaveCount(3);
  await expect(page.locator("#steps li").first()).toContainText("Set a timer for 2 minutes");
});

test("a refresh goes back to 5 steps; the pick is not saved", async ({ page }) => {
  await paste(page, LIST);
  await page.getByLabel("3 steps").check();
  await page.reload();
  await expect(page.getByLabel("5 steps")).toBeChecked();
});

test("the good-step card is folded, opens, and Got it hides it for good; Show step tips brings it back", async ({ page }) => {
  await paste(page, LIST);
  await page.getByRole("button", { name: "Show my steps" }).click();
  await page.getByRole("button", { name: "Change my steps" }).click();

  const toggle = page.getByRole("button", { name: "What makes a step easy to start" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText("It's small enough to begin in about two minutes.")).toBeHidden();
  await expect(page.getByRole("button", { name: "Got it" })).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("It starts with something you do, like read, write, list or find.")).toBeVisible();
  await expect(page.getByText("For example: Write down what the question asks for.")).toBeVisible();

  // The steps are untouched and still editable with the card open.
  await page.getByRole("button", { name: "Move step 2 down" }).click();
  await expect(page.getByLabel("Step 3", { exact: true })).toHaveValue("study for the test");

  await page.getByRole("button", { name: "Got it" }).click();
  await expect(toggle).toBeHidden();
  await expect(page.getByRole("button", { name: "Show step tips" })).toBeVisible();

  // Gone for good: after a refresh and a new plan the card stays hidden.
  await page.reload();
  await paste(page, LIST);
  await page.getByRole("button", { name: "Show my steps" }).click();
  await page.getByRole("button", { name: "Change my steps" }).click();
  await expect(page.getByRole("button", { name: "What makes a step easy to start" })).toBeHidden();
  await page.getByRole("button", { name: "Show step tips" }).click();
  await expect(page.getByText("It's small enough to begin in about two minutes.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Show step tips" })).toBeHidden();
});

test("damaged saved tips data shows the card and does not crash", async ({ page }) => {
  await page.addInitScript(() => {
    globalThis.localStorage.setItem("focusapp.v1", JSON.stringify({ schemaVersion: 1, tips: "yes" }));
  });
  await paste(page, LIST);
  await page.getByRole("button", { name: "Show my steps" }).click();
  await page.getByRole("button", { name: "Change my steps" }).click();
  await expect(page.getByRole("button", { name: "What makes a step easy to start" })).toBeVisible();
});

test("the card is folded again each time the editor opens", async ({ page }) => {
  await paste(page, LIST);
  await page.getByRole("button", { name: "Show my steps" }).click();
  await page.getByRole("button", { name: "Change my steps" }).click();
  await page.getByRole("button", { name: "What makes a step easy to start" }).click();
  await page.getByRole("button", { name: "Leave my steps as they were" }).click();
  await page.getByRole("button", { name: "Change my steps" }).click();
  await expect(page.getByRole("button", { name: "What makes a step easy to start" })).toHaveAttribute("aria-expanded", "false");
});
