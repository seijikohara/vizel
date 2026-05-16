import type { Editor } from "@tiptap/core";
import type { VizelNodeTypeOption } from "../extensions/node-types.ts";
import type { VizelLocale } from "../i18n/types.ts";
import type { VizelMenuItemAttrs, VizelMenuSpec } from "./types.ts";

/**
 * Item-data shape surfaced for each block-type option in the
 * `VizelNodeSelector` popover.
 *
 * The skeleton pre-evaluates `isActive` against the runtime editor and
 * exposes the keyboard-focused row via `isFocused`.
 */
export interface VizelNodeSelectorItemView {
  /** The node-type option as supplied by the consumer. */
  nodeType: VizelNodeTypeOption;
  /** Whether this node type matches the current selection. */
  isActive: boolean;
  /** Whether this row is the keyboard-focused option. */
  isFocused: boolean;
}

/**
 * Trigger button metadata. The trigger displays the currently-active
 * block type's icon + label, falls back to the locale-aware "Text"
 * label when no node type matches, and advertises the popover as a
 * listbox.
 */
export interface VizelNodeSelectorTriggerSpec {
  /** Icon name for the currently active block type. */
  iconName: VizelNodeTypeOption["icon"];
  /** Label for the currently active block type. */
  label: string;
  /** Localized title attribute ("Change block type"). */
  title: string;
  /** Localized aria-label ("Current block type: <label>"). */
  ariaLabel: string;
  /** ARIA attrs for the trigger button. */
  attrs: {
    "aria-haspopup": "listbox";
    "aria-expanded": boolean;
  };
}

/**
 * The complete node-selector skeleton: trigger + popover.
 */
export interface VizelNodeSelectorSpec {
  /** Trigger button metadata. */
  trigger: VizelNodeSelectorTriggerSpec;
  /** Popover listbox spec. */
  popover: VizelMenuSpec<VizelNodeSelectorItemView>;
}

/**
 * Build a {@link VizelNodeSelectorSpec} for the node-type selector.
 *
 * @param editor       Current editor instance — used to compute the
 *                     active node type and per-row `isActive`.
 * @param nodeTypes    Available node type options.
 * @param isOpen       Whether the popover is currently open.
 * @param focusedIndex Index of the keyboard-focused row.
 * @param locale       Optional locale for translated labels.
 */
export function buildVizelNodeSelectorSpec(
  editor: Editor,
  nodeTypes: readonly VizelNodeTypeOption[],
  isOpen: boolean,
  focusedIndex: number,
  locale: VizelLocale | undefined
): VizelNodeSelectorSpec {
  const activeNodeType = nodeTypes.find((type) => type.isActive(editor));
  const currentLabel = activeNodeType?.label ?? locale?.nodeTypes.text ?? "Text";
  const currentIcon = activeNodeType?.icon ?? "paragraph";
  const title = locale?.nodeSelector.changeBlockType ?? "Change block type";
  const ariaLabelTemplate = locale?.nodeSelector.currentBlockType ?? "Current block type: {type}";

  const trigger: VizelNodeSelectorTriggerSpec = {
    iconName: currentIcon,
    label: currentLabel,
    title,
    ariaLabel: ariaLabelTemplate.replace("{type}", currentLabel),
    attrs: {
      "aria-haspopup": "listbox",
      "aria-expanded": isOpen,
    },
  };

  const popover: VizelMenuSpec<VizelNodeSelectorItemView> = {
    root: {
      role: "listbox",
      "aria-label": locale?.nodeSelector.blockTypes ?? "Block types",
      tabIndex: -1,
    },
    sections: [
      {
        key: "node-types",
        items: nodeTypes.map((nodeType, index) => {
          const isActive = nodeType.isActive(editor);
          const isFocused = index === focusedIndex;
          const attrs: VizelMenuItemAttrs = {
            role: "option",
            "aria-selected": isActive,
            tabIndex: isFocused ? 0 : -1,
          };
          return {
            key: nodeType.name,
            index,
            data: { nodeType, isActive, isFocused },
            attrs,
          };
        }),
      },
    ],
  };

  return { trigger, popover };
}
