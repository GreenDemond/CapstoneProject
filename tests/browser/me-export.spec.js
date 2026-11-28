import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// Me and my data (design/me-export-w7.md): save a copy, load a copy, delete everything.
// These tests were written but NOT run when the slice was built (Chrome could not start in that sandbox).

const NOW = "2026-11-20T12:00:00.000Z";

const SAVED = {
  schemaVersion: 1,
  profile: { goals: { today: "Read chapter 3", week: "", month: "", year: "" }, gotInTheWay: [] },
  parked: [{ id: 1, text: "email Sam", date: NOW }],
  work: { steps: [{ id: 0, text: "Find three sources", done: false }], nextId: 1, savedOn: NOW },
  ai: { services: [{ id: "s1", label: "Mine", url: "https://example.com/v1/chat/completions", model: "m", keyHint: "wxyz", checked: true }], chosenId: "s1" },
};
const CHAT = { id: "c1", kind: "essay", title: "Essay chat", startedOn: NOW, usedOn: NOW, items: [{ who: "you", text: "hello there" }] };

async function seed(page, main = SAVED, chats = { schemaVersion: 1, chats: [CHAT] }) {
  await page.goto("/");
  await page.evaluate(([a, b]) => {
    globalThis.localStorage.setItem("focusapp.v1", JSON.stringify(a));
    globalThis.localStorage.setItem("focusapp.v1.chats", JSON.stringify(b));
  }, [main, chats]);
  await page.reload();
}

async function openMe(page) {
  await page.getByRole("button", { name: "Me and my data" }).click();
  await expect(page.getByRole("heading", { name: "Me and my data", level: 2 })).toBeVisible();
}

async function stored(page, key = "focusapp.v1") {
  return page.evaluate((k) => globalThis.localStorage.getItem(k), key);
}

function file(name, content) {
  return { name, mimeType: "application/json", buffer: Buffer.from(typeof content === "string" ? content : JSON.stringify(content)) };
}

async function saveCopyFile(page, withChats = false) {
  if (withChats) await page.getByLabel("Also put my saved chats in the copy").check();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Save a copy of my data" }).click(),
  ]);
  return readFileSync(await download.path(), "utf8");
}

test("Me screen: shows its links and Back to home works", async ({ page }) => {
  await seed(page);
  await openMe(page);
  for (const name of ["My profile", "How I like to work", "My calendar", "What I did", "What the app remembers", "Settings"]) {
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "My profile", exact: true }).click();
  await expect(page.getByRole("heading", { name: "My profile", level: 2 })).toBeVisible();
  await page.getByRole("button", { name: "Back to home" }).click();
  await page.getByRole("button", { name: "Me and my data" }).click();
  await page.getByRole("button", { name: "What the app remembers", exact: true }).click();
  await expect(page.getByRole("heading", { name: "What the app remembers", level: 2 })).toBeVisible();
  await expect(page.getByText("email Sam")).toBeVisible();
});

test("Save a copy: a file downloads, has no AI settings or chats unless ticked, and says so", async ({ page }) => {
  await seed(page);
  await openMe(page);
  await expect(page.getByText("AI keys are never in the copy")).toBeVisible();
  await expect(page.getByLabel("Also put my saved chats in the copy")).not.toBeChecked();
  const text = await saveCopyFile(page);
  const copy = JSON.parse(text);
  expect(copy.app).toBe("focus-app-copy");
  expect(copy.data.profile.goals.today).toBe("Read chapter 3");
  expect(copy.chats).toBeUndefined();
  for (const word of ["wxyz", "example.com", "keyHint", "hello there"]) expect(text).not.toContain(word);
  await expect(page.locator("#me-status")).toContainText("Your copy was made");
});

test("Save a copy with the tick box includes chats, still no keys", async ({ page }) => {
  await seed(page);
  await openMe(page);
  const text = await saveCopyFile(page, true);
  expect(JSON.parse(text).chats[0].id).toBe("c1");
  expect(text).not.toContain("wxyz");
});

test("Round trip: delete everything, then load the copy and get the data back", async ({ page }) => {
  await seed(page);
  await openMe(page);
  const text = await saveCopyFile(page, true);

  await page.getByRole("button", { name: "Delete everything", exact: true }).click();
  await expect(page.getByText("Delete all of it? It can't be undone.")).toBeVisible();
  await page.getByRole("button", { name: "Yes, delete everything" }).click();
  await expect(page.locator("#me-status")).toContainText("Everything is deleted");
  expect(await stored(page)).toBeNull();
  expect(await stored(page, "focusapp.v1.chats")).toBeNull();

  await page.locator("#me-file").setInputFiles(file("copy.json", text));
  await expect(page.getByText("Loading it replaces what is saved on this device.")).toBeVisible();
  await expect(page.getByText("1 parked thought")).toBeVisible();
  await page.getByRole("button", { name: "Yes, replace what is saved" }).click();
  await expect(page.locator("#me-status")).toContainText("Your copy is loaded");
  const main = JSON.parse(await stored(page));
  expect(main.parked[0].text).toBe("email Sam");
  expect(JSON.parse(await stored(page, "focusapp.v1.chats")).chats[0].id).toBe("c1");
  expect(main.ai).toBeUndefined();
});

