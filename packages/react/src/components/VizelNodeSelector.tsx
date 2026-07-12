import {
  buildVizelNodeSelectorSpec,
  createVizelNodeTypes,
  type Editor,
  type VizelLocale,
  type VizelNodeTypeOption,
  vizelDefaultNodeTypes,
} from "@vizel/core";
import { createVizelDismissable } from "@vizel/headless";
import { buildVizelComboboxKeySpec } from "@vizel/headless/combobox";
import { useEffect, useMemo, useRef, useState } from "react";

import { useVizelEditorState } from "../_reactivity.ts";
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
 * `@vizel/headless`. The dropdown root owns the
 * keydown listener but delegates navigate / select / close resolution to
 * the shared `buildVizelComboboxKeySpec`, matching the slash and mention
 * menus.
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

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Track only which node type is active through the flagship
  // `useVizelEditorState` primitive. The trigger label and
  // every row's `aria-selected` derive from the active node type, so a
  // string slice dedupes through the hook's `Object.is` cache: cursor
  // moves within the same block type do not re-render, replacing the
  // coarse `useVizelState` tick.
  const activeNodeName = useVizelEditorState(
    ({ editor: current }) =>
      current === null
        ? null
        : (effectiveNodeTypes.find((type) => type.isActive(current))?.name ?? null),
    { editor }
  );

  // `activeNodeName` joins the dependency list as a reactive stand-in for
  // the editor's active-block state: it changes when the caret enters a
  // block of a different type, so the spec rebuilds with the new active
  // highlight even though the `editor` identity stays stable.
  const spec = useMemo(
    () =>
      editor
        ? buildVizelNodeSelectorSpec(editor, effectiveNodeTypes, isOpen, focusedIndex, locale)
        : null,
    // oxlint-disable-next-line react/exhaustive-deps -- `activeNodeName` is the reactive trigger for re-reading the editor's active block, which `buildVizelNodeSelectorSpec` reads off the live editor.
    [editor, effectiveNodeTypes, isOpen, focusedIndex, locale, activeNodeName]
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

    // The open dropdown is a single-group listbox, so it delegates the
    // navigate / select / close verbs to the shared combobox resolver,
    // matching VizelSlashMenu and VizelMentionMenu. The dropdown
    // root (not a native button) owns the keydown, so Space activates like
    // Enter; normalise it before resolving. Tab (`groupNext`) has no group to
    // advance and falls through so focus leaves the dropdown.
    const action = buildVizelComboboxKeySpec({
      key: event.key === " " ? "Enter" : event.key,
      currentIndex: focusedIndex,
      length: effectiveNodeTypes.length,
    });
    if (action === null) return;
    // The open listbox owns its navigation keys. `stopPropagation` keeps the
    // Escape `close` from reaching the document-level bubble-menu escape
    // controller, which would otherwise collapse the selection and unmount the
    // host bubble menu (and the trigger) before focus can return to it. Tab
    // (`groupNext`) is the default no-op so focus can leave the dropdown.
    switch (action.type) {
      case "navigate":
        event.preventDefault();
        event.stopPropagation();
        setFocusedIndex(action.index);
        break;
      case "select": {
        event.preventDefault();
        event.stopPropagation();
        const selectedNodeType = effectiveNodeTypes[action.index];
        if (selectedNodeType) {
          handleSelectNodeType(selectedNodeType);
        }
        break;
      }
      case "close":
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
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
