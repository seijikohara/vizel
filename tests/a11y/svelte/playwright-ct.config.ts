import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/experimental-ct-svelte";
import { svelte } from "@sveltejs/vite-plugin-svelte";

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
  // On CI the standalone Component-Test process hangs after the run on the
  // Linux runner (#630), so the suite runs the `ct-runner-diagnostics`
  // reporter: it logs the leaking resources and force-exits with the run's
  // status. Locally it keeps the HTML reporter, pinned to `open: "never"`
  // so it never starts a report server.
  reporter: process.env.CI
    ? [["list"], [resolve(import.meta.dirname, "../../_support/ct-runner-diagnostics.ts")]]
    : [["html", { open: "never" }]],
  use: {
    trace: "on-first-retry",
    // A11y Svelte owns port 3112. Each a11y framework plus the round-trip
    // suite binds a distinct CT port (3110/3111/3112/3113) so the suites
    // never collide when CI runs them on the same runner.
    ctPort: 3112,
    ctViteConfig: {
      plugins: [svelte()],
      resolve: {
        alias: {
          "@vizel/core": resolve(import.meta.dirname, "../../../packages/core/src"),
          "@vizel/headless": resolve(import.meta.dirname, "../../../packages/headless/src"),
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