test("Load a copy: the second tap is needed, and No changes nothing", async ({ page }) => {
  await seed(page);
  await openMe(page);
  const other = { app: "focus-app-copy", fileVersion: 1, data: { parked: [{ id: 7, text: "different", date: NOW }] } };
  await page.locator("#me-file").setInputFiles(file("copy.json", other));
  await expect(page.getByRole("button", { name: "Yes, replace what is saved" })).toBeVisible();
  const before = await stored(page);
  expect(before).toContain("email Sam");
  await page.getByRole("button", { name: "No, keep what I have" }).click();
  await expect(page.locator("#me-status")).toContainText("Nothing was changed");
  expect(await stored(page)).toBe(before);
});

test("Load a copy keeps the student's AI helpers", async ({ page }) => {
  await seed(page);
  await openMe(page);
  const other = { app: "focus-app-copy", fileVersion: 1, data: { parked: [{ id: 7, text: "different", date: NOW }] } };
  await page.locator("#me-file").setInputFiles(file("copy.json", other));
  await page.getByRole("button", { name: "Yes, replace what is saved" }).click();
  await expect(page.locator("#me-status")).toContainText("Your copy is loaded");
  const main = JSON.parse(await stored(page));
  expect(main.ai.services[0].label).toBe("Mine");
  expect(main.parked[0].text).toBe("different");
  expect(main.work).toBeUndefined();
});

test("Awkward: files that are broken, wrong, or too new change nothing and say so", async ({ page }) => {
  await seed(page);
  await openMe(page);
  const before = await stored(page);
  const cases = [
    file("a.json", "{ this is not json"),
    file("b.json", "[1,2,3]"),
    file("c.json", { app: "something-else", fileVersion: 1, data: {} }),
    file("d.json", { app: "focus-app-copy", fileVersion: 99, data: { parked: [] } }),
    file("e.json", { app: "focus-app-copy", fileVersion: 1, data: { parked: "nope" } }),
    file("f.json", ""),
  ];
  for (const bad of cases) {
    await page.locator("#me-file").setInputFiles(bad);
    await expect(page.locator("#me-file-problem")).toContainText("Nothing was changed");
    await expect(page.getByRole("button", { name: "Yes, replace what is saved" })).toHaveCount(0);
    expect(await stored(page)).toBe(before);
  }
});

test("Awkward: a file that is too big is refused", async ({ page }) => {
  await seed(page);
  await openMe(page);
  const before = await stored(page);
  await page.locator("#me-file").setInputFiles({ name: "huge.json", mimeType: "application/json", buffer: Buffer.alloc(2100000, 32) });
  await expect(page.locator("#me-file-problem")).toContainText("too big");
  expect(await stored(page)).toBe(before);
});

test("Awkward: a hostile file with html in its text loads as plain text and nothing runs", async ({ page }) => {
  await seed(page);
  await openMe(page);
  const html = "<img src=x onerror=\"globalThis.hacked = 1\"><script>globalThis.hacked = 1</script>";
  const hostile = JSON.stringify({ app: "focus-app-copy", fileVersion: 1, data: { parked: [{ id: 1, text: html, date: NOW }], ai: { services: [{ id: "x", label: "Evil", url: "https://evil.example/v1/chat/completions", model: "m" }] } }, extra: { __proto__: 1 } });
  await page.locator("#me-file").setInputFiles(file("hostile.json", hostile));
  await page.getByRole("button", { name: "Yes, replace what is saved" }).click();
  await expect(page.locator("#me-status")).toContainText("Your copy is loaded");
  const main = JSON.parse(await stored(page));
  expect(main.ai.services[0].label).toBe("Mine");
  expect(main.parked[0].text).toBe(html);
  await page.getByRole("button", { name: "What the app remembers", exact: true }).click();
  await expect(page.getByText(html)).toBeVisible();
  expect(await page.evaluate(() => globalThis.hacked)).toBeUndefined();
  expect(await page.locator("#looking-body img").count()).toBe(0);
});

test("Delete everything: needs a second tap, No keeps data, Yes removes saved data and says what it removes", async ({ page }) => {
  await seed(page);
  await openMe(page);
  await expect(page.getByText("your AI helpers and their keys")).toBeVisible();
  await page.getByRole("button", { name: "Delete everything", exact: true }).click();
  await page.getByRole("button", { name: "No, keep it" }).click();
  expect(await stored(page)).not.toBeNull();
  await page.getByRole("button", { name: "Delete everything", exact: true }).click();
  await page.getByRole("button", { name: "Yes, delete everything" }).click();
  await expect(page.locator("#me-status")).toContainText("Everything is deleted");
  expect(await page.evaluate(() => Object.keys(globalThis.localStorage).filter((k) => k.startsWith("focusapp")))).toEqual([]);
  await page.getByRole("button", { name: "Back to home" }).click();
  await expect(page.getByRole("button", { name: "Show my steps" })).toBeVisible();
});

test("Awkward: Delete everything with nothing saved, and refresh in the middle of the question", async ({ page }) => {
  await page.goto("/");
  await openMe(page);
  await page.getByRole("button", { name: "Delete everything", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Yes, delete everything" })).toHaveCount(0);
  await openMe(page);
  await page.getByRole("button", { name: "Delete everything", exact: true }).click();
  await page.getByRole("button", { name: "Yes, delete everything" }).click();
  await expect(page.locator("#me-status")).toContainText("Everything is deleted");
});

test("Awkward: saving a copy with nothing saved still makes a valid file", async ({ page }) => {
  await page.goto("/");
  await openMe(page);
  const copy = JSON.parse(await saveCopyFile(page));
  expect(copy.app).toBe("focus-app-copy");
});
