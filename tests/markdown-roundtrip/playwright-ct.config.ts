import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/experimental-ct-react";
import react from "@vitejs/plugin-react";

/**
 * Playwright Component Test config for the Markdown round-trip suite.
 *
 * The suite mounts a single React fixture that exposes
 * `assertMarkdownRoundtrip` and the built-in flavor plugins on
 * `window`, then drives the assertion through `page.evaluate`. The
 * fixture is intentionally minimal — the round-trip helper internally
 * constructs its own editor — so the suite stays isolated from the
 * framework UI specs under `tests/ct/`.
 */
export default defineConfig({
  testDir: "./specs",
  snapshotDir: "./__snapshots__",
  timeout: 60_000,
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
    ? [["list"], [resolve(import.meta.dirname, "../_support/ct-runner-diagnostics.ts")]]
    : [["html", { open: "never" }]],
  use: {
    trace: "on-first-retry",
    // The round-trip suite binds port 3113 to avoid colliding with the
    // a11y suites on 3110/3111/3112 when CI runs them on the same runner.
    ctPort: 3113,
    ctViteConfig: {
      plugins: [react()],
      resolve: {
        alias: {
          "@vizel/core": resolve(import.meta.dirname, "../../packages/core/src"),
          "@vizel/react": resolve(import.meta.dirname, "../../packages/react/src"),
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
