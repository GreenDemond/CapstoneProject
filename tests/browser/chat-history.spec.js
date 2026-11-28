import { test, expect } from "@playwright/test";
import { standIn, openSettings, addOther } from "./helpers/ai.js";

// Browser tests for saved chats (design/chat-history.md). A stand-in AI service answers; no real service is used.
const CHATS_KEY = "focusapp.v1.chats";

// Adds a working helper and opens Talk it through. `failChats` makes saving the chats key fail.
async function openChat(page, { failChats = false, ...options } = {}) {
  await standIn(page);
  if (failChats) {
    await page.addInitScript((key) => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function setItem(k, v) {
        if (k === key) throw new Error("full");
        return original.call(this, k, v);
      };
    }, CHATS_KEY);
  }
  await openSettings(page);
  await addOther(page);
  const seen = await standIn(page, options);
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "Talk it through" }).click();
  await expect(page.getByRole("heading", { name: "Talk it through" })).toBeVisible();
  return seen;
}

async function say(page, text) {
  await page.getByLabel("Your message").fill(text);
  await page.getByRole("button", { name: "Send", exact: true }).click();
}

async function reopen(page) {
  await page.reload();
  await page.getByRole("button", { name: "Talk it through" }).click();
}

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const seedChat = (id, usedOn, text) => ({
  id, kind: "essay", title: `Essay · ${text}`, startedOn: usedOn, usedOn,
  items: [{ who: "you", text }, { who: "ai", text: `answer to ${text}` }],
});
async function seed(page, chats) {
  await page.evaluate(([key, value]) => globalThis.localStorage.setItem(key, JSON.stringify({ schemaVersion: 1, chats: value })), [CHATS_KEY, chats]);
}

