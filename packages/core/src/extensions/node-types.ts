import type { Editor } from "@tiptap/core";
import type { VizelNodeTypeIconName } from "../icons/types.ts";

/**
 * Node type option for the node selector dropdown
 */
export interface VizelNodeTypeOption {
  /** Internal node name */
  name: string;
  /** Display label */
  label: string;
  /** Icon name (semantic name, rendered by framework packages) */
  icon: VizelNodeTypeIconName;
  /** Check if this node type is currently active */
  isActive: (editor: Editor) => boolean;
  /** Command to transform the current block to this node type */
  command: (editor: Editor) => void;
}

/**
 * Default node types available in the node selector
 */
export const vizelDefaultNodeTypes = [
  {
    name: "paragraph",
    label: "Text",
    icon: "paragraph",
    isActive: (editor) =>
      editor.isActive("paragraph") &&
      !editor.isActive("bulletList") &&
      !editor.isActive("orderedList") &&
      !editor.isActive("taskList"),
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    name: "heading1",
    label: "Heading 1",
    icon: "heading1",
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
    command: (editor) => editor.chain().focus().setHeading({ level: 1 }).run(),
  },
  {
    name: "heading2",
    label: "Heading 2",
    icon: "heading2",
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    command: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
  },
  {
    name: "heading3",
    label: "Heading 3",
    icon: "heading3",
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
    command: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
  },
  {
    name: "heading4",
    label: "Heading 4",
    icon: "heading4",
    isActive: (editor) => editor.isActive("heading", { level: 4 }),
    command: (editor) => editor.chain().focus().setHeading({ level: 4 }).run(),
  },
  {
    name: "heading5",
    label: "Heading 5",
    icon: "heading5",
    isActive: (editor) => editor.isActive("heading", { level: 5 }),
    command: (editor) => editor.chain().focus().setHeading({ level: 5 }).run(),
  },
  {
    name: "heading6",
    label: "Heading 6",
    icon: "heading6",
    isActive: (editor) => editor.isActive("heading", { level: 6 }),
    command: (editor) => editor.chain().focus().setHeading({ level: 6 }).run(),
  },
  {
    name: "bulletList",
    label: "Bullet List",
    icon: "bulletList",
    isActive: (editor) => editor.isActive("bulletList"),
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    name: "orderedList",
    label: "Numbered List",
    icon: "orderedList",
    isActive: (editor) => editor.isActive("orderedList"),
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    name: "taskList",
    label: "Task List",
    icon: "taskList",
    isActive: (editor) => editor.isActive("taskList"),
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    name: "blockquote",
    label: "Quote",
    icon: "blockquote",
    isActive: (editor) => editor.isActive("blockquote"),
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    name: "codeBlock",
    label: "Code",
    icon: "codeBlock",
    isActive: (editor) => editor.isActive("codeBlock"),
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
] satisfies VizelNodeTypeOption[];

/**
 * Get the currently active node type
 */
export function getVizelActiveNodeType(
  editor: Editor,
  nodeTypes: VizelNodeTypeOption[] = vizelDefaultNodeTypes
): VizelNodeTypeOption | undefined {
  return nodeTypes.find((type) => type.isActive(editor));
}
