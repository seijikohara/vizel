import type { Editor } from "@tiptap/core";
import { deriveVizelCommandSpec } from "../commands/derive.ts";
import {
  groupSlashCommands as groupVizelSlashCommands,
  type SlashCommandItem as VizelSlashCommandItem,
} from "../commands/slash-items.ts";
import type { VizelCommand } from "../commands/types.ts";
import type { VizelLocale } from "../i18n/types.ts";
import type { VizelCommandSpec, VizelMenuSpec } from "./types.ts";

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
 * Return the stable `role="option"` id for a slash item.
 *
 * The id matches the listbox root's `aria-activedescendant` when the item
 * is the active selection. The prefix mirrors `vizel-mention-${id}` from
 * `buildVizelMentionMenuSpec` so both suggestion menus follow the same
 * combobox `aria-activedescendant` relationship.
 */
const slashOptionId = (item: VizelSlashCommandItem): string => `vizel-slash-${item.id}`;

/**
 * Build a {@link VizelMenuSpec} for the slash command menu.
 *
 * Slash menus use `role="listbox"` and may render multiple sections
 * (groups) each with a header label. The active option carries the id the
 * root's `aria-activedescendant` points at, matching
 * `buildVizelMentionMenuSpec`. The framework `VizelSlashMenuItem` component
 * owns the `role="option"` element, so the spec threads the id (and the
 * selection flag) to that component while leaving the role itself to the
 * component.
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
  const activeItem = items[selectedIndex];
  const activeId = activeItem ? slashOptionId(activeItem) : undefined;
  const rootAttrs = {
    role: "listbox",
    "aria-label": "Commands",
    ...(activeId && { "aria-activedescendant": activeId }),
  } as const;

  if (items.length === 0) {
    return { root: { role: "listbox", "aria-label": "Commands" }, sections: [] };
  }

  const groups =
    !showGroups || items.length <= 5
      ? [{ name: "", items: [...items] }]
      : groupVizelSlashCommands([...items], groupOrder);

  const groupOffsets = groups.reduce<number[]>(
    (acc, group) => {
      acc.push((acc.at(-1) ?? 0) + group.items.length);
      return acc;
    },
    [0]
  );
  const sections = groups.map((group, gIndex) => {
    const baseOffset = groupOffsets[gIndex] ?? 0;
    const sectionItems = group.items.map((item, indexInGroup) => {
      const index = baseOffset + indexInGroup;
      return {
        key: item.id,
        index,
        data: { item, isSelected: index === selectedIndex },
        attrs: { id: slashOptionId(item) },
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

// ============================================================================
// VizelCommand-based derivation (Section 9)
// ============================================================================

/**
 * Options accepted by {@link buildVizelSlashMenuSpecFromCommands}.
 */
export interface VizelSlashMenuFromCommandsOptions {
  /** Editor instance the commands run against (used for `canRun`/`isActive`). */
  readonly editor: Editor;
  /** Locale supplying `label` / `description` strings. */
  readonly locale: VizelLocale;
  /** Current query string; commands are filtered by name + keywords. */
  readonly query: string;
  /** Index of the keyboard-active selection (zero-based). */
  readonly selectedIndex: number;
  /** Whether to render groups with headers. Mirrors {@link buildVizelSlashMenuSpec}. */
  readonly showGroups?: boolean;
  /** Custom group display order. */
  readonly groupOrder?: readonly string[];
}

/** Default order used when callers do not supply `groupOrder`. */
const DEFAULT_COMMAND_GROUP_ORDER = ["Text", "Lists", "Blocks", "Media", "Navigation", "Advanced"];

function matchesQuery(command: VizelCommand, locale: VizelLocale, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  if (command.label(locale).toLowerCase().includes(q)) return true;
  if (command.description?.(locale).toLowerCase().includes(q) === true) return true;
  return command.keywords?.some((k) => k.toLowerCase().includes(q)) === true;
}

function compareSlashPriority(a: VizelCommand, b: VizelCommand): number {
  return (a.surfaces.slashMenu?.priority ?? 0) - (b.surfaces.slashMenu?.priority ?? 0);
}

/**
 * Build a {@link VizelMenuSpec} for the slash menu from a
 * {@link VizelCommand} array.
 *
 * Filters by `surfaces.slashMenu`, sorts by priority, applies the
 * query filter, groups by `command.group`, and derives a
 * {@link VizelCommandSpec} for each entry. Returns the same spec shape
 * the framework `VizelSlashMenu` component already consumes — but
 * sections carry `VizelCommandSpec` items (not the legacy
 * `VizelSlashItemView`).
 */
export function buildVizelSlashMenuSpecFromCommands(
  commands: readonly VizelCommand[],
  options: VizelSlashMenuFromCommandsOptions
): VizelMenuSpec<VizelCommandSpec> {
  const { editor, locale, query, selectedIndex, showGroups = true, groupOrder } = options;
  const rootAttrs = { role: "listbox", "aria-label": "Commands" } as const;

  const filtered = commands
    .filter((c) => c.surfaces.slashMenu !== undefined)
    .filter((c) => matchesQuery(c, locale, query))
    .slice()
    .sort(compareSlashPriority);

  if (filtered.length === 0) {
    return { root: rootAttrs, sections: [] };
  }

  const collapseGroups = !showGroups || filtered.length <= 5;
  const order = groupOrder ?? DEFAULT_COMMAND_GROUP_ORDER;

  const groupedMap = new Map<string, VizelCommand[]>();
  for (const command of filtered) {
    const name = collapseGroups ? "" : (command.group ?? "Other");
    const existing = groupedMap.get(name) ?? [];
    existing.push(command);
    groupedMap.set(name, existing);
  }

  const orderedGroupNames: string[] = collapseGroups
    ? [""]
    : [
        ...order.filter((name) => groupedMap.has(name)),
        ...[...groupedMap.keys()].filter((name) => !order.includes(name)),
      ];

  const groupOffsets = orderedGroupNames.reduce<number[]>(
    (acc, groupName) => {
      acc.push((acc.at(-1) ?? 0) + (groupedMap.get(groupName)?.length ?? 0));
      return acc;
    },
    [0]
  );
  const sections = orderedGroupNames.map((groupName, gIndex) => {
    const groupCommands = groupedMap.get(groupName) ?? [];
    const baseOffset = groupOffsets[gIndex] ?? 0;
    const sectionItems = groupCommands.map((command, indexInGroup) => {
      const index = baseOffset + indexInGroup;
      return {
        key: command.id,
        index,
        data: deriveVizelCommandSpec(command, editor, locale),
        attrs: {
          "aria-selected": index === selectedIndex,
        },
      };
    });
    return {
      key: groupName || `__ungrouped_${gIndex}`,
      ...(groupName && { header: { label: groupName } }),
      items: sectionItems,
    };
  });

  return { root: rootAttrs, sections };
}
