import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/experimental-ct-vue";
import vue from "@vitejs/plugin-vue";

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
  // The HTML reporter must never auto-open a browser. Auto-open keeps a
  // server handle alive and would hold the runner's event loop open after
  // the run finishes, so the suite is pinned to `open: "never"`. The
  // PLAYWRIGHT_HTML_OPEN=never CI env var is the belt-and-braces guard.
  reporter: [["html", { open: "never" }]],
  use: {
    trace: "on-first-retry",
    // A11y Vue owns port 3111. Each a11y framework plus the round-trip
    // suite binds a distinct CT port (3110/3111/3112/3113) so the suites
    // never collide when CI runs them on the same runner.
    ctPort: 3111,
    ctViteConfig: {
      plugins: [vue()],
      resolve: {
        alias: {
          "@vizel/core": resolve(import.meta.dirname, "../../../packages/core/src"),
          "@vizel/headless": resolve(import.meta.dirname, "../../../packages/headless/src"),
          "@vizel/vue": resolve(import.meta.dirname, "../../../packages/vue/src"),
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
