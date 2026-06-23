import { describe, test } from "vitest";
import { render } from "vitest-browser-vue";
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
} from "../../scenarios/color-picker-bc.scenario";
import ColorPickerFixture from "./ColorPickerFixture.vue";

describe("ColorPicker (Vitest Browser) - Vue", () => {
  describe("Rendering", () => {
    test("renders color palette", async () => {
      render(ColorPickerFixture);
      await testRendersColorPalette();
    });

    test("shows current selection", async () => {
      render(ColorPickerFixture, { props: { value: "#ef4444" } });
      await testShowsCurrentSelection("#ef4444");
    });

    test("displays none value correctly", async () => {
      render(ColorPickerFixture, { props: { useHighlightColors: true } });
      await testNoneValueDisplay();
    });
  });

  describe("Selection", () => {
    test("calls onChange when color selected", async () => {
      render(ColorPickerFixture);
      await testOnChangeCalledOnSelection();
    });
  });

  describe("Keyboard Navigation", () => {
    test("ArrowRight moves to next swatch", async () => {
      render(ColorPickerFixture);
      await testKeyboardNavigationArrowRight();
    });

    test("ArrowLeft moves to previous swatch", async () => {
      render(ColorPickerFixture);
      await testKeyboardNavigationArrowLeft();
    });

    test("ArrowDown moves down one row", async () => {
      render(ColorPickerFixture);
      await testKeyboardNavigationArrowDown();
    });

    test("ArrowUp moves up one row", async () => {
      render(ColorPickerFixture);
      await testKeyboardNavigationArrowUp();
    });

    test("Home moves to first swatch", async () => {
      render(ColorPickerFixture);
      await testKeyboardNavigationHome();
    });

    test("End moves to last swatch", async () => {
      render(ColorPickerFixture);
      await testKeyboardNavigationEnd();
    });

    test("Enter selects current swatch", async () => {
      render(ColorPickerFixture);
      await testKeyboardNavigationEnterSelect();
    });
  });

  describe("Custom Color Input", () => {
    test("custom color input works", async () => {
      render(ColorPickerFixture);
      await testCustomColorInput();
    });

    test("validates hex color input", async () => {
      render(ColorPickerFixture);
      await testCustomColorInputValidation();
    });
  });

  describe("Recent Colors", () => {
    test("displays recent colors section", async () => {
      render(ColorPickerFixture, {
        props: {
          recentColors: ["#ff0000", "#00ff00", "#0000ff"],
          showRecentColors: true,
        },
      });
      await testRecentColorsDisplay();
    });
  });

  describe("Accessibility", () => {
    test("has correct ARIA attributes", async () => {
      render(ColorPickerFixture, { props: { label: "Text color palette" } });
      await testAccessibilityAttributes("Text color palette");
    });
  });
});
