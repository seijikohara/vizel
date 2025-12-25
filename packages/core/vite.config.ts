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
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: [
        "@tiptap/core",
        "@tiptap/extension-blockquote",
        "@tiptap/extension-bold",
        "@tiptap/extension-bubble-menu",
        "@tiptap/extension-bullet-list",
        "@tiptap/extension-code",
        "@tiptap/extension-code-block",
        "@tiptap/extension-document",
        "@tiptap/extension-dropcursor",
        "@tiptap/extension-gapcursor",
        "@tiptap/extension-hard-break",
        "@tiptap/extension-heading",
        "@tiptap/extension-history",
        "@tiptap/extension-horizontal-rule",
        "@tiptap/extension-image",
        "@tiptap/extension-italic",
        "@tiptap/extension-link",
        "@tiptap/extension-list-item",
        "@tiptap/extension-list-keymap",
        "@tiptap/extension-ordered-list",
        "@tiptap/extension-paragraph",
        "@tiptap/extension-placeholder",
        "@tiptap/extension-strike",
        "@tiptap/extension-table",
        "@tiptap/extension-table-cell",
        "@tiptap/extension-table-header",
        "@tiptap/extension-table-row",
        "@tiptap/extension-text",
        "@tiptap/pm",
        "@tiptap/suggestion",
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
