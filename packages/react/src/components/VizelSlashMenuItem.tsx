import { formatVizelShortcut, splitVizelTextByMatches, type VizelCommandSpec } from "@vizel/core";

import { VizelIcon } from "./VizelIcon.tsx";

export interface VizelSlashMenuItemProps {
  /** The command spec to display (label, description, icon, shortcut). */
  item: VizelCommandSpec;
  /** Whether the item is selected */
  isSelected?: boolean;
  onClick: () => void;
  className?: string;
  /**
   * Stable id for the `role="option"` element. The listbox root's
   * `aria-activedescendant` points at this id when the item is the active
   * selection, matching the WAI-ARIA combobox pattern. The spec always
   * supplies the id for a rendered item; the optional `undefined` keeps the
   * prop assignable from the optional spec field under
   * `exactOptionalPropertyTypes`.
   */
  id?: string | undefined;
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
 * Displays the command icon, label, description, and optional keyboard shortcut.
 *
 * The shortcut hint renders through {@link formatVizelShortcut}, which
 * resolves the `{ mac, other }` `VizelShortcutSpec` to the current platform.
 */
export function VizelSlashMenuItem({
  item,
  isSelected = false,
  onClick,
  className,
  id,
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
      {...(id && { id })}
    >
      {item.icon && (
        <span className="vizel-slash-menu-icon">
          <VizelIcon name={item.icon} />
        </span>
      )}
      <div className="vizel-slash-menu-text">
        <span className="vizel-slash-menu-title">
          {renderHighlightedText(item.label, titleMatches)}
        </span>
        {item.description && (
          <span className="vizel-slash-menu-description">{item.description}</span>
        )}
      </div>
      {item.shortcut && (
        <span className="vizel-slash-menu-shortcut">{formatVizelShortcut(item.shortcut)}</span>
      )}
    </button>
  );
}
