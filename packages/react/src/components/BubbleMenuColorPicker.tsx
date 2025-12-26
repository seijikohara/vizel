import {
  addRecentColor,
  type ColorDefinition,
  type Editor,
  getRecentColors,
  HIGHLIGHT_COLORS,
  isValidHexColor,
  normalizeHexColor,
  TEXT_COLORS,
} from "@vizel/core";
import { useEffect, useRef, useState } from "react";

export interface BubbleMenuColorPickerProps {
  editor: Editor;
  /** Color picker type */
  type: "textColor" | "highlight";
  /** Custom color palette */
  colors?: ColorDefinition[];
  /** Custom class name */
  className?: string;
  /** Enable custom color input (default: true) */
  allowCustomColor?: boolean;
  /** Enable recent colors (default: true) */
  showRecentColors?: boolean;
}

/**
 * A color picker component for the BubbleMenu.
 * Supports text color and highlight color selection with custom colors and recent colors.
 */
export function BubbleMenuColorPicker({
  editor,
  type,
  colors,
  className,
  allowCustomColor = true,
  showRecentColors = true,
}: BubbleMenuColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const colorPalette = colors ?? (type === "textColor" ? TEXT_COLORS : HIGHLIGHT_COLORS);

  // Get current color
  const getCurrentColor = (): string | undefined => {
    if (type === "textColor") {
      return editor.getAttributes("textStyle").color;
    }
    return editor.getAttributes("highlight").color;
  };

  const currentColor = getCurrentColor();

  // Load recent colors when dropdown opens
  useEffect(() => {
    if (isOpen && showRecentColors) {
      setRecentColors(getRecentColors(type));
    }
    if (isOpen) {
      // Set initial input value to current color
      if (currentColor && currentColor !== "inherit" && currentColor !== "transparent") {
        setInputValue(currentColor);
      } else {
        setInputValue("");
      }
    }
  }, [isOpen, showRecentColors, type, currentColor]);

  // Apply color to editor
  const applyColor = (color: string) => {
    if (type === "textColor") {
      if (color === "inherit") {
        editor.chain().focus().unsetColor().run();
      } else {
        editor.chain().focus().setColor(color).run();
        addRecentColor(type, color);
      }
    } else if (color === "transparent") {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().toggleHighlight({ color }).run();
      addRecentColor(type, color);
    }
    setIsOpen(false);
    setInputValue("");
  };

  // Handle swatch click - update input and apply
  const handleSwatchClick = (color: string) => {
    if (color === "inherit" || color === "transparent") {
      applyColor(color);
    } else {
      setInputValue(color);
      applyColor(color);
    }
  };

  // Handle input submit
  const handleInputSubmit = () => {
    const normalized = normalizeHexColor(inputValue);
    if (isValidHexColor(normalized)) {
      applyColor(normalized);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInputSubmit();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const isTextColor = type === "textColor";
  const icon = isTextColor ? (
    "A"
  ) : (
    <span className="vizel-color-picker-highlight-icon">
      <span className="vizel-color-picker-highlight-bar" />
    </span>
  );

  const isInputValid = isValidHexColor(normalizeHexColor(inputValue));
  const previewColor = isInputValid ? normalizeHexColor(inputValue) : undefined;

  return (
    <div ref={containerRef} className={`vizel-color-picker ${className ?? ""}`} data-type={type}>
      <button
        type="button"
        className={`vizel-bubble-menu-button vizel-color-picker-trigger ${currentColor ? "has-color" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isTextColor ? "Text Color" : "Highlight"}
        data-action={type}
        style={
          isTextColor
            ? { color: currentColor || "inherit" }
            : ({ "--highlight-color": currentColor || "transparent" } as React.CSSProperties)
        }
      >
        {icon}
      </button>

      {isOpen && (
        <div className="vizel-color-picker-dropdown">
          {/* Recent colors */}
          {showRecentColors && recentColors.length > 0 && (
            <div className="vizel-color-picker-section">
              <div className="vizel-color-picker-label">Recent</div>
              <div className="vizel-color-picker-recent">
                {recentColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`vizel-color-picker-swatch ${currentColor === color ? "is-active" : ""}`}
                    onClick={() => handleSwatchClick(color)}
                    title={color}
                    style={{ backgroundColor: color }}
                    data-color={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Color palette */}
          <div className="vizel-color-picker-section">
            <div className="vizel-color-picker-grid">
              {colorPalette.map((colorDef) => (
                <button
                  key={colorDef.color}
                  type="button"
                  className={`vizel-color-picker-swatch ${currentColor === colorDef.color ? "is-active" : ""}`}
                  onClick={() => handleSwatchClick(colorDef.color)}
                  title={colorDef.name}
                  style={{
                    backgroundColor: colorDef.color === "inherit" ? "transparent" : colorDef.color,
                  }}
                  data-color={colorDef.color}
                >
                  {colorDef.color === "inherit" || colorDef.color === "transparent" ? (
                    <span className="vizel-color-picker-none">×</span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          {/* HEX input with preview */}
          {allowCustomColor && (
            <div className="vizel-color-picker-input-row">
              <span
                className="vizel-color-picker-preview"
                style={{ backgroundColor: previewColor || "transparent" }}
              />
              <input
                type="text"
                className="vizel-color-picker-input"
                placeholder="#000000"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={7}
              />
              <button
                type="button"
                className="vizel-color-picker-apply"
                onClick={handleInputSubmit}
                disabled={!isInputValid}
                title="Apply"
              >
                ✓
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
