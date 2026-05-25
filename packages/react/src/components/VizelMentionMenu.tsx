import {
  buildVizelMentionMenuSpec,
  resolveVizelListNavigation,
  type VizelLocale,
  type VizelMentionItem,
} from "@vizel/core";
import type { ReactNode, Ref } from "react";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

export interface VizelMentionMenuRef {
  /**
   * Handle keyboard navigation events.
   * The renderer forwards the raw `KeyboardEvent`; the React component
   * previously accepted `{ event }`. v2.0 unifies the signature across
   * React/Vue/Svelte to the raw-event form.
   */
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export interface VizelMentionMenuProps {
  /** Ref to access menu methods */
  ref?: Ref<VizelMentionMenuRef>;
  /** Mention items to display */
  items: VizelMentionItem[];
  /** Callback when an item is selected */
  onSelect: (item: VizelMentionItem) => void;
  /** Custom class name for the menu container */
  className?: string;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

/**
 * Mention autocomplete menu component.
 *
 * The DOM structure and ARIA wiring come from `@vizel/core`'s
 * `buildVizelMentionMenuSpec`; this component is the React-flavored
 * binding that maps the spec to JSX. Item rendering (avatar + label +
 * description) is React-specific and stays here.
 */
export function VizelMentionMenu({
  ref,
  items,
  onSelect,
  className,
  locale,
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
        onSelect(item);
      }
    },
    [items, onSelect]
  );

  useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (event.key === "Enter") {
        if (items.length === 0) return false;
        selectItem(selectedIndex);
        return true;
      }
      const next = resolveVizelListNavigation(event.key, selectedIndex, items.length);
      if (next === null) return false;
      setSelectedIndex(next);
      return true;
    },
  }));

  const spec = useMemo(
    () => buildVizelMentionMenuSpec(items, selectedIndex, locale),
    [items, selectedIndex, locale]
  );

  if (spec.sections.length === 0) {
    return (
      <div
        className={`vizel-mention-menu ${className ?? ""}`}
        data-vizel-mention-menu=""
        role="listbox"
        aria-label={spec.root["aria-label"]}
      >
        <div className="vizel-mention-menu-empty">
          {locale?.mentionMenu?.noResults ?? "No results"}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`vizel-mention-menu ${className ?? ""}`}
      data-vizel-mention-menu=""
      role="listbox"
      aria-label={spec.root["aria-label"]}
      {...(spec.root["aria-activedescendant"] && {
        "aria-activedescendant": spec.root["aria-activedescendant"],
      })}
    >
      {spec.sections.flatMap((section) =>
        section.items.map((slot) => (
          <div
            key={slot.key}
            id={slot.attrs.id}
            ref={(el) => {
              itemRefs.current[slot.index] = el;
            }}
            className={`vizel-mention-menu-item ${slot.data.isSelected ? "is-selected" : ""}`}
            onClick={() => selectItem(slot.index)}
            onKeyDown={(e) => {
              if (e.key === "Enter") selectItem(slot.index);
            }}
            tabIndex={slot.attrs.tabIndex}
            role="option"
            aria-selected={slot.attrs["aria-selected"]}
          >
            <div className="vizel-mention-menu-item-avatar">
              {slot.data.item.avatar ? (
                <img src={slot.data.item.avatar} alt={slot.data.item.label} />
              ) : (
                slot.data.item.label.charAt(0).toUpperCase()
              )}
            </div>
            <div className="vizel-mention-menu-item-content">
              <div className="vizel-mention-menu-item-label">{slot.data.item.label}</div>
              {slot.data.item.description && (
                <div className="vizel-mention-menu-item-description">
                  {slot.data.item.description}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
