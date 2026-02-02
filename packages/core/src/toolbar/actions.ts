import type { Editor } from "@tiptap/core";
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
  },
  {
    id: "heading2",
    label: "Heading 2",
    icon: "heading2",
    group: "heading",
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    isEnabled: (editor) => editor.can().toggleHeading({ level: 2 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: "heading3",
    label: "Heading 3",
    icon: "heading3",
    group: "heading",
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
    isEnabled: (editor) => editor.can().toggleHeading({ level: 3 }),
    run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
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
  },
  {
    id: "orderedList",
    label: "Numbered List",
    icon: "orderedList",
    group: "list",
    isActive: (editor) => editor.isActive("orderedList"),
    isEnabled: (editor) => editor.can().toggleOrderedList(),
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "taskList",
    label: "Task List",
    icon: "taskList",
    group: "list",
    isActive: (editor) => editor.isActive("taskList"),
    isEnabled: (editor) => editor.can().toggleTaskList(),
    run: (editor) => editor.chain().focus().toggleTaskList().run(),
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
 * Get toolbar actions grouped by their group identifier.
 */
export function groupVizelToolbarActions(
  actions: VizelToolbarAction[] = vizelDefaultToolbarActions
): VizelToolbarAction[][] {
  const groups: VizelToolbarAction[][] = [];
  let currentGroup: string | null = null;
  let currentActions: VizelToolbarAction[] = [];

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
