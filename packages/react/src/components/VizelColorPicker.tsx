import {
  isVizelValidHexColor,
  normalizeVizelHexColor,
  type VizelColorDefinition,
} from "@vizel/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VizelIcon } from "./VizelIcon.tsx";

export interface VizelColorPickerProps {
  /** Color palette to display */
  colors: VizelColorDefinition[];
  /** Currently selected color */
  value?: string | undefined;
  /** Callback when color is selected */
  onChange: (color: string) => void;
  /** Label for accessibility */
  label?: string;
  /** Custom class name */
  className?: string;
  /** Enable custom HEX input (default: true) */
  allowCustomColor?: boolean;
  /** Recent colors to display */
  recentColors?: string[];
  /** Show recent colors section (default: true) */
  showRecentColors?: boolean;
  /** "None" option color values (e.g., ["transparent", "inherit"]) */
  noneValues?: string[];
}

const GRID_COLUMNS = 4;
const DEFAULT_NONE_VALUES = ["transparent", "inherit"];

/**
 * A reusable color picker component with keyboard navigation and accessibility support.
 */
export function VizelColorPicker({
  colors,
  value,
  onChange,
  label = "Color palette",
  className,
  allowCustomColor = true,
  recentColors = [],
  showRecentColors = true,
  noneValues = DEFAULT_NONE_VALUES,
}: VizelColorPickerProps) {
  const [inputValue, setInputValue] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const swatchRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build flat list of all selectable colors for keyboard navigation
  const allColors = useMemo(
    () => [...(showRecentColors ? recentColors : []), ...colors.map((c) => c.color)],
    [showRecentColors, recentColors, colors]
  );

  // Trim refs array when colors count decreases to prevent stale references
  useEffect(() => {
    if (swatchRefs.current.length > allColors.length) {
      swatchRefs.current.length = allColors.length;
    }
  }, [allColors.length]);

  // Calculate the offset for color palette indices (after recent colors)
  const paletteOffset = showRecentColors ? recentColors.length : 0;

  // Check if a color is a "none" value
  const isNoneValue = useCallback(
    (color: string): boolean => {
      return noneValues.includes(color);
    },
    [noneValues]
  );

  // Handle swatch selection
  const handleSelect = useCallback(
    (color: string) => {
      onChange(color);
      setInputValue("");
    },
    [onChange]
  );

  // Handle custom color input submit
  const handleInputSubmit = useCallback(() => {
    const normalized = normalizeVizelHexColor(inputValue);
    if (isVizelValidHexColor(normalized)) {
      onChange(normalized);
      setInputValue("");
    }
  }, [inputValue, onChange]);

  // Handle input keydown
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInputSubmit();
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      const totalColors = allColors.length;
      if (totalColors === 0) return;

      let newIndex = currentIndex;
      let handled = false;

      switch (e.key) {
        case "ArrowRight":
          newIndex = (currentIndex + 1) % totalColors;
          handled = true;
          break;
        case "ArrowLeft":
          newIndex = (currentIndex - 1 + totalColors) % totalColors;
          handled = true;
          break;
        case "ArrowDown":
          newIndex = Math.min(currentIndex + GRID_COLUMNS, totalColors - 1);
          handled = true;
          break;
        case "ArrowUp":
          newIndex = Math.max(currentIndex - GRID_COLUMNS, 0);
          handled = true;
          break;
        case "Home":
          newIndex = 0;
          handled = true;
          break;
        case "End":
          newIndex = totalColors - 1;
          handled = true;
          break;
        case "Enter":
        case " ": {
          e.preventDefault();
          const selectedColor = allColors[currentIndex];
          if (selectedColor) {
            handleSelect(selectedColor);
          }
          return;
        }
        default:
          break;
      }

      if (handled) {
        e.preventDefault();
        setFocusedIndex(newIndex);
        swatchRefs.current[newIndex]?.focus();
      }
    },
    [allColors, handleSelect]
  );

  // Update input value when value prop changes
  useEffect(() => {
    if (value && !isNoneValue(value)) {
      setInputValue(value);
    } else {
      setInputValue("");
    }
  }, [value, isNoneValue]);

  // Focus first swatch or current value on mount
  useEffect(() => {
    const currentIndex = value ? allColors.indexOf(value) : -1;
    if (currentIndex >= 0) {
      setFocusedIndex(currentIndex);
    } else if (allColors.length > 0) {
      setFocusedIndex(0);
    }
  }, [allColors, value]);

  const isInputValid = isVizelValidHexColor(normalizeVizelHexColor(inputValue));
  const previewColor = isInputValid ? normalizeVizelHexColor(inputValue) : undefined;

  return (
    <div
      className={`vizel-color-picker-content ${className ?? ""}`}
      role="listbox"
      aria-label={label}
    >
      {/* Recent colors */}
      {showRecentColors && recentColors.length > 0 && (
        <div className="vizel-color-picker-section">
          <div className="vizel-color-picker-label">Recent</div>
          <div className="vizel-color-picker-recent">
            {recentColors.map((color, idx) => (
              <button
                key={color}
                ref={(el) => {
                  swatchRefs.current[idx] = el;
                }}
                type="button"
                role="option"
                aria-selected={value === color}
                aria-label={color}
                tabIndex={focusedIndex === idx ? 0 : -1}
                className={`vizel-color-picker-swatch ${value === color ? "is-active" : ""}`}
                onClick={() => handleSelect(color)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                style={{
                  backgroundColor: isNoneValue(color) ? "transparent" : color,
                }}
                data-color={color}
              >
                {isNoneValue(color) ? (
                  <span className="vizel-color-picker-none">
                    <VizelIcon name="x" />
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color palette */}
      <div className="vizel-color-picker-section">
        <div className="vizel-color-picker-grid">
          {colors.map((colorDef, i) => {
            const idx = paletteOffset + i;
            return (
              <button
                key={colorDef.color}
                ref={(el) => {
                  swatchRefs.current[idx] = el;
                }}
                type="button"
                role="option"
                aria-selected={value === colorDef.color}
                aria-label={colorDef.name}
                tabIndex={focusedIndex === idx ? 0 : -1}
                className={`vizel-color-picker-swatch ${value === colorDef.color ? "is-active" : ""}`}
                onClick={() => handleSelect(colorDef.color)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                style={{
                  backgroundColor: isNoneValue(colorDef.color) ? "transparent" : colorDef.color,
                }}
                data-color={colorDef.color}
              >
                {isNoneValue(colorDef.color) ? (
                  <span className="vizel-color-picker-none">
                    <VizelIcon name="x" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* HEX input with preview */}
      {allowCustomColor && (
        <div className="vizel-color-picker-input-row">
          <span
            className="vizel-color-picker-preview"
            style={{ backgroundColor: previewColor || "transparent" }}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            className="vizel-color-picker-input"
            placeholder="#000000"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            maxLength={7}
            aria-label="Custom color hex value"
          />
          <button
            type="button"
            className="vizel-color-picker-apply"
            onClick={handleInputSubmit}
            disabled={!isInputValid}
            title="Apply"
            aria-label="Apply custom color"
          >
            <VizelIcon name="check" />
          </button>
        </div>
      )}
    </div>
  );
}
