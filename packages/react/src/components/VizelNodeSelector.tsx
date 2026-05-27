import {
  buildVizelNodeSelectorSpec,
  createVizelNodeTypes,
  type Editor,
  type VizelLocale,
  type VizelNodeTypeOption,
  vizelDefaultNodeTypes,
} from "@vizel/core";
import { createVizelDismissable } from "@vizel/headless";
import { useEffect, useMemo, useRef, useState } from "react";
import { useVizelState } from "../hooks/useVizelState.ts";
import { useVizelContextSafe } from "./VizelContext.tsx";
import { VizelIcon } from "./VizelIcon.tsx";

export interface VizelNodeSelectorProps {
  /** Editor instance. Falls back to the editor from `VizelProvider`/`Vizel` context if omitted. */
  editor?: Editor | null;
  /** Custom node types (defaults to `vizelDefaultNodeTypes`) */
  nodeTypes?: readonly VizelNodeTypeOption[];
  /** Custom class name */
  className?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

/**
 * A dropdown selector for changing block node types.
 *
 * DOM/ARIA scaffolding (trigger + listbox popover) comes from
 * `@vizel/core`'s `buildVizelNodeSelectorSpec`. Pointer-outside
 * dismissal routes through `createVizelDismissable` from
 * `@vizel/headless` (ADR-0003, ADR-0007); the component still owns
 * keyboard navigation and Escape because the dropdown root captures
 * keydown directly inside React.
 */
export function VizelNodeSelector({
  editor: editorProp,
  nodeTypes,
  className,
  locale,
}: VizelNodeSelectorProps) {
  const contextEditor = useVizelContextSafe();
  const editor = editorProp ?? contextEditor;
  const effectiveNodeTypes =
    nodeTypes ?? (locale ? createVizelNodeTypes(locale) : vizelDefaultNodeTypes);
  useVizelState(editor);

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const spec = useMemo(
    () =>
      editor
        ? buildVizelNodeSelectorSpec(editor, effectiveNodeTypes, isOpen, focusedIndex, locale)
        : null,
    [editor, effectiveNodeTypes, isOpen, focusedIndex, locale]
  );

  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;

    // The dropdown owns Escape and arrow-key navigation inside its own
    // `onKeyDown`; the controller only handles outside-pointer dismissal.
    const controller = createVizelDismissable({
      onPointerOutside: () => setIsOpen(false),
    });
    controller.mount(container);
    return () => controller.unmount();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      dropdownRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (event.key) {
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % effectiveNodeTypes.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex(
          (prev) => (prev - 1 + effectiveNodeTypes.length) % effectiveNodeTypes.length
        );
        break;
      case "Enter":
      case " ": {
        event.preventDefault();
        const selectedNodeType = effectiveNodeTypes[focusedIndex];
        if (selectedNodeType) {
          handleSelectNodeType(selectedNodeType);
        }
        break;
      }
      case "Home":
        event.preventDefault();
        setFocusedIndex(0);
        break;
      case "End":
        event.preventDefault();
        setFocusedIndex(effectiveNodeTypes.length - 1);
        break;
      default:
        break;
    }
  };

  const handleSelectNodeType = (nodeType: VizelNodeTypeOption) => {
    if (!editor) return;
    nodeType.command(editor);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  if (!(editor && spec)) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`vizel-node-selector ${className ?? ""}`}
      data-vizel-node-selector
    >
      <button
        ref={triggerRef}
        type="button"
        className="vizel-node-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup={spec.trigger.attrs["aria-haspopup"]}
        aria-expanded={spec.trigger.attrs["aria-expanded"]}
        aria-label={spec.trigger.ariaLabel}
        title={spec.trigger.title}
      >
        <span className="vizel-node-selector-icon">
          <VizelIcon name={spec.trigger.iconName} />
        </span>
        <span className="vizel-node-selector-label">{spec.trigger.label}</span>
        <span className="vizel-node-selector-chevron" aria-hidden="true">
          <VizelIcon name="chevronDown" />
        </span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="vizel-node-selector-dropdown"
          role="listbox"
          aria-label={spec.popover.root["aria-label"]}
          data-vizel-node-selector-dropdown
          tabIndex={spec.popover.root.tabIndex}
          onKeyDown={handleKeyDown}
        >
          {spec.popover.sections.flatMap((section) =>
            section.items.map((slot) => (
              <button
                key={slot.key}
                type="button"
                role="option"
                aria-selected={slot.attrs["aria-selected"]}
                className={`vizel-node-selector-option ${slot.data.isActive ? "is-active" : ""} ${slot.data.isFocused ? "is-focused" : ""}`}
                onClick={() => handleSelectNodeType(slot.data.nodeType)}
                onMouseEnter={() => setFocusedIndex(slot.index)}
                tabIndex={slot.attrs.tabIndex}
              >
                <span className="vizel-node-selector-option-icon">
                  <VizelIcon name={slot.data.nodeType.icon} />
                </span>
                <span className="vizel-node-selector-option-label">{slot.data.nodeType.label}</span>
                {slot.data.isActive && (
                  <span className="vizel-node-selector-check" aria-hidden="true">
                    <VizelIcon name="check" />
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
