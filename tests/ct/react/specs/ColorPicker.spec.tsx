import { test } from "@playwright/experimental-ct-react";
import {
  testAccessibilityAttributes,
  testCustomColorInput,
  testCustomColorInputValidation,
  testKeyboardNavigationArrowDown,
  testKeyboardNavigationArrowLeft,
  testKeyboardNavigationArrowRight,
  testKeyboardNavigationArrowUp,
  testKeyboardNavigationEnd,
  testKeyboardNavigationEnterSelect,
  testKeyboardNavigationHome,
  testNoneValueDisplay,
  testOnChangeCalledOnSelection,
  testRecentColorsDisplay,
  testRendersColorPalette,
  testShowsCurrentSelection,
} from "../../scenarios/color-picker.scenario";
import { ColorPickerFixture } from "./ColorPickerFixture";

test.describe("ColorPicker - React", () => {
  test.describe("Rendering", () => {
    test("renders color palette", async ({ mount, page }) => {
      const component = await mount(<ColorPickerFixture />);
      await testRendersColorPalette(component, page);
    });

    test("shows current selection", async ({ mount, page }) => {
      const component = await mount(<ColorPickerFixture value="#ef4444" />);
      await testShowsCurrentSelection(component, page, "#ef4444");
    });

    test("displays none value correctly", async ({ mount, page }) => {
      const component = await mount(<ColorPickerFixture useHighlightColors />);
      await testNoneValueDisplay(component, page);
    });
  });

  test.describe("Selection", () => {
    test("calls onChange when color selected", async ({ mount, page }) => {
      const component = await mount(<ColorPickerFixture />);
      await testOnChangeCalledOnSelection(component, page);
    });
  });

  test.describe("Keyboard Navigation", () => {
    test("ArrowRight moves to next swatch", async ({ mount, page }) => {
      const component = await mount(<ColorPickerFixture />);
      await testKeyboardNavigationArrowRight(component, page);
    });

    test("ArrowLeft moves to previous swatch", async ({ mount, page }) => {
      const component = await mount(<ColorPickerFixture />);
      await testKeyboardNavigationArrowLeft(component, page);
    });

    test("ArrowDown moves down one row", async ({ mount, page }) => {
      const component = await mount(<ColorPickerFixture />);
      await testKeyboardNavigationArrowDown(component, page);
    });

    test("ArrowUp moves up one row", async ({ mount, page }) => {
      const component = await mount(<ColorPickerFixture />);
      await testKeyboardNavigationArrowUp(component, page);
    });

    test("Home moves to first swatch", async ({ mount, page }) => {
      const component = await mount(<ColorPickerFixture />);
      await testKeyboardNavigationHome(component, page);
    });

    test("End moves to last swatch", async ({ mount, page }) => {
      const component = await mount(<ColorPickerFixture />);
      await testKeyboardNavigationEnd(component, page);
    });

    test("Enter selects current swatch", async ({ mount, page }) => {
      const component = await mount(<ColorPickerFixture />);
      await testKeyboardNavigationEnterSelect(component, page);
    });
  });

  test.describe("Custom Color Input", () => {
    test("custom color input works", async ({ mount, page }) => {
      const component = await mount(<ColorPickerFixture />);
      await testCustomColorInput(component, page);
    });

    test("validates hex color input", async ({ mount, page }) => {
      const component = await mount(<ColorPickerFixture />);
      await testCustomColorInputValidation(component, page);
    });
  });

  test.describe("Recent Colors", () => {
    test("displays recent colors section", async ({ mount, page }) => {
      const component = await mount(
        <ColorPickerFixture recentColors={["#ff0000", "#00ff00", "#0000ff"]} showRecentColors />
      );
      await testRecentColorsDisplay(component, page);
    });
  });

  test.describe("Accessibility", () => {
    test("has correct ARIA attributes", async ({ mount, page }) => {
      const component = await mount(<ColorPickerFixture label="Text color palette" />);
      await testAccessibilityAttributes(component, page, "Text color palette");
    });
  });
});
