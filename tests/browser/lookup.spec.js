// W8: Look it up with Wikipedia (design/look-it-up-w8.md).
// NOTE: written without being run (Chrome aborts on launch in the author's sandbox). Run this first.
// The switch ships OFF. The enabled tests serve a different js/lookup-config.js through page.route, and
// Wikipedia is always a stub: nothing here reaches the real Wikipedia.
import { test, expect } from "@playwright/test";
import { startWork } from "./helpers/work.js";

const WIKI = "https://en.wikipedia.org/w/api.php*";

async function setSwitch(page, on) {
  await page.route("**/js/lookup-config.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: `export const LOOKUP_ENABLED = ${on};` }));
}

const jsonBody = (pages) => JSON.stringify({ query: { pages } });
const PAGES = [
  { index: 1, title: "Cell division", extract: "Cell division is the process by which a cell divides." },
  { index: 2, title: "Mitosis", extract: "Mitosis is a part of the cell cycle." },
  { index: 3, title: "Meiosis", extract: "Meiosis is a special type of cell division." },
];

// Stubs Wikipedia and records every request address.
async function stubWiki(page, { body = jsonBody(PAGES), status = 200, delayMs = 0 } = {}) {
  const urls = [];
  await page.route(WIKI, async (route) => {
    urls.push(route.request().url());
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body });
  });
  return urls;
}

async function openLookupFromHome(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Look it up" }).click();
  await expect(page.getByRole("heading", { name: "Look it up", level: 2 })).toBeVisible();
}

