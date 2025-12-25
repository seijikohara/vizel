import type { SlashCommandItem } from "@vizel/core";
import {
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { SlashMenuEmpty } from "./SlashMenuEmpty.tsx";
import { SlashMenuItem } from "./SlashMenuItem.tsx";

export interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export interface SlashMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  /** Custom class name for the menu container */
  className?: string;
  /** Custom render function for items */
  renderItem?: (props: {
    item: SlashCommandItem;
    isSelected: boolean;
    onClick: () => void;
  }) => ReactNode;
  /** Custom empty state component */
  renderEmpty?: () => ReactNode;
}

/**
 * Slash command menu component for displaying command suggestions.
 * This is used internally by the SlashCommand extension and should be
 * rendered via the suggestion plugin's render function.
 *
 * @example
 * ```tsx
 * // Basic usage via createSlashMenuRenderer
 * import { SlashCommand, createSlashMenuRenderer } from '@vizel/react';
 *
 * const editor = useEditor({
 *   extensions: [
 *     SlashCommand.configure({
 *       suggestion: createSlashMenuRenderer(),
 *     }),
 *   ],
 * });
 *
 * // Custom rendering with sub-components
 * <SlashMenu
 *   items={items}
 *   command={command}
 *   renderItem={({ item, isSelected, onClick }) => (
 *     <SlashMenuItem
 *       item={item}
 *       isSelected={isSelected}
 *       onClick={onClick}
 *     />
 *   )}
 *   renderEmpty={() => <SlashMenuEmpty>No commands</SlashMenuEmpty>}
 * />
 * ```
 */
export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command, className, renderItem, renderEmpty }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Scroll selected item into view when selection changes
    useEffect(() => {
      const selectedElement = itemRefs.current[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }, [selectedIndex]);

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

    useEffect(() => {
      setSelectedIndex(0);
    }, []);

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
        <div className={`vizel-slash-menu ${className ?? ""}`} data-vizel-slash-menu="">
          {renderEmpty?.() ?? <SlashMenuEmpty />}
        </div>
      );
    }

    return (
      <div className={`vizel-slash-menu ${className ?? ""}`} data-vizel-slash-menu="">
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          const onClick = () => selectItem(index);

          if (renderItem) {
            return (
              <div
                key={item.title}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
              >
                {renderItem({ item, isSelected, onClick })}
              </div>
            );
          }

          return (
            <div
              key={item.title}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
            >
              <SlashMenuItem item={item} isSelected={isSelected} onClick={onClick} />
            </div>
          );
        })}
      </div>
    );
  }
);

SlashMenu.displayName = "SlashMenu";
