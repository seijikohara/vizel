import type { Editor } from "@vizel/core";
import {
  createVizelToolbarActions,
  formatVizelTooltip,
  groupVizelToolbarActions,
  isVizelToolbarDropdownAction,
  type VizelLocale,
  type VizelToolbarActionItem,
  vizelDefaultToolbarActions,
} from "@vizel/core";
import { Fragment } from "react";
import { useVizelState } from "../hooks/useVizelState.ts";
import { VizelIcon } from "./VizelIcon.tsx";
import { VizelToolbarButton } from "./VizelToolbarButton.tsx";
import { VizelToolbarDivider } from "./VizelToolbarDivider.tsx";
import { VizelToolbarDropdown } from "./VizelToolbarDropdown.tsx";

export interface VizelToolbarDefaultProps {
  editor: Editor;
  className?: string;
  /** Custom toolbar actions — supports both simple actions and dropdown actions */
  actions?: VizelToolbarActionItem[];
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
  // Subscribe to editor state changes to update active/enabled states
  useVizelState(() => editor);

  const effectiveActions: VizelToolbarActionItem[] =
    actions ?? (locale ? createVizelToolbarActions(locale) : vizelDefaultToolbarActions);
  const groups = groupVizelToolbarActions(effectiveActions);

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
                isActive={action.isActive(editor)}
                disabled={!action.isEnabled(editor)}
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
