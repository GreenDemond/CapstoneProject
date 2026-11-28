// The old row of seven buttons is gone. Talk and Plan are tabs; everything else is a link on the Me screen.
// Call this from the Today screen (or any screen with the tab bar showing).
const TAB_FOR = { "Talk it through": "Talk", "My calendar": "Plan", "Me and my data": "Me" };

export async function openScreen(page, name) {
  const tab = TAB_FOR[name];
  if (tab) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    return;
  }
  await page.getByRole("tab", { name: "Me", exact: true }).click();
  await page.locator("#me-screen").getByRole("button", { name, exact: true }).click();
}
