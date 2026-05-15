import {
  createVizelBubbleMenuActions,
  type Editor,
  filterVizelBubbleMenuActions,
  formatVizelTooltip,
  groupVizelBubbleMenuActions,
  type VizelBubbleMenuAction,
  type VizelLocale,
} from "@vizel/core";
import { useMemo, useState } from "react";
import { useVizelState } from "../hooks/useVizelState.ts";
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
  // Subscribe to editor state changes so isActive() reflects the latest state.
  useVizelState(editor);
  const [showLinkEditor, setShowLinkEditor] = useState(false);

  const { markGroups, linkAction } = useMemo(() => {
    const all = filterVizelBubbleMenuActions(createVizelBubbleMenuActions(locale), editor);
    const link = all.find((a) => a.id === "link");
    const marks = all.filter((a) => a.id !== "link");
    return {
      markGroups: groupVizelBubbleMenuActions(marks),
      linkAction: link,
    };
  }, [locale, editor]);

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
      isActive={action.isActive(editor)}
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
        // biome-ignore lint/suspicious/noArrayIndexKey: groups are derived from the stable action list whose ordering is fixed at locale resolution time
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
            isActive={linkAction.isActive(editor)}
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
