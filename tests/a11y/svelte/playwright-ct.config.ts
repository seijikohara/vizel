import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/experimental-ct-svelte";
import { svelte } from "@sveltejs/vite-plugin-svelte";

/**
 * Pillar 5 — accessibility (Section 14).
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
    ctPort: 3112,
    ctViteConfig: {
      plugins: [svelte()],
      resolve: {
        alias: {
          "@vizel/core": resolve(import.meta.dirname, "../../../packages/core/src"),
          "@vizel/svelte": resolve(import.meta.dirname, "../../../packages/svelte/src"),
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
