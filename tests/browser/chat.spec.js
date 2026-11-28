import { test, expect } from "@playwright/test";
import { KEY, standIn, openSettings, addOther } from "./helpers/ai.js";
import { openScreen } from "./helpers/nav.js";

// Sets up a working stand-in helper, goes home, and opens the chat.
// The helper is added with a normal stand-in; the behaviour under test is then put in front of it.
async function openChat(page, options = {}) {
  await standIn(page);
  await openSettings(page);
  await addOther(page);
  const seen = await standIn(page, options);
  await page.getByRole("button", { name: "Back" }).click();
  await openScreen(page, "Talk it through");
  await expect(page.getByRole("heading", { name: "Talk it through" })).toBeVisible();
  return seen;
}

async function say(page, text) {
  await page.getByLabel("Your message").fill(text);
  await page.getByRole("button", { name: "Send", exact: true }).click();
}

const lastBody = (seen) => JSON.parse(seen.chat.at(-1).body);

// Main path: pick a kind, send, and the AI's reply appears labelled as an AI. Rules, kind, and the key are where they belong.
test("a message gets a reply labelled AI, with the rules first and the key only in the header", async ({ page }) => {
  const seen = await openChat(page, { content: "What do you already know about Scout?" });
  await expect(page.getByText("What are you working on, and what's the first thing you're not sure about?")).toBeVisible();
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "i'm trying to write an essay about scout from to kill a mockingbird");
  await expect(page.locator(".chat-ai").last()).toContainText("What do you already know about Scout?");
  await expect(page.locator(".chat-ai").last().locator(".chat-who")).toHaveText("AI");
  const body = lastBody(seen);
  expect(body.messages[0].role).toBe("system");
  expect(body.messages[0].content).toMatch(/^You are a study helper/);
  expect(body.messages[0].content).toContain("Kind of work: essay");
  expect(body.messages.at(-1)).toEqual({ role: "user", content: "i'm trying to write an essay about scout from to kill a mockingbird" });
  expect(seen.chat.at(-1).auth).toBe(`Bearer ${KEY}`);
  expect(seen.chat.at(-1).body).not.toContain(KEY);
  await expect(page.getByLabel("Your message")).toBeFocused();
});

// The conversation goes along with each new message.
test("the next message carries the earlier ones", async ({ page }) => {
  const seen = await openChat(page, { content: "Tell me more." });
  await page.getByRole("button", { name: "Reading" }).click();
  await say(page, "first thing");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await say(page, "second thing");
  await expect(page.locator(".chat-ai")).toHaveCount(3);
  const roles = lastBody(seen).messages.map((m) => m.role);
  expect(roles).toEqual(["system", "user", "assistant", "user"]);
});

// The AI's words are shown as text, never as markup.
test("a reply with tags and asterisks is shown as plain text", async ({ page }) => {
  await openChat(page, { content: "<b>Start</b> with **one** line\nthen stop" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "help");
  await expect(page.locator(".chat-ai").last()).toContainText("<b>Start</b> with **one** line");
  await expect(page.locator(".chat-ai b")).toHaveCount(0);
});

// Awkward path: no kind picked.
test("sending without picking a kind asks for one and keeps the words", async ({ page }) => {
  const seen = await openChat(page);
  await say(page, "hello");
  await expect(page.getByText("Tap the kind of work it is, then send again.")).toBeVisible();
  await expect(page.getByLabel("Your message")).toHaveValue("hello");
  expect(seen.chat).toHaveLength(0);
});

// Awkward path: no helper set up.
test("with no AI helper the chat says to add one in Settings", async ({ page }) => {
  await page.goto("/");
  await openScreen(page, "Talk it through");
  await expect(page.getByText("Add an AI helper in Settings first.")).toBeVisible();
  await expect(page.getByLabel("Your message")).toHaveCount(0);
});

// Awkward path: a rejected key gives a plain line, and the words come back to the box.
test("a failed call gives a plain line and the message is still in the box", async ({ page }) => {
  await openChat(page, { acceptKey: "another-key" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "my words");
  await expect(page.getByText("The service didn't accept the key.")).toBeVisible();
  await expect(page.getByLabel("Your message")).toHaveValue("my words");
  await expect(page.locator(".chat-you")).toHaveCount(0);
});

// A reply stopped by the service's own length limit is shown whole, and says so.
test("a reply cut off by the service is shown with a plain note", async ({ page }) => {
  await openChat(page, { chatBody: { choices: [{ message: { content: "Half a thou" }, finish_reason: "length" }] } });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "help");
  await expect(page.locator(".chat-ai").last()).toContainText("Half a thou");
  await expect(page.getByText("The reply was cut off by the AI service.")).toBeVisible();
});

// An empty reply (the service used its room thinking) is explained, and the words are kept.
test("an empty reply is explained and the message is kept", async ({ page }) => {
  await openChat(page, { chatBody: { choices: [{ message: { content: "" }, finish_reason: "length" }] } });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "help");
  await expect(page.getByText("The AI ran out of room before answering.")).toBeVisible();
  await expect(page.getByLabel("Your message")).toHaveValue("help");
});

