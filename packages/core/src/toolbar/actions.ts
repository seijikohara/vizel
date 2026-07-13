import type { Editor } from "@tiptap/core";

import type { VizelLocale } from "../i18n/types.ts";
import type { VizelIconName } from "../icons/types.ts";
import { groupByConsecutiveField } from "../utils/groupByField.ts";

/**
 * A single toolbar action definition.
 */
export interface VizelToolbarAction {
  /** Unique action identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon name from the Vizel icon system */
  icon: VizelIconName;
  /** Group identifier for visual separation */
  group: string;
  /** Check if this action is currently active */
  isActive: (editor: Editor) => boolean;
  /** Check if this action can be executed */
  isEnabled: (editor: Editor) => boolean;
  /** Execute the action */
  run: (editor: Editor) => void;
  /** Optional keyboard shortcut label for tooltip */
  shortcut?: string;
}

/**
 * A dropdown toolbar action that groups multiple sub-actions.
 * When clicked, displays a popover with the nested options.
 */
export interface VizelToolbarDropdownAction {
  /** Unique action identifier */
  id: string;
  /** Display label for the dropdown trigger */
  label: string;
  /** Icon name for the dropdown trigger */
  icon: VizelIconName;
  /** Group identifier for visual separation */
  group: string;
  /** Marks this as a dropdown action */
  type: "dropdown";
  /** The nested actions to display in the dropdown */
  options: VizelToolbarAction[];
  /** Returns the currently active option to display in the trigger */
  getActiveOption?: (editor: Editor) => VizelToolbarAction | undefined;
}

/**
 * Union type for any toolbar item — either a simple action or a dropdown.
 */
export type VizelToolbarActionItem = VizelToolbarAction | VizelToolbarDropdownAction;

/**
 * Type guard to check if a toolbar item is a dropdown action.
 */
export const isVizelToolbarDropdownAction = (
  item: VizelToolbarActionItem
): item is VizelToolbarDropdownAction => "type" in item && item.type === "dropdown";

/**
 * Default toolbar actions providing common formatting operations.
 */
