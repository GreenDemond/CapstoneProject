import { test, expect } from "@playwright/test";
import { KEY, standIn, openSettings, nextButton } from "./helpers/ai.js";
import { openScreen } from "./helpers/nav.js";

// Several OpenRouter helpers with different AIs and names (design/settings-ux.md, "Several helpers at one address").
// Stand-in service only: no real key or service is used.
const OPENROUTER = { host: "https://openrouter.ai", base: "/api/v1", models: ["vendor/alpha", "vendor/beta"] };

// Starts "Add an AI helper" for OpenRouter and gets as far as the pick step. The key is typed, or reused from a helper.
async function toPickStep(page, { reuseFrom = null } = {}) {
  await page.getByRole("button", { name: "Add an AI helper" }).click();
  await page.getByLabel(/^OpenRouter/).check();
  await nextButton(page).click();
  if (reuseFrom) {
    await page.getByRole("button", { name: `Use the same key as ${reuseFrom}` }).click();
  } else {
    await page.getByLabel("Your key").fill(KEY);
    await nextButton(page).click();
  }
  await expect(page.getByLabel("Pick an AI")).toBeVisible();
}

async function finishPick(page, model, name = "") {
  await page.getByLabel("Pick an AI").selectOption(model);
  await page.getByLabel("Name this helper (optional)").fill(name);
  await nextButton(page).click();
}

async function done(page) {
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Done" }).click();
}

test("two OpenRouter helpers with different AIs are both listed, named automatically or by hand", async ({ page }) => {
  await standIn(page, OPENROUTER);
  await openSettings(page);
  await toPickStep(page);
  await finishPick(page, "vendor/alpha");
  await done(page);
  await toPickStep(page);
  await finishPick(page, "vendor/beta", "Maths helper");
  await done(page);

  const cards = page.locator(".helper-card");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText("OpenRouter · alpha");
  await expect(cards.nth(1)).toContainText("Maths helper");
});

test("the same AI twice is refused, and a name already used is refused", async ({ page }) => {
  await standIn(page, OPENROUTER);
  await openSettings(page);
  await toPickStep(page);
  await finishPick(page, "vendor/alpha");
  await done(page);

  await toPickStep(page);
  await finishPick(page, "vendor/alpha");
  await expect(page.getByRole("status").last()).toContainText("You already have a helper for that AI at that address.");

  // The same step: a different AI but a name that is taken (any capitals).
  await page.getByLabel("Pick an AI").selectOption("vendor/beta");
  await page.getByLabel("Name this helper (optional)").fill("openrouter · ALPHA");
  await nextButton(page).click();
  await expect(page.getByRole("status").last()).toContainText("You already have a helper called that. Pick another name.");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator(".helper-card")).toHaveCount(1);
});

test("Rename refuses a name another helper has", async ({ page }) => {
  await standIn(page, OPENROUTER);
  await openSettings(page);
  await toPickStep(page);
  await finishPick(page, "vendor/alpha", "One");
  await done(page);
  await toPickStep(page);
  await finishPick(page, "vendor/beta", "Two");
  await done(page);
  await page.getByRole("button", { name: "Manage Two" }).click();
  await page.getByRole("button", { name: "Rename Two" }).click();
  await page.getByLabel("Name", { exact: true }).fill("one");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByRole("status").last()).toContainText("You already have a helper called that. Pick another name.");
});

test("the second helper can reuse the first one's key, which never shows on the page", async ({ page }) => {
  const seen = await standIn(page, OPENROUTER);
  await openSettings(page);
  await toPickStep(page);
  await finishPick(page, "vendor/alpha", "First");
  await done(page);

  await page.getByRole("button", { name: "Add an AI helper" }).click();
  await page.getByLabel(/^OpenRouter/).check();
  await nextButton(page).click();
  await expect(page.getByRole("button", { name: "Use the same key as First" })).toBeVisible();
  await page.getByRole("button", { name: "Use the same key as First" }).click();
  await expect(page.getByLabel("Pick an AI")).toBeVisible();
  await expect(page.getByRole("status").last()).toContainText("Using the key from First.");
  await finishPick(page, "vendor/beta", "Second");
  await done(page);

  // Each helper has its own saved copy: the second one's request carries the same key.
  const lastChat = seen.chat.at(-1);
  expect(JSON.parse(lastChat.body).model).toBe("vendor/beta");
  expect(lastChat.auth).toBe(`Bearer ${KEY}`);
  expect(await page.locator("body").innerText()).not.toContain(KEY);
  expect(await page.content()).not.toContain(KEY);
});

test("the chat has a Which AI helper? menu when two are ready, and the next message goes to the one chosen", async ({ page }) => {
  await standIn(page, OPENROUTER);
  await openSettings(page);
  await toPickStep(page);
  await finishPick(page, "vendor/alpha", "First");
  await done(page);
  await toPickStep(page, { reuseFrom: "First" });
  await finishPick(page, "vendor/beta", "Second");
  await done(page);

  const seen = await standIn(page, OPENROUTER);
  await page.getByRole("button", { name: "Back to home" }).click();
  await openScreen(page, "Talk it through");
  await page.getByRole("button", { name: "Essay" }).click();

  const menu = page.locator("#chat-helper");
  await expect(menu).toBeVisible();
  await expect(menu.locator("option")).toHaveCount(2);
  await expect(page.locator("#chat-goes-to")).toContainText("First");
  await menu.selectOption({ label: "Second" });
  await expect(page.locator("#chat-goes-to")).toContainText("Second");
  await expect(page.getByLabel("Search the web")).toBeVisible();

  await page.getByLabel("Your message").fill("how do I start");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".chat-log")).toContainText("ok");
  expect(JSON.parse(seen.chat.at(-1).body).model).toBe("vendor/beta");

  // Changing helper in the middle of the chat: the next message goes to the new one.
  await menu.selectOption({ label: "First" });
  await page.getByLabel("Your message").fill("and then");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect.poll(() => seen.chat.length).toBe(2);
  expect(JSON.parse(seen.chat.at(-1).body).model).toBe("vendor/alpha");

  // The home screen agrees with the chat's choice.
  await page.getByRole("button", { name: "Back to home" }).click();
  await expect(page.locator("#ai-choice").locator("option:checked")).toHaveText("First");
});

// A reused key belongs to its address: going back and typing another address drops it, so it is never sent there.
test("a reused key is dropped when the address changes", async ({ page }) => {
  await standIn(page, OPENROUTER);
  const other = await standIn(page);
  await openSettings(page);
  await toPickStep(page);
  await finishPick(page, "vendor/alpha", "First");
  await done(page);

  await page.getByRole("button", { name: "Add an AI helper" }).click();
  await page.getByLabel(/^OpenRouter/).check();
  await nextButton(page).click();
  await page.getByRole("button", { name: "Use the same key as First" }).click();
  // Back to the first step and switch to another address.
  for (let i = 0; i < 3 && !(await page.getByLabel(/^Another service/).isVisible()); i += 1) {
    await page.getByRole("button", { name: /^Back/ }).first().click();
  }
  await page.getByLabel(/^Another service/).check();
  await page.getByLabel("Its web address").fill("https://ai.example.test");
  await nextButton(page).click();
  await expect(page.getByLabel("Your key")).toHaveValue("");
  await nextButton(page).click();
  await expect(page.getByLabel("Your key")).toBeVisible();
  expect(other.chat.length + other.models.length).toBe(0);
});
