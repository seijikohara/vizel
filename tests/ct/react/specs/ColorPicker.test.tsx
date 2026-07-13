import { describe, test } from "vitest";
import { render } from "vitest-browser-react";

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

describe("ColorPicker (Vitest Browser) - React", () => {
  describe("Rendering", () => {
    test("renders color palette", async () => {
      await render(<ColorPickerFixture />);
      await testRendersColorPalette();
    });

    test("shows current selection", async () => {
      await render(<ColorPickerFixture value="#ef4444" />);
      await testShowsCurrentSelection("#ef4444");
    });

    test("displays none value correctly", async () => {
      await render(<ColorPickerFixture useHighlightColors />);
      await testNoneValueDisplay();
    });
  });

  describe("Selection", () => {
    test("calls onChange when color selected", async () => {
      await render(<ColorPickerFixture />);
      await testOnChangeCalledOnSelection();
    });
  });

  describe("Keyboard Navigation", () => {
    test("ArrowRight moves to next swatch", async () => {
      await render(<ColorPickerFixture />);
      await testKeyboardNavigationArrowRight();
    });

    test("ArrowLeft moves to previous swatch", async () => {
      await render(<ColorPickerFixture />);
      await testKeyboardNavigationArrowLeft();
    });

    test("ArrowDown moves down one row", async () => {
      await render(<ColorPickerFixture />);
      await testKeyboardNavigationArrowDown();
    });

    test("ArrowUp moves up one row", async () => {
      await render(<ColorPickerFixture />);
      await testKeyboardNavigationArrowUp();
    });

    test("Home moves to first swatch", async () => {
      await render(<ColorPickerFixture />);
      await testKeyboardNavigationHome();
    });

    test("End moves to last swatch", async () => {
      await render(<ColorPickerFixture />);
      await testKeyboardNavigationEnd();
    });

    test("Enter selects current swatch", async () => {
      await render(<ColorPickerFixture />);
      await testKeyboardNavigationEnterSelect();
    });
  });

  describe("Custom Color Input", () => {
    test("custom color input works", async () => {
      await render(<ColorPickerFixture />);
      await testCustomColorInput();
    });

    test("validates hex color input", async () => {
      await render(<ColorPickerFixture />);
      await testCustomColorInputValidation();
    });
  });

  describe("Recent Colors", () => {
    test("displays recent colors section", async () => {
      await render(
        <ColorPickerFixture recentColors={["#ff0000", "#00ff00", "#0000ff"]} showRecentColors />
      );
      await testRecentColorsDisplay();
    });
  });

  describe("Accessibility", () => {
    test("has correct ARIA attributes", async () => {
      await render(<ColorPickerFixture label="Text color palette" />);
      await testAccessibilityAttributes("Text color palette");
    });
  });
});
