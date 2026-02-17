import type { Editor } from "@tiptap/core";
import type { VizelLocale } from "../i18n/types.ts";
import type { VizelIconName } from "../icons/types.ts";

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
] satisfies VizelToolbarAction[];

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
  actions: VizelToolbarActionItem[] = vizelDefaultToolbarActions
): VizelToolbarActionItem[][] {
  const groups: VizelToolbarActionItem[][] = [];
  let currentGroup: string | null = null;
  let currentActions: VizelToolbarActionItem[] = [];

  for (const action of actions) {
    if (action.group !== currentGroup) {
      if (currentActions.length > 0) {
        groups.push(currentActions);
      }
      currentGroup = action.group;
      currentActions = [];
    }
    currentActions.push(action);
  }

  if (currentActions.length > 0) {
    groups.push(currentActions);
  }

  return groups;
}