export const vizelDefaultToolbarActions = [
  // History
  {
    id: "undo",
    label: "Undo",
    icon: "undo",
    group: "history",
    isActive: () => false,
    isEnabled: (editor) => editor.can().undo(),
    run: (editor) => editor.chain().focus().undo().run(),
    shortcut: "Mod+Z",
  },
  {
    id: "redo",
    label: "Redo",
    icon: "redo",
    group: "history",
    isActive: () => false,
    isEnabled: (editor) => editor.can().redo(),
    run: (editor) => editor.chain().focus().redo().run(),
    shortcut: "Mod+Shift+Z",
  },
  // Inline formatting
  {
    id: "bold",
    label: "Bold",
    icon: "bold",
    group: "format",
    isActive: (editor) => editor.isActive("bold"),
    isEnabled: (editor) => editor.can().toggleBold(),
    run: (editor) => editor.chain().focus().toggleBold().run(),
    shortcut: "Mod+B",
  },
  {
    id: "italic",
    label: "Italic",
    icon: "italic",
    group: "format",
    isActive: (editor) => editor.isActive("italic"),
    isEnabled: (editor) => editor.can().toggleItalic(),
    run: (editor) => editor.chain().focus().toggleItalic().run(),
    shortcut: "Mod+I",
  },
  {
    id: "strike",
    label: "Strikethrough",
    icon: "strikethrough",
    group: "format",
    isActive: (editor) => editor.isActive("strike"),
    isEnabled: (editor) => editor.can().toggleStrike(),
    run: (editor) => editor.chain().focus().toggleStrike().run(),
    shortcut: "Mod+Shift+S",
  },
  {
    id: "underline",
    label: "Underline",
    icon: "underline",
    group: "format",
    isActive: (editor) => editor.isActive("underline"),
    isEnabled: (editor) => editor.can().toggleUnderline(),
    run: (editor) => editor.chain().focus().toggleUnderline().run(),
    shortcut: "Mod+U",
  },
  {
    id: "code",
    label: "Code",
    icon: "code",
    group: "format",
    isActive: (editor) => editor.isActive("code"),
    isEnabled: (editor) => editor.can().toggleCode(),
    run: (editor) => editor.chain().focus().toggleCode().run(),
    shortcut: "Mod+E",
  },
  // Headings
  {
    id: "heading1",
    label: "Heading 1",
    icon: "heading1",
    group: "heading",
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
    isEnabled: (editor) => editor.can().toggleHeading({ level: 1 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    shortcut: "Mod+Alt+1",
  },
  {
    id: "heading2",
    label: "Heading 2",
    icon: "heading2",
    group: "heading",
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    isEnabled: (editor) => editor.can().toggleHeading({ level: 2 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    shortcut: "Mod+Alt+2",
  },
  {
    id: "heading3",
    label: "Heading 3",
    icon: "heading3",
    group: "heading",
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
    isEnabled: (editor) => editor.can().toggleHeading({ level: 3 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    shortcut: "Mod+Alt+3",
  },
  // Lists
  {
    id: "bulletList",
    label: "Bullet List",
    icon: "bulletList",
    group: "list",
    isActive: (editor) => editor.isActive("bulletList"),
    isEnabled: (editor) => editor.can().toggleBulletList(),
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
    shortcut: "Mod+Shift+8",
  },
  {
    id: "orderedList",
    label: "Numbered List",
    icon: "orderedList",
    group: "list",
    isActive: (editor) => editor.isActive("orderedList"),
    isEnabled: (editor) => editor.can().toggleOrderedList(),
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
    shortcut: "Mod+Shift+7",
  },
  {
    id: "taskList",
    label: "Task List",
    icon: "taskList",
    group: "list",
    isActive: (editor) => editor.isActive("taskList"),
    isEnabled: (editor) => editor.can().toggleTaskList(),
    run: (editor) => editor.chain().focus().toggleTaskList().run(),
    shortcut: "Mod+Shift+9",
  },
  // Blocks
  {
    id: "blockquote",
    label: "Quote",
    icon: "blockquote",
    group: "block",
    isActive: (editor) => editor.isActive("blockquote"),
    isEnabled: (editor) => editor.can().toggleBlockquote(),
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
    shortcut: "Mod+Shift+B",
  },
  {
    id: "codeBlock",
    label: "Code Block",
    icon: "codeBlock",
    group: "block",
    isActive: (editor) => editor.isActive("codeBlock"),
    isEnabled: (editor) => editor.can().toggleCodeBlock(),
    run: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "horizontalRule",
    label: "Horizontal Rule",
    icon: "horizontalRule",
    group: "block",
    isActive: () => false,
    isEnabled: (editor) => editor.can().setHorizontalRule(),
    run: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
] as const satisfies readonly VizelToolbarAction[];

/**
 * Create toolbar actions with locale-specific labels.
 */
export function createVizelToolbarActions(locale: VizelLocale): VizelToolbarAction[] {
  const labels: Record<string, string> = {
    undo: locale.toolbar.undo,
    redo: locale.toolbar.redo,
    bold: locale.toolbar.bold,
    italic: locale.toolbar.italic,
    strike: locale.toolbar.strikethrough,
    underline: locale.toolbar.underline,
    code: locale.toolbar.code,
    heading1: locale.toolbar.heading1,
    heading2: locale.toolbar.heading2,
    heading3: locale.toolbar.heading3,
    bulletList: locale.toolbar.bulletList,
    orderedList: locale.toolbar.numberedList,
    taskList: locale.toolbar.taskList,
    blockquote: locale.toolbar.quote,
    codeBlock: locale.toolbar.codeBlock,
    horizontalRule: locale.toolbar.horizontalRule,
  };
  return vizelDefaultToolbarActions.map((action) => ({
    ...action,
    label: labels[action.id] ?? action.label,
  }));
}

/**
 * Get toolbar actions grouped by their group identifier.
 * Supports both simple actions and dropdown actions.
 */
export function groupVizelToolbarActions(
  actions: readonly VizelToolbarActionItem[] = vizelDefaultToolbarActions
): VizelToolbarActionItem[][] {
  return groupByConsecutiveField(actions, "group");
}

// =============================================================================
// Bubble menu actions
// =============================================================================

/**
 * A single bubble-menu action definition.
 *
 * Similar to {@link VizelToolbarAction} but specialised for the inline
 * bubble menu surface: bound to a Tiptap mark name, with a tooltip
 * shortcut and an optional extension-name precondition (so actions
 * tied to extensions a consumer hasn't enabled don't show up).
 */
export interface VizelBubbleMenuAction {
  /** Unique action identifier (stable across locale changes). */
  id: string;
  /** Localized label (used for `title` / `aria-label`). */
  label: string;
  /** Icon name from the Vizel icon system. */
  icon: VizelIconName;
  /** Group identifier for visual separation (dividers between groups). */
  group: string;
  /** Returns true when the action is currently applied to the selection. */
  isActive: (editor: Editor) => boolean;
  /** Executes the toggle command. */
  run: (editor: Editor) => void;
  /** Keyboard shortcut label for the tooltip (e.g. `"Mod+B"`). */
  shortcut: string;
  /**
   * If set, the action is only emitted when an extension with this name
   * is registered on the editor. Lets `superscript` / `subscript` opt
   * out cleanly when the consumer didn't enable those features.
   */
  requiresExtension?: string;
}

const VIZEL_BUBBLE_MENU_DEFAULT_ACTIONS = [
  {
    id: "bold",
    label: "Bold",
    icon: "bold",
    group: "marks",
    isActive: (editor) => editor.isActive("bold"),
    run: (editor) => editor.chain().focus().toggleBold().run(),
    shortcut: "Mod+B",
  },
  {
    id: "italic",
    label: "Italic",
    icon: "italic",
    group: "marks",
    isActive: (editor) => editor.isActive("italic"),
    run: (editor) => editor.chain().focus().toggleItalic().run(),
    shortcut: "Mod+I",
  },
  {
    id: "strike",
    label: "Strikethrough",
    icon: "strikethrough",
    group: "marks",
    isActive: (editor) => editor.isActive("strike"),
    run: (editor) => editor.chain().focus().toggleStrike().run(),
    shortcut: "Mod+Shift+S",
  },
  {
    id: "underline",
    label: "Underline",
    icon: "underline",
    group: "marks",
    isActive: (editor) => editor.isActive("underline"),
    run: (editor) => editor.chain().focus().toggleUnderline().run(),
    shortcut: "Mod+U",
  },
  {
    id: "code",
    label: "Code",
    icon: "code",
    group: "marks",
    isActive: (editor) => editor.isActive("code"),
    run: (editor) => editor.chain().focus().toggleCode().run(),
    shortcut: "Mod+E",
  },
  {
    id: "superscript",
    label: "Superscript",
    icon: "superscript",
    group: "marks",
    isActive: (editor) => editor.isActive("superscript"),
    run: (editor) => editor.chain().focus().toggleSuperscript().run(),
    shortcut: "Cmd+.",
    requiresExtension: "superscript",
  },
  {
    id: "subscript",
    label: "Subscript",
    icon: "subscript",
    group: "marks",
    isActive: (editor) => editor.isActive("subscript"),
    run: (editor) => editor.chain().focus().toggleSubscript().run(),
    shortcut: "Cmd+,",
    requiresExtension: "subscript",
  },
  {
    id: "link",
    label: "Link",
    icon: "link",
    group: "link",
    isActive: (editor) => editor.isActive("link"),
    // The `run` for "link" intentionally doesn't toggle the mark — clicking
    // the bubble-menu link button opens the link editor. Frameworks override
    // this in their component to drive their own modal state. Provided here
    // so consumers iterating the list have a stable id and label.
    run: () => {
      /* overridden by VizelBubbleMenuDefault to open the link editor */
    },
    shortcut: "Mod+K",
  },
] as const satisfies readonly VizelBubbleMenuAction[];

/** Default bubble-menu actions, locale-resolved. */
export const vizelDefaultBubbleMenuActions: readonly VizelBubbleMenuAction[] =
  VIZEL_BUBBLE_MENU_DEFAULT_ACTIONS;

/**
 * Create bubble-menu actions with locale-specific labels.
 *
 * Mirrors {@link createVizelToolbarActions}. Consumers that want to add or
 * filter actions can `.filter` / `.concat` on the returned array; the
 * built-in set is exposed as `vizelDefaultBubbleMenuActions` for the
 * pure-default case.
 *
 * `locale` is optional — when `undefined`, the actions keep their built-in
 * English labels (suitable for components that allow consumers to omit a
 * locale entirely).
 */
export function createVizelBubbleMenuActions(locale?: VizelLocale): VizelBubbleMenuAction[] {
  if (!locale) return vizelDefaultBubbleMenuActions.map((action) => ({ ...action }));
  const labels: Record<string, string> = {
    bold: locale.bubbleMenu.bold,
    italic: locale.bubbleMenu.italic,
    strike: locale.bubbleMenu.strikethrough,
    underline: locale.bubbleMenu.underline,
    code: locale.bubbleMenu.code,
    superscript: locale.bubbleMenu.superscript,
    subscript: locale.bubbleMenu.subscript,
    link: locale.bubbleMenu.link,
  };
  return vizelDefaultBubbleMenuActions.map((action) => ({
    ...action,
    label: labels[action.id] ?? action.label,
  }));
}

/**
 * Filter bubble-menu actions down to the ones whose `requiresExtension`
 * precondition is satisfied by the supplied editor. Returns the original
 * list when no actions declare a precondition.
 */
export function filterVizelBubbleMenuActions(
  actions: readonly VizelBubbleMenuAction[],
  editor: Editor
): VizelBubbleMenuAction[] {
  return actions.filter((action) => {
    if (!action.requiresExtension) return true;
    return editor.extensionManager.extensions.some((ext) => ext.name === action.requiresExtension);
  });
}

/**
 * Group bubble-menu actions by their group identifier for visual separation.
 */
export function groupVizelBubbleMenuActions(
  actions: readonly VizelBubbleMenuAction[]
): VizelBubbleMenuAction[][] {
  return groupByConsecutiveField(actions, "group");
}
