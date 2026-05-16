import type { Editor } from "@tiptap/core";
import type { VizelIconName } from "../icons/types.ts";
import type { VizelToolbarAction, VizelToolbarDropdownAction } from "../toolbar/actions.ts";
import type { VizelMenuItemAttrs, VizelMenuSpec } from "./types.ts";

/**
 * Item-data shape surfaced to the framework `VizelToolbarDropdown`
 * component for each option in the popover listbox.
 *
 * The skeleton pre-evaluates `isActive` and `isEnabled` against the
 * runtime editor so the component renders without recomputing those
 * predicates inline. `isFocused` mirrors the component's keyboard
 * navigation cursor and drives the `is-focused` className.
 */
export interface VizelToolbarDropdownItemView {
  /** The option as supplied by the consumer. */
  option: VizelToolbarAction;
  /** Whether this option is currently the active formatting state. */
  isActive: boolean;
  /** Whether this option's `run` can fire (drives `disabled`). */
  isEnabled: boolean;
  /** Whether this option is the keyboard-focused row. */
  isFocused: boolean;
}

/**
 * Trigger button metadata. The trigger advertises the popover as a
 * listbox via `aria-haspopup="listbox"` and reflects the open state in
 * `aria-expanded`. The visible icon + label follow the currently-active
 * option (when `getActiveOption` is supplied) — for an unset state the
 * dropdown's own icon + label are used.
 */
export interface VizelToolbarDropdownTriggerSpec {
  /** Icon name rendered inside the trigger. */
  iconName: VizelIconName;
  /** Localized title / tooltip for the trigger button. */
  label: string;
  /** ARIA attrs for the trigger button. */
  attrs: {
    "aria-haspopup": "listbox";
    "aria-expanded": boolean;
  };
}

/**
 * The complete toolbar-dropdown skeleton: trigger + popover.
 *
 * The popover is a `VizelMenuSpec<VizelToolbarDropdownItemView>` so it
 * reuses the menu-spec iteration shape. The popover's `sections` always
 * contains exactly one section (flat listbox).
 */
export interface VizelToolbarDropdownSpec {
  /** Trigger button metadata. */
  trigger: VizelToolbarDropdownTriggerSpec;
  /** Popover listbox spec. */
  popover: VizelMenuSpec<VizelToolbarDropdownItemView>;
}

/**
 * Build a {@link VizelToolbarDropdownSpec} for the toolbar dropdown.
 *
 * @param dropdown  The dropdown action definition (id, options, getActiveOption).
 * @param editor    Current editor instance — used to pre-evaluate
 *                  `isActive` / `isEnabled` for each option and to resolve
 *                  the active-option icon / label for the trigger.
 * @param isOpen    Whether the popover is currently open.
 * @param focusedIndex Index of the keyboard-focused option.
 */
export function buildVizelToolbarDropdownSpec(
  dropdown: VizelToolbarDropdownAction,
  editor: Editor,
  isOpen: boolean,
  focusedIndex: number
): VizelToolbarDropdownSpec {
  const activeOption = dropdown.getActiveOption?.(editor);
  const trigger: VizelToolbarDropdownTriggerSpec = {
    iconName: activeOption?.icon ?? dropdown.icon,
    label: activeOption?.label ?? dropdown.label,
    attrs: {
      "aria-haspopup": "listbox",
      "aria-expanded": isOpen,
    },
  };

  const focusedOptionId = dropdown.options[focusedIndex]?.id;
  const activedescendant = focusedOptionId
    ? `vizel-dropdown-${dropdown.id}-${focusedOptionId}`
    : undefined;

  const popover: VizelMenuSpec<VizelToolbarDropdownItemView> = {
    root: {
      role: "listbox",
      "aria-label": dropdown.label,
      tabIndex: 0,
      ...(activedescendant && { "aria-activedescendant": activedescendant }),
    },
    sections: [
      {
        key: "options",
        items: dropdown.options.map((option, index) => {
          const isActive = option.isActive(editor);
          const isEnabled = option.isEnabled(editor);
          const isFocused = index === focusedIndex;
          const attrs: VizelMenuItemAttrs = {
            id: `vizel-dropdown-${dropdown.id}-${option.id}`,
            role: "option",
            "aria-selected": isActive,
            tabIndex: -1,
            ...(isEnabled ? {} : { "aria-disabled": true }),
          };
          return {
            key: option.id,
            index,
            data: { option, isActive, isEnabled, isFocused },
            attrs,
          };
        }),
      },
    ],
  };

  return { trigger, popover };
}
