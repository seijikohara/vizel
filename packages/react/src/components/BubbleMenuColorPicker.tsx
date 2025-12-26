import { type ColorDefinition, type Editor, HIGHLIGHT_COLORS, TEXT_COLORS } from "@vizel/core";
import { useEffect, useRef, useState } from "react";

export interface BubbleMenuColorPickerProps {
  editor: Editor;
  /** Color picker type */
  type: "textColor" | "highlight";
  /** Custom color palette */
  colors?: ColorDefinition[];
  /** Custom class name */
  className?: string;
}

/**
 * A color picker component for the BubbleMenu.
 * Supports text color and highlight color selection.
 */
export function BubbleMenuColorPicker({
  editor,
  type,
  colors,
  className,
}: BubbleMenuColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  // Handle color selection
  const handleColorSelect = (color: string) => {
    if (type === "textColor") {
      if (color === "inherit") {
        editor.chain().focus().unsetColor().run();
      } else {
        editor.chain().focus().setColor(color).run();
      }
    } else if (color === "transparent") {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().toggleHighlight({ color }).run();
    }
    setIsOpen(false);
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
          <div className="vizel-color-picker-grid">
            {colorPalette.map((colorDef) => (
              <button
                key={colorDef.color}
                type="button"
                className={`vizel-color-picker-swatch ${currentColor === colorDef.color ? "is-active" : ""}`}
                onClick={() => handleColorSelect(colorDef.color)}
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
      )}
    </div>
  );
}
