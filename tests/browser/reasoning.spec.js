import { test, expect } from "@playwright/test";
import { KEY, standIn, openSettings, addOther, nextButton } from "./helpers/ai.js";
import { openScreen } from "./helpers/nav.js";

// Each helper has a thinking effort (None, Low, Medium, High), Low by default. Stand-in services only:
// no real key or service is used.
const OPENROUTER = { host: "https://openrouter.ai", base: "/api/v1" };
const MUST_THINK = "This AI always thinks first, so thinking can't be turned off.";
const IGNORED = "This AI doesn't take a thinking setting, so it used its own.";
const LABEL = "How hard should the AI think?";

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
  await openScreen(page, "Talk it through");
  await page.getByRole("button", { name: "Essay" }).click();
}

async function say(page, text) {
  await page.getByLabel("Your message").fill(text);
  await page.getByRole("button", { name: "Send", exact: true }).click();
}

async function chooseEffort(page, option) {
  await page.getByRole("button", { name: /^Manage/ }).click();
  await page.getByLabel(LABEL).selectOption({ label: option });
  await expect(page.getByRole("status").last()).toContainText("Saved.");
  await page.getByRole("button", { name: "Back" }).first().click();
}

test("a new OpenRouter helper: the check and the chat send effort low", async ({ page }) => {
  const seen = await standIn(page, OPENROUTER);
  await openSettings(page);
  await addOpenRouter(page);
  expect(bodies(seen)[0].reasoning).toEqual({ effort: "low" });
  await toChat(page);
  await say(page, "I need help starting");
  await expect(page.getByRole("log", { name: "Chat" })).toContainText("ok");
  expect(bodies(seen).at(-1).reasoning).toEqual({ effort: "low" });
});

test("Manage: the choice is there with its hint, defaults to Low, and None and High are sent", async ({ page }) => {
  const seen = await standIn(page, OPENROUTER);
  await openSettings(page);
  await addOpenRouter(page);
  await page.getByRole("button", { name: /^Manage/ }).click();
  const select = page.getByLabel(LABEL);
  await expect(select).toHaveValue("low");
  await expect(select.locator("option")).toHaveText(["None (fastest)", "Low", "Medium", "High (slowest, uses more credit)"]);
  await expect(page.getByText("Low is a good balance. Not every AI supports this; if it doesn't, it uses its own setting.")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).first().click();

  await chooseEffort(page, "None (fastest)");
  await toChat(page);
  await say(page, "hello");
  await expect(page.getByRole("log", { name: "Chat" })).toContainText("ok");
  expect(bodies(seen).at(-1).reasoning).toEqual({ effort: "none" });

  await page.getByRole("button", { name: "Back" }).click();
  await openScreen(page, "Settings");
  await chooseEffort(page, "High (slowest, uses more credit)");
  await toChat(page);
  const before = seen.chat.length;
  await say(page, "again");
  await expect.poll(() => seen.chat.length).toBeGreaterThan(before);
  expect(bodies(seen).at(-1).reasoning).toEqual({ effort: "high" });
});

test("the chosen effort is still there after a reload", async ({ page }) => {
  await standIn(page, OPENROUTER);
  await openSettings(page);
  await addOpenRouter(page);
  await page.getByRole("button", { name: /^Manage/ }).click();
  await page.getByLabel(LABEL).selectOption({ label: "Medium" });
  await expect(page.getByRole("status").last()).toContainText("Saved.");
  await page.reload();
  await openScreen(page, "Settings");
  await page.getByRole("button", { name: /^Manage/ }).click();
  await expect(page.getByLabel(LABEL)).toHaveValue("medium");
});

