import type { SlashCommandItem } from "@vizel/core";

export interface SlashMenuItemProps {
  item: SlashCommandItem;
  isSelected?: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * A menu item component for the SlashMenu.
 * Displays the command icon, title, and description.
 *
 * @example
 * ```tsx
 * <SlashMenuItem
 *   item={{ title: "Heading 1", icon: "H1", description: "Large heading" }}
 *   isSelected={selectedIndex === 0}
 *   onClick={() => command(item)}
 * />
 * ```
 */
export function SlashMenuItem({
  item,
  isSelected = false,
  onClick,
  className,
}: SlashMenuItemProps) {
  return (
    <button
      type="button"
      className={`vizel-slash-menu-item ${isSelected ? "is-selected" : ""} ${className ?? ""}`}
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
