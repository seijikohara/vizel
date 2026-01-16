import path from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  server: {
    port: 3001,
  },
  resolve:
    mode === "development"
      ? {
          alias: {
            "@vizel/core": path.resolve(__dirname, "../../../packages/core/src"),
            "@vizel/vue": path.resolve(__dirname, "../../../packages/vue/src"),
          },
        }
      : undefined,
}));
