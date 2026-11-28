import { test, expect } from "@playwright/test";

async function openSteps(page, text) {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill(text);
  await page.getByRole("button", { name: "Reading" }).click();
  await page.getByRole("button", { name: "Show my steps" }).click();
  await expect(page.locator("#steps li").first()).toBeVisible();
}

const LIST = "1. Find sources and take notes\n2. study for the test\n3. Write a draft\n4. Check the facts\n5. Hand it in today";

test("change, split, move, add Get ready and Put it away, then Start runs the edited steps", async ({ page }) => {
  await openSteps(page, LIST);
  await page.getByRole("button", { name: "Change my steps" }).click();
  await expect(page.getByRole("heading", { name: "Change my steps" })).toBeVisible();

  // Questions, never orders.
  await expect(page.getByText("This looks like more than one step. Split it?")).toBeVisible();
  await expect(page.getByText("What is the first small thing you would do for this step?")).toBeVisible();

  await page.getByRole("button", { name: "Split step 1" }).click();
  await expect(page.getByLabel("Step 1", { exact: true })).toHaveValue("Find sources");
  await expect(page.getByLabel("Step 2", { exact: true })).toHaveValue("Take notes");

  await page.getByLabel("Step 3", { exact: true }).fill("Make a list of the terms I need to know");
  await expect(page.getByText("What is the first small thing you would do for this step?")).toBeHidden();

  await page.getByRole("button", { name: "Move step 4 up" }).click();
  await expect(page.getByLabel("Step 3", { exact: true })).toHaveValue("Write a draft");

  await page.getByRole("button", { name: "Add a Get ready step" }).click();
  await page.getByRole("button", { name: "Add a Put it away step" }).click();
  await expect(page.getByRole("button", { name: "Add a Get ready step" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Add a Put it away step" })).toBeHidden();
  await page.getByRole("button", { name: "Remove step 7" }).click();

  await page.getByRole("button", { name: "Done changing" }).click();
  const steps = page.locator("#steps li");
  await expect(steps).toHaveText([
    "Get ready: gather what you need and clear a space to work",
    "Find sources",
    "Take notes",
    "Write a draft",
    "Make a list of the terms I need to know",
    "Check the facts",
    "Put it away: save your work and put your things away",
  ]);
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByText("Step 1 of 7")).toBeVisible();
  await expect(page.locator(".current-step")).toHaveText("Get ready: gather what you need and clear a space to work");
});

test("keep as one hides the question; join puts two steps together", async ({ page }) => {
  await openSteps(page, LIST);
  await page.getByRole("button", { name: "Change my steps" }).click();
  await page.getByRole("button", { name: "Keep step 1 as one" }).click();
  await expect(page.getByText("This looks like more than one step. Split it?")).toBeHidden();
  await page.getByRole("button", { name: "Join step 2 with the next" }).click();
  await expect(page.getByLabel("Step 2", { exact: true })).toHaveValue("study for the test; Write a draft");
});

test("removing every step asks for one; blank steps are dropped; leaving keeps the old steps", async ({ page }) => {
  await openSteps(page, LIST);
  await page.getByRole("button", { name: "Change my steps" }).click();
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: "Remove step 1" }).click();
  }
  await page.getByRole("button", { name: "Done changing" }).click();
  await expect(page.getByText("Add at least one step to go on.")).toBeVisible();
  await page.getByRole("button", { name: "Add a step" }).click();
  await page.getByRole("button", { name: "Add a step" }).click();
  await page.getByLabel("Step 2", { exact: true }).fill("<b>Just this</b>");
  await page.getByRole("button", { name: "Done changing" }).click();
  await expect(page.locator("#steps li")).toHaveText(["<b>Just this</b>"]);

  await page.getByRole("button", { name: "Change my steps" }).click();
  await page.getByLabel("Step 1", { exact: true }).fill("Something else entirely");
  await page.getByRole("button", { name: "Leave my steps as they were" }).click();
  await expect(page.locator("#steps li")).toHaveText(["<b>Just this</b>"]);
});

test("a step cannot be split when it is too short, and a refresh mid-edit goes back to the paste screen", async ({ page }) => {
  await openSteps(page, "1. Read it\n2. Do it");
  await page.getByRole("button", { name: "Change my steps" }).click();
  await page.getByRole("button", { name: "Split step 1" }).click();
  await expect(page.getByLabel("Step 1", { exact: true })).toHaveValue("Read it");
  await page.reload();
  await expect(page.getByRole("button", { name: "Show my steps" })).toBeVisible();
  await expect(page.locator("#steps-editor")).toBeHidden();
});

test("pressing Show my steps again closes the editor", async ({ page }) => {
  await openSteps(page, LIST);
  await page.getByRole("button", { name: "Change my steps" }).click();
  await page.getByRole("button", { name: "Show my steps" }).click();
  await expect(page.locator("#steps-editor")).toBeHidden();
  await expect(page.locator("#steps li").first()).toBeVisible();
});
