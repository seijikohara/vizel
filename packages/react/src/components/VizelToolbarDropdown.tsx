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
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeOption = dropdown.getActiveOption?.(editor);
  const triggerIcon = activeOption?.icon ?? dropdown.icon;
  const triggerLabel = activeOption?.label ?? dropdown.label;

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (!(e.target instanceof Node)) return;
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, close]);

  // Reset focused index when opening
  useEffect(() => {
    if (isOpen) setFocusedIndex(0);
  }, [isOpen]);

  const optionCount = dropdown.options.length;

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsOpen(true);
      setFocusedIndex(0);
    }
  }

  function handleListKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % optionCount);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + optionCount) % optionCount);
        break;
      case "Home":
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case "End":
        e.preventDefault();
        setFocusedIndex(optionCount - 1);
        break;
      case "Enter":
      case " ": {
        e.preventDefault();
        const selected = dropdown.options[focusedIndex];
        if (selected?.isEnabled(editor)) {
          selected.run(editor);
          close();
        }
        break;
      }
      default:
        break;
    }
  }

  return (
    <div
      ref={containerRef}
      className={`vizel-toolbar-dropdown ${className ?? ""}`}
      data-vizel-toolbar-dropdown=""
    >
      <button
        ref={triggerRef}
        type="button"
        className="vizel-toolbar-dropdown-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={triggerLabel}
      >
        <VizelIcon name={triggerIcon} />
        <span className="vizel-toolbar-dropdown-chevron">
          <VizelIcon name="chevronDown" />
        </span>
      </button>

      {isOpen && (
        <div
          className="vizel-toolbar-dropdown-popover"
          role="listbox"
          aria-label={dropdown.label}
          aria-activedescendant={`vizel-dropdown-${dropdown.id}-${dropdown.options[focusedIndex]?.id}`}
          tabIndex={0}
          onKeyDown={handleListKeyDown}
        >
          {dropdown.options.map((option, index) => {
            const active = option.isActive(editor);
            return (
              <button
                key={option.id}
                id={`vizel-dropdown-${dropdown.id}-${option.id}`}
                type="button"
                role="option"
                aria-selected={active}
                className={`vizel-toolbar-dropdown-option ${active ? "is-active" : ""} ${index === focusedIndex ? "is-focused" : ""}`}
                onClick={() => {
                  option.run(editor);
                  close();
                }}
                disabled={!option.isEnabled(editor)}
                title={formatVizelTooltip(option.label, option.shortcut)}
                tabIndex={-1}
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
