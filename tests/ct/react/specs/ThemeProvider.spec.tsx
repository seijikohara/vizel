import { test } from "@playwright/experimental-ct-react";
import {
  testThemeProviderDarkCSS,
  testThemeProviderDefaultTheme,
  testThemeProviderLightCSS,
  testThemeProviderPersistence,
  testThemeProviderShowsResolvedTheme,
  testThemeProviderToggle,
} from "../../scenarios/theme-provider.scenario";
import { ThemeProviderFixture } from "./ThemeProviderFixture";

test.describe("ThemeProvider", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.evaluate(() => localStorage.clear());
  });

  test("renders with default theme", async ({ mount, page }) => {
    const component = await mount(<ThemeProviderFixture />);
    await testThemeProviderDefaultTheme(page, component);
  });

  test("toggles theme on button click", async ({ mount, page }) => {
    const component = await mount(<ThemeProviderFixture defaultTheme="light" />);
    const toggleButton = component.getByTestId("toggle-theme");
    await testThemeProviderToggle(page, toggleButton);
  });

  test("persists theme to localStorage", async ({ mount, page }) => {
    const storageKey = "vizel-theme-test";
    const component = await mount(
      <ThemeProviderFixture defaultTheme="light" storageKey={storageKey} />
    );
    const toggleButton = component.getByTestId("toggle-theme");
    await testThemeProviderPersistence(page, toggleButton, storageKey);
  });

  test("shows resolved theme", async ({ mount, page }) => {
    const component = await mount(<ThemeProviderFixture defaultTheme="light" />);
    const themeDisplay = component.getByTestId("resolved-theme");
    await testThemeProviderShowsResolvedTheme(page, themeDisplay);
  });

  test("applies light theme CSS variables", async ({ mount, page }) => {
    await mount(<ThemeProviderFixture defaultTheme="light" />);
    await testThemeProviderLightCSS(page);
  });

  test("applies dark theme CSS variables", async ({ mount, page }) => {
    await mount(<ThemeProviderFixture defaultTheme="dark" />);
    await testThemeProviderDarkCSS(page);
  });
});
