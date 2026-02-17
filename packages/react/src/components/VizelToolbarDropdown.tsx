import type { Editor, VizelToolbarDropdownAction } from "@vizel/core";
import { formatVizelTooltip } from "@vizel/core";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { VizelIcon } from "./VizelIcon.tsx";

export interface VizelToolbarDropdownProps {
  editor: Editor;
  dropdown: VizelToolbarDropdownAction;
  className?: string;
}

/**
 * A dropdown toolbar button that shows a popover with nested actions.
 */
export function VizelToolbarDropdown({
  editor,
  dropdown,
  className,
}: VizelToolbarDropdownProps): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeOption = dropdown.getActiveOption?.(editor);
  const triggerIcon = activeOption?.icon ?? dropdown.icon;
  const triggerLabel = activeOption?.label ?? dropdown.label;

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, close]);

  return (
    <div
      ref={containerRef}
      className={`vizel-toolbar-dropdown ${className ?? ""}`}
      data-vizel-toolbar-dropdown=""
    >
      <button
        type="button"
        className="vizel-toolbar-dropdown-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={triggerLabel}
      >
        <VizelIcon name={triggerIcon} />
        <span className="vizel-toolbar-dropdown-chevron">
          <VizelIcon name="chevronDown" />
        </span>
      </button>

      {isOpen && (
        <div className="vizel-toolbar-dropdown-popover" role="listbox" aria-label={dropdown.label}>
          {dropdown.options.map((option) => {
            const active = option.isActive(editor);
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={active}
                className={`vizel-toolbar-dropdown-option ${active ? "is-active" : ""}`}
                onClick={() => {
                  option.run(editor);
                  close();
                }}
                disabled={!option.isEnabled(editor)}
                title={formatVizelTooltip(option.label, option.shortcut)}
              >
                <VizelIcon name={option.icon} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
