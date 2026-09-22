import { defineConfig, devices } from "@playwright/test";

const CHROMIUM_PATH = "C:\\Users\\hp\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: CHROMIUM_PATH,
        },
      },
    },
    {
      name: "Tablet Chromium",
      use: {
        ...devices["iPad (gen 7)"],
        defaultBrowserType: "chromium",
        launchOptions: {
          executablePath: CHROMIUM_PATH,
        },
      },
    },
    {
      name: "Mobile Chromium",
      use: {
        ...devices["iPhone 14"],
        defaultBrowserType: "chromium",
        launchOptions: {
          executablePath: CHROMIUM_PATH,
        },
      },
    },
  ],
  webServer: {
    command: "npm run dev:frontend",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
