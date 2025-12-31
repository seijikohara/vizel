import { Extension } from "@tiptap/core";
import DragHandle, { type DragHandleOptions } from "@tiptap/extension-drag-handle";

export { DragHandle };
export type { DragHandleOptions };

export interface VizelDragHandleOptions {
  /**
   * Whether to show the drag handle
   * @default true
   */
  enabled?: boolean;
}

/**
 * Creates a DragHandle extension with default styling.
 * The drag handle appears on the left side of blocks when hovering.
 */
export function createDragHandleExtension(options: VizelDragHandleOptions = {}): Extension {
  const { enabled = true } = options;

  if (!enabled) {
    return Extension.create({ name: "vizelDragHandleDisabled" });
  }

  return DragHandle.configure({
    render() {
      const element = document.createElement("div");
      element.classList.add("vizel-drag-handle");
      element.setAttribute("data-vizel-drag-handle", "");
      element.setAttribute("draggable", "true");
      element.setAttribute("aria-label", "Drag to reorder block");
      element.setAttribute("role", "button");

      // Create grip icon (6 dots pattern)
      const grip = document.createElement("div");
      grip.classList.add("vizel-drag-handle-grip");
      grip.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="5" r="2"/>
          <circle cx="15" cy="5" r="2"/>
          <circle cx="9" cy="12" r="2"/>
          <circle cx="15" cy="12" r="2"/>
          <circle cx="9" cy="19" r="2"/>
          <circle cx="15" cy="19" r="2"/>
        </svg>
      `;
      element.appendChild(grip);

      return element;
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

import type { Node } from "@tiptap/pm/model";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import { TextSelection } from "@tiptap/pm/state";

interface BlockInfo {
  pos: number;
  node: Node;
}

/**
 * Find the position of the previous sibling block
 */
function findPreviousSiblingInfo(
  state: EditorState,
  blockPos: number
): { pos: number; node: Node } | null {
  const resolvedPos = state.doc.resolve(blockPos);
  const parentStart = resolvedPos.start(resolvedPos.depth);
  const parent = resolvedPos.parent;

  // Find current node index by iterating through parent's children
  let currentOffset = parentStart;
  let currentIndex = -1;

  for (let i = 0; i < parent.childCount; i++) {
    if (currentOffset === blockPos) {
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
 * Get current block info from editor state
 */
function getCurrentBlockInfo(state: EditorState): BlockInfo | null {
  const { $from } = state.selection;
  const blockPos = $from.before($from.depth);
  const blockNode = state.doc.nodeAt(blockPos);

  if (!blockNode) return null;
  return { pos: blockPos, node: blockNode };
}

/**
 * Execute the block move transaction
 */
function executeMoveTransaction(
  tr: Transaction,
  deleteFrom: number,
  deleteTo: number,
  insertPos: number,
  node: Node
): void {
  tr.delete(deleteFrom, deleteTo);
  tr.insert(insertPos, node);
  const newPos = insertPos + 1;
  tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)));
}

/**
 * Extension for keyboard shortcuts to move blocks up/down.
 * Alt+ArrowUp moves block up, Alt+ArrowDown moves block down.
 */
export const BlockMoveKeymap = Extension.create({
  name: "vizelBlockMoveKeymap",

  addCommands() {
    return {
      moveBlockUp:
        () =>
        ({ tr, state, dispatch }) => {
          const blockInfo = getCurrentBlockInfo(state);
          if (!blockInfo || blockInfo.pos <= 0) return false;

          const prevSibling = findPreviousSiblingInfo(state, blockInfo.pos);
          if (!prevSibling) return false;

          if (dispatch) {
            const blockEnd = blockInfo.pos + blockInfo.node.nodeSize;
            executeMoveTransaction(tr, blockInfo.pos, blockEnd, prevSibling.pos, blockInfo.node);
          }

          return true;
        },

      moveBlockDown:
        () =>
        ({ tr, state, dispatch }) => {
          const blockInfo = getCurrentBlockInfo(state);
          if (!blockInfo) return false;

          const blockEnd = blockInfo.pos + blockInfo.node.nodeSize;
          const resolvedEnd = state.doc.resolve(blockEnd);
          if (blockEnd >= resolvedEnd.end()) return false;

          const nextNode = state.doc.nodeAt(blockEnd);
          if (!nextNode) return false;

          if (dispatch) {
            tr.delete(blockInfo.pos, blockEnd);
            const insertPos = blockInfo.pos + nextNode.nodeSize;
            tr.insert(insertPos, blockInfo.node);
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
export function createDragHandleExtensions(options: VizelDragHandleOptions = {}): Extension[] {
  return [createDragHandleExtension(options), BlockMoveKeymap];
}
