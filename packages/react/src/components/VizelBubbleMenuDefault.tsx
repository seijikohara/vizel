import {
  createVizelBubbleMenuActions,
  type Editor,
  filterVizelBubbleMenuActions,
  formatVizelTooltip,
  groupVizelBubbleMenuActions,
  shallowEqualObject,
  type VizelBubbleMenuAction,
  type VizelLocale,
} from "@vizel/core";
import { useMemo, useState } from "react";

import { useVizelEditorState } from "../_reactivity.ts";
import { VizelBubbleMenuButton } from "./VizelBubbleMenuButton.tsx";
import { VizelBubbleMenuColorPicker } from "./VizelBubbleMenuColorPicker.tsx";
import { VizelBubbleMenuDivider } from "./VizelBubbleMenuDivider.tsx";
import { VizelIcon } from "./VizelIcon.tsx";
import { VizelLinkEditor } from "./VizelLinkEditor.tsx";
import { VizelNodeSelector } from "./VizelNodeSelector.tsx";

export interface VizelBubbleMenuDefaultProps {
  editor: Editor;
  className?: string;
  /** Enable embed option in link editor (requires Embed extension) */
  enableEmbed?: boolean;
  /** Locale for translated UI strings */
  locale?: VizelLocale;
}

/**
 * The default menu content for VizelBubbleMenu.
 *
 * Renders an iterated list of mark-toggle buttons driven by
 * `createVizelBubbleMenuActions` from `@vizel/core`. The `link` action
 * is plucked out and rendered specially because its activation opens the
 * link editor instead of running a Tiptap command.
 */
export function VizelBubbleMenuDefault({
  editor,
  className,
  enableEmbed,
  locale,
}: VizelBubbleMenuDefaultProps) {
  const [showLinkEditor, setShowLinkEditor] = useState(false);

  const { markGroups, linkAction, allActions } = useMemo(() => {
    const all = filterVizelBubbleMenuActions(createVizelBubbleMenuActions(locale), editor);
    const link = all.find((a) => a.id === "link");
    const marks = all.filter((a) => a.id !== "link");
    return {
      markGroups: groupVizelBubbleMenuActions(marks),
      linkAction: link,
      allActions: all,
    };
  }, [locale, editor]);

  // Read each action's active flag through a selector slice keyed by
  // action id. `shallowEqualObject` suppresses a re-render unless one of
  // the marks toggles, replacing the coarse `useVizelState` tick that
  // re-rendered on every transaction. The explicit `editor`
  // keeps the subscription working when the bubble menu renders outside a
  // `VizelProvider`.
  const activeById = useVizelEditorState(
    ({ editor: current }) => buildActiveById(allActions, current),
    {
      editor,
      equalityFn: shallowEqualObject,
    }
  );

  if (showLinkEditor) {
    return (
      <VizelLinkEditor
        editor={editor}
        onClose={() => setShowLinkEditor(false)}
        {...(enableEmbed ? { enableEmbed } : {})}
        {...(locale ? { locale } : {})}
      />
    );
  }

  const renderAction = (action: VizelBubbleMenuAction) => (
    <VizelBubbleMenuButton
      key={action.id}
      action={action.id}
      onClick={() => action.run(editor)}
      isActive={activeById[action.id] ?? false}
      title={formatVizelTooltip(action.label, action.shortcut)}
    >
      <VizelIcon name={action.icon} />
    </VizelBubbleMenuButton>
  );

  return (
    <div className={`vizel-bubble-menu-toolbar ${className ?? ""}`}>
      <VizelNodeSelector editor={editor} />
      <VizelBubbleMenuDivider />
      {markGroups.map((group, groupIndex) => (
        // oxlint-disable-next-line react/no-array-index-key -- groups are derived from the stable action list whose ordering is fixed at locale resolution time
        <div key={`group-${groupIndex}`} style={{ display: "contents" }}>
          {groupIndex > 0 && <VizelBubbleMenuDivider />}
          {group.map(renderAction)}
        </div>
      ))}
      {linkAction && (
        <>
          <VizelBubbleMenuDivider />
          <VizelBubbleMenuButton
            action={linkAction.id}
            onClick={() => setShowLinkEditor(true)}
            isActive={activeById[linkAction.id] ?? false}
            title={formatVizelTooltip(linkAction.label, linkAction.shortcut)}
          >
            <VizelIcon name={linkAction.icon} />
          </VizelBubbleMenuButton>
        </>
      )}
      <VizelBubbleMenuDivider />
      <VizelBubbleMenuColorPicker
        editor={editor}
        type="textColor"
        {...(locale ? { locale } : {})}
      />
      <VizelBubbleMenuColorPicker
        editor={editor}
        type="highlight"
        {...(locale ? { locale } : {})}
      />
    </div>
  );
}

/**
 * Project each action's active flag into a plain record keyed by action
 * id. The record is the selector slice: `shallowEqualObject` compares it
 * field by field, so the bubble menu re-renders only when a mark toggles.
 */
function buildActiveById(
  actions: readonly VizelBubbleMenuAction[],
  editor: Editor | null
): Record<string, boolean> {
  if (editor === null) return {};
  return Object.fromEntries(actions.map((action) => [action.id, action.isActive(editor)]));
}
