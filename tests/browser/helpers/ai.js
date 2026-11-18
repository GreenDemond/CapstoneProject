import { expect } from "@playwright/test";

export const KEY = "sk-test-helper-1234567890";
export const HOST = "https://ai.example.test";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };

// A stand-in AI service. No real service or key is used. Returns what it received.
export async function standIn(page, { host = HOST, base = "/v1", models = ["small-model", "big-model"], content = "ok", chatStatus = 200, chatBody = null, abortChat = false, acceptKey = null, chatDelay = 0, redirectTo = null, rejectReasoning = false } = {}) {
  const seen = { models: [], chat: [] };
  await page.route(`${host}${base}/models*`, async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }
    seen.models.push({ auth: request.headers().authorization ?? null });
    await route.fulfill({ headers: CORS, json: { object: "list", data: models.map((id) => ({ id })) } });
  });
  await page.route(`${host}${base}/chat/completions*`, async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }
    seen.chat.push({ auth: request.headers().authorization ?? null, body: request.postData() });
    if (rejectReasoning && (request.postData() ?? "").includes('"reasoning"')) {
      await route.fulfill({ status: 400, headers: CORS, json: { error: "reasoning is mandatory for this model" } });
      return;
    }
    if (abortChat) {
      await route.abort();
      return;
    }
    if (redirectTo) {
      await route.fulfill({ status: 307, headers: { ...CORS, Location: redirectTo } });
      return;
    }
    if (chatDelay) {
      await new Promise((resolve) => setTimeout(resolve, chatDelay));
    }
    const rejected = acceptKey && request.headers().authorization !== `Bearer ${acceptKey}`;
    try {
      await route.fulfill({ status: rejected ? 401 : chatStatus, headers: CORS, json: rejected ? { error: "bad key" } : chatBody ?? { choices: [{ message: { content } }] } });
    } catch {
      // The page stopped waiting (Stop was pressed), so there is nobody to answer.
    }
  });
  return seen;
}

export async function openSettings(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "AI helpers" })).toBeVisible();
}

export const nextButton = (page) => page.getByRole("button", { name: /^Next/ });

// A control's position on the page (not the screen), so scrolling does not count as movement.
export const pageTop = (locator) => locator.evaluate((node) => node.getBoundingClientRect().top + globalThis.scrollY);

// Step 1 to 3 for "Another service": address, key, pick (by clicking the AI), leaving you on the check step.
// The helper is named after its host unless a name is given (a blank name would be named automatically).
export async function setUpOther(page, { address = HOST, key = KEY, model = "small-model", name = new URL(address).hostname } = {}) {
  await page.getByRole("button", { name: "Add an AI helper" }).click();
  await page.getByLabel(/^Another service/).check();
  await page.getByLabel("Its web address").fill(address);
  await nextButton(page).click();
  await page.getByLabel("Your key").fill(key);
  await nextButton(page).click();
  await page.getByLabel("Pick an AI").selectOption(model);
  await page.getByLabel("Name this helper (optional)").fill(name);
  await nextButton(page).click();
}

// Adds a working "Another service" helper all the way to Done.
export async function addOther(page, options = {}) {
  await setUpOther(page, options);
  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Done" }).click();
}