test("while the switch is off there is no Look it up button anywhere", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Look it up" })).toHaveCount(0);
  await startWork(page);
  await page.getByRole("button", { name: "Stuck", exact: true }).click();
  await expect(page.getByRole("button", { name: "Another hint" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Look it up" })).toHaveCount(0);
});

test("a search shows three results, links to Wikipedia, and sends only the typed words", async ({ page }) => {
  await setSwitch(page, true);
  const urls = await stubWiki(page);
  await openLookupFromHome(page);
  await expect(page.locator("#lookup-notice")).toHaveText("Your words go to Wikipedia.");
  expect(urls).toHaveLength(0);
  await page.getByLabel("What do you want to look up?").fill("cell division");
  await page.getByRole("button", { name: "Search Wikipedia" }).click();
  await expect(page.locator("#lookup-results h3")).toHaveText(["Cell division", "Mitosis", "Meiosis"]);
  await expect(page.locator("#lookup-status")).toHaveText("Here is what Wikipedia says.");
  expect(urls).toHaveLength(1);
  const sent = new URL(urls[0]);
  expect(sent.origin).toBe("https://en.wikipedia.org");
  expect(sent.searchParams.get("gsrsearch")).toBe("cell division");
  expect(sent.searchParams.get("origin")).toBe("*");
  const link = page.getByRole("link", { name: "Read it on Wikipedia: Mitosis" });
  await expect(link).toHaveAttribute("href", "https://en.wikipedia.org/wiki/Mitosis");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await page.getByRole("button", { name: "Back to home" }).click();
  await expect(page.getByRole("heading", { name: "What's the assignment?" })).toBeVisible();
});

test("the assignment text is never sent", async ({ page }) => {
  await setSwitch(page, true);
  const urls = await stubWiki(page);
  await page.goto("/");
  await page.getByLabel("Assignment text").fill("Secret essay about my school project");
  await page.getByRole("button", { name: "Look it up" }).click();
  await page.getByLabel("What do you want to look up?").fill("volcano");
  await page.keyboard.press("Enter");
  await expect(page.locator("#lookup-results h3").first()).toBeVisible();
  expect(urls.join(" ")).not.toContain("Secret");
  expect(urls.join(" ")).not.toContain("school");
});

test("from the Stuck sheet it opens, and Back to the step returns to the same hint", async ({ page }) => {
  await setSwitch(page, true);
  await stubWiki(page);
  await startWork(page);
  await page.getByRole("button", { name: "Stuck", exact: true }).click();
  await page.getByRole("button", { name: "Another hint" }).click();
  await page.getByRole("button", { name: "Look it up" }).click();
  await page.getByLabel("What do you want to look up?").fill("sources");
  await page.getByRole("button", { name: "Search Wikipedia" }).click();
  await expect(page.locator("#lookup-results h3")).toHaveCount(3);
  await page.getByRole("button", { name: "Back to the step" }).click();
  await expect(page.getByText("Stuck is okay.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Look it up" })).toBeFocused();
});

test("an empty box asks for words and sends nothing", async ({ page }) => {
  await setSwitch(page, true);
  const urls = await stubWiki(page);
  await openLookupFromHome(page);
  await page.getByLabel("What do you want to look up?").fill("   ");
  await page.getByRole("button", { name: "Search Wikipedia" }).click();
  await expect(page.locator("#lookup-status")).toHaveText("Type a few words to look up.");
  expect(urls).toHaveLength(0);
});

test("a very long entry is cut to 100 characters", async ({ page }) => {
  await setSwitch(page, true);
  const urls = await stubWiki(page);
  await openLookupFromHome(page);
  await page.getByLabel("What do you want to look up?").evaluate((node) => { node.removeAttribute("maxlength"); node.value = "a".repeat(500); });
  await page.getByRole("button", { name: "Search Wikipedia" }).click();
  await expect(page.locator("#lookup-results h3").first()).toBeVisible();
  expect(new URL(urls[0]).searchParams.get("gsrsearch")).toHaveLength(100);
});

test("no results, a server error, and a broken reply each give a calm message", async ({ page }) => {
  await setSwitch(page, true);
  let mode = "none";
  await page.route(WIKI, (route) => {
    const replies = {
      none: { status: 200, body: JSON.stringify({ batchcomplete: true }) },
      http: { status: 500, body: "oops" },
      json: { status: 200, body: "not json {" },
      shape: { status: 200, body: JSON.stringify({ query: { pages: "x" } }) },
    };
    return route.fulfill({ ...replies[mode], headers: { "access-control-allow-origin": "*" } });
  });
  await openLookupFromHome(page);
  const box = page.getByLabel("What do you want to look up?");
  const status = page.locator("#lookup-status");
  await box.fill("zzzz");
  await page.getByRole("button", { name: "Search Wikipedia" }).click();
  await expect(status).toHaveText("Wikipedia has nothing for those words. Try different words.");
  for (const next of ["http", "json", "shape"]) {
    mode = next;
    await page.getByRole("button", { name: "Search Wikipedia" }).click();
    await expect(status).toHaveText("That didn't work. Check your internet and try again.");
    await expect(page.locator("#lookup-results h3")).toHaveCount(0);
  }
});

test("offline gives a calm message", async ({ page }) => {
  await setSwitch(page, true);
  await page.route(WIKI, (route) => route.abort("internetdisconnected"));
  await openLookupFromHome(page);
  await page.getByLabel("What do you want to look up?").fill("tides");
  await page.getByRole("button", { name: "Search Wikipedia" }).click();
  await expect(page.locator("#lookup-status")).toHaveText("That didn't work. Check your internet and try again.");
});

test("html and link text in a reply show as plain words, and the link is built by the app", async ({ page }) => {
  await setSwitch(page, true);
  await stubWiki(page, {
    body: jsonBody([{ index: 1, title: "javascript:alert(1)", extract: "<img src=x onerror=alert(1)>Plain <b>text</b>", url: "javascript:alert(2)", fullurl: "https://evil.example" }]),
  });
  await openLookupFromHome(page);
  await page.getByLabel("What do you want to look up?").fill("x");
  await page.getByRole("button", { name: "Search Wikipedia" }).click();
  await expect(page.locator("#lookup-results li p").first()).toHaveText("Plain text");
  await expect(page.locator("#lookup-results img, #lookup-results b")).toHaveCount(0);
  const href = await page.locator("#lookup-results a").getAttribute("href");
  expect(href.startsWith("https://en.wikipedia.org/wiki/")).toBe(true);
});

test("a double tap sends one request, and leaving mid-search shows nothing later", async ({ page }) => {
  await setSwitch(page, true);
  const urls = await stubWiki(page, { delayMs: 600 });
  await openLookupFromHome(page);
  await page.getByLabel("What do you want to look up?").fill("cell");
  const go = page.getByRole("button", { name: "Search Wikipedia" });
  await go.dblclick();
  await expect(page.locator("#lookup-results h3")).toHaveCount(3);
  expect(urls).toHaveLength(1);
  await go.click();
  await page.getByRole("button", { name: "Back to home" }).click();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Look it up" }).click();
  await expect(page.locator("#lookup-results h3")).toHaveCount(0);
  await expect(page.locator("#lookup-status")).toHaveText("");
});

test("a refresh puts the screen back to home with nothing saved", async ({ page }) => {
  await setSwitch(page, true);
  await stubWiki(page);
  await openLookupFromHome(page);
  await page.getByLabel("What do you want to look up?").fill("cell");
  await page.getByRole("button", { name: "Search Wikipedia" }).click();
  await expect(page.locator("#lookup-results h3")).toHaveCount(3);
  const stored = await page.evaluate(() => JSON.stringify(globalThis.localStorage));
  expect(stored).not.toContain("cell");
  await page.reload();
  await expect(page.getByRole("heading", { name: "What's the assignment?" })).toBeVisible();
});
