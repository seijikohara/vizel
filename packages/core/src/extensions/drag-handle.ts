import { Extension } from "@tiptap/core";
import DragHandle from "@tiptap/extension-drag-handle";
import type { Node as PmNode } from "@tiptap/pm/model";
import { renderVizelIcon } from "../icons/types.ts";
import { VIZEL_BLOCK_MENU_EVENT, type VizelBlockMenuOpenDetail } from "./block-menu.ts";

export { DragHandle as VizelDragHandle };

export interface VizelDragHandleOptions {
  /**
   * Whether to show the drag handle
   * @default true
   */
  enabled?: boolean;
}

/** Threshold in pixels to distinguish click from drag */
const CLICK_DRAG_THRESHOLD = 5;

/**
 * Creates a DragHandle extension with default styling.
 * The drag handle appears on the left side of blocks when hovering.
 * Clicking (not dragging) the handle opens the block menu.
 */
export function createVizelDragHandleExtension(options: VizelDragHandleOptions = {}): Extension {
  const { enabled = true } = options;

  if (!enabled) {
    return Extension.create({ name: "vizelDragHandleDisabled" });
  }

  // Store references for onNodeChange and click handler
  let dragHandleElement: HTMLElement | null = null;
  let currentNode: PmNode | null = null;
  let currentPos = 0;
  let currentEditor: import("@tiptap/core").Editor | null = null;

  return DragHandle.configure({
    render() {
      const element = document.createElement("div");
      element.classList.add("vizel-drag-handle");
      element.setAttribute("data-vizel-drag-handle", "");
      element.setAttribute("draggable", "true");
      element.setAttribute("aria-label", "Drag to reorder block, click for menu");
      element.setAttribute("role", "button");

      // Create grip icon using safe template element approach
      const grip = document.createElement("div");
      grip.classList.add("vizel-drag-handle-grip");
      const iconHtml = renderVizelIcon("grip", { width: 14, height: 14 });
      const template = document.createElement("template");
      template.innerHTML = iconHtml;
      grip.appendChild(template.content);
      element.appendChild(grip);

      // Click vs drag detection
      let startX = 0;
      let startY = 0;
      let isDrag = false;

      element.addEventListener("mousedown", (e: MouseEvent) => {
        startX = e.clientX;
        startY = e.clientY;
        isDrag = false;
      });

      element.addEventListener("mousemove", (e: MouseEvent) => {
        if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > CLICK_DRAG_THRESHOLD) {
          isDrag = true;
        }
      });

      element.addEventListener("mouseup", () => {
        if (!isDrag && currentNode && currentEditor && dragHandleElement) {
          const handleRect = dragHandleElement.getBoundingClientRect();
          const detail: VizelBlockMenuOpenDetail = {
            editor: currentEditor,
            pos: currentPos,
            node: currentNode,
            handleRect,
          };
          document.dispatchEvent(new CustomEvent(VIZEL_BLOCK_MENU_EVENT, { detail }));
        }
      });

      dragHandleElement = element;

      return element;
    },
    onNodeChange({ node, editor, ...rest }) {
      currentNode = node ?? null;
      // The drag-handle plugin passes pos at runtime but the public type omits it
      currentPos = (rest as { pos?: number }).pos ?? 0;
      currentEditor = editor;

      // Toggle visibility class based on whether a node is being targeted
      if (dragHandleElement) {
        if (node) {
          dragHandleElement.classList.add("is-visible");
        } else {
          dragHandleElement.classList.remove("is-visible");
        }
      }
    },
    computePositionConfig: {
      placement: "left",
    },
  });
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    vizelBlockMove: {
      /**
       * Move the current block up
       */
      moveBlockUp: () => ReturnType;
      /**
       * Move the current block down
       */
      moveBlockDown: () => ReturnType;
    };
  }
}

import type { Node, ResolvedPos } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";
import { TextSelection } from "@tiptap/pm/state";

interface BlockInfo {
  pos: number;
  node: Node;
  depth: number;
}

/** Node types that should be treated as movable blocks */
const MOVABLE_NODE_TYPES = new Set(["listItem", "taskItem"]);

/**
 * Find the movable block at the cursor position.
 * For list items, returns the listItem/taskItem node.
 * For other blocks, returns the top-level block.
 */
