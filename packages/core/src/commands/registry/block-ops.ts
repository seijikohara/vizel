import type { Editor } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";

import type { VizelCommand } from "../types.ts";

/**
 * Move the block containing the current selection one position up or
 * down by reordering its parent's children. Returns `true` when the
 * move applied, `false` otherwise.
 */
function moveCurrentBlock(editor: Editor, direction: -1 | 1): boolean {
  const { state, view } = editor;
  const { $from } = state.selection;
  if ($from.depth === 0) return false;
  const blockDepth = 1;
  const parent = $from.node(blockDepth - 1);
  const indexInParent = $from.index(blockDepth - 1);
  const targetIndex = indexInParent + direction;
  if (targetIndex < 0 || targetIndex >= parent.childCount) return false;

  const blockStart = $from.before(blockDepth);
  const blockNode = $from.node(blockDepth);
  const blockEnd = blockStart + blockNode.nodeSize;
  const targetSiblingSize = parent.child(targetIndex).nodeSize;

  // After deleting the current block, the sibling we are swapping with
  // shifts. For move-up the previous sibling keeps its original start; for
  // move-down the next sibling slides into the deleted block's slot and ends
  // at `blockStart + targetSiblingSize`.
  const insertPos =
    direction === -1 ? blockStart - targetSiblingSize : blockStart + targetSiblingSize;

  const tr = state.tr;
  tr.delete(blockStart, blockEnd);
  tr.insert(insertPos, blockNode);
  tr.setSelection(NodeSelection.create(tr.doc, insertPos));
  view.dispatch(tr.scrollIntoView());
  return true;
}

/**
 * Duplicate the block containing the current selection. The copy is
 * inserted immediately after the original and selected.
 */
function duplicateCurrentBlock(editor: Editor): boolean {
  const { state, view } = editor;
  const { $from } = state.selection;
  if ($from.depth === 0) return false;
  const blockDepth = 1;
  const blockStart = $from.before(blockDepth);
  const blockNode = $from.node(blockDepth);
  const blockEnd = blockStart + blockNode.nodeSize;
  const tr = state.tr.insert(blockEnd, blockNode.copy(blockNode.content));
  tr.setSelection(NodeSelection.create(tr.doc, blockEnd));
  view.dispatch(tr.scrollIntoView());
  return true;
}

/**
 * Built-in block-operation commands.
 *
 * Each command joins the block menu surface plus a keyboard shortcut.
 * They build on Tiptap's command APIs (`joinBackward`, `splitBlock`,
 * `liftListItem`, `sinkListItem`) and on the local helpers above for
 * the operations Tiptap does not expose by default (move-up / move-down
 * / duplicate).
 */
export const vizelBlockOperationCommands: readonly VizelCommand[] = [
  {
    id: "block/merge-previous",
    label: (locale) => locale.commands.block.mergePrevious.title,
    description: (locale) => locale.commands.block.mergePrevious.description,
    icon: "delete",
    shortcut: { mac: "Backspace", other: "Backspace" },
    canRun: (editor) => editor.can().joinBackward(),
    run: (editor) => editor.chain().focus().joinBackward().run(),
    surfaces: {
      blockMenu: { priority: 100 },
    },
  },
  {
    id: "block/promote",
    label: (locale) => locale.commands.block.promote.title,
    description: (locale) => locale.commands.block.promote.description,
    icon: "outdent",
    shortcut: { mac: "Shift-Tab", other: "Shift-Tab" },
    canRun: (editor) =>
      editor.can().liftListItem?.("listItem") ?? editor.can().liftListItem?.("taskItem") ?? false,
    run: (editor) =>
      editor.chain().focus().liftListItem("listItem").run() ||
      editor.chain().focus().liftListItem("taskItem").run(),
    surfaces: {
      blockMenu: { priority: 110 },
      shortcut: true,
    },
  },
  {
    id: "block/demote",
    label: (locale) => locale.commands.block.demote.title,
    description: (locale) => locale.commands.block.demote.description,
    icon: "indent",
    shortcut: { mac: "Tab", other: "Tab" },
    canRun: (editor) =>
      editor.can().sinkListItem?.("listItem") ?? editor.can().sinkListItem?.("taskItem") ?? false,
    run: (editor) =>
      editor.chain().focus().sinkListItem("listItem").run() ||
      editor.chain().focus().sinkListItem("taskItem").run(),
    surfaces: {
      blockMenu: { priority: 120 },
      shortcut: true,
    },
  },
  {
    id: "block/split",
    label: (locale) => locale.commands.block.split.title,
    description: (locale) => locale.commands.block.split.description,
    icon: "split",
    shortcut: { mac: "Enter", other: "Enter" },
    canRun: (editor) => editor.can().splitBlock(),
    run: (editor) => editor.chain().focus().splitBlock().run(),
    surfaces: {
      blockMenu: { priority: 130 },
    },
  },
  {
    id: "block/duplicate",
    label: (locale) => locale.commands.block.duplicate.title,
    description: (locale) => locale.commands.block.duplicate.description,
    icon: "copy",
    shortcut: { mac: "Mod-D", other: "Mod-D" },
    canRun: (editor) => editor.state.selection.$from.depth > 0,
    run: (editor) => duplicateCurrentBlock(editor),
    surfaces: {
      blockMenu: { priority: 140 },
      shortcut: true,
    },
  },
  {
    id: "block/move-up",
    label: (locale) => locale.commands.block.moveUp.title,
    description: (locale) => locale.commands.block.moveUp.description,
    icon: "arrowUp",
    shortcut: { mac: "Alt-ArrowUp", other: "Alt-ArrowUp" },
    canRun: (editor) => editor.state.selection.$from.depth > 0,
    run: (editor) => moveCurrentBlock(editor, -1),
    surfaces: {
      blockMenu: { priority: 150 },
      shortcut: true,
    },
  },
  {
    id: "block/move-down",
    label: (locale) => locale.commands.block.moveDown.title,
    description: (locale) => locale.commands.block.moveDown.description,
    icon: "arrowDown",
    shortcut: { mac: "Alt-ArrowDown", other: "Alt-ArrowDown" },
    canRun: (editor) => editor.state.selection.$from.depth > 0,
    run: (editor) => moveCurrentBlock(editor, 1),
    surfaces: {
      blockMenu: { priority: 160 },
      shortcut: true,
    },
  },
];
