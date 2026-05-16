import type { VizelMentionItem } from "../extensions/mention.ts";
import type { VizelLocale } from "../i18n/types.ts";
import type { VizelMenuSpec } from "./types.ts";

/**
 * Item-data shape surfaced to the framework `VizelMentionMenu` component.
 *
 * Carries the original `VizelMentionItem` plus the selection flag so the
 * component renders avatar + label + description without re-deriving
 * `isSelected` from `selectedIndex`.
 */
export interface VizelMentionItemView {
  /** The item as supplied by the consumer. */
  item: VizelMentionItem;
  /** Whether this item is the keyboard-active selection. */
  isSelected: boolean;
}

/**
 * Build a {@link VizelMenuSpec} for the mention autocomplete menu.
 *
 * Mention menus are flat (no groups), use `role="listbox"`, and address
 * the active option through `aria-activedescendant`. The locale provides
 * the container's `aria-label`; framework components render the item
 * view (avatar + label + description) themselves using the supplied
 * `data` field.
 *
 * Returning an empty `sections` array signals the empty / no-results
 * state — the component renders a localized empty-state element.
 */
export function buildVizelMentionMenuSkeleton(
  items: readonly VizelMentionItem[],
  selectedIndex: number,
  locale: VizelLocale | undefined
): VizelMenuSpec<VizelMentionItemView> {
  const ariaLabel = locale?.mentionMenu?.ariaLabel ?? "Mentions";
  const activeItem = items[selectedIndex];
  const activeId = activeItem ? `vizel-mention-${activeItem.id}` : undefined;

  return {
    root: {
      role: "listbox",
      "aria-label": ariaLabel,
      ...(activeId && { "aria-activedescendant": activeId }),
    },
    sections:
      items.length === 0
        ? []
        : [
            {
              key: "default",
              items: items.map((item, index) => ({
                key: item.id,
                index,
                data: { item, isSelected: index === selectedIndex },
                attrs: {
                  role: "option",
                  "aria-selected": index === selectedIndex,
                  id: `vizel-mention-${item.id}`,
                  tabIndex: -1,
                },
              })),
            },
          ],
  };
}
