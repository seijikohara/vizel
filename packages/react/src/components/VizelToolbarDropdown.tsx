import type { Editor, VizelToolbarDropdownAction } from "@vizel/core";
import { buildVizelToolbarDropdownSkeleton, formatVizelTooltip } from "@vizel/core";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VizelIcon } from "./VizelIcon.tsx";

export interface VizelToolbarDropdownProps {
  editor: Editor;
  dropdown: VizelToolbarDropdownAction;
  className?: string;
}

/**
 * A dropdown toolbar button that shows a popover with nested actions.
 *
 * DOM/ARIA scaffolding (trigger + listbox popover) comes from
 * `@vizel/core`'s `buildVizelToolbarDropdownSkeleton`. The component
 * owns popover open/close state, outside-click + Escape dismissal,
 * keyboard navigation, and binding `onClick` to each option's `run`.
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

  useEffect(() => {
    if (isOpen) setFocusedIndex(0);
  }, [isOpen]);

  const spec = useMemo(
    () => buildVizelToolbarDropdownSkeleton(dropdown, editor, isOpen, focusedIndex),
    [dropdown, editor, isOpen, focusedIndex]
  );

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
        aria-haspopup={spec.trigger.attrs["aria-haspopup"]}
        aria-expanded={spec.trigger.attrs["aria-expanded"]}
        title={spec.trigger.label}
      >
        <VizelIcon name={spec.trigger.iconName} />
        <span className="vizel-toolbar-dropdown-chevron">
          <VizelIcon name="chevronDown" />
        </span>
      </button>

      {isOpen && (
        <div
          className="vizel-toolbar-dropdown-popover"
          role="listbox"
          aria-label={spec.popover.root["aria-label"]}
          {...(spec.popover.root["aria-activedescendant"] && {
            "aria-activedescendant": spec.popover.root["aria-activedescendant"],
          })}
          tabIndex={spec.popover.root.tabIndex}
          onKeyDown={handleListKeyDown}
        >
          {spec.popover.sections.flatMap((section) =>
            section.items.map((slot) => (
              <button
                key={slot.key}
                id={slot.attrs.id}
                type="button"
                role="option"
                aria-selected={slot.attrs["aria-selected"]}
                className={`vizel-toolbar-dropdown-option ${slot.data.isActive ? "is-active" : ""} ${slot.data.isFocused ? "is-focused" : ""}`}
                onClick={() => {
                  slot.data.option.run(editor);
                  close();
                }}
                disabled={!slot.data.isEnabled}
                title={formatVizelTooltip(slot.data.option.label, slot.data.option.shortcut)}
                tabIndex={slot.attrs.tabIndex}
              >
                <VizelIcon name={slot.data.option.icon} />
                <span>{slot.data.option.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
