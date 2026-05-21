import { splitVizelTextByMatches, type VizelSlashCommandItem } from "@vizel/core";
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
 * Render text with highlighted segments based on match indices from fuzzy search
 */
const renderHighlightedText = (text: string, matches?: [number, number][]): React.ReactNode => {
  const segments = splitVizelTextByMatches(text, matches);
  // Use fragment with cumulative character position as unique key. The
  // cumulative offset is derived from a running prefix-sum over preceding
  // segment lengths so the implementation stays free of mutable counters.
  return segments.map((segment, i) => {
    const charPos = segments.slice(0, i).reduce((sum, s) => sum + s.text.length, 0);
    const key = `${charPos}-${segment.highlight}`;
    return segment.highlight ? (
      <mark key={key} className="vizel-slash-menu-highlight">
        {segment.text}
      </mark>
    ) : (
      segment.text
    );
  });
};

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
      role="option"
      aria-selected={isSelected}
      data-selected={isSelected || undefined}
    >
      <span className="vizel-slash-menu-icon">
        <VizelIcon name={item.icon} />
      </span>
      <div className="vizel-slash-menu-text">
        <span className="vizel-slash-menu-title">
          {renderHighlightedText(item.title, titleMatches)}
        </span>
        <span className="vizel-slash-menu-description">{item.description}</span>
      </div>
      {item.shortcut && <span className="vizel-slash-menu-shortcut">{item.shortcut}</span>}
    </button>
  );
}
