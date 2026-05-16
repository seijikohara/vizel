import {
  groupSlashCommands as groupVizelSlashCommands,
  type SlashCommandItem as VizelSlashCommandItem,
} from "../commands/slash-items.ts";
import type { VizelMenuSpec } from "./types.ts";

/**
 * Item-data shape surfaced to the framework `VizelSlashMenu` component.
 *
 * Carries the original `VizelSlashCommandItem` plus the selection flag so
 * the component can render its default `VizelSlashMenuItem` (or a
 * consumer-supplied custom renderer) without re-deriving `isSelected`
 * from `selectedIndex`.
 */
export interface VizelSlashItemView {
  /** The slash-command item as supplied by the consumer. */
  item: VizelSlashCommandItem;
  /** Whether this item is the keyboard-active selection. */
  isSelected: boolean;
}

/**
 * Options accepted by {@link buildVizelSlashMenuSpec}.
 */
export interface VizelSlashMenuSpecOptions {
  /**
   * Whether to render items grouped by category. When `false`, or when
   * `items.length <= 5` (typically fuzzy-search results), grouping is
   * collapsed to a single un-headed section.
   *
   * @default true
   */
  showGroups?: boolean;
  /** Custom group display order. Forwarded to `groupVizelSlashCommands`. */
  groupOrder?: string[];
}

/**
 * Build a {@link VizelMenuSpec} for the slash command menu.
 *
 * Slash menus use `role="listbox"` and may render multiple sections
 * (groups) each with a header label. Items defer their own role / ARIA
 * to the framework `VizelSlashMenuItem` component (which is itself a
 * `role="option"` button), so the spec-level item `attrs` are empty —
 * the spec carries identity (key, index) and view data only.
 *
 * The empty `sections` array represents the no-items state; the
 * component renders its default `VizelSlashMenuEmpty` (or a custom
 * `renderEmpty`).
 */
export function buildVizelSlashMenuSpec(
  items: readonly VizelSlashCommandItem[],
  selectedIndex: number,
  options: VizelSlashMenuSpecOptions = {}
): VizelMenuSpec<VizelSlashItemView> {
  const { showGroups = true, groupOrder } = options;
  const rootAttrs = { role: "listbox", "aria-label": "Commands" } as const;

  if (items.length === 0) {
    return { root: rootAttrs, sections: [] };
  }

  const groups =
    !showGroups || items.length <= 5
      ? [{ name: "", items: [...items] }]
      : groupVizelSlashCommands([...items], groupOrder);

  let globalIndex = 0;
  const sections = groups.map((group, gIndex) => {
    const sectionItems = group.items.map((item) => {
      const index = globalIndex++;
      return {
        key: item.id,
        index,
        data: { item, isSelected: index === selectedIndex },
        attrs: {},
      };
    });
    return {
      key: group.name || `__ungrouped_${gIndex}`,
      ...(group.name && { header: { label: group.name } }),
      items: sectionItems,
    };
  });

  return { root: rootAttrs, sections };
}

/**
 * Compute the next-group jump target for Tab-key navigation.
 *
 * Given the current spec and the global `currentIndex`, return the
 * global index of the first item in the *next* section (wrapping
 * around). When the spec has zero or one section, the current index
 * is returned unchanged.
 */
export function getNextVizelSlashMenuGroupIndex(
  spec: VizelMenuSpec<VizelSlashItemView>,
  currentIndex: number
): number {
  if (spec.sections.length <= 1) return currentIndex;

  const curSectionIdx = spec.sections.findIndex((section) =>
    section.items.some((slot) => slot.index === currentIndex)
  );
  if (curSectionIdx === -1) return currentIndex;

  const nextSectionIdx = (curSectionIdx + 1) % spec.sections.length;
  const nextSection = spec.sections[nextSectionIdx];
  return nextSection?.items[0]?.index ?? currentIndex;
}
