import { defineConfig } from "@playwright/test";

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
      use: { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true },
    },
    {
      name: "desktop",
      use: { viewport: { width: 1280, height: 800 } },
    },
  ],
});
