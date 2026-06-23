import { resolve } from "node:path";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Point Vite's root at the React CT directory so the dep optimizer scans only
  // that subtree instead of the entire pnpm monorepo store, which would cause
  // Vite to stall for minutes and the browser iframes to time out.
  root: resolve(import.meta.dirname, "tests/ct/react"),
  // Serve files outside `root`: the shared scenarios under tests/ct/scenarios
  // and the @vizel source under packages/*/src. noDiscovery still prevents the
  // monorepo-wide dependency crawl.
  server: { fs: { allow: [resolve(import.meta.dirname)] } },
  plugins: [react()],
  resolve: {
    alias: {
      "@vizel/core": resolve(import.meta.dirname, "packages/core/src"),
      "@vizel/headless": resolve(import.meta.dirname, "packages/headless/src"),
      "@vizel/react": resolve(import.meta.dirname, "packages/react/src"),
    },
  },
  optimizeDeps: {
    // Scope dependency discovery to the test entries instead of the whole pnpm
    // store. Vite crawls from the specs (which import the editor) and pre-bundles
    // the editor's transitive CJS deps (markdown-it-task-lists via tiptap-markdown,
    // etc.) for the browser, without the monorepo-wide scan that stalls a cold start.
    entries: ["specs-bc/**/*.bc.test.{ts,tsx}"],
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-dev-runtime",
      "react/jsx-runtime",
      "vitest > @vitest/expect > chai",
      "vitest > expect-type",
      "vitest > @vitest/snapshot > magic-string",
    ],
  },
  test: {
    // test.include is relative to root (tests/ct/react).
    include: ["specs-bc/**/*.bc.test.{ts,tsx}"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }, { browser: "firefox" }, { browser: "webkit" }],
    },
  },
});
