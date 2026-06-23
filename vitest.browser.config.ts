import { resolve } from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { playwright } from "@vitest/browser-playwright";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const rootDir = import.meta.dirname;

type Framework = "react" | "vue" | "svelte";

// Resolve `@vizel/*` to source so the browser bundles the editor under test
// without a build step. Each project repeats this alias because Vitest
// projects do not inherit the top-level `resolve` in browser mode.
const vizelAliases = {
  "@vizel/core": resolve(rootDir, "packages/core/src"),
  "@vizel/headless": resolve(rootDir, "packages/headless/src"),
} as const;

// All three browser engines, matching the Playwright CT matrix. Each instance
// carries an explicit, project-scoped name: Vitest derives a browser instance's
// project name from the parent name plus the browser, and two projects that both
// define a nameless chromium instance collide on the auto-generated name.
const browserNames = ["chromium", "firefox", "webkit"] as const;
const chromiumOnly = ["chromium"] as const;

// Pre-bundle the chai/expect helpers Vitest pulls in for every browser project.
// Listing them keeps the optimizer off the monorepo-wide crawl that stalls a
// cold start.
const sharedOptimizeIncludes = [
  "vitest > @vitest/expect > chai",
  "vitest > expect-type",
  "vitest > @vitest/snapshot > magic-string",
] as const;

// Serve files outside each project root: the shared scenarios under
// tests/*/scenarios and the @vizel source under packages/*/src.
const fsAllow = { fs: { allow: [resolve(rootDir)] } } as const;

const testInclude = ["specs-bc/**/*.bc.test.{ts,tsx}"] as const;

// Shared per-project test options. Projects do NOT inherit the root `test`
// block in browser mode, so spread these into every project's `test`.
// `fileParallelism: false` runs one spec file (one browser tab) at a time per
// project: the real-browser editor tests are timing-sensitive, and several
// concurrent tabs saturate the machine and flake on focus and async mount.
// The raised timeouts absorb the residual slowness of a contended run.
const sharedTestOptions = {
  testTimeout: 30_000,
  hookTimeout: 30_000,
  fileParallelism: false,
} as const;

const frameworkPlugin: Record<Framework, () => Plugin | Plugin[]> = { react, vue, svelte };

const frameworkPackageAlias: Record<Framework, string> = {
  react: "@vizel/react",
  vue: "@vizel/vue",
  svelte: "@vizel/svelte",
};

// Per-framework runtime entries to pre-bundle for the browser. Svelte needs
// `@floating-ui/dom` up front: `@vizel/headless` resolves to source, so Vite
// discovers the dependency only after chunking the entry, and the Svelte build
// then references esbuild's `__commonJSMin` interop helper before it is defined.
const frameworkOptimizeInclude: Record<Framework, readonly string[]> = {
  react: ["react", "react-dom", "react-dom/client", "react/jsx-dev-runtime", "react/jsx-runtime"],
  vue: ["vue"],
  svelte: ["svelte", "@floating-ui/dom"],
};

interface ProjectOptions {
  readonly name: string;
  readonly framework: Framework;
  readonly root: string;
  readonly browsers: readonly string[];
  readonly extraOptimize?: readonly string[];
}

// Build one Vitest browser project. Each project scopes Vite's root at its own
// test subtree so the dependency optimizer scans only that subtree instead of
// the whole pnpm monorepo store, which would stall a cold start and time out the
// browser iframes. `optimizeDeps.entries` points the crawl at the test glob.
function frameworkProject(options: ProjectOptions) {
  const { name, framework, root, browsers, extraOptimize = [] } = options;
  return {
    root: resolve(rootDir, root),
    plugins: [frameworkPlugin[framework]()],
    server: { ...fsAllow },
    resolve: {
      alias: {
        ...vizelAliases,
        [frameworkPackageAlias[framework]]: resolve(rootDir, `packages/${framework}/src`),
      },
    },
    optimizeDeps: {
      entries: [...testInclude],
      include: [
        ...frameworkOptimizeInclude[framework],
        ...extraOptimize,
        ...sharedOptimizeIncludes,
      ],
    },
    test: {
      ...sharedTestOptions,
      name,
      include: [...testInclude],
      browser: {
        enabled: true,
        provider: playwright(),
        headless: true,
        instances: browsers.map((browser) => ({ browser, name: `${name}-${browser}` })),
      },
    },
  };
}

// The Markdown round-trip suite is framework-agnostic: it imports the round-trip
// helper from `@vizel/core` and needs no adapter render. It runs in the browser
// only because the helper constructs a Tiptap editor that depends on `document`.
function roundtripProject() {
  return {
    root: resolve(rootDir, "tests/markdown-roundtrip"),
    server: { ...fsAllow },
    resolve: { alias: { ...vizelAliases } },
    optimizeDeps: {
      entries: [...testInclude],
      include: [...sharedOptimizeIncludes],
    },
    test: {
      ...sharedTestOptions,
      name: "roundtrip",
      include: [...testInclude],
      browser: {
        enabled: true,
        provider: playwright(),
        headless: true,
        instances: [{ browser: "chromium", name: "roundtrip-chromium" }],
      },
    },
  };
}

export default defineConfig({
  test: {
    projects: [
      // Component behavior suite — full browser matrix.
      frameworkProject({
        name: "react",
        framework: "react",
        root: "tests/ct/react",
        browsers: browserNames,
      }),
      frameworkProject({
        name: "vue",
        framework: "vue",
        root: "tests/ct/vue",
        browsers: browserNames,
      }),
      frameworkProject({
        name: "svelte",
        framework: "svelte",
        root: "tests/ct/svelte",
        browsers: browserNames,
      }),
      // Accessibility suite — Chromium only (axe-core reports one canonical list).
      frameworkProject({
        name: "a11y-react",
        framework: "react",
        root: "tests/a11y/react",
        browsers: chromiumOnly,
        extraOptimize: ["axe-core"],
      }),
      frameworkProject({
        name: "a11y-vue",
        framework: "vue",
        root: "tests/a11y/vue",
        browsers: chromiumOnly,
        extraOptimize: ["axe-core"],
      }),
      frameworkProject({
        name: "a11y-svelte",
        framework: "svelte",
        root: "tests/a11y/svelte",
        browsers: chromiumOnly,
        extraOptimize: ["axe-core"],
      }),
      // Markdown round-trip — Chromium only.
      roundtripProject(),
    ],
  },
});
