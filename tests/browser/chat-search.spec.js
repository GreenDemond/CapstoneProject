import { test, expect } from "@playwright/test";
import { KEY, standIn, openSettings, addOther, nextButton } from "./helpers/ai.js";

// Browser tests for the Search the web box (design/web-search.md, slice 1). Stand-in services only.
const OPENROUTER = { host: "https://openrouter.ai", base: "/api/v1" };
const CITE = (url, title) => ({ type: "url_citation", url_citation: { url, title } });
const withSources = (annotations) => ({ choices: [{ message: { content: "Look at these.", annotations } }] });

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

// Sets up an OpenRouter helper (or another service), then swaps in the stand-in that answers the chat.
async function openChat(page, options = {}, { openRouter = true } = {}) {
  await standIn(page, openRouter ? OPENROUTER : {});
  await openSettings(page);
  if (openRouter) await addOpenRouter(page);
  else await addOther(page);
  const seen = await standIn(page, { ...(openRouter ? OPENROUTER : {}), ...options });
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "Talk it through" }).click();
  await expect(page.getByRole("heading", { name: "Talk it through" })).toBeVisible();
  await page.getByRole("button", { name: "Essay" }).click();
  return seen;
}

async function say(page, text) {
  await page.getByLabel("Your message").fill(text);
  await page.getByRole("button", { name: "Send", exact: true }).click();
}

const box = (page) => page.getByLabel("Search the web");
const lastBody = (seen) => JSON.parse(seen.chat.at(-1).body);

test("the box shows for OpenRouter, with the cost line, and is unticked", async ({ page }) => {
  await openChat(page);
  await expect(box(page)).toBeVisible();
  await expect(box(page)).not.toBeChecked();
  await expect(page.getByText("Uses your OpenRouter credit (about 1 cent per message).")).toBeVisible();
});

test("the box does not show for another service", async ({ page }) => {
  await openChat(page, {}, { openRouter: false });
  await expect(page.getByLabel("Your message")).toBeVisible();
  await expect(page.getByText("Search the web")).toHaveCount(0);
});

test("ticked: the request has the web plugin and search line, and Sources show as safe links", async ({ page }) => {
  const seen = await openChat(page, {
    chatBody: withSources([CITE("https://example.org/scout", "Scout Finch <b>page</b>"), CITE("http://insecure.test/x", "Insecure"), CITE("https://example.org/scout", "Dup")]),
    chatDelay: 400,
  });
  await box(page).check();
  await say(page, "who is Scout Finch");
  await expect(page.locator("#chat-status")).toContainText("Searching the web and asking");
  await expect(page.getByText("Sources", { exact: true })).toBeVisible();
  const body = lastBody(seen);
  expect(body.plugins).toEqual([{ id: "web", max_results: 5 }]);
  expect(body.messages[0].content).toContain("Web search results may be included");
  expect(body.messages[0].content.split("\n\n").at(-1)).toMatch(/^Reminder:/);
  const links = page.locator(".chat-sources a");
  await expect(links).toHaveCount(1);
  await expect(links.first()).toHaveText("Scout Finch <b>page</b>");
  await expect(links.first()).toHaveAttribute("href", "https://example.org/scout");
  await expect(links.first()).toHaveAttribute("target", "_blank");
  await expect(links.first()).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.locator(".chat-sources b")).toHaveCount(0);
});

test("unticked: no plugin and no search line", async ({ page }) => {
  const seen = await openChat(page, { chatBody: withSources([CITE("https://example.org/x", "X")]) });
  await say(page, "hello");
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  const body = lastBody(seen);
  expect("plugins" in body).toBe(false);
  expect(body.messages[0].content).not.toContain("Web search results");
});

test("a 402 with search on shows the credit line and gives the words back", async ({ page }) => {
  await openChat(page, { chatStatus: 402, chatBody: { error: "credit" } });
  await box(page).check();
  await say(page, "who is Scout Finch");
  await expect(page.locator("#chat-status")).toContainText("Web search needs credit on your OpenRouter account. Untick Search the web to keep chatting for free.");
  await expect(page.getByLabel("Your message")).toHaveValue("who is Scout Finch");
});

test("a 402 with search off keeps the usual line", async ({ page }) => {
  await openChat(page, { chatStatus: 402, chatBody: { error: "credit" } });
  await say(page, "hello");
  await expect(page.locator("#chat-status")).toContainText("busy or out of credit");
});

test("New chat unticks the box", async ({ page }) => {
  await openChat(page);
  await box(page).check();
  await page.getByRole("button", { name: "New chat" }).click();
  await expect(box(page)).not.toBeChecked();
});

test("sources survive a reload, the box is unticked, and sources are not sent back", async ({ page }) => {
  const seen = await openChat(page, { chatBody: withSources([CITE("https://example.org/a", "Article A")]) });
  await box(page).check();
  await say(page, "first question");
  await expect(page.locator(".chat-sources a")).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: "Talk it through" }).click();
  await expect(page.locator(".chat-sources a")).toHaveCount(1);
  await expect(page.locator(".chat-sources a")).toHaveAttribute("href", "https://example.org/a");
  await expect(box(page)).not.toBeChecked();
  await say(page, "second question");
  await expect(page.locator(".chat-sources a")).toHaveCount(2);
  const sent = lastBody(seen).messages;
  expect(JSON.stringify(sent)).not.toContain("example.org");
  expect(JSON.stringify(sent)).not.toContain("Sources");
  expect("plugins" in lastBody(seen)).toBe(false);
});
