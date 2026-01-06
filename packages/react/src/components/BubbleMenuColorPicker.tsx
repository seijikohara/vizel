import {
  addRecentColor,
  type ColorDefinition,
  type Editor,
  getRecentColors,
  HIGHLIGHT_COLORS,
  TEXT_COLORS,
} from "@vizel/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { ColorPicker } from "./ColorPicker";
import { Icon } from "./Icon.tsx";

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
  }, [isOpen, showRecentColors, type]);

  // Apply color to editor
  const handleColorChange = useCallback(
    (color: string) => {
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
    },
    [editor, type]
  );

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
  const icon = isTextColor ? <Icon name="textColor" /> : <Icon name="highlighter" />;

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
          <ColorPicker
            colors={colorPalette}
            value={currentColor}
            onChange={handleColorChange}
            label={isTextColor ? "Text color palette" : "Highlight color palette"}
            allowCustomColor={allowCustomColor}
            recentColors={recentColors}
            showRecentColors={showRecentColors}
            noneValues={isTextColor ? ["inherit"] : ["transparent"]}
          />
        </div>
      )}
    </div>
  );
}
