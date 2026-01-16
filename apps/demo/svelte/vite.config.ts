import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [svelte()],
  server: {
    port: 3002,
  },
  resolve:
    mode === "development"
      ? {
          alias: {
            "@vizel/core": path.resolve(__dirname, "../../../packages/core/src"),
            "@vizel/svelte": path.resolve(__dirname, "../../../packages/svelte/src"),
          },
        }
      : undefined,
  optimizeDeps: {
    // Exclude workspace packages so Vite can process .svelte files
    exclude: ["@vizel/svelte"],
  },
  ssr: {
    // Ensure @vizel/svelte is bundled so .svelte files are processed
    noExternal: ["@vizel/svelte"],
  },
}));
