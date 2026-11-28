import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { KEY, HOST, standIn, openSettings, addOther } from "./helpers/ai.js";

// Save and load the AI helpers file (design/ai-helpers-file.md). Stand-in service and fake keys only.
const PASS = "correct horse battery";

function file(name, content) {
  return { name, mimeType: "application/json", buffer: Buffer.from(typeof content === "string" ? content : JSON.stringify(content)) };
}

async function saveFile(page, { passphrase = null, again = passphrase } = {}) {
  await page.getByRole("button", { name: "Save my AI helpers" }).click();
  if (passphrase !== null) {
    await page.getByLabel(/^With keys/).check();
    await page.getByLabel("Passphrase", { exact: true }).fill(passphrase);
    await page.getByLabel("Type it again").fill(again);
  }
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Make the file" }).click()]);
  return { text: readFileSync(await download.path(), "utf8"), name: download.suggestedFilename() };
}

async function wipe(page) {
  await page.getByRole("tab", { name: "Me", exact: true }).click();
  await page.getByRole("button", { name: "Delete everything", exact: true }).click();
  await page.getByRole("button", { name: "Yes, delete everything" }).click();
  await expect(page.locator("#me-status")).toContainText("Everything is deleted");
}

async function loadFile(page, content) {
  await page.getByRole("button", { name: "Load AI helpers" }).click();
  await page.getByLabel("Choose an AI helpers file").setInputFiles(file("helpers.json", content));
}

const stored = (page) => page.evaluate(() => JSON.parse(globalThis.localStorage.getItem("focusapp.v1") ?? "{}").ai);

function helpersFile(helpers, extra = {}) {
  return { app: "focus-app-ai-helpers", version: 1, savedOn: "2026-11-28", helpers, ...extra };
}
const HELPER = { ref: "h2", label: "Loaded one", url: `${HOST}/v1/chat/completions`, model: "big-model", effort: "high" };

test("Save without keys: the file has the helpers and no key or hint", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await addOther(page);
  const saved = await saveFile(page);
  expect(saved.name).toMatch(/^focus-app-ai-helpers-\d{4}-\d{2}-\d{2}\.json$/);
  const data = JSON.parse(saved.text);
  expect(data.app).toBe("focus-app-ai-helpers");
  expect(data.keys).toBeUndefined();
  expect(data.helpers).toHaveLength(1);
  expect(data.helpers[0]).toMatchObject({ url: `${HOST}/v1/chat/completions`, model: "small-model" });
  expect(saved.text).not.toContain(KEY);
  expect(saved.text).not.toContain(KEY.slice(-4));
  await expect(page.locator("#hf-status")).toContainText("without keys");
  await expect(page.locator("#hf-status")).toContainText(saved.name);
});

test("Round trip: save with keys, wipe everything, load with the passphrase, the helper sends the right key", async ({ page }) => {
  const seen = await standIn(page, { acceptKey: KEY });
  await openSettings(page);
  await addOther(page);
  const saved = await saveFile(page, { passphrase: PASS });
  const data = JSON.parse(saved.text);
  expect(data.keys.kdf).toBe("PBKDF2-SHA-256");
  expect(saved.text).not.toContain(KEY);
  expect(saved.text).not.toContain(PASS);
  await expect(page.locator("#hf-status")).toContainText("1 locked key");

  await wipe(page);
  await openSettings(page);
  await expect(page.locator(".helper-card")).toHaveCount(0);
  await loadFile(page, saved.text);
  await expect(page.getByText("These helpers will be added:")).toBeVisible();
  await expect(page.locator("#hf-preview")).toContainText(`${HOST}/v1/chat/completions`);
  await expect(page.getByText("Only load a file you made yourself.")).toBeVisible();
  await page.getByRole("button", { name: "Yes, add these helpers" }).click();
  await page.getByLabel("Passphrase for the keys").fill(PASS);
  await page.getByRole("button", { name: "Open the keys and add the helpers" }).click();
  await expect(page.locator(".helper-card")).toHaveCount(1);
  await expect(page.locator(".setup-message").last()).toContainText("Added 1 helper");

  const ai = await stored(page);
  expect(ai.services[0].keyReady).toBe(true);
  expect(ai.services[0].keyHint).toBe(KEY.slice(-4));
  expect(JSON.stringify(ai)).not.toContain(KEY);

  await page.locator(".helper-card").getByRole("button", { name: /^Manage/ }).click();
  await page.getByRole("button", { name: /^Test .* again/ }).click();
  await expect(page.getByText("It works.")).toBeVisible();
  expect(seen.chat.at(-1).auth).toBe(`Bearer ${KEY}`);
  const text = await page.evaluate(() => globalThis.document.body.innerText + globalThis.document.documentElement.innerHTML);
  expect(text).not.toContain(KEY);
  expect(text).not.toContain(PASS);
});

