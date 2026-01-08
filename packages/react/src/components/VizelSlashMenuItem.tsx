import type { VizelSlashCommandItem } from "@vizel/core";
import { VizelIcon } from "./VizelIcon.tsx";

export interface VizelSlashMenuItemProps {
  item: VizelSlashCommandItem;
  isSelected?: boolean;
  onClick: () => void;
  className?: string;
  /** Match indices for highlighting (from fuzzy search) */
  titleMatches?: [number, number][];
}

/**
 * Highlight text based on match indices from fuzzy search
 */
function highlightMatches(text: string, matches?: [number, number][]): React.ReactNode {
  if (!matches || matches.length === 0) {
    return text;
  }

  const result: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const [start, end] of matches) {
    // Add text before match
    if (start > lastIndex) {
      result.push(text.slice(lastIndex, start));
    }
    // Add highlighted match
    result.push(
      <mark key={start} className="vizel-slash-menu-highlight">
        {text.slice(start, end + 1)}
      </mark>
    );
    lastIndex = end + 1;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}

/**
 * A menu item component for the VizelSlashMenu.
 * Displays the command icon, title, description, and optional keyboard shortcut.
 *
 * @example
 * ```tsx
 * <VizelSlashMenuItem
 *   item={{ title: "Heading 1", icon: "H1", description: "Large heading", shortcut: "⌘⌥1" }}
 *   isSelected={selectedIndex === 0}
 *   onClick={() => command(item)}
 * />
 * ```
 */
export function VizelSlashMenuItem({
  item,
  isSelected = false,
  onClick,
  className,
  titleMatches,
}: VizelSlashMenuItemProps) {
  return (
    <button
      type="button"
      className={`vizel-slash-menu-item ${isSelected ? "is-selected" : ""} ${className ?? ""}`}
      onClick={onClick}
      data-selected={isSelected || undefined}
    >
      <span className="vizel-slash-menu-icon">
        <VizelIcon name={item.icon} />
      </span>
      <div className="vizel-slash-menu-text">
        <span className="vizel-slash-menu-title">{highlightMatches(item.title, titleMatches)}</span>
        <span className="vizel-slash-menu-description">{item.description}</span>
      </div>
      {item.shortcut && <span className="vizel-slash-menu-shortcut">{item.shortcut}</span>}
    </button>
  );
}
