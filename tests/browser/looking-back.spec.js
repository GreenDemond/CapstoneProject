import { test, expect } from "@playwright/test";

// Looking back (design/looking-back-w6.md): Did that help, What I did, the weekly lines, and
// What the app remembers with Delete.
// These tests were written but NOT run when the slice was built (Chrome could not start in that sandbox).

const STEPS = "1. Find three sources\n2. Take notes\n3. Write a draft";
const GUARD = 450; // the work screen ignores a second tap within 400 ms

async function startKind(page, kindName = "Essay", text = STEPS) {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill(text);
  await page.getByRole("button", { name: kindName, exact: true }).click();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.locator(".current-step")).toBeVisible();
}

async function stored(page, name) {
  return page.evaluate((section) => {
    const raw = globalThis.localStorage.getItem("focusapp.v1");
    return raw ? JSON.parse(raw)[section] ?? null : null;
  }, name);
}

async function pressDone(page) {
  await page.waitForTimeout(GUARD);
  await page.getByRole("button", { name: "Done", exact: true }).click();
}

// ---- Did that help ----

test("Did that help: one tap saves a mark and the card goes", async ({ page }) => {
  await startKind(page);
  await expect(page.getByText("Did that way of working help?")).toHaveCount(0);
  await pressDone(page);
  await expect(page.getByText("Did that way of working help?")).toBeVisible();
  await expect(page.locator(".current-step")).toHaveText("Take notes");
  await page.getByRole("button", { name: "It helped", exact: true }).click();
  await expect(page.getByText("Noted.")).toBeVisible();
  await expect(page.getByText("Did that way of working help?")).toHaveCount(0);
  const helps = await stored(page, "helps");
  expect(helps).toHaveLength(1);
  expect(helps[0].answer).toBe("yes");
  expect(helps[0].timer).toBe(0);
  await expect(page.locator(".current-step")).toHaveText("Take notes");
});

test("Did that help: Not now saves nothing, and ignoring the card costs nothing", async ({ page }) => {
  await startKind(page);
  await pressDone(page);
  await page.getByRole("button", { name: "Not now", exact: true }).click();
  await expect(page.getByText("Did that way of working help?")).toHaveCount(0);
  expect(await stored(page, "helps")).toBeNull();
  // Ignore the next card and carry on: the step moves on and there is one card, for the newest step.
  await pressDone(page);
  await expect(page.getByText("Did that way of working help?")).toBeVisible();
  await expect(page.locator(".current-step")).toHaveText("Write a draft");
  await pressDone(page);
  await expect(page.getByRole("heading", { name: "All your steps are done." })).toBeVisible();
  // After the last step the card is still only a question.
  await page.getByRole("button", { name: "A bit", exact: true }).click();
  expect((await stored(page, "helps"))[0].answer).toBe("bit");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.locator("#paste-screen")).toBeVisible();
});

test("Did that help: Drifted also asks, and one tap saves one mark", async ({ page }) => {
  await startKind(page);
  await page.getByRole("button", { name: "Drifted", exact: true }).click();
  await page.locator("#split-text").fill("Find one source");
  await page.getByRole("button", { name: "Start this part" }).click();
  await expect(page.getByText("Did that way of working help?")).toBeVisible();
  await page.getByRole("button", { name: "Not really", exact: true }).click();
  await expect(page.getByText("Did that way of working help?")).toHaveCount(0);
  expect(await stored(page, "helps")).toHaveLength(1);
});

test("Did that help: the countdown length goes with the mark", async ({ page }) => {
  await startKind(page);
  await page.getByLabel("Show a countdown").check();
  await page.getByRole("button", { name: "25 minutes" }).click();
  await pressDone(page);
  await page.getByRole("button", { name: "It helped", exact: true }).click();
  expect((await stored(page, "helps"))[0].timer).toBe(25);
});

// ---- What I did ----

test("What I did: empty at first, with a calm line", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "What I did", exact: true }).click();
  await expect(page.locator("#looking-screen")).toBeVisible();
  await expect(page.locator("#paste-screen")).toBeHidden();
  await expect(page.getByText("Nothing yet. After you work on a step, you'll see it here.")).toBeVisible();
  await expect(page.getByText("A quiet week.")).toBeVisible();
  await page.locator("#looking-screen").getByRole("button", { name: "Back to home" }).click();
  await expect(page.locator("#paste-screen")).toBeVisible();
});

test("What I did: Done and Drifted both count as finished, with weekly lines", async ({ page }) => {
  await startKind(page);
  await pressDone(page);
  await page.waitForTimeout(GUARD);
  await page.getByRole("button", { name: "Drifted", exact: true }).click();
  await page.locator("#split-text").fill("Jot two lines");
  await page.getByRole("button", { name: "Start this part" }).click();
  await page.getByRole("button", { name: "Back to home" }).click();
  await page.getByRole("button", { name: "What I did", exact: true }).click();
  await expect(page.getByText("2 steps finished")).toBeVisible();
  await expect(page.getByText("1 step made smaller, then finished")).toBeVisible();
  await expect(page.getByText("You finished 2 steps.")).toBeVisible();
  await expect(page.getByText("1 step started big and got smaller. That counts too.")).toBeVisible();
  // Nothing shaming or ranking.
  const text = await page.locator("#looking-screen").innerText();
  expect(text).not.toMatch(/missed|streak|behind|score|grade|rank/i);
  // Still there after a refresh.
  await page.reload();
  await page.getByRole("button", { name: "What I did", exact: true }).click();
  await expect(page.getByText("2 steps finished")).toBeVisible();
});

