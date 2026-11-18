import { test, expect } from "@playwright/test";
import { standIn, openSettings, addOther } from "./helpers/ai.js";

async function openTalkSettings(page) {
  await page.getByRole("button", { name: "How the AI talks" }).click();
  await expect(page.getByRole("heading", { name: "How the AI talks" })).toBeVisible();
}

// Main path: change the Essay guide, save, and the chat uses it, after the rules.
test("a saved Essay guide and length are used by the chat, and Reading keeps the default", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await addOther(page);
  await openTalkSettings(page);
  await expect(page.getByText("Using the default")).toHaveCount(7);
  await page.getByRole("button", { name: "Change Essay" }).click();
  await page.getByLabel("Your guide for the AI").fill("Ask me what I think before you suggest anything.");
  await page.getByRole("button", { name: "Medium" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved on this device.")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator(".helper-card", { hasText: "Essay" }).getByText("Your own guide")).toBeVisible();

  await page.getByRole("button", { name: "Back" }).first().click();
  await page.getByRole("button", { name: "Back" }).first().click();
  const seen = await standIn(page, { content: "ok" });
  await page.getByRole("button", { name: "Talk it through" }).click();
  await page.getByRole("button", { name: "Essay" }).click();
  await page.getByLabel("Your message").fill("hi");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  const system = JSON.parse(seen.chat.at(-1).body).messages[0].content;
  expect(system).toContain("Ask me what I think before you suggest anything.");
  expect(system).toContain("one short paragraph");
  expect(system.indexOf("Never give the answer")).toBeLessThan(system.indexOf("Ask me what I think"));
  expect(system.trimEnd()).toMatch(/never the answer/);

  await page.getByRole("button", { name: "New chat" }).click(); // was Start over
  await page.getByRole("button", { name: "Reading" }).click();
  await page.getByLabel("Your message").fill("hi");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".chat-ai")).toHaveCount(2);
  const other = JSON.parse(seen.chat.at(-1).body).messages[0].content;
  expect(other).not.toContain("Ask me what I think");
});

// A kind without its own guide uses All kinds; the saved settings survive a reload.
test("an All kinds guide is used by other kinds and is still there after a reload", async ({ page }) => {
  await standIn(page);
  await openSettings(page);
  await openTalkSettings(page);
  await page.getByRole("button", { name: "Change All kinds" }).click();
  await page.getByLabel("Your guide for the AI").fill("Keep it very gentle.");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved on this device.")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Settings" }).click();
  await openTalkSettings(page);
  await expect(page.locator(".helper-card", { hasText: "Reading" }).getByText("Using your All kinds guide")).toBeVisible();
  await page.getByRole("button", { name: "Change Reading" }).click();
  await expect(page.getByLabel("Your guide for the AI")).toHaveValue("Keep it very gentle.");
});

// Use the default clears only that row.
test("Use the default clears only that kind", async ({ page }) => {
  await openSettings(page);
  await openTalkSettings(page);
  for (const name of ["Change Essay", "Change Project"]) {
    await page.getByRole("button", { name }).click();
    await page.getByLabel("Your guide for the AI").fill("Mine");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Saved on this device.")).toBeVisible();
    await page.getByRole("button", { name: "Back" }).click();
  }
  await page.getByRole("button", { name: "Change Essay" }).click();
  await page.getByRole("button", { name: "Use the default" }).click();
  await expect(page.getByText("Press again to use the default.")).toBeVisible();
  await page.getByRole("button", { name: "Use the default" }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator(".helper-card", { hasText: "Essay" }).getByText("Using the default")).toBeVisible();
  await expect(page.locator(".helper-card", { hasText: "Project" }).getByText("Your own guide")).toBeVisible();
});

