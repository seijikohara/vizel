import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 3002,
  },
  optimizeDeps: {
    // Exclude workspace packages so Vite can process .svelte files
    exclude: ["@vizel/svelte"],
  },
  ssr: {
    // Ensure @vizel/svelte is bundled so .svelte files are processed
    noExternal: ["@vizel/svelte"],
  },
});
