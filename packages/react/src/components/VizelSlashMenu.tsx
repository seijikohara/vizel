import {
  buildVizelSlashMenuSkeleton,
  getNextVizelSlashMenuGroupIndex,
  type VizelSlashCommandItem,
} from "@vizel/core";
import type { ReactNode, Ref } from "react";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { VizelSlashMenuEmpty } from "./VizelSlashMenuEmpty.tsx";
import { VizelSlashMenuItem, type VizelSlashMenuItemProps } from "./VizelSlashMenuItem.tsx";

export interface VizelSlashMenuRef {
  /**
   * Handle keyboard navigation events.
   * The renderer forwards the raw `KeyboardEvent`; the React component
   * previously accepted `{ event }`. v2.0 unifies the signature across
   * React/Vue/Svelte to the raw-event form.
   */
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export interface VizelSlashMenuProps {
  /** Ref to access menu methods */
  ref?: Ref<VizelSlashMenuRef>;
  items: VizelSlashCommandItem[];
  onSelect: (item: VizelSlashCommandItem) => void;
  /** Custom class name for the menu container */
  className?: string;
  /** Whether to show items grouped by category (default: true when not searching) */
  showGroups?: boolean;
  /** Custom render function for items */
  renderItem?: (props: {
    item: VizelSlashCommandItem;
    isSelected: boolean;
    onClick: () => void;
  }) => ReactNode;
  /** Custom empty state component */
  renderEmpty?: () => ReactNode;
  /** Custom group order */
  groupOrder?: string[];
}

/**
 * Slash command menu component for displaying command suggestions.
 *
 * DOM scaffolding (listbox container, section grouping, item identity
 * + index) comes from `@vizel/core`'s `buildVizelSlashMenuSkeleton`;
 * this component is the React-flavored binding that maps the spec to
 * JSX. Item rendering (icon + title + description + shortcut) stays in
 * `VizelSlashMenuItem`, which keeps `role="option"` ownership.
 */
export function VizelSlashMenu({
  ref,
  items,
  onSelect,
  className,
  showGroups = true,
  renderItem,
  renderEmpty,
  groupOrder,
}: VizelSlashMenuProps): ReactNode {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const spec = useMemo(
    () =>
      buildVizelSlashMenuSkeleton(items, selectedIndex, {
        showGroups,
        ...(groupOrder && { groupOrder }),
      }),
    [items, selectedIndex, showGroups, groupOrder]
  );

  const flatItemCount = useMemo(
    () => spec.sections.reduce((sum, section) => sum + section.items.length, 0),
    [spec]
  );

  useEffect(() => {
    if (itemRefs.current.length > flatItemCount) {
      itemRefs.current.length = flatItemCount;
    }
  }, [flatItemCount]);

  useEffect(() => {
    const selectedElement = itemRefs.current[selectedIndex];
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = useCallback(
    (index: number) => {
      const slot = spec.sections.flatMap((s) => s.items).find((s) => s.index === index);
      if (slot) {
        onSelect(slot.data.item);
      }
    },
    [spec, onSelect]
  );

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i + flatItemCount - 1) % flatItemCount);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % flatItemCount);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        setSelectedIndex(getNextVizelSlashMenuGroupIndex(spec, selectedIndex));
        return true;
      }
      return false;
    },
  }));

  if (spec.sections.length === 0) {
    return (
      <div
        className={`vizel-slash-menu ${className ?? ""}`}
        data-vizel-slash-menu=""
        role="listbox"
        aria-label={spec.root["aria-label"]}
      >
        {renderEmpty?.() ?? <VizelSlashMenuEmpty />}
      </div>
    );
  }

  return (
    <div
      className={`vizel-slash-menu ${className ?? ""}`}
      data-vizel-slash-menu=""
      role="listbox"
      aria-label={spec.root["aria-label"]}
    >
      {spec.sections.map((section) => {
        const renderedItems = section.items.map((slot) => {
          const onClick = () => selectItem(slot.index);
          const content = renderItem ? (
            renderItem({ item: slot.data.item, isSelected: slot.data.isSelected, onClick })
          ) : (
            <VizelSlashMenuItem
              item={slot.data.item}
              isSelected={slot.data.isSelected}
              onClick={onClick}
            />
          );
          return (
            <div
              key={slot.key}
              ref={(el) => {
                itemRefs.current[slot.index] = el;
              }}
            >
              {content}
            </div>
          );
        });

        if (!section.header) {
          return renderedItems;
        }

        return (
          <div key={section.key} className="vizel-slash-menu-group" data-vizel-slash-menu-group="">
            <div className="vizel-slash-menu-group-header">{section.header.label}</div>
            {renderedItems}
          </div>
        );
      })}
    </div>
  );
}

// Re-export VizelSlashMenuItem props for consumers
export type { VizelSlashMenuItemProps };
