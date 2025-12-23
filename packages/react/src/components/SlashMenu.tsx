import {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type ReactNode,
} from "react";
import type { SlashCommandItem } from "@vizel/core";

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
}

/**
 * Default menu item renderer
 */
function DefaultMenuItem({
  item,
  isSelected,
  onClick,
}: {
  item: SlashCommandItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`vizel-slash-menu-item ${isSelected ? "is-selected" : ""}`}
      onClick={onClick}
      data-selected={isSelected || undefined}
    >
      <span className="vizel-slash-menu-icon">{item.icon}</span>
      <div className="vizel-slash-menu-text">
        <span className="vizel-slash-menu-title">{item.title}</span>
        <span className="vizel-slash-menu-description">{item.description}</span>
      </div>
    </button>
  );
}

/**
 * Slash command menu component for displaying command suggestions.
 * This is used internally by the SlashCommand extension and should be
 * rendered via the suggestion plugin's render function.
 *
 * @example
 * ```tsx
 * // This component is typically used via the suggestion plugin:
 * SlashCommand.configure({
 *   suggestion: {
 *     render: () => {
 *       let component: ReactRenderer<SlashMenuRef>;
 *       return {
 *         onStart: (props) => {
 *           component = new ReactRenderer(SlashMenu, {
 *             props,
 *             editor: props.editor,
 *           });
 *         },
 *         // ... other handlers
 *       };
 *     },
 *   },
 * })
 * ```
 */
export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command, className, renderItem }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

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
    }, [items]);

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
          <div className="vizel-slash-menu-empty">No results</div>
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
              <div key={item.title}>
                {renderItem({ item, isSelected, onClick })}
              </div>
            );
          }

          return (
            <DefaultMenuItem
              key={item.title}
              item={item}
              isSelected={isSelected}
              onClick={onClick}
            />
          );
        })}
      </div>
    );
  }
);

SlashMenu.displayName = "SlashMenu";
