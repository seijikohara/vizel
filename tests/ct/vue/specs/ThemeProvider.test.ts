// Import the Vizel stylesheet so CSS custom properties resolve correctly when
// the scenarios call getComputedStyle. Without this import the variables are
// absent from the cascade and all CSS-variable assertions read empty strings.
import "@vizel/core/styles/index.scss";
import { afterEach, beforeEach, describe, test } from "vitest";
import { render } from "vitest-browser-vue";

import {
  testThemeProviderDarkCSS,
  testThemeProviderDefaultTheme,
  testThemeProviderLightCSS,
  testThemeProviderPersistence,
  testThemeProviderShowsResolvedTheme,
  testThemeProviderSpacingVariables,
  testThemeProviderToggle,
  testThemeProviderTypographyVariables,
} from "../../scenarios/theme-provider.scenario";
import ThemeProviderFixture from "./ThemeProviderFixture.vue";

describe("ThemeProvider (Vitest Browser) - Vue", () => {
  beforeEach(() => {
    // Clear localStorage before each test so previous theme choices do not
    // bleed into subsequent tests in the same browser tab.
    localStorage.clear();
  });

  afterEach(() => {
    // Remove the data-vizel-theme attribute after CSS-variable tests to avoid
    // the theme attribute from one test affecting the next test's cascade.
    document.documentElement.removeAttribute("data-vizel-theme");
  });

  test("renders with default theme", async () => {
    render(ThemeProviderFixture, { props: {} });
    await testThemeProviderDefaultTheme();
  });

  test("toggles theme on button click", async () => {
    render(ThemeProviderFixture, { props: { defaultTheme: "light" } });
    await testThemeProviderToggle();
  });

  test("persists theme to localStorage", async () => {
    const storageKey = "vizel-theme-test";
    render(ThemeProviderFixture, { props: { defaultTheme: "light", storageKey } });
    await testThemeProviderPersistence(storageKey);
  });

  test("shows resolved theme", async () => {
    render(ThemeProviderFixture, { props: { defaultTheme: "light" } });
    await testThemeProviderShowsResolvedTheme();
  });

  test("applies light theme CSS variables", async () => {
    render(ThemeProviderFixture, { props: { defaultTheme: "light" } });
    await testThemeProviderLightCSS();
  });

  test("applies dark theme CSS variables", async () => {
    render(ThemeProviderFixture, { props: { defaultTheme: "dark" } });
    await testThemeProviderDarkCSS();
  });

  test("defines typography CSS variables", async () => {
    render(ThemeProviderFixture, { props: { defaultTheme: "light" } });
    await testThemeProviderTypographyVariables();
  });

  test("defines spacing CSS variables", async () => {
    render(ThemeProviderFixture, { props: { defaultTheme: "light" } });
    await testThemeProviderSpacingVariables();
  });
});
