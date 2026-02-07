import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      include: ["src/**/*.ts"],
      outDir: "dist",
      rollupTypes: true,
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
