import { groupSlashCommands, type SlashCommandGroup, type SlashCommandItem } from "@vizel/core";
import {
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { SlashMenuEmpty } from "./SlashMenuEmpty.tsx";
import { SlashMenuItem, type SlashMenuItemProps } from "./SlashMenuItem.tsx";

export interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export interface SlashMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  /** Custom class name for the menu container */
  className?: string;
  /** Whether to show items grouped by category (default: true when not searching) */
  showGroups?: boolean;
  /** Custom render function for items */
  renderItem?: (props: {
    item: SlashCommandItem;
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
 * Supports grouping, keyboard navigation, and fuzzy search highlighting.
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
 * ```
 */
export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command, className, showGroups = true, renderItem, renderEmpty, groupOrder }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Group items when showGroups is true and there are enough items
    const groups = useMemo<SlashCommandGroup[]>(() => {
      if (!showGroups || items.length <= 5) {
        // Don't group if explicitly disabled or few items (likely search results)
        return [{ name: "", items }];
      }
      return groupSlashCommands(items, groupOrder);
    }, [items, showGroups, groupOrder]);

    // Flatten for navigation
    const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

    // Scroll selected item into view when selection changes
    useEffect(() => {
      const selectedElement = itemRefs.current[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }, [selectedIndex]);

    const selectItem = useCallback(
      (index: number) => {
        const item = flatItems[index];
        if (item) {
          command(item);
        }
      },
      [flatItems, command]
    );

    const upHandler = useCallback(() => {
      setSelectedIndex((index) => (index + flatItems.length - 1) % flatItems.length);
    }, [flatItems.length]);

    const downHandler = useCallback(() => {
      setSelectedIndex((index) => (index + 1) % flatItems.length);
    }, [flatItems.length]);

    const enterHandler = useCallback(() => {
      selectItem(selectedIndex);
    }, [selectItem, selectedIndex]);

    // Navigate to next group with Tab
    const tabHandler = useCallback(() => {
      if (groups.length <= 1) return;

      let currentGroupIndex = 0;
      let itemCount = 0;
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        if (!group) continue;
        if (selectedIndex < itemCount + group.items.length) {
          currentGroupIndex = i;
          break;
        }
        itemCount += group.items.length;
      }

      // Move to next group
      const nextGroupIndex = (currentGroupIndex + 1) % groups.length;
      let nextIndex = 0;
      for (let i = 0; i < nextGroupIndex; i++) {
        const group = groups[i];
        if (group) {
          nextIndex += group.items.length;
        }
      }
      setSelectedIndex(nextIndex);
    }, [groups, selectedIndex]);

    // Reset selection when items change (tracked via groups length)
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentional dependency on groups to reset selection
    useEffect(() => {
      setSelectedIndex(0);
    }, [groups]);

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

        if (event.key === "Tab") {
          event.preventDefault();
          tabHandler();
          return true;
        }

        return false;
      },
    }));

    if (flatItems.length === 0) {
      return (
        <div className={`vizel-slash-menu ${className ?? ""}`} data-vizel-slash-menu="">
          {renderEmpty?.() ?? <SlashMenuEmpty />}
        </div>
      );
    }

    // Render with groups
    let globalIndex = 0;

    return (
      <div className={`vizel-slash-menu ${className ?? ""}`} data-vizel-slash-menu="">
        {groups.map((group) => {
          const groupItems = group.items.map((item) => {
            const index = globalIndex++;
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
          });

          // If no group name, just render items
          if (!group.name) {
            return groupItems;
          }

          return (
            <div key={group.name} className="vizel-slash-menu-group" data-vizel-slash-menu-group>
              <div className="vizel-slash-menu-group-header">{group.name}</div>
              {groupItems}
            </div>
          );
        })}
      </div>
    );
  }
);

SlashMenu.displayName = "SlashMenu";

// Re-export SlashMenuItem props for consumers
export type { SlashMenuItemProps };
