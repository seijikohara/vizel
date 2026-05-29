import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      include: ["src/**/*.ts"],
      outDir: "dist",
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "combobox/index": resolve(__dirname, "src/combobox/index.ts"),
        "dismissable/index": resolve(__dirname, "src/dismissable/index.ts"),
        "floating/index": resolve(__dirname, "src/floating/index.ts"),
        "focus-trap/index": resolve(__dirname, "src/focus-trap/index.ts"),
        "keyboard/index": resolve(__dirname, "src/keyboard/index.ts"),
        "popover/index": resolve(__dirname, "src/popover/index.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      // Externalise `@floating-ui/dom` so its bytes stay out of the
      // headless `dist`; consumers resolve it transitively through the
      // adapter's dependency on `@vizel/headless`. ADR-0014's headless
      // budget measures only Vizel-authored bytes for this reason.
      external: ["@floating-ui/dom"],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