// Rule 11: the AI's signal shows the trusted-adult line, hides its reply, and the chat carries on.
test("a TRUSTED_ADULT reply shows the adult line, hides the reply, and the chat continues", async ({ page }) => {
  await openChat(page, { content: "I'm sorry you feel that way. TRUSTED_ADULT" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "something serious");
  await expect(page.getByText("If something serious is going on, please talk to an adult you trust.")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("I'm sorry you feel that way");
  await say(page, "ok back to homework");
  await expect(page.locator(".chat-you")).toHaveCount(2);
});

// The flagged message is not sent again with later ones.
test("after the adult line the flagged message is not sent again", async ({ page }) => {
  const seen = await openChat(page, { content: "TRUSTED_ADULT" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "something serious");
  await expect(page.getByText("talk to an adult you trust")).toBeVisible();
  await say(page, "ok back to homework");
  await expect(page.locator(".chat-you")).toHaveCount(2);
  const sent = JSON.parse(seen.chat.at(-1).body).messages.map((m) => m.content);
  expect(sent.join(" ")).not.toContain("something serious");
});

// Words typed while waiting are not lost when the call fails.
test("words typed while waiting are kept when the call fails", async ({ page }) => {
  await openChat(page, { chatStatus: 500, chatDelay: 600 });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "first words");
  await expect(page.getByText("Waiting for")).toBeVisible();
  await page.getByLabel("Your message").fill("next thought");
  await expect(page.getByText("Your message is back in the box.")).toBeVisible();
  await expect(page.getByLabel("Your message")).toHaveValue("first words\nnext thought");
});

// The log is not rebuilt for each message, so a screen reader hears only what is new.
test("a new reply is added to the same chat log, not a rebuilt one", async ({ page }) => {
  await openChat(page, { content: "reply" });
  await page.getByRole("button", { name: "Essay" }).click();
  await page.locator(".chat-log").evaluate((node) => { node.dataset.mark = "same"; });
  await say(page, "hi");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await expect(page.locator(".chat-log")).toHaveAttribute("data-mark", "same");
});

// The warning about answers is on the chat screen from the start.
test("the chat says an AI can still get it wrong", async ({ page }) => {
  await openChat(page);
  await expect(page.getByText("An AI can still get it wrong. If it gives you a finished answer, don't copy it.")).toBeVisible();
});

// Enter sends and Shift+Enter makes a new line (a computer keyboard).
test("Enter sends and Shift+Enter adds a new line", async ({ page, isMobile }) => {
  test.skip(isMobile, "phones use the Send button");
  const seen = await openChat(page, { content: "reply" });
  await page.getByRole("button", { name: "Essay" }).click();
  const box = page.getByLabel("Your message");
  await box.fill("line one");
  await box.press("Shift+Enter");
  await box.pressSequentially("line two");
  await expect(box).toHaveValue("line one\nline two");
  await box.press("Enter");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  expect(JSON.parse(seen.chat.at(-1).body).messages.at(-1).content).toBe("line one\nline two");
});

// Back while a reply is coming: the late reply does not appear in the next chat.
test("Back while waiting ignores the late reply", async ({ page }) => {
  await openChat(page, { chatDelay: 1200, content: "late answer" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "slow");
  await page.getByRole("button", { name: "Back to home" }).click();
  await openScreen(page, "Talk it through");
  await page.waitForTimeout(1800);
  await expect(page.locator("body")).not.toContainText("late answer");
});

// Double tap sends once.
test("a quick double tap on Send sends one message", async ({ page }) => {
  const seen = await openChat(page, { chatDelay: 600 });
  await page.getByRole("button", { name: "Essay" }).click();
  await page.getByLabel("Your message").fill("once");
  await page.getByRole("button", { name: "Send", exact: true }).dblclick();
  await expect(page.locator(".chat-ai")).toHaveCount(2, { timeout: 5000 });
  expect(seen.chat).toHaveLength(1);
});

// Stop ends the wait; a late reply is ignored.
test("Stop ends the wait and a late reply is ignored", async ({ page }) => {
  await openChat(page, { chatDelay: 1500, content: "late answer" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "slow one");
  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.getByText("Stopped. Your message is back in the box.")).toBeVisible();
  await expect(page.getByLabel("Your message")).toHaveValue("slow one");
  await page.waitForTimeout(2000);
  await expect(page.locator("body")).not.toContainText("late answer");
  await expect(page.getByRole("button", { name: "Send", exact: true })).toBeEnabled();
});

// Long messages are refused, never cut.
test("a very long message is refused and kept in the box", async ({ page }) => {
  const seen = await openChat(page);
  await page.getByRole("button", { name: "Essay" }).click();
  const long = "a".repeat(2001);
  await say(page, long);
  await expect(page.getByText("That message is long. Shorten it and try again.")).toBeVisible();
  await expect(page.getByLabel("Your message")).toHaveValue(long);
  expect(seen.chat).toHaveLength(0);
});

// New chat replaces Start over (chats are now saved: design/chat-history.md).
// Back to home no longer forgets the chat, so the last two lines changed from "nothing is kept" to "today's chat reopens".
test("New chat starts an empty chat, and Back to home keeps today's chat", async ({ page }) => {
  await openChat(page, { content: "reply" });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "hi");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await page.getByRole("button", { name: "New chat" }).click();
  await expect(page.locator(".chat-you")).toHaveCount(0);
  await expect(page.locator(".chat-ai")).toHaveCount(1);
  await say(page, "again");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  await page.getByRole("button", { name: "Back to home" }).click();
  await openScreen(page, "Talk it through");
  await expect(page.locator(".chat-you")).toHaveCount(1);
  await expect(page.locator(".chat-you")).toContainText("again");
});

// Long unbroken words do not push the page sideways (works at phone width too).
test("a long unbroken reply does not make the page scroll sideways", async ({ page }) => {
  await openChat(page, { content: "x".repeat(300) });
  await page.getByRole("button", { name: "Essay" }).click();
  await say(page, "y".repeat(300));
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  const overflow = await page.evaluate(() => globalThis.document.documentElement.scrollWidth - globalThis.document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
