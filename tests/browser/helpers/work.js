// Shared helper for the work screen and home screen browser tests.

// Pastes an essay, shows the steps, and presses Start, so the work screen is open.
export async function startWork(page, text = "1. Find three sources\n2. Take notes\n3. Write a draft") {
  await page.goto("/");
  await page.getByLabel("Assignment text").fill(text);
  await page.getByRole("button", { name: "Essay" }).click();
  await page.getByRole("button", { name: "Suggest some to start" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
}