test("What I did: damaged saved data does not crash the screen", async ({ page }) => {
  await page.addInitScript(() => {
    globalThis.localStorage.setItem("focusapp.v1", JSON.stringify({ schemaVersion: 1, moments: "oops", helps: [null, 3], parked: { a: 1 } }));
  });
  await page.goto("/");
  await page.getByRole("button", { name: "What I did", exact: true }).click();
  await expect(page.getByText("Nothing yet. After you work on a step, you'll see it here.")).toBeVisible();
  await page.getByRole("button", { name: "What the app remembers" }).click();
  await expect(page.getByText("Nothing yet. As you use the app, the things you save will show up here.")).toBeVisible();
});

// ---- What the app remembers ----

async function seed(page) {
  await page.addInitScript(() => {
    if (globalThis.localStorage.getItem("seeded")) return;
    globalThis.localStorage.setItem("seeded", "1");
    const day = new Date().toISOString();
    globalThis.localStorage.setItem("focusapp.v1", JSON.stringify({
      schemaVersion: 1,
      profile: { goals: { today: "Read", week: "", month: "", year: "" }, gotInTheWay: [{ id: "n1", text: "<b>phone buzzed</b>", savedOn: "2026-11-20" }] },
      parked: [{ id: 1, text: "look up that song", date: day }, { id: 2, text: "email Sam", date: day }],
      recall: [{ id: 1, answer: "plants make sugar", date: day }],
      helps: [{ id: 1, answer: "yes", timer: 12, date: day }],
      moments: [{ id: 1, kind: "done", date: day }],
    }));
  });
  await page.goto("/");
  await page.getByRole("button", { name: "What I did", exact: true }).click();
  await page.getByRole("button", { name: "What the app remembers" }).click();
}

test("What the app remembers: lists everything saved, as plain text", async ({ page }) => {
  await seed(page);
  await expect(page.getByText("look up that song")).toBeVisible();
  await expect(page.getByText("email Sam")).toBeVisible();
  await expect(page.getByText("plants make sugar")).toBeVisible();
  await expect(page.getByText("Working with a 12-minute countdown: helped")).toBeVisible();
  await expect(page.getByText("<b>phone buzzed</b>")).toBeVisible();
  await expect(page.locator("#looking-body b")).toHaveCount(0);
  await expect(page.getByText("1 finished step kept as a count")).toBeVisible();
});

test("What the app remembers: Delete removes one line and keeps the rest", async ({ page }) => {
  await seed(page);
  await page.getByRole("button", { name: "Delete: look up that song" }).click();
  await expect(page.getByText("Deleted.")).toBeVisible();
  await expect(page.getByText("look up that song")).toHaveCount(0);
  await expect(page.getByText("email Sam")).toBeVisible();
  expect((await stored(page, "parked")).map((p) => p.text)).toEqual(["email Sam"]);
  await page.getByRole("button", { name: "Delete: plants make sugar" }).click();
  expect(await stored(page, "recall")).toBeNull();
  await page.getByRole("button", { name: "Delete: <b>phone buzzed</b>" }).click();
  await expect(page.getByText("<b>phone buzzed</b>")).toHaveCount(0);
  expect((await stored(page, "profile")).gotInTheWay).toEqual([]);
  expect((await stored(page, "profile")).goals.today).toBe("Read");
  await page.getByRole("button", { name: "Delete: the count of steps I finished" }).click();
  expect(await stored(page, "moments")).toBeNull();
});

test("What the app remembers: Delete all needs a second tap, and Keep it changes nothing", async ({ page }) => {
  await seed(page);
  await page.getByRole("button", { name: "Delete all of this" }).click();
  await expect(page.getByText("Delete all of this? It can't be undone.")).toBeVisible();
  expect(await stored(page, "parked")).toHaveLength(2);
  await page.getByRole("button", { name: "No, keep it" }).click();
  await expect(page.getByText("email Sam")).toBeVisible();
  expect(await stored(page, "parked")).toHaveLength(2);
  await page.getByRole("button", { name: "Delete all of this" }).click();
  await page.getByRole("button", { name: "Yes, delete it all" }).click();
  await expect(page.getByText("Everything is deleted.")).toBeVisible();
  await expect(page.getByText("Nothing yet. As you use the app, the things you save will show up here.")).toBeVisible();
  for (const name of ["parked", "recall", "helps", "moments"]) {
    expect(await stored(page, name)).toBeNull();
  }
  expect((await stored(page, "profile")).gotInTheWay).toEqual([]);
  // The counts screen is empty too.
  await page.getByRole("button", { name: "Back to What I did" }).first().click();
  await expect(page.getByText("Nothing yet. After you work on a step, you'll see it here.")).toBeVisible();
});

test("What the app remembers: a deleted thought is gone from the work screen too", async ({ page }) => {
  await startKind(page);
  await page.getByRole("button", { name: "Park a thought" }).click();
  await page.getByLabel("A thought for later").fill("ask about the quiz");
  await page.getByLabel("A thought for later").press("Enter");
  await page.getByRole("button", { name: "Back to home" }).click();
  await page.getByRole("button", { name: "What I did", exact: true }).click();
  await page.getByRole("button", { name: "What the app remembers" }).click();
  await page.getByRole("button", { name: "Delete: ask about the quiz" }).click();
  await page.getByRole("button", { name: "Back to What I did" }).first().click();
  await page.locator("#looking-screen").getByRole("button", { name: "Back to home" }).click();
  await page.getByRole("button", { name: "Start this step" }).click();
  await page.getByRole("button", { name: "Park a thought" }).click();
  await expect(page.locator(".parked-list li")).toHaveCount(0);
});
