import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/experimental-ct-react";
import react from "@vitejs/plugin-react";

/**
 * Pillar 5 — accessibility.
 *
 * Runs `@axe-core/playwright` against each shipped component to assert
 * WCAG 2.1 AA conformance. Chromium-only by design: axe-core reports a
 * single canonical violation list, so re-running the same rule set in
 * Firefox and WebKit adds nothing but flake.
 */
export default defineConfig({
  testDir: "./specs",
  snapshotDir: "./__snapshots__",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : "50%",
  reporter: "html",
  use: {
    trace: "on-first-retry",
    ctPort: 3110,
    ctViteConfig: {
      plugins: [react()],
      resolve: {
        alias: {
          "@vizel/core": resolve(import.meta.dirname, "../../../packages/core/src"),
          "@vizel/headless": resolve(import.meta.dirname, "../../../packages/headless/src"),
          "@vizel/react": resolve(import.meta.dirname, "../../../packages/react/src"),
        },
      },
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
