import type { VizelMentionItem } from "@vizel/core";
import type { ReactNode, Ref } from "react";
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface VizelMentionMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export interface VizelMentionMenuProps {
  /** Ref to access menu methods */
  ref?: Ref<VizelMentionMenuRef>;
  /** Mention items to display */
  items: VizelMentionItem[];
  /** Callback when an item is selected */
  command: (item: VizelMentionItem) => void;
  /** Custom class name for the menu container */
  className?: string;
}

/**
 * Mention autocomplete menu component.
 * Displays a list of mention suggestions with keyboard navigation.
 */
export function VizelMentionMenu({
  ref,
  items,
  command,
  className,
}: VizelMentionMenuProps): ReactNode {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (itemRefs.current.length > items.length) {
      itemRefs.current.length = items.length;
    }
  }, [items.length]);

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
      const item = items[index];
      if (item) {
        command(item);
      }
    },
    [items, command]
  );

  const upHandler = useCallback(() => {
    setSelectedIndex((index) => (index + items.length - 1) % items.length);
  }, [items.length]);

  const downHandler = useCallback(() => {
    setSelectedIndex((index) => (index + 1) % items.length);
  }, [items.length]);

  const enterHandler = useCallback(() => {
    selectItem(selectedIndex);
  }, [selectItem, selectedIndex]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }
      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }
      if (event.key === "Enter") {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className={`vizel-mention-menu ${className ?? ""}`} data-vizel-mention-menu="">
        <div className="vizel-mention-menu-empty">No results</div>
      </div>
    );
  }

  return (
    <div className={`vizel-mention-menu ${className ?? ""}`} data-vizel-mention-menu="">
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <div
            key={item.id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className={`vizel-mention-menu-item ${isSelected ? "is-selected" : ""}`}
            onClick={() => selectItem(index)}
            onKeyDown={(e) => {
              if (e.key === "Enter") selectItem(index);
            }}
            tabIndex={-1}
            role="option"
            aria-selected={isSelected}
          >
            <div className="vizel-mention-menu-item-avatar">
              {item.avatar ? (
                <img src={item.avatar} alt={item.label} />
              ) : (
                item.label.charAt(0).toUpperCase()
              )}
            </div>
            <div className="vizel-mention-menu-item-content">
              <div className="vizel-mention-menu-item-label">{item.label}</div>
              {item.description && (
                <div className="vizel-mention-menu-item-description">{item.description}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
