import type { Editor } from "@tiptap/core";

/**
 * Node type option for the node selector dropdown
 */
export interface NodeTypeOption {
  /** Internal node name */
  name: string;
  /** Display label */
  label: string;
  /** Icon character or symbol */
  icon: string;
  /** Check if this node type is currently active */
  isActive: (editor: Editor) => boolean;
  /** Command to transform the current block to this node type */
  command: (editor: Editor) => void;
}

/**
 * Default node types available in the node selector
 */
export const defaultNodeTypes = [
  {
    name: "paragraph",
    label: "Text",
    icon: "¶",
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
    icon: "H1",
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
    command: (editor) => editor.chain().focus().setHeading({ level: 1 }).run(),
  },
  {
    name: "heading2",
    label: "Heading 2",
    icon: "H2",
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
    command: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
  },
  {
    name: "heading3",
    label: "Heading 3",
    icon: "H3",
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
    command: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
  },
  {
    name: "bulletList",
    label: "Bullet List",
    icon: "•",
    isActive: (editor) => editor.isActive("bulletList"),
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    name: "orderedList",
    label: "Numbered List",
    icon: "1.",
    isActive: (editor) => editor.isActive("orderedList"),
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    name: "taskList",
    label: "Task List",
    icon: "☑",
    isActive: (editor) => editor.isActive("taskList"),
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    name: "blockquote",
    label: "Quote",
    icon: '"',
    isActive: (editor) => editor.isActive("blockquote"),
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    name: "codeBlock",
    label: "Code",
    icon: "</>",
    isActive: (editor) => editor.isActive("codeBlock"),
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
] satisfies NodeTypeOption[];

/**
 * Get the currently active node type
 */
export function getActiveNodeType(
  editor: Editor,
  nodeTypes: NodeTypeOption[] = defaultNodeTypes
): NodeTypeOption | undefined {
  return nodeTypes.find((type) => type.isActive(editor));
}
