import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve:
    mode === "development"
      ? {
          alias: {
            "@vizel/core": path.resolve(__dirname, "../../../packages/core/src"),
            "@vizel/react": path.resolve(__dirname, "../../../packages/react/src"),
          },
        }
      : undefined,
}));
