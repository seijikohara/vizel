import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "./vizel-overrides.css";

const theme: Theme = {
  ...DefaultTheme,
};

// biome-ignore lint/style/noDefaultExport: VitePress requires default export
export default theme;
