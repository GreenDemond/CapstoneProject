import { test, expect } from "@playwright/test";

// Main path: the page opens and shows the setup message.
test("the app opens and shows the setup message", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Focus app" })).toBeVisible();
  await expect(page.getByText("Setup complete")).toBeVisible();
});

// Awkward path: no page asks for anything outside this app (DECISIONS.md T2),
// and a missing page is a clean 404, not a crash.
test("the app loads nothing from outside, and a missing page is a clean 404", async ({ page, request, baseURL }) => {
  const ownOrigin = new URL(baseURL).origin;
  const outside = [];
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (url.origin !== ownOrigin && url.protocol !== "data:") {
      outside.push(req.url());
    }
  });
  await page.goto("/");
  expect(outside).toEqual([]);

  const missing = await request.get("/does-not-exist.html");
  expect(missing.status()).toBe(404);
});