test("Wrong passphrase: plain message, then the helpers can be added without keys", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await addOther(page);
  const saved = await saveFile(page, { passphrase: PASS });
  await wipe(page);
  await openSettings(page);
  await loadFile(page, saved.text);
  await page.getByRole("button", { name: "Yes, add these helpers" }).click();
  await page.getByLabel("Passphrase for the keys").fill("not the passphrase");
  await page.getByRole("button", { name: "Open the keys and add the helpers" }).click();
  await expect(page.locator("#hf-status")).toHaveText("That passphrase didn't open the keys.");
  await expect(page.locator(".helper-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Add the helpers without their keys" }).click();
  await expect(page.locator(".helper-card")).toHaveCount(1);
  await expect(page.getByRole("button", { name: /^Finish setting up/ })).toBeVisible();
  const ai = await stored(page);
  expect(ai.services[0].keyReady).toBe(false);
  expect(ai.services[0].keyHint).toBe("");
});

test("Three wrong passphrases add a short wait, then the box opens again", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await addOther(page);
  const saved = await saveFile(page, { passphrase: PASS });
  await wipe(page);
  await openSettings(page);
  await loadFile(page, saved.text);
  await page.getByRole("button", { name: "Yes, add these helpers" }).click();
  await expect(page.locator("#hf-send-to")).toContainText(`${HOST}/v1/chat/completions`);
  for (let i = 0; i < 3; i += 1) {
    await page.getByLabel("Passphrase for the keys").fill(`not the passphrase ${i}`);
    await page.getByRole("button", { name: "Open the keys and add the helpers" }).click();
    await expect(page.locator("#hf-status")).toContainText("That passphrase didn't open the keys.");
  }
  await expect(page.locator("#hf-status")).toContainText("Wait a few seconds");
  await expect(page.locator("#hf-open")).toBeDisabled();
  await expect(page.locator(".helper-card")).toHaveCount(0);
  await expect(page.locator("#hf-open")).toBeEnabled({ timeout: 10000 });
  await page.getByLabel("Passphrase for the keys").fill(PASS);
  await page.getByRole("button", { name: "Open the keys and add the helpers" }).click();
  await expect(page.locator(".helper-card")).toHaveCount(1);
});

test("An address edited after locking: the right passphrase still fails and nothing is added", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await addOther(page);
  const saved = await saveFile(page, { passphrase: PASS });
  const edited = JSON.parse(saved.text);
  edited.helpers[0].url = "https://evil.example/v1/chat/completions";
  await wipe(page);
  await openSettings(page);
  await loadFile(page, edited);
  await page.getByRole("button", { name: "Yes, add these helpers" }).click();
  await page.getByLabel("Passphrase for the keys").fill(PASS);
  await page.getByRole("button", { name: "Open the keys and add the helpers" }).click();
  await expect(page.locator("#hf-status")).toHaveText("That passphrase didn't open the keys.");
  await expect(page.locator(".helper-card")).toHaveCount(0);
  expect((await stored(page))?.services ?? []).toHaveLength(0);
});

test("Passphrase rules: too short and not matching are refused, and no file is made", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await addOther(page);
  let downloads = 0;
  page.on("download", () => (downloads += 1));
  await page.getByRole("button", { name: "Save my AI helpers" }).click();
  await page.getByLabel(/^With keys/).check();
  await page.getByLabel("Passphrase", { exact: true }).fill("short");
  await page.getByLabel("Type it again").fill("short");
  await page.getByRole("button", { name: "Make the file" }).click();
  await expect(page.locator("#hf-status")).toContainText("at least 10 characters");
  await page.getByLabel("Passphrase", { exact: true }).fill(PASS);
  await page.getByLabel("Type it again").fill(`${PASS}x`);
  await page.getByRole("button", { name: "Make the file" }).click();
  await expect(page.locator("#hf-status")).toContainText("don't match");
  expect(downloads).toBe(0);
});