// Awkward path: Back with unsaved changes warns once, then leaves; nothing was saved.
test("Back with unsaved changes warns first and saves nothing", async ({ page }) => {
  await openSettings(page);
  await openTalkSettings(page);
  await page.getByRole("button", { name: "Change Essay" }).click();
  await page.getByLabel("Your guide for the AI").fill("Unsaved words");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByText("You have changes that aren't saved.")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator(".helper-card", { hasText: "Essay" }).getByText("Using the default")).toBeVisible();
});

// The limit is shown, and the rules line is on the screen.
test("the screen shows the character limit and says the rules are always added", async ({ page }) => {
  await openSettings(page);
  await openTalkSettings(page);
  await expect(page.getByText("The app always adds its own rules: hints, not answers.").first()).toBeVisible();
  await page.getByRole("button", { name: "Change Essay" }).click();
  await expect(page.getByText(/of 500 characters/)).toBeVisible();
  await page.getByLabel("Your guide for the AI").fill("y".repeat(900));
  await expect(page.getByLabel("Your guide for the AI")).toHaveValue("y".repeat(500));
  await expect(page.getByText("That's the limit. Anything longer was cut off.")).toBeVisible();
  await expect(page.getByText("sent to your AI helper with each message")).toBeVisible();
});

// Help me write it says it replaces the box, and Cancel keeps the student's own words.
test("Help me write it warns it replaces the box, and Cancel keeps your words", async ({ page }) => {
  await openSettings(page);
  await openTalkSettings(page);
  await page.getByRole("button", { name: "Change Essay" }).click();
  await page.getByLabel("Your guide for the AI").fill("My own careful guide");
  await page.getByRole("button", { name: "Help me write it" }).click();
  await expect(page.getByText("The draft replaces what is in the box")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByLabel("Your guide for the AI")).toHaveValue("My own careful guide");
});

// With an All kinds guide, a kind's reset button says where it goes back to.
test("on a kind the reset button names the All kinds guide when there is one", async ({ page }) => {
  await openSettings(page);
  await openTalkSettings(page);
  await page.getByRole("button", { name: "Change All kinds" }).click();
  await page.getByLabel("Your guide for the AI").fill("Everything gentle");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved on this device.")).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "Change Essay" }).click();
  await expect(page.getByRole("button", { name: "Use my All kinds guide" })).toBeVisible();
});

// Help me write it: four questions, then a draft in the box that is not saved until Save.
test("Help me write it drafts a guide that is not saved until Save", async ({ page }) => {
  await openSettings(page);
  await openTalkSettings(page);
  await page.getByRole("button", { name: "Change Essay" }).click();
  await page.getByRole("button", { name: "Help me write it" }).click();
  await page.getByRole("button", { name: "A short paragraph" }).click();
  await page.getByRole("button", { name: "Calm and plain" }).click();
  await page.getByRole("button", { name: "Ask me what I already know" }).click();
  await page.getByRole("button", { name: "A smaller piece to try" }).click();
  await expect(page.getByText("Here's a first draft.")).toBeVisible();
  const box = page.getByLabel("Your guide for the AI");
  await expect(box).toHaveValue(/Use calm, plain words\. Start by asking me what I already know\./);
  await expect(box).toHaveValue(/smaller piece to try/);
  await expect(page.getByRole("button", { name: "Medium" })).toHaveAttribute("aria-pressed", "true");
  // Not saved yet: leaving shows the warning, and a reload shows nothing saved.
  await page.reload();
  await page.getByRole("button", { name: "Settings" }).click();
  await openTalkSettings(page);
  await expect(page.locator(".helper-card", { hasText: "Essay" }).getByText("Using the default")).toBeVisible();
});

// Damaged saved settings do not crash anything.
test("damaged saved chat settings are ignored", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("focusapp.v1", JSON.stringify({ schemaVersion: 1, chat: { guides: 5, lengths: "x" } })));
  await page.reload();
  await page.getByRole("button", { name: "Settings" }).click();
  await openTalkSettings(page);
  await expect(page.getByText("Using the default")).toHaveCount(7);
});
