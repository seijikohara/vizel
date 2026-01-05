import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/experimental-ct-vue";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  testDir: "./specs",
  snapshotDir: "./__snapshots__",
  timeout: 10_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : "50%",
  reporter: "html",
  use: {
    trace: "on-first-retry",
    ctPort: 3101,
    ctViteConfig: {
      plugins: [vue()],
      resolve: {
        alias: {
          "@vizel/core": resolve(__dirname, "../../../packages/core/src"),
          "@vizel/vue": resolve(__dirname, "../../../packages/vue/src"),
        },
      },
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