test("A hostile file shows only text, bad ones change nothing", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await page.evaluate(() => {
    globalThis.hacked = false;
  });
  const nasty = helpersFile([
    { ref: "h1", label: "<img src=x onerror=\"globalThis.hacked=true\">", url: `${HOST}/v1/chat/completions`, model: "<script>globalThis.hacked=true</script>", effort: "high" },
    { ref: "h2", label: "bad", url: "https://user:pw@evil.example/v1/chat/completions", model: "m" },
    { ref: "h3", label: "bad2", url: "javascript:alert(1)", model: "m" },
    { ref: "__proto__", label: "proto", url: `${HOST}/v1/chat/completions`, model: "p", effort: "low" },
  ]);
  await loadFile(page, JSON.stringify(nasty).replace('"ref":"__proto__"', '"__proto__":{"x":1},"ref":"__proto__"'));
  await expect(page.locator("#hf-preview li")).toHaveCount(2);
  await expect(page.locator("#hf-preview")).toContainText("<img src=x");
  expect(await page.locator("#hf-preview img").count()).toBe(0);
  expect(await page.evaluate(() => globalThis.hacked)).toBe(false);
  await expect(page.locator("#hf-preview")).not.toContainText("evil.example");
  await page.getByRole("button", { name: "No, keep what I have" }).click();
  await expect(page.locator("#hf-status")).toHaveText("Nothing was changed.");
  expect(await stored(page)).toBeUndefined();

  for (const [content, message] of [
    ["not json", "That file isn't an AI helpers file. Nothing was changed."],
    [JSON.stringify({ app: "focus-app-ai-helpers", version: 2, helpers: [] }), "That file was made by a newer version of the app. Nothing was changed."],
    [JSON.stringify(helpersFile([{ label: "x", url: "https://user:pw@evil.example/v1/chat/completions", model: "m" }])), "That file has no helpers that can be added. Nothing was changed."],
    ["x".repeat(250000), "That file is too big to be an AI helpers file. Nothing was changed."],
  ]) {
    await page.getByRole("button", { name: "Load AI helpers" }).click();
    await page.getByLabel("Choose an AI helpers file").setInputFiles(file("bad.json", content));
    await expect(page.locator("#hf-status")).toHaveText(message);
    await page.getByRole("button", { name: "Cancel" }).click();
  }
  expect(await stored(page)).toBeUndefined();
});

test("Loading only adds: the helper in use and existing helpers stay as they were, duplicates are skipped, No changes nothing", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await addOther(page);
  await expect(page.locator(".helper-card")).toHaveCount(1);
  const before = await stored(page);
  expect(before.chosenId).toBe(before.services[0].id);

  const content = helpersFile([
    { ref: "h1", label: "Same again", url: `${HOST}/v1/chat/completions`, model: "small-model", effort: "high" },
    HELPER,
  ]);
  await loadFile(page, content);
  await expect(page.locator("#hf-skipped")).toContainText("Same again");
  await expect(page.locator("#hf-preview li")).toHaveCount(1);
  await page.getByRole("button", { name: "No, keep what I have" }).click();
  expect(await stored(page)).toEqual(before);

  await loadFile(page, content);
  await page.getByRole("button", { name: "Yes, add these helpers" }).click();
  await expect(page.locator(".helper-card")).toHaveCount(2);
  const after = await stored(page);
  expect(after.chosenId).toBe(before.chosenId);
  expect(after.services[0]).toEqual(before.services[0]);
  expect(after.services[1]).toMatchObject({ label: "Loaded one", model: "big-model", effort: "high", keyReady: false, keyHint: "" });
});

test("Loading with no helper in use does not pick one", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await loadFile(page, helpersFile([HELPER]));
  await page.getByRole("button", { name: "Yes, add these helpers" }).click();
  await expect(page.locator(".helper-card")).toHaveCount(1);
  const ai = await stored(page);
  expect(ai.chosenId ?? null).toBeNull();
});
