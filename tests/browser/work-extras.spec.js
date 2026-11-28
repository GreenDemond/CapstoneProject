import { test, expect } from "@playwright/test";

// Work screen extras (design/work-extras-w4.md): the Stuck sheet's Ask a person, park a thought,
// and the recall question after reading and study steps.
// These tests were written but NOT run when the slice was built (Chrome could not start in that sandbox).

const STEPS = "1. Find three sources\n2. Take notes\n3. Write a draft";

async function startKind(page, kindName, text = STEPS) {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill(text);
  await page.getByRole("button", { name: kindName, exact: true }).click();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.locator(".current-step")).toBeVisible();
}

async function storedSection(page, name) {
  return page.evaluate((section) => {
    const raw = globalThis.localStorage.getItem("focusapp.v1");
    return raw ? JSON.parse(raw)[section] ?? null : null;
  }, name);
}

// ---- Stuck sheet ----

test("Stuck: Ask a person appears after two hints and copies the student's own words", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  await startKind(page, "Essay");
  await page.getByRole("button", { name: "Stuck", exact: true }).click();
  await expect(page.getByText("Stuck is okay.")).toBeVisible();
  await expect(page.getByText("Re-read the instructions")).toBeVisible();
  await expect(page.getByText("Ask a person", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Another hint" }).click();
  await expect(page.getByText("Ask a person", { exact: true })).toBeVisible();
  await expect(page.getByLabel("I'm on:")).toHaveValue("Find three sources");
  await page.getByLabel("I tried:").fill("Skimmed the first page");
  // Typing is kept when another hint is shown.
  await page.getByRole("button", { name: "Another hint" }).click();
  await expect(page.getByLabel("I tried:")).toHaveValue("Skimmed the first page");
  await page.getByRole("button", { name: "Copy my question" }).click();
  await expect(page.locator("#ask-status")).not.toHaveText("");
  const status = await page.locator("#ask-status").textContent();
  if (status === "Copied.") {
    const copied = await page.evaluate(() => globalThis.navigator.clipboard.readText());
    expect(copied).toBe("I'm on: Find three sources\nI tried: Skimmed the first page");
  } else {
    await expect(page.locator("#ask-copy-fallback")).toHaveValue("I'm on: Find three sources\nI tried: Skimmed the first page");
  }
  // The steps are not changed by Stuck.
  await page.getByRole("button", { name: "Back to the step" }).click();
  await expect(page.locator(".current-step")).toHaveText("Find three sources");
  await expect(page.getByText(/^Step 1 of \d+$/)).toBeVisible();
});

test("Stuck: nothing to copy until the student writes something, and a failed copy shows the text", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("blocked")) },
      configurable: true,
    });
  });
  await startKind(page, "Essay");
  await page.getByRole("button", { name: "Stuck", exact: true }).click();
  await page.getByRole("button", { name: "Another hint" }).click();
  await page.getByRole("button", { name: "Copy my question" }).click();
  await expect(page.locator("#ask-status")).toHaveText("Write a little in I tried or I don't get first.");
  await expect(page.locator("#ask-copy-fallback")).toHaveCount(0);
  await page.getByLabel("I don't get:").fill("what the question wants");
  await page.getByRole("button", { name: "Copy my question" }).click();
  await expect(page.locator("#ask-copy-fallback")).toHaveValue("I'm on: Find three sources\nI don't get: what the question wants");
  await expect(page.locator("#ask-status")).toContainText("Copying did not work here");
});

