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
  reporter: "html",
  use: {
    trace: "on-first-retry",
    ctPort: 3110,
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
