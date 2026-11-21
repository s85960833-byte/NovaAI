import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/nova2",
  fullyParallel: false,
  workers: process.env.CI ? 1 : 2,
  reporter: "list",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: `http://127.0.0.1:${process.env.NOVA2_E2E_PORT || "8787"}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run start --workspace @nova/api",
    url: "http://127.0.0.1:8787/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      MOCK_FEATURES_ENABLED: "true",
      AI_PROVIDER: "mock",
      AI_KILL_SWITCH: "true",
      PORT: process.env.NOVA2_E2E_PORT || "8787",
      NOVA2_API_PORT: "8788",
      NOVA2_API_HOST: "127.0.0.1",
      APP_BASE_URL: "http://127.0.0.1:8787",
    },
  },
});
