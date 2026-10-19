import { resolve } from "node:path";

import vue from "@vitejs/plugin-vue";
import dts from "unplugin-dts/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ["src/**/*.ts", "src/**/*.vue"],
      outDir: "dist",
      tsconfigPath: resolve(__dirname, "tsconfig.build.json"),
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["vue", "@tiptap/core", "@vizel/core", "@vizel/headless", "@iconify/vue"],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