function findMovableBlock($pos: ResolvedPos): BlockInfo | null {
  // Walk up from the cursor position to find a movable block
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    const nodeType = node.type.name;

    // Check if this is a list item (listItem or taskItem)
    if (MOVABLE_NODE_TYPES.has(nodeType)) {
      return {
        pos: $pos.before(depth),
        node,
        depth,
      };
    }
  }

  // Default: return the block at depth 1 (top-level block)
  if ($pos.depth >= 1) {
    const node = $pos.node(1);
    return {
      pos: $pos.before(1),
      node,
      depth: 1,
    };
  }

  return null;
}

/**
 * Find the position of the previous sibling block
 */
function findPreviousSiblingInfo(
  state: EditorState,
  blockInfo: BlockInfo
): { pos: number; node: Node } | null {
  const resolvedPos = state.doc.resolve(blockInfo.pos);
  const parentDepth = resolvedPos.depth;
  const parentStart = resolvedPos.start(parentDepth);
  const parent = resolvedPos.parent;

  // Find current node index by iterating through parent's children
  let currentOffset = parentStart;
  let currentIndex = -1;

  for (let i = 0; i < parent.childCount; i++) {
    if (currentOffset === blockInfo.pos) {
      currentIndex = i;
      break;
    }
    currentOffset += parent.child(i).nodeSize;
  }

  // If current node is first child, no previous sibling
  if (currentIndex <= 0) return null;

  // Calculate the position of the previous sibling
  let prevPos = parentStart;
  for (let i = 0; i < currentIndex - 1; i++) {
    prevPos += parent.child(i).nodeSize;
  }

  return { pos: prevPos, node: parent.child(currentIndex - 1) };
}

/**
 * Find the next sibling block
 */
function findNextSiblingInfo(
  state: EditorState,
  blockInfo: BlockInfo
): { pos: number; node: Node } | null {
  const blockEnd = blockInfo.pos + blockInfo.node.nodeSize;
  const resolvedEnd = state.doc.resolve(blockEnd);

  // Check if we're at the end of the parent
  if (blockEnd >= resolvedEnd.end(resolvedEnd.depth)) return null;

  const nextNode = state.doc.nodeAt(blockEnd);
  if (!nextNode) return null;

  return { pos: blockEnd, node: nextNode };
}

/**
 * Extension for keyboard shortcuts to move blocks up/down.
 * Alt+ArrowUp moves block up, Alt+ArrowDown moves block down.
 * Supports moving list items within their parent list.
 */
export const VizelBlockMoveKeymap = Extension.create({
  name: "vizelBlockMoveKeymap",

  addCommands() {
    return {
      moveBlockUp:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          const blockInfo = findMovableBlock($from);
          if (!blockInfo || blockInfo.pos <= 0) return false;

          const prevSibling = findPreviousSiblingInfo(state, blockInfo);
          if (!prevSibling) return false;

          if (dispatch) {
            const blockEnd = blockInfo.pos + blockInfo.node.nodeSize;
            // Delete the current block
            tr.delete(blockInfo.pos, blockEnd);
            // Insert at the previous sibling's position
            tr.insert(prevSibling.pos, blockInfo.node);
            // Set cursor inside the moved block
            const newPos = prevSibling.pos + 1;
            tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)));
          }

          return true;
        },

      moveBlockDown:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          const blockInfo = findMovableBlock($from);
          if (!blockInfo) return false;

          const nextSibling = findNextSiblingInfo(state, blockInfo);
          if (!nextSibling) return false;

          if (dispatch) {
            const blockEnd = blockInfo.pos + blockInfo.node.nodeSize;
            // Delete the current block first
            tr.delete(blockInfo.pos, blockEnd);
            // Calculate new insert position (after the next sibling, adjusted for deletion)
            const insertPos = blockInfo.pos + nextSibling.node.nodeSize;
            tr.insert(insertPos, blockInfo.node);
            // Set cursor inside the moved block
            const newPos = insertPos + 1;
            tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)));
          }

          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Alt-ArrowUp": () => this.editor.commands.moveBlockUp(),
      "Alt-ArrowDown": () => this.editor.commands.moveBlockDown(),
    };
  },
});

/**
 * Creates the complete drag handle extension set including:
 * - Visual drag handle on block hover
 * - Keyboard shortcuts for block movement (Alt+Up/Down)
 */
export function createVizelDragHandleExtensions(options: VizelDragHandleOptions = {}): Extension[] {
  return [createVizelDragHandleExtension(options), VizelBlockMoveKeymap];
}
