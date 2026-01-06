import { defaultNodeTypes, type Editor, getActiveNodeType, type NodeTypeOption } from "@vizel/core";
import { useEffect, useRef, useState } from "react";
import { useEditorState } from "../hooks/useEditorState.ts";
import { Icon } from "./Icon.tsx";

export interface NodeSelectorProps {
  /** The editor instance */
  editor: Editor;
  /** Custom node types (defaults to defaultNodeTypes) */
  nodeTypes?: NodeTypeOption[];
  /** Custom class name */
  className?: string;
}

/**
 * A dropdown selector for changing block node types.
 * Displays the current node type and allows transformation to other types.
 *
 * @example
 * ```tsx
 * <NodeSelector editor={editor} />
 * ```
 */
export function NodeSelector({
  editor,
  nodeTypes = defaultNodeTypes,
  className,
}: NodeSelectorProps) {
  // Subscribe to editor state changes
  useEditorState(editor);

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeNodeType = getActiveNodeType(editor, nodeTypes);
  const currentLabel = activeNodeType?.label ?? "Text";
  const currentIcon = activeNodeType?.icon ?? "paragraph";

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
        break;
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % nodeTypes.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + nodeTypes.length) % nodeTypes.length);
        break;
      case "Enter":
      case " ": {
        event.preventDefault();
        const selectedNodeType = nodeTypes[focusedIndex];
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
        setFocusedIndex(nodeTypes.length - 1);
        break;
      default:
        // Allow other keys to propagate
        break;
    }
  };

  const handleSelectNodeType = (nodeType: NodeTypeOption) => {
    nodeType.command(editor);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`vizel-node-selector ${className ?? ""}`}
      data-vizel-node-selector
    >
      <button
        type="button"
        className="vizel-node-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Current block type: ${currentLabel}`}
        title="Change block type"
      >
        <span className="vizel-node-selector-icon">
          <Icon name={currentIcon} />
        </span>
        <span className="vizel-node-selector-label">{currentLabel}</span>
        <span className="vizel-node-selector-chevron" aria-hidden="true">
          <Icon name="chevronDown" />
        </span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="vizel-node-selector-dropdown"
          role="listbox"
          aria-label="Block types"
          data-vizel-node-selector-dropdown
          tabIndex={-1}
          onKeyDown={handleKeyDown}
        >
          {nodeTypes.map((nodeType, index) => {
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
                  <Icon name={nodeType.icon} />
                </span>
                <span className="vizel-node-selector-option-label">{nodeType.label}</span>
                {isActive && (
                  <span className="vizel-node-selector-check" aria-hidden="true">
                    <Icon name="check" />
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
