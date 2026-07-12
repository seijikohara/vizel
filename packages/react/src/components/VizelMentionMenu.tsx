import { buildVizelMentionMenuSpec, type VizelLocale, type VizelMentionItem } from "@vizel/core";
import { buildVizelComboboxKeySpec } from "@vizel/headless/combobox";
import type { ReactNode, Ref } from "react";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

export interface VizelMentionMenuRef {
  /**
   * Handle keyboard navigation events.
   * The renderer forwards the raw `KeyboardEvent`. React, Vue, and Svelte
   * share the raw-event signature so the renderer wires the same way in
   * every adapter.
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
  /**
   * Custom render function for items. Receives the item, the selection
   * state, and a click handler that selects the item. Mirrors the
   * `renderItem` seam on `VizelSlashMenu`.
   */
  renderItem?: (props: {
    item: VizelMentionItem;
    isSelected: boolean;
    onClick: () => void;
  }) => ReactNode;
  /** Custom empty state component. Mirrors `VizelSlashMenu.renderEmpty`. */
  renderEmpty?: () => ReactNode;
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
  renderItem,
  renderEmpty,
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

  // Reset selection when items change.
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
      // The mention menu is flat: it handles `navigate` and `select` only.
      // `groupNext` (Tab) and `close` (Escape) fall through as unhandled —
      // mention has no groups and no own close path — so Tiptap consumes
      // those keys, matching the menu's pre-adoption behaviour.
      const action = buildVizelComboboxKeySpec({
        key: event.key,
        currentIndex: selectedIndex,
        length: items.length,
      });
      if (action === null) return false;
      switch (action.type) {
        case "navigate":
          setSelectedIndex(action.index);
          return true;
        case "select":
          selectItem(action.index);
          return true;
        default:
          return false;
      }
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
        {renderEmpty?.() ?? (
          <div className="vizel-mention-menu-empty">
            {locale?.mentionMenu?.noResults ?? "No results"}
          </div>
        )}
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
        section.items.map((slot) => {
          const onClick = () => selectItem(slot.index);
          const content = renderItem ? (
            renderItem({ item: slot.data.item, isSelected: slot.data.isSelected, onClick })
          ) : (
            <>
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
            </>
          );
          return (
            <div
              key={slot.key}
              id={slot.attrs.id}
              ref={(el) => {
                itemRefs.current[slot.index] = el;
              }}
              className={`vizel-mention-menu-item ${slot.data.isSelected ? "is-selected" : ""}`}
              onClick={onClick}
              onKeyDown={(e) => {
                if (e.key === "Enter") selectItem(slot.index);
              }}
              tabIndex={slot.attrs.tabIndex}
              role="option"
              aria-selected={slot.attrs["aria-selected"]}
            >
              {content}
            </div>
          );
        })
      )}
    </div>
  );
}