test("a refresh in the middle of today's chat keeps it", async ({ page }) => {
  await openChat(page, { content: "What do you know so far?" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "help me start");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await reopen(page);
  await expect(page.locator(".chat-you")).toHaveText(/help me start/);
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Essay" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/^Carry on:/)).toBeHidden();
  await expect(page.getByText("Your chats are saved on this device only.")).toBeVisible();
});

test("Back to home and returning keeps the chat, and a new message carries the old ones", async ({ page }) => {
  const seen = await openChat(page, { content: "ok" });
  await page.getByRole("button", { name: "Reading" }).click();
  await say(page, "first");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await page.getByRole("button", { name: "Back to home" }).click();
  await page.getByRole("button", { name: "Talk it through" }).click();
  await expect(page.locator(".chat-you")).toHaveCount(1);
  await say(page, "second");
  await expect(page.locator(".chat-ai")).toHaveCount(3);
  const roles = JSON.parse(seen.chat.at(-1).body).messages.map((m) => m.role);
  expect(roles).toEqual(["system", "user", "assistant", "user"]);
});

test("New chat starts empty and the old chat is in My chats, where it can be opened", async ({ page }) => {
  await openChat(page, { content: "ok" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "about scout");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await page.getByRole("button", { name: "New chat" }).click();
  await expect(page.locator(".chat-you")).toHaveCount(0);
  await say(page, "about math");
  await expect(page.locator(".chat-ai")).toHaveCount(2);

  await page.getByRole("button", { name: "My chats" }).click();
  await expect(page.getByRole("heading", { name: "My chats" })).toBeFocused();
  await expect(page.getByLabel("Your message")).toHaveCount(0);
  const rows = page.locator(".chat-open");
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText("about math");
  await expect(rows.first()).toContainText("Today");
  await expect(rows.last()).toContainText("Essay · about scout");
  await expect(page.getByText("Keeps your 10 most recent chats.")).toBeVisible();
  await expect(page.getByText("Anyone using this browser can see these.")).toBeVisible();

  await rows.last().click();
  await expect(page.getByRole("heading", { name: "Talk it through" })).toBeVisible();
  await expect(page.locator(".chat-you")).toHaveText(/about scout/);
  await expect(page.locator(".chat-you")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Essay" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "My chats" }).click();
  await page.getByRole("button", { name: "Back to the chat" }).click();
  await expect(page.locator(".chat-you")).toHaveText(/about scout/);
});

test("Delete in My chats needs a second tap, and Keep it deletes nothing", async ({ page }) => {
  await openChat(page, { content: "ok" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "one");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await page.getByRole("button", { name: "New chat" }).click();
  await say(page, "two");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await page.getByRole("button", { name: "My chats" }).click();
  await expect(page.locator(".chat-open")).toHaveCount(2);
  const del = page.getByRole("button", { name: /^Delete: / }).first();
  expect((await del.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await del.click();
  await expect(page.locator(".chat-open")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Yes, delete" })).toBeFocused();
  await page.getByRole("button", { name: "Keep it" }).click();
  await expect(page.locator(".chat-open")).toHaveCount(2);
  await page.getByRole("button", { name: /^Delete: / }).first().click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page.locator(".chat-open")).toHaveCount(1);
  await expect(page.locator(".chat-open")).toContainText("one");
  // The deleted chat was the open one: Back to the chat shows an empty chat, not the deleted one.
  await page.getByRole("button", { name: "Back to the chat" }).click();
  await expect(page.locator(".chat-you")).toHaveCount(0);
  await reopen(page);
  await expect(page.locator(".chat-you")).toHaveCount(1);
  await expect(page.locator(".chat-you")).toHaveText(/one/);
});

test("Delete all my chats needs a second tap and leaves an empty list", async ({ page }) => {
  await openChat(page, { content: "ok" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "one");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await page.getByRole("button", { name: "My chats" }).click();
  await page.getByRole("button", { name: "Delete all my chats" }).click();
  await expect(page.locator(".chat-open")).toHaveCount(1);
  await page.getByRole("button", { name: "Keep it" }).click();
  await expect(page.locator(".chat-open")).toHaveCount(1);
  await page.getByRole("button", { name: "Delete all my chats" }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page.getByText("No saved chats yet.")).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "All chats deleted." })).toBeVisible();
  expect(await page.evaluate((key) => JSON.parse(globalThis.localStorage.getItem(key)).chats, CHATS_KEY)).toEqual([]);
});

test("Delete all my chats also removes the chats backup, and a single delete is announced", async ({ page }) => {
  await openChat(page, { content: "ok" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "one");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await page.evaluate(() => globalThis.localStorage.setItem("focusapp.v1.chats.backup", "old copy"));
  await page.getByRole("button", { name: "My chats" }).click();
  await expect(page.getByRole("button", { name: /^Delete: Essay · one/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Essay · one, Today/ })).toBeVisible();
  await page.getByRole("button", { name: "Delete all my chats" }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page.getByText("No saved chats yet.")).toBeVisible();
  expect(await page.evaluate(() => globalThis.localStorage.getItem("focusapp.v1.chats.backup"))).toBeNull();
});

test("deleting one chat says so for screen readers", async ({ page }) => {
  await openChat(page, { content: "ok" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "one");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await page.getByRole("button", { name: "My chats" }).click();
  await page.getByRole("button", { name: /^Delete: / }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Chat deleted." })).toBeVisible();
});

// Rule 11 and design/chat-history.md: the message that made the adult line show is not kept.
test("a flagged message is gone after a refresh while the adult line stays", async ({ page }) => {
  const seen = await openChat(page, { content: "fine" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "my normal question");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await standIn(page, { content: "TRUSTED_ADULT" });
  await say(page, "very private worry");
  await expect(page.getByText("talk to an adult you trust")).toBeVisible();
  await expect(page.locator(".chat-you")).toHaveCount(2); // still on screen for this visit
  const stored = await page.evaluate((key) => globalThis.localStorage.getItem(key), CHATS_KEY);
  expect(stored).not.toContain("very private worry");
  expect(stored).toContain("talk to an adult you trust");
  await reopen(page);
  await expect(page.locator(".chat-you")).toHaveCount(1);
  await expect(page.locator("body")).not.toContainText("very private worry");
  await expect(page.getByText("If something serious is going on, please talk to an adult you trust.")).toBeVisible();
  expect(seen.chat).toHaveLength(1);
});

test("a chat whose first message was flagged is not saved and never gives the title", async ({ page }) => {
  await openChat(page, { content: "TRUSTED_ADULT" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "very private worry");
  await expect(page.getByText("talk to an adult you trust")).toBeVisible();
  await standIn(page, { content: "fine" });
  await say(page, "now the homework");
  await expect(page.locator(".chat-ai").last()).toContainText("fine");
  await page.getByRole("button", { name: "My chats" }).click();
  await expect(page.locator(".chat-open")).toHaveCount(1);
  await expect(page.locator(".chat-open")).toContainText("now the homework");
  await expect(page.locator("body")).not.toContainText("very private worry");
});

test("a chat from yesterday opens a fresh chat with a Carry on line that reopens it", async ({ page }) => {
  await openChat(page, { content: "ok" });
  await seed(page, [seedChat("old", daysAgo(1), "how do I start my intro")]);
  await reopen(page);
  await expect(page.locator(".chat-you")).toHaveCount(0);
  const carry = page.getByRole("button", { name: "Carry on: Essay · how do I start my intro" });
  await expect(carry).toBeVisible();
  await expect(page.locator("body")).not.toContainText("days ago");
  await carry.click();
  await expect(page.locator(".chat-you")).toHaveText(/how do I start my intro/);
  await expect(page.locator(".chat-ai").last()).toContainText("answer to how do I start my intro");
  await expect(page.getByText(/^Carry on:/)).toBeHidden();
  await page.getByRole("button", { name: "My chats" }).click();
  await expect(page.locator(".chat-open")).toContainText("Yesterday");
});

test("when saving fails the chat says so and keeps working", async ({ page }) => {
  await openChat(page, { failChats: true, content: "ok" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "hello");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await expect(page.locator("#chat-status")).toHaveText("This chat couldn't be saved on this device. Deleting an old chat makes room.");
  await say(page, "and again");
  await expect(page.locator(".chat-ai")).toHaveCount(3);
});

test("the 11th chat pushes out the oldest one", async ({ page }) => {
  await openChat(page, { content: "ok" });
  await seed(page, Array.from({ length: 10 }, (_, i) => seedChat(`c${i}`, daysAgo(i + 2), `topic ${i}`)));
  await reopen(page);
  await page.getByRole("button", { name: "Essay", exact: true }).click();
  await say(page, "brand new topic");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await page.getByRole("button", { name: "My chats" }).click();
  await expect(page.locator(".chat-open")).toHaveCount(10);
  await expect(page.locator(".chat-open").first()).toContainText("brand new topic");
  await expect(page.locator("body")).not.toContainText("topic 9");
  await expect(page.locator("body")).toContainText("topic 8");
});

test("the kind saved with the steps is pre-selected after a refresh", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await addOther(page);
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByLabel("Assignment text").fill("1. Read chapter one\n2. Note three ideas");
  await page.getByRole("button", { name: "Reading" }).click();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByText("Step 1 of")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Talk it through" }).click();
  await expect(page.getByRole("button", { name: "Reading" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Essay" })).toHaveAttribute("aria-pressed", "false");
});

test("with no AI helper, saved chats can still be opened and read", async ({ page }) => {
  await page.goto("/");
  await seed(page, [seedChat("old", daysAgo(0), "read me")]);
  await page.reload();
  await page.getByRole("button", { name: "Talk it through" }).click();
  await expect(page.getByText("Add an AI helper in Settings first.")).toBeVisible();
  await expect(page.locator(".chat-you")).toHaveText(/read me/);
  await page.getByRole("button", { name: "My chats" }).click();
  await page.locator(".chat-open").click();
  await expect(page.locator(".chat-ai").last()).toContainText("answer to read me");
  await page.getByLabel("Your message").fill("hello");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("No AI helper is ready. Finish one in Settings first.")).toBeVisible();
});

test("damaged saved chats do not crash the chat", async ({ page }) => {
  await page.goto("/");
  await page.evaluate((key) => globalThis.localStorage.setItem(key, "{not json"), CHATS_KEY);
  await page.reload();
  await page.getByRole("button", { name: "Talk it through" }).click();
  await expect(page.getByText("Add an AI helper in Settings first.")).toBeVisible();
  expect(await page.evaluate(() => globalThis.localStorage.getItem("focusapp.v1.chats.backup"))).toBe("{not json");
});

// Rule 11: a message is saved only together with a usable reply.
test("a refresh while a reply that would be flagged is pending leaves the message nowhere in storage", async ({ page }) => {
  await openChat(page, { content: "TRUSTED_ADULT", chatDelay: 1500 });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "very private worry");
  await expect(page.getByText("Waiting for")).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify(Object.entries(globalThis.localStorage)))).not.toContain("very private worry");
  await reopen(page);
  await expect(page.locator(".chat-you")).toHaveCount(0);
  const all = await page.evaluate(() => JSON.stringify(Object.entries(globalThis.localStorage)));
  expect(all).not.toContain("very private worry");
});

test("Stop and then different words: the title comes from the words that were answered", async ({ page }) => {
  await openChat(page, { content: "ok", chatDelay: 1500 });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "first words stopped");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.getByLabel("Your message")).toHaveValue("first words stopped");
  await standIn(page, { content: "ok" });
  await say(page, "other words sent");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await page.getByRole("button", { name: "My chats" }).click();
  await expect(page.locator(".chat-open")).toHaveCount(1);
  await expect(page.locator(".chat-open")).toContainText("other words sent");
  await expect(page.locator(".chat-open")).not.toContainText("first words");
});

test("My chats then Back to the chat while a reply was pending: the words are back in the box and the next request alternates", async ({ page }) => {
  const seen = await openChat(page, { content: "ok", chatDelay: 1500 });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "unanswered words");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.getByRole("button", { name: "My chats" }).click();
  await page.getByRole("button", { name: "Back to the chat" }).click();
  await expect(page.locator(".chat-you")).toHaveCount(0);
  await expect(page.getByLabel("Your message")).toHaveValue("unanswered words");
  await page.getByLabel("Your message").fill("second try");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".chat-ai")).toHaveCount(2, { timeout: 10000 });
  const sent = JSON.parse(seen.chat.at(-1).body).messages.map((m) => m.role);
  expect(sent).toEqual(["system", "user"]);
});
