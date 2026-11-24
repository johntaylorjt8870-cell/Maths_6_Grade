import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "lesson-5*.spec.mjs",
  fullyParallel: false,
  timeout: 120_000,
  expect: { timeout: 5_000 },
  reporter: "list",
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:4001", headless: true, actionTimeout: 4_000, navigationTimeout: 15_000 },
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://127.0.0.1:4001/Maths_6_Grade/",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { HOST: "0.0.0.0", PORT: "4001" },
  },
});
