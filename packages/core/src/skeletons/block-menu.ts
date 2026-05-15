import { groupVizelBlockMenuActions, type VizelBlockMenuAction } from "../extensions/block-menu.ts";
import type { VizelNodeTypeOption } from "../extensions/node-types.ts";
import type { VizelLocale } from "../i18n/types.ts";
import type { VizelMenuItemAttrs, VizelMenuSectionSpec, VizelMenuSpec } from "./types.ts";

/**
 * Item-data shape surfaced to the framework `VizelBlockMenu` component for
 * each block action.
 *
 * The action itself is the source of truth for icon name, label, optional
 * shortcut, and `isEnabled` predicate — the component reads those off
 * `data.action` at render time. The skeleton owns identity (key, index)
 * and the structural flags that drive styling (`isDestructive`).
 */
export interface VizelBlockMenuItemView {
  /** The block-menu action as supplied by the consumer. */
  action: VizelBlockMenuAction;
  /**
   * Whether this action is destructive (currently only `id === "delete"`).
   * Maps to the `is-destructive` class in the default theme.
   */
  isDestructive: boolean;
}

/**
 * Item-data shape surfaced for each "Turn into" submenu entry.
 */
export interface VizelBlockMenuTurnIntoItemView {
  nodeType: VizelNodeTypeOption;
}

/**
 * The submenu trigger metadata. The trigger is a `role="menuitem"` button
 * rendered after the action groups, opens the "Turn into" submenu, and
 * advertises that via `aria-haspopup` + `aria-expanded`.
 */
export interface VizelBlockMenuSubmenuTriggerSpec {
  /** Stable key (used as iteration key when needed). */
  key: string;
  /** Localized trigger label (e.g. "Turn into"). */
  label: string;
  /** Icon name rendered before the label. */
  iconName: "arrowRightLeft";
  /** ARIA attrs for the trigger button. */
  attrs: VizelMenuItemAttrs;
}

/**
 * The complete block-menu skeleton: main menu + submenu trigger + submenu.
 *
 * The main menu's `sections` come from `groupVizelBlockMenuActions`. The
 * framework component renders a divider between adjacent sections. The
 * submenu trigger sits after all action sections; the submenu itself is
 * rendered conditionally when `showTurnInto` is `true` and it has items.
 */
export interface VizelBlockMenuSpec {
  /** Main menu root attrs (`role="menu"`, `aria-label`). */
  root: { role: "menu"; "aria-label": string; tabIndex: -1 };
  /** Action groups (rendered with a divider between adjacent sections). */
  sections: readonly VizelMenuSectionSpec<VizelBlockMenuItemView>[];
  /** "Turn into" submenu trigger. */
  submenuTrigger: VizelBlockMenuSubmenuTriggerSpec;
  /**
   * "Turn into" submenu spec. Empty `sections` array means the consumer
   * should skip rendering the submenu (no available target node types).
   */
  submenu: VizelMenuSpec<VizelBlockMenuTurnIntoItemView>;
}

/**
 * Build a {@link VizelBlockMenuSpec} for the block context menu.
 *
 * The skeleton owns: container ARIA, grouping of actions into sections,
 * `is-destructive` flag derivation, submenu trigger ARIA wiring
 * (`aria-haspopup` + `aria-expanded`), and submenu list shape.
 *
 * The framework component owns: positioning, focus management, event
 * binding, and computing per-action `disabled` state (which requires the
 * runtime editor + node, not available here).
 *
 * @param actions  Resolved block-menu actions (already locale-applied).
 * @param turnIntoOptions  Filtered list of available "Turn into" targets.
 * @param showTurnInto  Whether the submenu is currently open.
 * @param locale  Optional locale for translated labels.
 */
export function buildVizelBlockMenuSkeleton(
  actions: readonly VizelBlockMenuAction[],
  turnIntoOptions: readonly VizelNodeTypeOption[],
  showTurnInto: boolean,
  locale: VizelLocale | undefined
): VizelBlockMenuSpec {
  const menuLabel = locale?.blockMenu.label ?? "Block menu";
  const turnIntoLabel = locale?.blockMenu.turnInto ?? "Turn into";

  const groups = groupVizelBlockMenuActions(actions);
  let globalIndex = 0;
  const sections: VizelMenuSectionSpec<VizelBlockMenuItemView>[] = groups.map(
    (group, groupIndex) => ({
      key: `group-${groupIndex}`,
      items: group.map((action) => ({
        key: action.id,
        index: globalIndex++,
        data: { action, isDestructive: action.id === "delete" },
        attrs: { role: "menuitem" satisfies "menuitem" } as VizelMenuItemAttrs,
      })),
    })
  );

  const submenuTrigger: VizelBlockMenuSubmenuTriggerSpec = {
    key: "submenu-trigger-turn-into",
    label: turnIntoLabel,
    iconName: "arrowRightLeft",
    attrs: {
      role: "menuitem",
      "aria-haspopup": "menu",
      "aria-expanded": showTurnInto,
    },
  };

  const submenu: VizelMenuSpec<VizelBlockMenuTurnIntoItemView> = {
    root: { role: "menu", "aria-label": turnIntoLabel },
    sections:
      turnIntoOptions.length === 0
        ? []
        : [
            {
              key: "turn-into-options",
              items: turnIntoOptions.map((nodeType, index) => ({
                key: nodeType.name,
                index,
                data: { nodeType },
                attrs: { role: "menuitem" },
              })),
            },
          ],
  };

  return {
    root: { role: "menu", "aria-label": menuLabel, tabIndex: -1 },
    sections,
    submenuTrigger,
    submenu,
  };
}
