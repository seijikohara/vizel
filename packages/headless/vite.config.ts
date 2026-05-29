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
        "dismissable/index": resolve(__dirname, "src/dismissable/index.ts"),
        "keyboard/index": resolve(__dirname, "src/keyboard/index.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
