import {
  createVizelNodeTypes,
  type Editor,
  getVizelActiveNodeType,
  type VizelLocale,
  type VizelNodeTypeOption,
  vizelDefaultNodeTypes,
} from "@vizel/core";
import { useEffect, useRef, useState } from "react";
import { useVizelState } from "../hooks/useVizelState.ts";
import { VizelIcon } from "./VizelIcon.tsx";

export interface VizelNodeSelectorProps {
  /** The editor instance */
  editor: Editor;
  /** Custom node types (defaults to vizelDefaultNodeTypes) */
  nodeTypes?: VizelNodeTypeOption[];
  /** Custom class name */
  className?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

/**
 * A dropdown selector for changing block node types.
 * Displays the current node type and allows transformation to other types.
 *
 * @example
 * ```tsx
 * <VizelNodeSelector editor={editor} />
 * ```
 */
export function VizelNodeSelector({
  editor,
  nodeTypes,
  className,
  locale,
}: VizelNodeSelectorProps) {
  const effectiveNodeTypes =
    nodeTypes ?? (locale ? createVizelNodeTypes(locale) : vizelDefaultNodeTypes);
  // Subscribe to editor state changes
  useVizelState(() => editor);

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const activeNodeType = getVizelActiveNodeType(editor, effectiveNodeTypes);
  const currentLabel = activeNodeType?.label ?? locale?.nodeTypes.text ?? "Text";
  const currentIcon = activeNodeType?.icon ?? "paragraph";

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus the dropdown when it opens to ensure keyboard navigation works
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      dropdownRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
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
        // Allow other keys to propagate
        break;
    }
  };

  const handleSelectNodeType = (nodeType: VizelNodeTypeOption) => {
    nodeType.command(editor);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

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
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={(locale?.nodeSelector.currentBlockType ?? "Current block type: {type}").replace(
          "{type}",
          currentLabel
        )}
        title={locale?.nodeSelector.changeBlockType ?? "Change block type"}
      >
        <span className="vizel-node-selector-icon">
          <VizelIcon name={currentIcon} />
        </span>
        <span className="vizel-node-selector-label">{currentLabel}</span>
        <span className="vizel-node-selector-chevron" aria-hidden="true">
          <VizelIcon name="chevronDown" />
        </span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="vizel-node-selector-dropdown"
          role="listbox"
          aria-label={locale?.nodeSelector.blockTypes ?? "Block types"}
          data-vizel-node-selector-dropdown
          tabIndex={-1}
          onKeyDown={handleKeyDown}
        >
          {effectiveNodeTypes.map((nodeType, index) => {
            const isActive = nodeType.isActive(editor);
            const isFocused = index === focusedIndex;

            return (
              <button
                key={nodeType.name}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`vizel-node-selector-option ${isActive ? "is-active" : ""} ${isFocused ? "is-focused" : ""}`}
                onClick={() => handleSelectNodeType(nodeType)}
                onMouseEnter={() => setFocusedIndex(index)}
                tabIndex={isFocused ? 0 : -1}
              >
                <span className="vizel-node-selector-option-icon">
                  <VizelIcon name={nodeType.icon} />
                </span>
                <span className="vizel-node-selector-option-label">{nodeType.label}</span>
                {isActive && (
                  <span className="vizel-node-selector-check" aria-hidden="true">
                    <VizelIcon name="check" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