test("another service: None sends all three fields, Medium sends reasoning and reasoning_effort only", async ({ page }) => {
  const seen = await standIn(page);
  await openSettings(page);
  await addOther(page);
  await chooseEffort(page, "None (fastest)");
  await toChat(page);
  await say(page, "hello");
  await expect(page.getByRole("log", { name: "Chat" })).toContainText("ok");
  const none = bodies(seen).at(-1);
  expect(none.reasoning).toEqual({ effort: "none" });
  expect(none.reasoning_effort).toBe("none");
  expect(none.chat_template_kwargs).toEqual({ enable_thinking: false });

  await page.getByRole("button", { name: "Back" }).click();
  await openScreen(page, "Settings");
  await chooseEffort(page, "Medium");
  await toChat(page);
  const before = seen.chat.length;
  await say(page, "again");
  await expect.poll(() => seen.chat.length).toBeGreaterThan(before);
  const medium = bodies(seen).at(-1);
  expect(medium.reasoning).toEqual({ effort: "medium" });
  expect(medium.reasoning_effort).toBe("medium");
  expect(medium).not.toHaveProperty("chat_template_kwargs");
});

test("a service that rejects the fields with None: still answers via the retry, says so once", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await addOther(page);
  await chooseEffort(page, "None (fastest)");
  const seen = await standIn(page, { rejectReasoning: true });
  await toChat(page);
  await say(page, "first");
  await expect(page.getByRole("log", { name: "Chat" })).toContainText("ok");
  await expect(page.getByText(MUST_THINK)).toBeVisible();
  const sent = bodies(seen);
  expect(sent.length).toBe(2);
  expect(sent[0]).toHaveProperty("reasoning_effort");
  expect(sent[1]).not.toHaveProperty("reasoning_effort");
  expect(sent[1]).not.toHaveProperty("chat_template_kwargs");
  await say(page, "second");
  await expect(page.getByRole("log", { name: "Chat" }).getByText("ok", { exact: true })).toHaveCount(2);
  await expect(page.getByText(MUST_THINK)).toHaveCount(0);
  // The refusal is remembered: the second message is sent once, without the fields.
  const after = bodies(seen);
  expect(after.length).toBe(3);
  expect(after[2]).not.toHaveProperty("reasoning_effort");
});

test("a service that rejects the fields with Low: still answers via the retry, says so once", async ({ page }) => {
  await standIn(page, OPENROUTER);
  await openSettings(page);
  await addOpenRouter(page);
  const seen = await standIn(page, { ...OPENROUTER, rejectReasoning: true });
  await toChat(page);
  await say(page, "first");
  await expect(page.getByRole("log", { name: "Chat" })).toContainText("ok");
  await expect(page.getByText(IGNORED)).toBeVisible();
  await expect(page.getByText(MUST_THINK)).toHaveCount(0);
  const sent = bodies(seen);
  expect(sent.length).toBe(2);
  expect(sent[0]).toHaveProperty("reasoning");
  expect(sent[1]).not.toHaveProperty("reasoning");
  await say(page, "second");
  await expect(page.getByRole("log", { name: "Chat" }).getByText("ok", { exact: true })).toHaveCount(2);
  await expect(page.getByText(IGNORED)).toHaveCount(0);
});

test("Suggest some to start sends the effort too, and says so once if the AI refuses it", async ({ page }) => {
  await standIn(page, OPENROUTER);
  await openSettings(page);
  await addOpenRouter(page);
  const steps = "Read the question\nWrite one line";
  let seen = await standIn(page, { ...OPENROUTER, content: steps });
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByLabel("Assignment text").fill("Write an essay about owls");
  await page.getByRole("button", { name: "Essay" }).click();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await expect(page.locator("#message")).toContainText("Suggested by an AI");
  expect(bodies(seen).at(-1).reasoning).toEqual({ effort: "low" });
  await expect(page.locator("#message")).not.toContainText(IGNORED);

  seen = await standIn(page, { ...OPENROUTER, content: steps, rejectReasoning: true });
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await expect(page.locator("#message")).toContainText(IGNORED);
  expect(bodies(seen).length).toBe(2);
});
