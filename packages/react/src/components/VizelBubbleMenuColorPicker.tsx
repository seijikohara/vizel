import {
  addVizelRecentColor,
  type Editor,
  getVizelRecentColors,
  VIZEL_HIGHLIGHT_COLORS,
  VIZEL_TEXT_COLORS,
  type VizelColorDefinition,
  type VizelLocale,
} from "@vizel/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { VizelColorPicker } from "./VizelColorPicker.tsx";
import { VizelIcon } from "./VizelIcon.tsx";

export interface VizelBubbleMenuColorPickerProps {
  editor: Editor;
  /** Color picker type */
  type: "textColor" | "highlight";
  /** Custom color palette */
  colors?: VizelColorDefinition[];
  /** Custom class name */
  className?: string;
  /** Enable custom color input (default: true) */
  allowCustomColor?: boolean;
  /** Enable recent colors (default: true) */
  showRecentColors?: boolean;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

/**
 * A color picker component for the VizelBubbleMenu.
 * Supports text color and highlight color selection with custom colors and recent colors.
 */
export function VizelBubbleMenuColorPicker({
  editor,
  type,
  colors,
  className,
  allowCustomColor = true,
  showRecentColors = true,
  locale,
}: VizelBubbleMenuColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const colorPalette =
    colors ?? (type === "textColor" ? VIZEL_TEXT_COLORS : VIZEL_HIGHLIGHT_COLORS);

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
      setRecentColors(getVizelRecentColors(type));
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
          addVizelRecentColor(type, color);
        }
      } else if (color === "transparent") {
        editor.chain().focus().unsetHighlight().run();
      } else {
        editor.chain().focus().toggleHighlight({ color }).run();
        addVizelRecentColor(type, color);
      }
      setIsOpen(false);
    },
    [editor, type]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (containerRef.current && !containerRef.current.contains(event.target)) {
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
  const icon = isTextColor ? <VizelIcon name="textColor" /> : <VizelIcon name="highlighter" />;

  return (
    <div ref={containerRef} className={`vizel-color-picker ${className ?? ""}`} data-type={type}>
      <button
        type="button"
        className={`vizel-bubble-menu-button vizel-color-picker-trigger ${currentColor ? "has-color" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title={
          isTextColor
            ? (locale?.colorPicker?.textColor ?? "Text Color")
            : (locale?.colorPicker?.highlight ?? "Highlight")
        }
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
          <VizelColorPicker
            colors={colorPalette}
            value={currentColor}
            onChange={handleColorChange}
            label={
              isTextColor
                ? (locale?.colorPicker?.textColorPalette ?? "Text color palette")
                : (locale?.colorPicker?.highlightPalette ?? "Highlight color palette")
            }
            allowCustomColor={allowCustomColor}
            recentColors={recentColors}
            showRecentColors={showRecentColors}
            noneValues={isTextColor ? ["inherit"] : ["transparent"]}
            recentLabel={locale?.colorPicker?.recent ?? "Recent"}
            hexPlaceholder={locale?.colorPicker?.hexPlaceholder ?? "#000000"}
            applyTitle={locale?.colorPicker?.apply ?? "Apply"}
            applyAriaLabel={locale?.colorPicker?.applyAriaLabel ?? "Apply custom color"}
          />
        </div>
      )}
    </div>
  );
}
