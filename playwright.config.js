import { defineConfig, devices } from "@playwright/test";

// Every browser test runs at phone width and at desktop width (DECISIONS.md T12).
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
  },
  webServer: {
    command: "npm start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "phone",
      use: { ...devices["iPhone SE"], defaultBrowserType: "chromium" },
    },
    {
      name: "desktop",
      use: { viewport: { width: 1280, height: 800 } },
    },
  ],
});
