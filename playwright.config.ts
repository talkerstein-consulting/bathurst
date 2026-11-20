import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3000", trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // reuses the dev server if it is already running
  webServer: { command: "npm run dev", url: process.env.BASE_URL ?? "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});