test("Stuck: a new step starts with an empty question, and the last hint still offers Ask a person", async ({ page }) => {
  await startKind(page, "Essay");
  await page.getByRole("button", { name: "Stuck", exact: true }).click();
  for (let i = 0; i < 5; i += 1) {
    await page.getByRole("button", { name: "Another hint" }).click();
  }
  await expect(page.getByText("That's all the hints for now.")).toBeVisible();
  await expect(page.getByText("Ask a person", { exact: true })).toBeVisible();
  await page.getByLabel("I tried:").fill("something");
  await page.getByRole("button", { name: "Back to the step" }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Stuck", exact: true }).click();
  await page.getByRole("button", { name: "Another hint" }).click();
  await expect(page.getByLabel("I'm on:")).toHaveValue("Take notes");
  await expect(page.getByLabel("I tried:")).toHaveValue("");
});

// ---- Park a thought ----

test("Park a thought: saved on this device, step unchanged, can be removed", async ({ page }) => {
  await startKind(page, "Essay");
  await expect(page.getByLabel("A thought for later")).toHaveCount(0);
  await page.getByRole("button", { name: "Park a thought" }).click();
  await page.getByLabel("A thought for later").fill("look up that song");
  await page.getByLabel("A thought for later").press("Enter");
  await expect(page.getByText("Saved for later.")).toBeVisible();
  await expect(page.locator(".parked-list li")).toHaveText(/look up that song/);
  await expect(page.locator(".current-step")).toHaveText("Find three sources");
  const saved = await storedSection(page, "parked");
  expect(saved).toHaveLength(1);
  expect(saved[0].text).toBe("look up that song");
  // Parked thoughts do not change the work.
  await expect(page.getByText(/^Step 1 of \d+$/)).toBeVisible();
  await page.getByRole("button", { name: "Remove parked thought 1" }).click();
  await expect(page.locator(".parked-list li")).toHaveCount(0);
  expect(await storedSection(page, "parked")).toBeNull();
});

test("Park a thought: blank is refused, long text is cut, text with tags stays text", async ({ page }) => {
  await startKind(page, "Essay");
  await page.getByRole("button", { name: "Park a thought" }).click();
  await page.getByRole("button", { name: "Save thought" }).click();
  await expect(page.getByText("Write a few words first.")).toBeVisible();
  await page.getByLabel("A thought for later").fill("<b>bold</b> idea");
  await page.getByRole("button", { name: "Save thought" }).click();
  await expect(page.locator(".parked-list li")).toContainText("<b>bold</b> idea");
  await expect(page.locator(".parked-list li b")).toHaveCount(0);
  await page.getByLabel("A thought for later").fill("x".repeat(400));
  await page.getByRole("button", { name: "Save thought" }).click();
  const saved = await storedSection(page, "parked");
  expect(saved).toHaveLength(2);
  expect(saved[0].text).toHaveLength(300);
});

test("Park a thought: a half-typed thought survives Show all my steps; damaged saved data is ignored", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    globalThis.localStorage.setItem("focusapp.v1", JSON.stringify({ schemaVersion: 1, parked: "junk", recall: [null, 5] }));
  });
  await startKind(page, "Essay");
  await page.getByRole("button", { name: "Park a thought" }).click();
  await expect(page.locator(".parked-list li")).toHaveCount(0);
  await page.getByLabel("A thought for later").fill("half a thought");
  await page.locator("#work-list-toggle").click();
  await expect(page.getByLabel("A thought for later")).toHaveValue("half a thought");
});

// ---- Recall question ----

test("Recall: after a study step the student can write one thing, and it is saved", async ({ page }) => {
  await startKind(page, "Studying for a test");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByText("One thing you just learned?", { exact: true })).toBeVisible();
  await expect(page.getByText("Nothing is graded")).toBeVisible();
  await page.getByLabel("One thing you just learned?").fill("Plants make sugar from light");
  await page.getByRole("button", { name: "Save answer" }).click();
  await expect(page.locator(".current-step")).toHaveText("Take notes");
  await expect(page.getByText(/^Step 2 of \d+$/)).toBeVisible();
  const saved = await storedSection(page, "recall");
  expect(saved).toHaveLength(1);
  expect(saved[0].answer).toBe("Plants make sugar from light");
});

test("Recall: Skip and blank both go on; blank Save asks for a few words; the last step still finishes", async ({ page }) => {
  await startKind(page, "Studying for a test", "1. Read page one\n2. Read page two");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Save answer" }).click();
  await expect(page.getByText("Write a few words, or tap Skip.")).toBeVisible();
  await expect(page.getByLabel("One thing you just learned?")).toBeFocused();
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.locator(".current-step")).toHaveText("Read page two");
  expect(await storedSection(page, "recall")).toBeNull();
  // Keep finishing steps: each one asks, each can be skipped, and the last one still reaches the end.
  for (let i = 0; i < 30 && (await page.getByText("All your steps are done.").count()) === 0; i += 1) {
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(page.getByText("One thing you just learned?", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Skip" }).click();
  }
  await expect(page.getByText("All your steps are done.")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
});

test("Recall: not asked after an essay step", async ({ page }) => {
  await startKind(page, "Essay");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByText("One thing you just learned?")).toHaveCount(0);
  await expect(page.getByText(/^Step 2 of \d+$/)).toBeVisible();
});

test("Recall: a refresh while the question is open loses nothing but the question", async ({ page }) => {
  await startKind(page, "Reading");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByText("One thing you just learned?", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("One thing you just learned?")).toHaveCount(0);
  expect(await storedSection(page, "recall")).toBeNull();
});
