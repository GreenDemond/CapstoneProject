import { test, expect } from "@playwright/test";
import { KEY, standIn, openSettings, addOther } from "./helpers/ai.js";

// Google's OpenAI-compatible Gemini address (design/google-address.md). Stand-in only: no real key or service.
const GOOGLE = { host: "https://generativelanguage.googleapis.com", base: "/v1beta/openai", models: ["models/gemini-a", "models/gemini-b"] };

test("typing Google's base address checks and chats at the expanded address with the Bearer key", async ({ page }) => {
  const seen = await standIn(page, GOOGLE);
  await openSettings(page);
  await addOther(page, { address: "https://generativelanguage.googleapis.com/v1beta/openai", model: "models/gemini-b", name: "Gemini" });

  expect(seen.models.length).toBeGreaterThan(0);
  expect(seen.models[0].auth).toBe(`Bearer ${KEY}`);
  expect(seen.chat.length).toBeGreaterThan(0);
  expect(seen.chat[0].auth).toBe(`Bearer ${KEY}`);
  expect(JSON.parse(seen.chat[0].body).model).toBe("models/gemini-b");
  await expect(page.locator(".helper-card")).toContainText("Gemini");
  expect(await page.content()).not.toContain(KEY);
});
