import { resolve } from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const rootDir = import.meta.dirname;

// Resolve `@vizel/*` to source so the browser bundles the editor under test
// without a build step. Each project repeats this alias because Vitest
// projects do not inherit the top-level `resolve` in browser mode.
const vizelAliases = {
  "@vizel/core": resolve(rootDir, "packages/core/src"),
  "@vizel/headless": resolve(rootDir, "packages/headless/src"),
} as const;

// Run all three browser engines so the matrix matches the Playwright CT suite.
// Each instance carries an explicit, framework-scoped name. Vitest derives a
// browser instance's project name from the parent name plus the browser; two
// projects that both define a nameless chromium instance collide on the
// auto-generated "<project> (chromium)" name, so name every instance uniquely.
const browserNames = ["chromium", "firefox", "webkit"] as const;
const browserInstancesFor = (fw: string) =>
  browserNames.map((browser) => ({ browser, name: `${fw}-${browser}` }));

// Pre-bundle the chai/expect helpers Vitest pulls in for every browser project.
// Listing them keeps the optimizer off the monorepo-wide crawl that stalls a
// cold start.
const sharedOptimizeIncludes = [
  "vitest > @vitest/expect > chai",
  "vitest > expect-type",
  "vitest > @vitest/snapshot > magic-string",
] as const;

// Serve files outside each project root: the shared scenarios under
// tests/ct/scenarios and the @vizel source under packages/*/src.
const fsAllow = { fs: { allow: [resolve(rootDir)] } } as const;

const testInclude = ["specs-bc/**/*.bc.test.{ts,tsx}"] as const;

// One project per framework. Each project scopes Vite's root at its own CT
// subtree so the dependency optimizer scans only that subtree instead of the
// entire pnpm monorepo store, which would stall a cold start and time out the
// browser iframes. `optimizeDeps.entries` points the crawl at the test glob.
export default defineConfig({
  test: {
    // The asynchronous Tiptap mount plus real-browser interaction overruns the
    // default 5s test budget when several browser instances run concurrently and
    // saturate the machine (notably the full nine-instance matrix). Raise the
    // ceiling so contention slows tests without failing them. Projects inherit
    // this value.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    projects: [
      {
        root: resolve(rootDir, "tests/ct/react"),
        plugins: [react()],
        server: { ...fsAllow },
        resolve: {
          alias: { ...vizelAliases, "@vizel/react": resolve(rootDir, "packages/react/src") },
        },
        optimizeDeps: {
          entries: [...testInclude],
          include: [
            "react",
            "react-dom",
            "react-dom/client",
            "react/jsx-dev-runtime",
            "react/jsx-runtime",
            ...sharedOptimizeIncludes,
          ],
        },
        test: {
          name: "react",
          include: [...testInclude],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: browserInstancesFor("react"),
          },
        },
      },
      {
        root: resolve(rootDir, "tests/ct/vue"),
        plugins: [vue()],
        server: { ...fsAllow },
        resolve: { alias: { ...vizelAliases, "@vizel/vue": resolve(rootDir, "packages/vue/src") } },
        optimizeDeps: {
          entries: [...testInclude],
          include: ["vue", ...sharedOptimizeIncludes],
        },
        test: {
          name: "vue",
          include: [...testInclude],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: browserInstancesFor("vue"),
          },
        },
      },
      {
        root: resolve(rootDir, "tests/ct/svelte"),
        plugins: [svelte()],
        server: { ...fsAllow },
        resolve: {
          alias: { ...vizelAliases, "@vizel/svelte": resolve(rootDir, "packages/svelte/src") },
        },
        optimizeDeps: {
          entries: [...testInclude],
          // `@vizel/headless` resolves to source, so Vite discovers
          // `@floating-ui/dom` only after it chunks the entry. Pre-bundle the
          // dependency up front; otherwise the Svelte build references
          // esbuild's `__commonJSMin` interop helper before it is defined and
          // the mount throws at runtime (mirrors the Playwright Svelte CT config).
          include: ["svelte", "@floating-ui/dom", ...sharedOptimizeIncludes],
        },
        test: {
          name: "svelte",
          include: [...testInclude],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: browserInstancesFor("svelte"),
          },
        },
      },
    ],
  },
});
