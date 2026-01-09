import { VIZEL_HIGHLIGHT_COLORS, VIZEL_TEXT_COLORS } from "@vizel/core";
import { type ColorPickerProps, VizelColorPicker } from "@vizel/react";
import { useState } from "react";

interface Props {
  colors?: ColorPickerProps["colors"];
  value?: string;
  label?: string;
  className?: string;
  allowCustomColor?: boolean;
  recentColors?: string[];
  showRecentColors?: boolean;
  noneValues?: string[];
  useHighlightColors?: boolean;
}

export function ColorPickerFixture({
  colors,
  value: initialValue,
  label = "Color palette",
  className,
  allowCustomColor = true,
  recentColors,
  showRecentColors = true,
  noneValues,
  useHighlightColors = false,
}: Props) {
  const [selectedColor, setSelectedColor] = useState(initialValue ?? "");

  const colorPalette = colors ?? (useHighlightColors ? VIZEL_HIGHLIGHT_COLORS : VIZEL_TEXT_COLORS);

  return (
    <div>
      <VizelColorPicker
        colors={colorPalette}
        value={selectedColor}
        onChange={setSelectedColor}
        label={label}
        className={className}
        allowCustomColor={allowCustomColor}
        recentColors={recentColors}
        showRecentColors={showRecentColors}
        noneValues={noneValues}
      />
      <div data-testid="selected-color">{selectedColor}</div>
    </div>
  );
}
