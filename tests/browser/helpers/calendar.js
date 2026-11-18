// Shared helpers for the calendar browser tests.

export function dayFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function openCalendar(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "My calendar" }).click();
}

// Opens the add form if it is closed.
export async function openForm(page) {
  const opener = page.getByRole("button", { name: "Add something" });
  if ((await opener.getAttribute("aria-expanded")) !== "true") {
    await opener.click();
  }
}

// Adds a task (date given as days from today) and leaves the form closed.
export async function addItem(page, { title, days = 3, time = "12:00", date = null }) {
  await openForm(page);
  await page.getByLabel("What is it?").fill(title);
  await page.getByLabel("Due date").fill(date ?? dayFromNow(days));
  await page.getByLabel("Due time").fill(time);
  await page.getByRole("button", { name: "Add to my calendar" }).click();
}

// Two taps: Delete, then Yes, delete (waits out the short guard).
export async function deleteWithConfirm(row) {
  await row.getByRole("button", { name: "Delete" }).click();
  await row.page().waitForTimeout(500);
  await row.getByRole("button", { name: "Yes, delete" }).click();
}
