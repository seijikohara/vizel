import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 3002,
  },
  optimizeDeps: {
    exclude: ["@vizel/svelte"],
    include: ["@vizel/svelte > @vizel/core", "@vizel/svelte > @iconify/svelte"],
  },
  ssr: {
    noExternal: ["@vizel/svelte"],
  },
});
