import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";

import "./vizel-overrides.css";

const theme: Theme = {
  ...DefaultTheme,
};

export default theme;
