import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/experimental-ct-react";
import react from "@vitejs/plugin-react";

/**
 * Playwright Component Test config for the visual regression suite.
 *
 * Visual snapshots are deliberately constrained to one browser
 * (chromium) so font and rendering subpixel differences across
 * engines do not generate false positives. The suite is CI-only —
 * baselines live in `__snapshots__/` and update through a
 * `workflow_dispatch` job rather than running on every pull request.
 */
export default defineConfig({
  testDir: "./specs",
  snapshotDir: "./__snapshots__",
  // Snapshot paths exclude the platform / browser suffix so the same
  // baselines apply across local macOS dev and Linux CI. The
  // `maxDiffPixelRatio` below absorbs subpixel rendering differences;
  // genuine layout regressions still fail.
  snapshotPathTemplate: "{snapshotDir}/{testFileName}-snapshots/{arg}{ext}",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : "50%",
  reporter: "html",
  expect: {
    toHaveScreenshot: {
      // Anti-aliasing differences between Linux CI and local macOS are
      // expected; the threshold is wide enough to absorb them while
      // still catching layout regressions.
      maxDiffPixelRatio: 0.02,
    },
  },
  use: {
    trace: "on-first-retry",
    ctPort: 3120,
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
