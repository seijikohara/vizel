import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";

import Mermaid from "./Mermaid.vue";

import "./vizel-overrides.css";

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("Mermaid", Mermaid);
  },
};

export default theme;
