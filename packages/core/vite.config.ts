import { resolve } from "node:path";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      include: ["src/**/*.ts"],
      outDir: "dist",
      rollupTypes: true,
      // Use the build tsconfig so the declaration rollup resolves
      // @vizel/headless to its built dist types instead of following the
      // root path alias into headless source (which trips TS6059).
      tsconfigPath: resolve(__dirname, "tsconfig.build.json"),
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [resolve(__dirname, "src/styles")],
      },
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: [
        // Tiptap packages (all @tiptap/* must be external to avoid plugin conflicts)
        /^@tiptap\/.*/,
        // ProseMirror packages (must be external to share plugin instances)
        /^prosemirror-.*/,
        // `@vizel/headless` is a declared dependency that ships the popover
        // primitive Core re-exports; keep it (and its `@floating-ui/dom`
        // engine) external so Core imports them instead of inlining a copy.
        // The consumer resolves both once through the shared dependency tree.
        /^@vizel\/headless(\/.*)?$/,
        /^@floating-ui\/.*/,
        // Large optional dependencies - externalized to reduce bundle size
        "@hpcc-js/wasm-graphviz",
        "mermaid",
        "katex",
        "lowlight",
        "fuse.js",
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
