import type { Editor } from "@vizel/core";
import {
  createVizelToolbarActions,
  formatVizelTooltip,
  groupVizelToolbarActions,
  isVizelToolbarDropdownAction,
  shallowEqualObject,
  type VizelLocale,
  type VizelToolbarActionItem,
  vizelDefaultToolbarActions,
} from "@vizel/core";
import { Fragment, useMemo } from "react";
import { useVizelEditorState } from "../_reactivity.ts";
import { VizelIcon } from "./VizelIcon.tsx";
import { VizelToolbarButton } from "./VizelToolbarButton.tsx";
import { VizelToolbarDivider } from "./VizelToolbarDivider.tsx";
import { VizelToolbarDropdown } from "./VizelToolbarDropdown.tsx";

export interface VizelToolbarDefaultProps {
  editor: Editor;
  className?: string;
  /** Custom toolbar actions — supports both simple actions and dropdown actions */
  actions?: readonly VizelToolbarActionItem[];
  /** Locale for translated labels */
  locale?: VizelLocale;
}

/**
 * The default toolbar content for VizelToolbar.
 * Provides formatting buttons grouped by category with dividers between groups.
 * Supports both simple button actions and dropdown menu actions.
 *
 * @example
 * ```tsx
 * <VizelToolbar>
 *   <VizelToolbarDefault editor={editor} />
 * </VizelToolbar>
 * ```
 */
export function VizelToolbarDefault({
  editor,
  className,
  actions,
  locale,
}: VizelToolbarDefaultProps) {
  const { groups, buttonActions } = useMemo(() => {
    const effectiveActions: readonly VizelToolbarActionItem[] =
      actions ?? (locale ? createVizelToolbarActions(locale) : vizelDefaultToolbarActions);
    return {
      groups: groupVizelToolbarActions(effectiveActions),
      // Dropdown actions own their own active/disabled rendering, so the
      // selector slice only tracks the plain button actions.
      buttonActions: effectiveActions.filter((action) => !isVizelToolbarDropdownAction(action)),
    };
  }, [actions, locale]);

  // Read each button's active/enabled flags through a selector slice.
  // `shallowEqualObject` re-renders the toolbar only when one of those
  // flags flips, replacing the coarse `useVizelState` full-tick re-render
  // (ADR-0004). The explicit `editor` keeps the subscription bound when
  // the toolbar renders without a surrounding `VizelProvider`.
  const stateById = useVizelEditorState((current) => buildButtonStateById(buttonActions, current), {
    editor,
    equalityFn: shallowEqualObject,
  });

  return (
    <div className={`vizel-toolbar-content ${className ?? ""}`} data-vizel-toolbar="">
      {groups.map((group, groupIndex) => (
        <Fragment key={group[0]?.group ?? groupIndex}>
          {groupIndex > 0 && <VizelToolbarDivider />}
          {group.map((action) =>
            isVizelToolbarDropdownAction(action) ? (
              <VizelToolbarDropdown key={action.id} editor={editor} dropdown={action} />
            ) : (
              <VizelToolbarButton
                key={action.id}
                action={action.id}
                onClick={() => action.run(editor)}
                isActive={stateById[`${action.id}:active`] ?? false}
                disabled={!(stateById[`${action.id}:enabled`] ?? true)}
                title={formatVizelTooltip(action.label, action.shortcut)}
              >
                <VizelIcon name={action.icon} />
              </VizelToolbarButton>
            )
          )}
        </Fragment>
      ))}
    </div>
  );
}

/**
 * Project each button action's active and enabled flags into a flat
 * record. The keys carry an `:active` / `:enabled` suffix so the slice
 * stays a single shallow-compared object rather than a nested map.
 */
function buildButtonStateById(
  actions: readonly VizelToolbarActionItem[],
  editor: Editor | null
): Record<string, boolean> {
  if (editor === null) return {};
  return Object.fromEntries(
    actions.flatMap((action) =>
      isVizelToolbarDropdownAction(action)
        ? []
        : [
            [`${action.id}:active`, action.isActive(editor)],
            [`${action.id}:enabled`, action.isEnabled(editor)],
          ]
    )
  );
}
