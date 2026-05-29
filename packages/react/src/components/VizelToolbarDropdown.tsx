import type { Editor, VizelToolbarDropdownAction } from "@vizel/core";
import { buildVizelToolbarDropdownSpec, formatVizelTooltip } from "@vizel/core";
import { createVizelDismissable } from "@vizel/headless";
import { buildVizelListNavSpec } from "@vizel/headless/keyboard";
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
 * `@vizel/core`'s `buildVizelToolbarDropdownSpec`. Pointer-outside and
 * Escape dismissal route through `createVizelDismissable` from
 * `@vizel/headless` to satisfy ADR-0003 and ADR-0007 (no direct
 * document listeners in adapter code).
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

  // Hold the latest `close` callback in a ref so the controller dispatches
  // to the current handler without re-mounting its document listeners.
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;

    // `captureEscape: true` runs the Escape handler in the capture phase
    // and calls `stopImmediatePropagation()`. The dropdown popover owns
    // Escape while open; otherwise the editor's bubble-phase keymap also
    // fires and resets the selection or drops focus from the trigger.
    // ADR-0007 delegates this adapter-side contract to the controller.
    const controller = createVizelDismissable({
      onPointerOutside: () => closeRef.current(),
      onEscape: () => closeRef.current(),
      captureEscape: true,
    });
    controller.mount(container);
    return () => controller.unmount();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setFocusedIndex(0);
  }, [isOpen]);

  const spec = useMemo(
    () => buildVizelToolbarDropdownSpec(dropdown, editor, isOpen, focusedIndex),
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
    if (e.key === "Enter" || e.key === " ") {
      if (optionCount === 0) return;
      e.preventDefault();
      const selected = dropdown.options[focusedIndex];
      if (selected?.isEnabled(editor)) {
        selected.run(editor);
        close();
      }
      return;
    }
    // Delegate Arrow/Home/End to the headless builder, which short-circuits
    // on `optionCount === 0` instead of computing `NaN`.
    const next = buildVizelListNavSpec({
      key: e.key,
      currentIndex: focusedIndex,
      length: optionCount,
    });
    if (next === null) return;
    e.preventDefault();
    setFocusedIndex(next);
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
