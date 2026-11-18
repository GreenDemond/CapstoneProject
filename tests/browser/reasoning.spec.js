import { test, expect } from "@playwright/test";
import { KEY, standIn, openSettings, addOther, nextButton } from "./helpers/ai.js";

// Thinking is off by default for OpenRouter helpers. Stand-in services only: no real key or service is used.
const OPENROUTER = { host: "https://openrouter.ai", base: "/api/v1" };
const MUST_THINK = "This AI always thinks first, so thinking can't be turned off.";

async function addOpenRouter(page) {
  await page.getByRole("button", { name: "Add an AI helper" }).click();
  await page.getByLabel(/^OpenRouter/).check();
  await nextButton(page).click();
  await page.getByLabel("Your key").fill(KEY);
  await nextButton(page).click();
  await nextButton(page).click();
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Done" }).click();
}

const bodies = (seen) => seen.chat.map((c) => JSON.parse(c.body));

async function toChat(page) {
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "Talk it through" }).click();
  await page.getByRole("button", { name: "Essay" }).click();
}

async function say(page, text) {
  await page.getByLabel("Your message").fill(text);
  await page.getByRole("button", { name: "Send", exact: true }).click();
}

test("a new OpenRouter helper: the check and the chat ask for no thinking", async ({ page }) => {
  const seen = await standIn(page, OPENROUTER);
  await openSettings(page);
  await addOpenRouter(page);
  expect(bodies(seen)[0].reasoning).toEqual({ effort: "none" });
  await toChat(page);
  await say(page, "I need help starting");
  await expect(page.getByRole("log", { name: "Chat" })).toContainText("ok");
  expect(bodies(seen).at(-1).reasoning).toEqual({ effort: "none" });
});

test("ticking the box on Manage saves at once and stops sending the setting", async ({ page }) => {
  const seen = await standIn(page, OPENROUTER);
  await openSettings(page);
  await addOpenRouter(page);
  await page.getByRole("button", { name: /^Manage/ }).click();
  const box = page.getByLabel("Let the AI think before answering");
  await expect(box).not.toBeChecked();
  await expect(page.getByText("Off is faster and uses less of your credit. Some AIs always think.")).toBeVisible();
  await box.check();
  await expect(page.getByRole("status").last()).toContainText("Saved.");
  await page.reload();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: /^Manage/ }).click();
  await expect(page.getByLabel("Let the AI think before answering")).toBeChecked();
  await page.getByRole("button", { name: "Back" }).first().click();
  await toChat(page);
  await say(page, "hello");
  await expect(page.getByRole("log", { name: "Chat" })).toContainText("ok");
  expect(bodies(seen).at(-1)).not.toHaveProperty("reasoning");
});

test("another service never sends the setting and has no box", async ({ page }) => {
  const seen = await standIn(page);
  await openSettings(page);
  await addOther(page);
  await page.getByRole("button", { name: /^Manage/ }).click();
  await expect(page.getByLabel("Let the AI think before answering")).toHaveCount(0);
  await page.getByRole("button", { name: "Back" }).first().click();
  await toChat(page);
  await say(page, "hello");
  await expect(page.getByRole("log", { name: "Chat" })).toContainText("ok");
  for (const body of bodies(seen)) {
    expect(body).not.toHaveProperty("reasoning");
  }
});

test("an AI that must think: the chat still answers and says so once", async ({ page }) => {
  await standIn(page, OPENROUTER);
  await openSettings(page);
  await addOpenRouter(page);
  const seen = await standIn(page, { ...OPENROUTER, rejectReasoning: true });
  await toChat(page);
  await say(page, "first");
  await expect(page.getByRole("log", { name: "Chat" })).toContainText("ok");
  await expect(page.getByText(MUST_THINK)).toBeVisible();
  const sent = bodies(seen);
  expect(sent.length).toBe(2);
  expect(sent[0]).toHaveProperty("reasoning");
  expect(sent[1]).not.toHaveProperty("reasoning");
  await say(page, "second");
  await expect(page.getByRole("log", { name: "Chat" }).getByText("ok", { exact: true })).toHaveCount(2);
  await expect(page.getByText(MUST_THINK)).toHaveCount(0);
});

test("Show my steps sends the setting too, and says so once if the AI must think", async ({ page }) => {
  await standIn(page, OPENROUTER);
  await openSettings(page);
  await addOpenRouter(page);
  const steps = "Read the question\nWrite one line";
  let seen = await standIn(page, { ...OPENROUTER, content: steps });
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByLabel("Assignment text").fill("Write an essay about owls");
  await page.getByRole("button", { name: "Essay" }).click();
  await page.getByRole("button", { name: "Show my steps" }).click();
  await expect(page.locator("#message")).toContainText("Suggested by an AI");
  expect(bodies(seen).at(-1).reasoning).toEqual({ effort: "none" });
  await expect(page.locator("#message")).not.toContainText(MUST_THINK);

  seen = await standIn(page, { ...OPENROUTER, content: steps, rejectReasoning: true });
  await page.getByRole("button", { name: "Show my steps" }).click();
  await expect(page.locator("#message")).toContainText(MUST_THINK);
  expect(bodies(seen).length).toBe(2);
});
