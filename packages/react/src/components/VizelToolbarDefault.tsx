import type { Editor } from "@vizel/core";
import {
  groupVizelToolbarActions,
  type VizelToolbarAction,
  vizelDefaultToolbarActions,
} from "@vizel/core";
import { Fragment } from "react";
import { useVizelState } from "../hooks/useVizelState.ts";
import { VizelIcon } from "./VizelIcon.tsx";
import { VizelToolbarButton } from "./VizelToolbarButton.tsx";
import { VizelToolbarDivider } from "./VizelToolbarDivider.tsx";

export interface VizelToolbarDefaultProps {
  editor: Editor;
  className?: string;
  /** Custom toolbar actions (defaults to vizelDefaultToolbarActions) */
  actions?: VizelToolbarAction[];
}

/**
 * The default toolbar content for VizelToolbar.
 * Provides formatting buttons grouped by category with dividers between groups.
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
  actions = vizelDefaultToolbarActions,
}: VizelToolbarDefaultProps) {
  // Subscribe to editor state changes to update active/enabled states
  useVizelState(() => editor);

  const groups = groupVizelToolbarActions(actions);

  return (
    <div className={`vizel-toolbar-content ${className ?? ""}`} data-vizel-toolbar="">
      {groups.map((group, groupIndex) => (
        <Fragment key={group[0]?.group ?? groupIndex}>
          {groupIndex > 0 && <VizelToolbarDivider />}
          {group.map((action) => (
            <VizelToolbarButton
              key={action.id}
              action={action.id}
              onClick={() => action.run(editor)}
              isActive={action.isActive(editor)}
              disabled={!action.isEnabled(editor)}
              title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
            >
              <VizelIcon name={action.icon} />
            </VizelToolbarButton>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
